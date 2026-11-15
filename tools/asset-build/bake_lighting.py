"""Bake night lighting (Cycles) into lightmaps for the static Harbor & Co. environment.

Approach A: every baked mesh gets a second UV set ("Lightmap" -> glTF TEXCOORD_1, three.js `uv1`) and one shared
lightmap atlas per area. The atlas holds DIFFUSE light only (direct + indirect, no albedo), so the game keeps its
tiled PBR textures / normal maps and multiplies them by baked light:  outgoing = albedo * lightmap_value.

    python3 bake_lighting.py cab|lobby|f14|all [--samples N] [--res N]

Outputs (out/baked/):
    harbor_<area>_baked.glb          meshes renamed <orig>_Baked, extras: replaces, lightmap, lightmap_intensity
    harbor_<area>_lm.jpg             sRGB-encoded lightmap atlas (decode: linear * lightmap_scale)
    harbor_baked_lightmaps.json      manifest for the game (per file: replaces, nodes, lightmap, intensity)

The scenes are rebuilt by importing the shipped GLBs (identical geometry/names to the build scripts' output).
Interactive nodes are only used as occluders/bouncers; they are never exported here.
"""
import sys, os, json, math, time
sys.path.insert(0, '/home/claude/harbor')
import bpy, bmesh
import numpy as np
from mathutils import Vector

OUT = "/home/claude/harbor/out"
BOUT = f"{OUT}/baked"
os.makedirs(BOUT, exist_ok=True)

def argval(flag, default):
    return type(default)(sys.argv[sys.argv.index(flag) + 1]) if flag in sys.argv else default

SAMPLES = argval("--samples", 96)
RES_DIV = argval("--resdiv", 1)   # quick dry runs: --resdiv 8
WHICH = [a for a in sys.argv[1:] if a in ("cab", "lobby", "f14", "all")] or ["all"]

# night palette (brief: warm sodium street, cool-white office/lobby, dim moon)
SODIUM = '#ff9d45'
LOBBY_WHITE = '#ffe3bf'      # warm white, same as the lobby_*.png Cycles previews (set '#eef0f2' for cool)
OFFICE_WHITE = '#dfe9f5'     # cool white, same as the f14_*.png Cycles previews
MOON = '#9db4ff'
# Display calibration vs the Cycles previews (AgX there, ACES in the game). The cab is brushed steel: the game shows it
# with metalness capped at 0.5 + this lightmap, which reads brighter than Cycles' reflections, so it is toned down.
AREA_EXPOSURE = {"cab": 0.55, "lobby": 1.0, "frontage": 1.0, "f14": 1.0}

def hexc(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)

# ------------------------------------------------------------------ scene helpers
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def imp(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.data.objects if o not in before]

def obj(name):
    return bpy.data.objects[name]

def delete(objs):
    names = [o.name for o in objs]
    for n in names:
        if n in bpy.data.objects: bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)

def delete_where(pred, roots_only=False):
    for n in [o.name for o in bpy.data.objects]:
        o = bpy.data.objects.get(n)
        if o is None or (roots_only and o.parent is not None): continue
        if pred(o): delete([o] + list(o.children_recursive))

def delete_tree(name):
    if name in bpy.data.objects:
        o = obj(name); delete(list(o.children_recursive) + [o])

def add_light(name, kind, loc, color, energy, radius=0.3, spot_deg=120, rot=(0, 0, 0)):
    ld = bpy.data.lights.new(name, kind); ld.color = hexc(color); ld.energy = energy
    if kind == 'SPOT': ld.spot_size = math.radians(spot_deg); ld.spot_blend = 0.6
    if kind in ('POINT', 'SPOT'): ld.shadow_soft_size = radius
    o = bpy.data.objects.new(name, ld); bpy.context.scene.collection.objects.link(o)
    o.location = loc; o.rotation_euler = rot
    return o

def world_night(strength=1.0):
    sc = bpy.context.scene
    w = bpy.data.worlds.new("Night"); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.012, 0.016, 0.03, 1); bg.inputs[1].default_value = strength

def recolor(prefix, color, energy=None):
    for o in bpy.data.objects:
        if o.type == 'LIGHT' and o.name.startswith(prefix):
            o.data.color = hexc(color)
            if energy is not None: o.data.energy = energy

# ------------------------------------------------------------------ geometry prep
def weld_flat(o):
    """Merge coincident verts (so coplanar faces form one UV island) and keep flat shading."""
    me = o.data
    bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = False
    try: me.normals_split_custom_set([])  # drop imported custom normals -> flat face normals
    except Exception: pass
    try: bpy.context.view_layer.objects.active = o; bpy.ops.mesh.customdata_custom_splitnormals_clear()
    except Exception: pass
    me.update()

def split_mesh(o, keep_fn, name_in, name_out):
    """Split object o by face predicate keep_fn(world_center)->bool. Returns (inside, outside) objects."""
    mw = o.matrix_world
    o2 = o.copy(); o2.data = o.data.copy(); bpy.context.scene.collection.objects.link(o2)
    for ob, want in ((o, True), (o2, False)):
        bm = bmesh.new(); bm.from_mesh(ob.data)
        kill = [f for f in bm.faces if keep_fn(mw @ f.calc_center_median()) != want]
        bmesh.ops.delete(bm, geom=kill, context='FACES')
        bm.to_mesh(ob.data); bm.free(); ob.data.update()
    for c in list(o2.children): pass
    o.name = name_in; o2.name = name_out
    o2.parent = o.parent
    return o, o2

def cut_x(o, xs):
    """Bisect a mesh at world x planes so a frontage window can be split off cleanly."""
    me = o.data; mw = o.matrix_world; inv = mw.inverted()
    bm = bmesh.new(); bm.from_mesh(me)
    for x in xs:
        co = inv @ Vector((x, 0, 0)); no = (inv.to_3x3() @ Vector((1, 0, 0))).normalized()
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=co, plane_no=no)
    bm.to_mesh(me); bm.free(); me.update()

def cull_faces(o, pred):
    """Delete never-visible faces (under the street, above the lobby ceiling, outside the cab) so they don't eat
    lightmap texels. pred(world_center, world_normal) -> True to delete."""
    mw = o.matrix_world; nm = mw.to_3x3().inverted().transposed()
    bm = bmesh.new(); bm.from_mesh(o.data)
    kill = [f for f in bm.faces if pred(mw @ f.calc_center_median(), (nm @ f.normal).normalized())]
    bmesh.ops.delete(bm, geom=kill, context='FACES')
    bm.to_mesh(o.data); bm.free(); o.data.update()
    print(f"cull {o.name}: {len(kill)} faces", flush=True)

def orient_faces(objs, max_d=60.0, solid=0.75):
    """The source boxes are double-sided in glTF, but many faces point INTO their own solid (e.g. the lobby side of the
    tower's stone walls, the inside of the cab walls). A bake only gathers light on the normal side, so flip every face
    whose normal runs into solid material (a hit closer than the thickest wall/column, 0.75 m) while its back side is
    clearly more open. Rendering is unchanged: the materials are double-sided and three.js shades back faces with the
    flipped normal."""
    dg = bpy.context.evaluated_depsgraph_get(); sc = bpy.context.scene
    def free(p, d):
        hit, loc, *_ = sc.ray_cast(dg, p + d * 2e-3, d, distance=max_d)
        return (loc - p).length if hit else max_d
    total = 0
    for o in objs:
        if o.type != 'MESH': continue
        mw = o.matrix_world; nm = mw.to_3x3().inverted().transposed()
        bm = bmesh.new(); bm.from_mesh(o.data); bm.faces.ensure_lookup_table()
        flip = []
        for f in bm.faces:
            if f.calc_area() < 1e-7: continue
            c = mw @ f.calc_center_median(); n = (nm @ f.normal).normalized()
            if n.length < 0.5: continue
            dp = free(c, n)
            if dp >= solid: continue
            dn = free(c, -n)
            if dn > max(solid, 2.0 * dp): flip.append(f)
        if flip:
            bmesh.ops.reverse_faces(bm, faces=flip)
            bm.to_mesh(o.data); o.data.update(); total += len(flip)
        bm.free()
        print(f"orient {o.name}: flipped {len(flip)} faces", flush=True)
    return total

UNDER_STREET = lambda c, n: n.z < -0.9 and c.z < -0.05
ABOVE_LOBBY_CEILING = lambda c, n: abs(n.z) > 0.9 and 4.44 < c.z < 4.6 and abs(c.x) < 10.6 and 0.85 < c.y < 17.6 \
    and not (n.z < 0 and c.z < 4.5)

# ------------------------------------------------------------------ lightmap UVs
def lightmap_uvs(objs, margin=0.0035):
    for o in objs:
        me = o.data
        lm = me.uv_layers.get("Lightmap") or me.uv_layers.new(name="Lightmap")
        me.uv_layers.active = lm                      # bake + unwrap target
        for uv in me.uv_layers: uv.active_render = (uv.name != "Lightmap")  # textures keep UV0
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.0, area_weight=0.0,
                             correct_aspect=True, scale_to_bounds=False)
    try:
        bpy.ops.uv.pack_islands(udim_source='CLOSEST_UDIM', rotate=True, margin_method='FRACTION', margin=margin,
                                shape_method='CONCAVE')
    except TypeError:
        bpy.ops.uv.pack_islands(rotate=True, margin=margin)
    bpy.ops.object.mode_set(mode='OBJECT')

# ------------------------------------------------------------------ material prep for the bake
def is_glass(m):
    if not m or not m.use_nodes: return False
    p = m.node_tree.nodes.get("Principled BSDF")
    return bool(p and p.inputs["Transmission Weight"].default_value > 0.5) or m.blend_method == 'BLEND'

def prep_scene_materials():
    """Diffuse-only bake: metals -> dielectric, no normal maps (lightmap is low-frequency), glass lets light pass."""
    for m in bpy.data.materials:
        if not m.use_nodes: continue
        nt = m.node_tree; p = nt.nodes.get("Principled BSDF")
        if not p: continue
        if is_glass(m):
            p.inputs["Transmission Weight"].default_value = 0.0
            for l in list(p.inputs["Alpha"].links): nt.links.remove(l)
            p.inputs["Alpha"].default_value = 0.12
            continue
        for l in list(p.inputs["Metallic"].links): nt.links.remove(l)
        p.inputs["Metallic"].default_value = 0.0
        for l in list(p.inputs["Normal"].links): nt.links.remove(l)

def setup_cycles(samples):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    sc.cycles.samples = samples; sc.cycles.use_denoising = False
    sc.cycles.max_bounces = 6; sc.cycles.diffuse_bounces = 4; sc.cycles.glossy_bounces = 1
    sc.cycles.transmission_bounces = 2; sc.cycles.transparent_max_bounces = 4
    sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
    sc.cycles.sample_clamp_indirect = 8.0
    sc.render.threads_mode = 'AUTO'
    b = sc.render.bake
    b.use_pass_direct = True; b.use_pass_indirect = True; b.use_pass_color = False
    b.margin = 6; b.margin_type = 'EXTEND'; b.use_clear = True; b.target = 'IMAGE_TEXTURES'

def bake_atlas(objs, res, name):
    img = bpy.data.images.new(name, res, res, alpha=True, float_buffer=True)
    img.generated_color = (0, 0, 0, 0)
    mats = set()
    for o in objs:
        for s in o.material_slots:
            if s.material: mats.add(s.material)
    for m in mats:
        nt = m.node_tree
        n = nt.nodes.get("__LM__") or nt.nodes.new("ShaderNodeTexImage")
        n.name = "__LM__"; n.image = img; n.interpolation = 'Linear'
        nt.nodes.active = n
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    t = time.time()
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, use_clear=True, margin=6)
    print(f"BAKE {name} {res}px {len(objs)} objs {time.time() - t:.0f}s", flush=True)
    a = np.array(img.pixels[:], dtype=np.float32).reshape(res, res, 4)
    return a  # bottom-up rows (Blender convention)

# ------------------------------------------------------------------ denoise + encode
def denoise(a):
    """Bake noise removal: OIDN through the compositor if available, else a mask-aware gaussian."""
    rgb, mask = a[..., :3].copy(), (a[..., 3] > 0.5).astype(np.float32)
    try:
        out = oidn(rgb)
        if out is not None: return out * mask[..., None] + rgb * (1 - mask[..., None]), mask
    except Exception as e:
        print("OIDN unavailable:", e)
    from PIL import Image, ImageFilter  # fallback: separable gaussian, normalised by the island mask
    def blur(ch, r=1.6):
        k = np.exp(-0.5 * (np.arange(-4, 5) / r) ** 2); k /= k.sum()
        o = np.apply_along_axis(lambda v: np.convolve(v, k, mode='same'), 0, ch)
        return np.apply_along_axis(lambda v: np.convolve(v, k, mode='same'), 1, o)
    w = blur(mask) + 1e-6
    out = np.stack([blur(rgb[..., i] * mask) / w for i in range(3)], -1)
    return np.where(mask[..., None] > 0, out, rgb), mask

def oidn(rgb):
    h, w, _ = rgb.shape
    src = bpy.data.images.new("__noisy__", w, h, alpha=True, float_buffer=True)
    px = np.concatenate([rgb, np.ones((h, w, 1), np.float32)], -1)
    src.pixels.foreach_set(px.ravel())
    sc = bpy.context.scene
    tree = bpy.data.node_groups.new("__dn__", 'CompositorNodeTree')
    sc.compositing_node_group = tree
    n_img = tree.nodes.new("CompositorNodeImage"); n_img.image = src
    n_dn = tree.nodes.new("CompositorNodeDenoise")
    try: n_dn.prefilter = 'NONE'
    except Exception: pass
    out = tree.nodes.new("NodeGroupOutput")
    tree.interface.new_socket("Image", in_out='OUTPUT', socket_type='NodeSocketColor')
    tree.links.new(n_img.outputs["Image"], n_dn.inputs["Image"])
    tree.links.new(n_dn.outputs["Image"], out.inputs[0])
    eng = sc.render.engine
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = w, h, 100
    sc.render.use_compositing = True; sc.render.use_sequencer = False
    sc.render.image_settings.file_format = 'OPEN_EXR'
    path = f"/tmp/__dn_{w}.exr"; sc.render.filepath = path
    hide = [o for o in sc.objects if not o.hide_render]
    for o in hide: o.hide_render = True
    bpy.ops.render.render(write_still=True)
    for o in hide: o.hide_render = False
    sc.render.engine = eng
    r = bpy.data.images.load(path)
    a = np.array(r.pixels[:], dtype=np.float32).reshape(h, w, 4)[..., :3]
    bpy.data.images.remove(r); bpy.data.images.remove(src)
    if not np.isfinite(a).all() or a.max() <= 0: return None
    print("OIDN denoise ok", flush=True)
    return a

def encode(rgb, mask, path, quality=90):
    """sRGB-encode linear light / scale into an 8-bit JPEG. Returns the scale (linear value of texel 255)."""
    from PIL import Image
    lum = rgb[mask > 0].max(-1)
    scale = float(np.percentile(lum, 99.6)) if lum.size else 1.0
    scale = max(scale, 1e-4)
    v = np.clip(rgb / scale, 0, 1)
    s = np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - 0.055)
    im = Image.fromarray((np.flipud(s) * 255 + 0.5).astype(np.uint8), "RGB")
    im.save(path, quality=quality, subsampling=0, optimize=True)
    np.save(path.replace(".jpg", "_linear.npy"), rgb.astype(np.float16))
    return scale

# ------------------------------------------------------------------ export
MANIFEST = f"{BOUT}/harbor_baked_lightmaps.json"

def finish(area, glb_name, baked, unbaked, replaces, res, note, extra_place=None):
    """baked/unbaked: lists of objects to export. Renames to *_Baked, writes extras, exports, updates manifest."""
    res = res // RES_DIV
    a = bake_atlas(baked, res, f"LM_{area}")
    rgb, mask = denoise(a)
    lm_file = f"harbor_{area}_lm.jpg"
    scale = encode(rgb, mask, f"{BOUT}/{lm_file}")
    intensity = round(math.pi * scale * AREA_EXPOSURE.get(area, 1.0), 5)
    names = []
    for o in baked + unbaked:
        orig = o.get("replaces_src") or o.name
        if o in baked:
            o["lightmap"] = lm_file; o["lightmap_uv"] = 1; o["lightmap_intensity"] = intensity
            o["baked"] = True
        o["replaces"] = orig
        for k in ("note",):
            if k in o: del o[k]
        if "replaces_src" in o: del o["replaces_src"]
    for o in baked:
        if not o.name.endswith("_Baked"): o.name = o.name + "_Baked"
        names.append(o.name)
    # remove helper node so the exporter never sees the float image
    for m in bpy.data.materials:
        if m.use_nodes and "__LM__" in m.node_tree.nodes: m.node_tree.nodes.remove(m.node_tree.nodes["__LM__"])
    restore_materials()
    bpy.ops.object.select_all(action='DESELECT')
    for o in baked + unbaked: o.select_set(True)
    path = f"{BOUT}/{glb_name}"
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_yup=True, export_apply=True,
                              export_lights=False, export_extras=True, export_animations=False, use_selection=True,
                              export_image_format='JPEG', export_jpeg_quality=85, export_cameras=False)
    man = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else {"version": 1, "files": {}}
    entry = {"lightmap": lm_file, "lightmap_uv": 1, "lightmap_intensity": intensity, "lightmap_scale": round(scale, 5),
             "lightmap_colorspace": "srgb", "replaces": replaces,
             "baked_nodes": [o.name for o in baked], "unbaked_nodes": [o.name for o in unbaked], "note": note}
    if extra_place: entry.update(extra_place)
    man["files"][glb_name] = entry
    json.dump(man, open(MANIFEST, "w"), indent=2)
    print("EXPORTED", path, os.path.getsize(path), "LM scale", scale, flush=True)

_SAVED = {}
def snapshot_materials():
    """Remember original material settings so the exported GLB keeps the real PBR values."""
    for m in bpy.data.materials:
        if not m.use_nodes: continue
        nt = m.node_tree; p = nt.nodes.get("Principled BSDF")
        if not p: continue
        links = [(l.from_node.name, l.from_socket.identifier, l.to_socket.identifier) for l in nt.links if l.to_node == p
                 and l.to_socket.name in ("Metallic", "Normal", "Alpha")]
        _SAVED[m.name] = dict(metal=p.inputs["Metallic"].default_value, trans=p.inputs["Transmission Weight"].default_value,
                              alpha=p.inputs["Alpha"].default_value, links=links)

def restore_materials():
    for mn, s in _SAVED.items():
        m = bpy.data.materials.get(mn)
        if not m: continue
        nt = m.node_tree; p = nt.nodes["Principled BSDF"]
        p.inputs["Metallic"].default_value = s["metal"]; p.inputs["Transmission Weight"].default_value = s["trans"]
        p.inputs["Alpha"].default_value = s["alpha"]
        for fn, fs, ts in s["links"]:
            src = nt.nodes[fn]
            out = next(o for o in src.outputs if o.identifier == fs)
            inp = next(i for i in p.inputs if i.identifier == ts)
            nt.links.new(out, inp)

def collect_tree(name):
    o = obj(name)
    return [o] + [c for c in o.children_recursive if c.type == 'MESH']

def prep_targets(objs):
    meshes = [o for o in objs if o.type == 'MESH']
    for o in meshes: weld_flat(o)
    lightmap_uvs(meshes)
    return meshes

# ================================================================== AREAS
def bake_cab():
    reset()
    imp(f"{OUT}/harbor_elevator_cab.glb")
    world_night(0.5)
    # ride state: doors closed, indicator/buttons as at rest. Light = cab point light + emissive ceiling panel.
    targets = collect_tree("Elevator_Cab_Shell")
    shell = obj("Elevator_Cab_Shell")
    root = shell.parent
    snapshot_materials(); prep_scene_materials(); setup_cycles(SAMPLES)
    orient_faces(targets)
    cull_faces(shell, lambda c, n: (n.y > 0.9 and c.y > 1.415) or (abs(n.x) > 0.9 and abs(c.x) > 0.825 and n.x * c.x > 0)
               or (n.z > 0.9 and c.z > 2.64) or (n.z < -0.9 and c.z < -0.045))
    meshes = prep_targets(targets)
    # export the shell in cab-local space (root is at the origin with identity transform)
    finish("cab", "harbor_cab_baked.glb", meshes, [], ["Elevator_Cab_Shell"], 1024,
           "Cab-local coordinates (origin = door threshold). Parent Elevator_Cab_Shell_Baked under the Elevator_Cab "
           "root of harbor_elevator_cab.glb (identity local transform) and hide Elevator_Cab_Shell.",
           {"parent": "Elevator_Cab"})

def lobby_scene():
    reset()
    imp(f"{OUT}/harbor_block.glb")
    for nm in ("Harbor_Tower", "Lobby_Interior"): delete_tree(nm)
    imp(f"{OUT}/harbor_shaft_cut.glb")
    delete_tree("Office_F14_Shell_ShaftCut")
    imp(f"{OUT}/harbor_lobby_detail.glb")
    # drop hidden-by-default variants (lit LEDs, wedge, parcel) and far / moving context to keep the bake honest + fast
    delete_where(lambda o: o.get("default_visible") is False)
    delete_where(lambda o: o.get("role") == "vehicle" or o.name.startswith(("Parked_", "Company_Sedan", "Ship_", "Quay_Crane",
                 "Quay_Containers", "Water", "Yard_", "Gate_Barrier", "GateHouse", "Warehouse_")), roots_only=True)
    delete_where(lambda o: o.type == 'LIGHT' and o.name.startswith(("Quay_Mast", "Ship_", "Yard_", "GateHouse", "Company_")))
    world_night(1.0)
    add_light("Moon", 'SUN', (0, 0, 50), MOON, 0.06, rot=(math.radians(50), 0, math.radians(-140)))
    recolor("Street_Sodium", SODIUM)
    recolor("Lobby_Light", LOBBY_WHITE)
    for i, (x, y) in enumerate(((-4.4, 7.5), (0.5, 12.0), (6.7, 5.8), (1.5, 15.5), (9.6, 16.0), (-8.4, 4.6), (0.0, 3.0))):
        add_light(f"Bake_Lobby_{i}", 'POINT', (x, y, 3.9), LOBBY_WHITE, 260, radius=0.4)   # same rig as lobby_*.png

def bake_lobby_and_frontage():
    lobby_scene()
    snapshot_materials(); prep_scene_materials(); setup_cycles(SAMPLES)
    # ---------------- lobby
    lobby_roots = ["Lobby_Interior_ShaftCut", "SpeedGate_Bank", "Lobby_Seating", "Lobby_Plants", "Lobby_Art",
                   "Mailroom_Shelf", "Stair_Core"]
    tg = []
    for r in lobby_roots: tg += collect_tree(r)
    orient_faces(tg)
    cull_faces(obj("Lobby_Interior_ShaftCut"), lambda c, n: UNDER_STREET(c, n) or ABOVE_LOBBY_CEILING(c, n))
    lobby = prep_targets(tg)
    # ---------------- frontage: split the tower at the lobby roof line, ground strips at a window around the tower
    tower = obj("Harbor_Tower_ShaftCut")
    sign = obj("HARBOR_Sign_ShaftCut")
    tower["replaces_src"] = "Harbor_Tower_ShaftCut"
    base, upper = split_mesh(tower, lambda c: c.z < 5.0, "Harbor_Tower_Base", "Harbor_Tower_Upper")
    upper["replaces_src"] = "Harbor_Tower_ShaftCut"; base["replaces_src"] = "Harbor_Tower_ShaftCut"
    sign["replaces_src"] = "HARBOR_Sign_ShaftCut"; sign.name = "HARBOR_Sign"
    XW = 27.0
    ground_b, ground_u = [], []
    for nm in ("Sidewalk", "Curbs", "Road"):
        o = obj(nm); cut_x(o, (-XW, XW))
        inside = (lambda c: abs(c.x) < XW and c.y < 1.0)
        b, u = split_mesh(o, inside, f"{nm}_Frontage", f"{nm}_Rest")
        b["replaces_src"] = nm; u["replaces_src"] = nm
        ground_b.append(b); ground_u.append(u)
    canopy = obj("Entrance_Canopy"); canopy["replaces_src"] = "Entrance_Canopy"
    orient_faces([base, sign, canopy] + ground_b)
    cull_faces(base, ABOVE_LOBBY_CEILING)
    for b in ground_b: cull_faces(b, UNDER_STREET)
    front = prep_targets([base, sign, canopy] + ground_b)
    # bake lobby atlas, export lobby
    finish("lobby", "harbor_lobby_baked.glb", lobby, [],
           ["Lobby_Interior_ShaftCut", "SpeedGate_Bank", "Lobby_Seating", "Lobby_Plants", "Lobby_Art", "Mailroom_Shelf",
            "Stair_Core"], 2048, "World space, load at the origin.")
    # export clears selection/renames; materials were restored -> re-prep for the second bake
    prep_scene_materials()
    finish("frontage", "harbor_frontage_baked.glb", front, ground_u + [upper],
           ["Harbor_Tower_ShaftCut", "Entrance_Canopy", "Sidewalk", "Curbs", "Road"], 2048,
           "World space, load at the origin. *_Rest and Harbor_Tower_Upper_Baked are unbaked remainders of the split "
           "originals (same materials) and must be shown together with the baked pieces.")

def bake_f14():
    reset()
    imp(f"{OUT}/harbor_office_f14.glb")
    delete_tree("Office_F14_Shell")
    imp(f"{OUT}/harbor_shaft_cut.glb")
    for nm in ("Harbor_Tower_ShaftCut", "Lobby_Interior_ShaftCut"): delete_tree(nm)
    imp(f"{OUT}/harbor_f14_detail.glb")
    delete_where(lambda o: o.get("default_visible") is False)
    world_night(1.0)
    add_light("Moon", 'SUN', (0, 0, 80), MOON, 0.06, rot=(math.radians(50), 0, math.radians(-140)))
    recolor("F14_", OFFICE_WHITE)
    F, CEIL = 50.6, 50.6 + 2.9
    ceil_z = max(v.co.z for v in obj("Office_F14_Shell_ShaftCut").data.vertices)  # local == world here
    for i, (x, y) in enumerate(((-5.5, 2.4), (7.8, 10.8), (1.5, 14.2), (-2.0, 7.5), (-8.2, 14.5), (6.8, 15.0), (2.8, 8.0), (-2.3, 12.8))):
        add_light(f"Bake_F14_{i}", 'POINT', (x, y, ceil_z - 0.3), OFFICE_WHITE, 180, radius=0.4)  # same rig as f14_*.png
    snapshot_materials(); prep_scene_materials(); setup_cycles(SAMPLES)
    roots = ["Office_F14_Shell_ShaftCut"] + [f"Desk_0{i}" for i in range(1, 9)] + [
        "Break_Counter", "ServerCloset_Walls", "MeetingRoom_Furniture", "PrintArea", "Desk_Clutter", "Coat_Hooks",
        "F14_Plants", "Window_Blinds", "ServerRacks", "Emergency_Exit_Frame"]
    tg = []
    for r in roots: tg += collect_tree(r)
    orient_faces(tg)
    meshes = prep_targets(tg)
    finish("f14", "harbor_f14_baked.glb", meshes, [], roots, 2048, "World space, load at the origin (floor at y = 50.6).")

if __name__ == "__main__":
    t0 = time.time()
    if "cab" in WHICH or "all" in WHICH: bake_cab()
    if "lobby" in WHICH or "all" in WHICH: bake_lobby_and_frontage()
    if "f14" in WHICH or "all" in WHICH: bake_f14()
    print(f"DONE {time.time() - t0:.0f}s")
