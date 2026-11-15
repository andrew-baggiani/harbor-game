"""Shared Blender helpers: fast mesh builder with world-space UVs, PBR material catalog, text, export."""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

TEX = "/home/claude/harbor/textures"
OUT = "/home/claude/harbor/out"
os.makedirs(OUT, exist_ok=True)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = 30
    MATS.clear()

def hexc(h):
    h = h.lstrip('#')
    c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    # sRGB -> linear
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)

# ---------------- material catalog ----------------
# textured: name -> (texture base, tile size m, extra)
TEXTURED = {
    "brick_red": ("brick_red", 0.9), "brick_dark": ("brick_dark", 0.9), "brick_buff": ("brick_buff", 0.9),
    "concrete_slab": ("concrete_slab", 3.0), "concrete": ("concrete", 4.0), "asphalt_wet": ("asphalt_wet", 4.0),
    "wood_oak": ("wood_oak", 1.0), "granite_polished": ("granite_polished", 1.2), "carpet": ("carpet", 1.0),
    "metal_brushed": ("metal_brushed", 0.5), "container_rust": ("container_rust", 2.4),
    "container_blue": ("container_blue", 2.4), "container_green": ("container_green", 2.4),
    "container_grey": ("container_grey", 2.4), "hull_paint": ("hull_paint", 4.0),
    "hull_antifoul": ("hull_antifoul", 4.0), "stone_trim": ("stone_trim", 1.0),
    "plaster_white": ("plaster_white", 2.0), "paint_navy": ("paint_navy", 2.0),
    "paint_green": ("paint_green", 2.0), "paint_oxblood": ("paint_oxblood", 2.0),
    "timber_weathered": ("timber_weathered", 2.0),
}
TEX_METAL = {"metal_brushed": 1.0}

# plain: name -> kwargs
PLAIN = {
    "glass_clear":   dict(color='#e8f0ee', rough=0.02, trans=1.0),
    "glass_tint":    dict(color='#5d6b70', rough=0.03, trans=1.0),
    "glass_dark":    dict(color='#0d1114', rough=0.06, metal=0.0),
    "window_lit":    dict(color='#cfd9e2', rough=0.3, emit='#cfdce8', estr=0.7),
    "window_lit_warm": dict(color='#e8d8b8', rough=0.3, emit='#f2d7a6', estr=0.6),
    "steel_black":   dict(color='#0b0b0d', metal=1.0, rough=0.35),
    "steel_paint":   dict(color='#2a2d30', metal=0.6, rough=0.5),
    "bronze":        dict(color='#8c6239', metal=1.0, rough=0.3),
    "chrome":        dict(color='#d8d8d8', metal=1.0, rough=0.08),
    "alloy":         dict(color='#a7a9ac', metal=1.0, rough=0.25),
    "rubber":        dict(color='#121212', rough=0.85),
    "plastic_black": dict(color='#111114', rough=0.45),
    "plastic_grey":  dict(color='#4a4c50', rough=0.5),
    "plastic_white": dict(color='#d9d7d0', rough=0.45),
    "paper_white":   dict(color='#f4f0e6', rough=0.9),
    "paint_white_line": dict(color='#bdbab2', rough=0.6),
    "paint_yellow_line": dict(color='#b8902a', rough=0.6),
    "sodium_lamp":   dict(color='#ffb45e', rough=0.4, emit='#ff9d3b', estr=12.0),
    "downlight":     dict(color='#fff4e0', rough=0.4, emit='#fff1dc', estr=8.0),
    "panel_light_on": dict(color='#e8eef2', rough=0.4, emit='#e4ecf2', estr=3.0),
    "panel_light_off": dict(color='#c8c8c4', rough=0.6),
    "ceiling_tile":  dict(color='#bdbcb6', rough=0.8),
    "screen_on":     dict(color='#1a2a3a', rough=0.15, emit='#8fb3d8', estr=1.6),
    "screen_off":    dict(color='#050607', rough=0.12),
    "led_red":       dict(color='#ff2010', rough=0.3, emit='#ff1a0a', estr=15.0),
    "led_green":     dict(color='#20ff40', rough=0.3, emit='#14ff3a', estr=15.0),
    "led_amber":     dict(color='#ffb000', rough=0.3, emit='#ffaa00', estr=10.0),
    "car_navy":      dict(color='#1e3a6e', metal=0.55, rough=0.28, coat=1.0),
    "car_silver":    dict(color='#9a9da1', metal=0.8, rough=0.3, coat=1.0),
    "car_charcoal":  dict(color='#2b2e31', metal=0.6, rough=0.3, coat=1.0),
    "car_white":     dict(color='#d8d8d4', metal=0.1, rough=0.3, coat=1.0),
    "headlight":     dict(color='#e9eef2', rough=0.05, metal=0.3, emit='#fff8ea', estr=0.0),
    "taillight":     dict(color='#7a0a0a', rough=0.15, emit='#ff1a0a', estr=1.5),
    "water":         dict(color='#0a1418', rough=0.04, normal="water", tile=6.0),
    "sign_warm":     dict(color='#fff2d8', rough=0.4, emit='#ffe2b0', estr=5.0),
    "sign_cool":     dict(color='#e6f2ff', rough=0.4, emit='#d8ecff', estr=4.0),
    "sign_board":    dict(color='#1a1b1d', rough=0.6),
    "awning_green":  dict(color='#23382c', rough=0.85),
    "awning_navy":   dict(color='#1b2a40', rough=0.85),
    "crane_yellow":  dict(color='#b58b1c', metal=0.4, rough=0.55),
    "ship_white":    dict(color='#c9c9c2', rough=0.55),
    "ship_red":      dict(color='#7a2420', rough=0.6),
    "iron_black":    dict(color='#141414', metal=0.7, rough=0.6),
    "plant_green":   dict(color='#2c4a26', rough=0.7),
    "soil":          dict(color='#2a1f16', rough=0.95),
    "fabric_grey":   dict(color='#3a3d42', rough=0.9),
    "fabric_navy":   dict(color='#1e3a6e', rough=0.9),
    "door_metal":    dict(color='#3a3c3e', metal=0.8, rough=0.4),
    "roller_shutter": dict(color='#6d6f70', metal=0.7, rough=0.5),
    "tar_roof":      dict(color='#222224', rough=0.9),
}

MATS = {}

def _img(path, noncolor=False):
    im = bpy.data.images.load(path, check_existing=True)
    if noncolor: im.colorspace_settings.name = 'Non-Color'
    return im

def get_mat(name):
    """Returns (material, tile_size)."""
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; p = nt.nodes["Principled BSDF"]
    tile = 1.0
    if name in TEXTURED:
        base, tile = TEXTURED[name]
        tc = nt.nodes.new("ShaderNodeTexImage"); tc.image = _img(f"{TEX}/{base}_color.png")
        nt.links.new(tc.outputs["Color"], p.inputs["Base Color"])
        tr = nt.nodes.new("ShaderNodeTexImage"); tr.image = _img(f"{TEX}/{base}_rough.png", True)
        nt.links.new(tr.outputs["Color"], p.inputs["Roughness"])
        tn = nt.nodes.new("ShaderNodeTexImage"); tn.image = _img(f"{TEX}/{base}_normal.png", True)
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nt.links.new(tn.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], p.inputs["Normal"])
        p.inputs["Metallic"].default_value = TEX_METAL.get(name, 0.0)
    elif name in PLAIN or name.startswith("img:") or name.startswith("imgemit:"):
        if name.startswith("img"):
            path = name.split(":", 1)[1]
            tc = nt.nodes.new("ShaderNodeTexImage"); tc.image = _img(path)
            nt.links.new(tc.outputs["Color"], p.inputs["Base Color"])
            p.inputs["Roughness"].default_value = 0.55
            if name.startswith("imgemit:"):
                nt.links.new(tc.outputs["Color"], p.inputs["Emission Color"])
                p.inputs["Emission Strength"].default_value = 1.0
                p.inputs["Roughness"].default_value = 0.15
        else:
            d = PLAIN[name]
            p.inputs["Base Color"].default_value = (*hexc(d.get('color', '#808080')), 1)
            p.inputs["Metallic"].default_value = d.get('metal', 0.0)
            p.inputs["Roughness"].default_value = d.get('rough', 0.5)
            if d.get('trans'):
                p.inputs["Transmission Weight"].default_value = d['trans']
                p.inputs["IOR"].default_value = 1.5
            if d.get('emit'):
                p.inputs["Emission Color"].default_value = (*hexc(d['emit']), 1)
                p.inputs["Emission Strength"].default_value = d.get('estr', 1.0)
            if d.get('coat'):
                p.inputs["Coat Weight"].default_value = d['coat']
                p.inputs["Coat Roughness"].default_value = 0.03
            if d.get('normal'):
                tile = d.get('tile', 1.0)
                tn = nt.nodes.new("ShaderNodeTexImage"); tn.image = _img(f"{TEX}/{d['normal']}_normal.png", True)
                nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = 0.6
                nt.links.new(tn.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], p.inputs["Normal"])
    else:
        raise KeyError(name)
    MATS[name] = (m, tile)
    return MATS[name]

# ---------------- mesh builder ----------------
def quad_uv(mb, p0, p1, p2, p3, mat):
    """Textured quad: p0=bottom-left, p1=bottom-right, p2=top-right, p3=top-left (counter-clockwise seen from front)."""
    mb.face([p0, p1, p2, p3], mat, uvs=[(0, 0), (1, 0), (1, 1), (0, 1)])

class MB:
    def __init__(self, name):
        self.name = name; self.v = []; self.f = []   # f: (indices, mat, uvs or None)

    def _add(self, pts):
        i0 = len(self.v); self.v.extend([tuple(p) for p in pts]); return i0

    def face(self, pts, mat, uvs=None):
        i0 = self._add(pts); self.f.append((tuple(range(i0, i0 + len(pts))), mat, uvs))

    def box(self, x0, y0, z0, x1, y1, z1, mat, rot=0.0, pivot=None, mats=None):
        """Axis-aligned box from min/max, optionally rotated about Z around pivot.
        mats: optional dict side->mat for sides 'top','bottom','front'(-y),'back'(+y),'left'(-x),'right'(+x)."""
        if x0 > x1: x0, x1 = x1, x0
        if y0 > y1: y0, y1 = y1, y0
        if z0 > z1: z0, z1 = z1, z0
        c = [(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0),(x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)]
        if rot:
            px, py = pivot if pivot else ((x0+x1)/2, (y0+y1)/2)
            cs, sn = math.cos(rot), math.sin(rot)
            c = [(px + (x-px)*cs - (y-py)*sn, py + (x-px)*sn + (y-py)*cs, z) for x, y, z in c]
        sides = {'bottom':(0,3,2,1),'top':(4,5,6,7),'front':(0,1,5,4),'right':(1,2,6,5),'back':(2,3,7,6),'left':(3,0,4,7)}
        for s, idx in sides.items():
            m = (mats or {}).get(s, mat)
            if m is None: continue
            self.face([c[i] for i in idx], m)

    def boxc(self, cx, cy, cz, sx, sy, sz, mat, rot=0.0):
        self.box(cx-sx/2, cy-sy/2, cz-sz/2, cx+sx/2, cy+sy/2, cz+sz/2, mat, rot=rot, pivot=(cx, cy))

    def cyl(self, base, axis, r, length, mat, seg=24, cap=True, r2=None, capmat=None):
        base = Vector(base); a = Vector(axis).normalized()
        t = a.orthogonal().normalized(); b = a.cross(t)
        r2 = r if r2 is None else r2
        ring0 = [base + (t*math.cos(2*math.pi*i/seg) + b*math.sin(2*math.pi*i/seg)) * r for i in range(seg)]
        ring1 = [base + a*length + (t*math.cos(2*math.pi*i/seg) + b*math.sin(2*math.pi*i/seg)) * r2 for i in range(seg)]
        for i in range(seg):
            j = (i + 1) % seg
            self.face([ring0[i], ring0[j], ring1[j], ring1[i]], mat)
        if cap:
            self.face(list(reversed(ring0)), capmat or mat); self.face(ring1, capmat or mat)

    def loft(self, sections, mat_fn, close=True, cap=True, capmat=None):
        """sections: list of point-loops (same count). mat_fn(face_center, normal)->mat or a mat name."""
        n = len(sections[0])
        for s in range(len(sections) - 1):
            A, B = sections[s], sections[s+1]
            for i in range(n if close else n - 1):
                j = (i + 1) % n
                pts = [A[i], A[j], B[j], B[i]]
                m = mat_fn if isinstance(mat_fn, str) else mat_fn(pts)
                self.face(pts, m)
        if cap:
            cm = capmat or (mat_fn if isinstance(mat_fn, str) else mat_fn(sections[0]))
            self.face(list(reversed(sections[0])), cm); self.face(sections[-1], cm)

    def build(self, origin=(0, 0, 0), smooth=False, parent=None, collection=None, fix_normals=True):
        if not self.f: return None
        me = bpy.data.meshes.new(self.name)
        ox, oy, oz = origin
        me.from_pydata([(x-ox, y-oy, z-oz) for x, y, z in self.v], [], [f[0] for f in self.f])
        mat_names = []
        for _, m, _ in self.f:
            if m not in mat_names: mat_names.append(m)
        for mn in mat_names: me.materials.append(get_mat(mn)[0])
        if fix_normals:
            bm = bmesh.new(); bm.from_mesh(me)
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
            bm.to_mesh(me); bm.free()
        uvl = me.uv_layers.new(name="UVMap")
        for poly, (idx, m, uvs) in zip(me.polygons, self.f):
            poly.material_index = mat_names.index(m)
            tile = get_mat(m)[1]
            uvmap = dict(zip(idx, uvs)) if uvs else None
            vidx = list(poly.vertices)
            idx = vidx
            if uvs: uvs = [uvmap[i] for i in vidx]
            pts = [Vector(self.v[i]) for i in idx]
            n = (pts[1]-pts[0]).cross(pts[2]-pts[0])
            if n.length < 1e-12 and len(pts) > 3: n = (pts[2]-pts[0]).cross(pts[3]-pts[0])
            ax = max(range(3), key=lambda k: abs(n[k]))
            for k, li in enumerate(poly.loop_indices):
                if uvs: uvl.data[li].uv = uvs[k]
                else:
                    p = pts[k]
                    if ax == 0: u, v = p.y * (1 if n.x > 0 else -1), p.z
                    elif ax == 1: u, v = p.x * (-1 if n.y > 0 else 1), p.z
                    else: u, v = p.x, p.y
                    uvl.data[li].uv = (u / tile, v / tile)
            poly.use_smooth = smooth
        me.validate(); me.update()
        if smooth:
            try: me.set_sharp_from_angle(angle=math.radians(40))
            except Exception: pass
        o = bpy.data.objects.new(self.name, me)
        (collection or bpy.context.scene.collection).objects.link(o)
        o.location = origin
        if parent: set_parent(o, parent)
        return o

def set_parent(o, parent):
    bpy.context.view_layer.update()
    mw = o.matrix_world.copy()
    o.parent = parent
    o.matrix_parent_inverse = parent.matrix_world.inverted()

def empty(name, loc=(0, 0, 0), parent=None):
    e = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(e)
    e.location = loc
    if parent: set_parent(e, parent)
    return e

def text(name, s, size, loc, mat, rot=(math.radians(90), 0, 0), extrude=0.005, align='CENTER', parent=None, font_bold=False):
    cu = bpy.data.curves.new(name, 'FONT'); cu.body = s
    cu.size = size; cu.extrude = extrude; cu.align_x = align; cu.align_y = 'BOTTOM'
    o = bpy.data.objects.new(name, cu); bpy.context.scene.collection.objects.link(o)
    o.location = loc; o.rotation_euler = rot
    bpy.context.view_layer.objects.active = o
    for ob in bpy.context.view_layer.objects: ob.select_set(False)
    o.select_set(True)
    bpy.ops.object.convert(target='MESH')
    o = bpy.context.active_object; o.name = name
    o.data.materials.clear(); o.data.materials.append(get_mat(mat)[0])
    if parent: set_parent(o, parent)
    return o

def light(name, kind, loc, color='#ffb060', energy=500, spot_deg=110, rot=(0, 0, 0), radius=0.1, parent=None):
    ld = bpy.data.lights.new(name, kind)
    ld.color = hexc(color); ld.energy = energy
    if kind == 'SPOT': ld.spot_size = math.radians(spot_deg); ld.spot_blend = 0.6
    if kind in ('POINT', 'SPOT'): ld.shadow_soft_size = radius
    o = bpy.data.objects.new(name, ld); bpy.context.scene.collection.objects.link(o)
    o.location = loc; o.rotation_euler = rot
    if parent: set_parent(o, parent)
    return o

def tag(o, **kw):
    for k, v in kw.items(): o[k] = v
    return o

def export(path, use_selection=False):
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_yup=True, export_apply=True,
                              export_lights=True, export_extras=True, export_animations=True,
                              export_image_format='JPEG', export_jpeg_quality=88, use_selection=use_selection)

def stats():
    tris = 0
    for o in bpy.data.objects:
        if o.type == 'MESH':
            tris += sum(len(p.vertices) - 2 for p in o.data.polygons)
    return tris

def setup_render(night=True, res=(1200, 800), samples=48):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = samples; sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.view_settings.view_transform = 'AgX'
    w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    if night:
        bg.inputs[0].default_value = (0.012, 0.016, 0.03, 1); bg.inputs[1].default_value = 1.0
    else:
        sky = w.node_tree.nodes.new("ShaderNodeTexSky"); w.node_tree.links.new(sky.outputs[0], bg.inputs[0])
        bg.inputs[1].default_value = 0.3
    cam_d = bpy.data.cameras.new("Cam")
    cam = bpy.data.objects.new("PreviewCam", cam_d); sc.collection.objects.link(cam); sc.camera = cam
    return cam

def shoot(cam, pos, tgt, path, lens=28):
    cam.data.lens = lens
    cam.location = pos
    cam.rotation_euler = (Vector(tgt) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
