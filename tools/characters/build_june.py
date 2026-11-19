"""June Park, MetaHuman (UE 5.6 Optimized/Low assembly, FBX bulk export) -> one web GLB.

    python3 build_june.py [--render]

- One skeleton (the face export's, which holds the full body chain), pruned to the bones any mesh uses + jaw/eyes.
- Body LOD1, face LOD0 (already the LOD5-7 head), outfit LOD3, sneakers LOD2.
- Textures to 1K. Clothing has no exported textures, so it gets flat colors close to the Creator preview.
- Hair: modeled cap + curly bob (Creator hair is strand grooms, which can't leave Unreal), weighted to 'head'.
Output: out/june.glb (meters, Y-up, faces +Z).
"""
import bpy, bmesh, math, sys, os, random
from mathutils import Vector

B = "/mnt/user-data/uploads/MetaHumans/MHC_JunePark/"
HERE = "/home/claude/june/"
RENDER = "--render" in sys.argv
os.makedirs(HERE + "out", exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)

def imp(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=B + path, use_custom_normals=True, ignore_leaf_bones=True)
    return [o for o in bpy.data.objects if o not in before]

face_objs = imp("Face/SKM_MHC_JunePark_FaceMesh.FBX")
face_rig = next(o for o in face_objs if o.type == 'ARMATURE')
body_objs = imp("Body/SKM_MHC_JunePark_BodyMesh.FBX")
rig = next(o for o in body_objs if o.type == 'ARMATURE')       # the full body skeleton (arms, legs, hands)
rig.name = "June_Rig"
others = imp("Clothing/MHC_JunePark_Outfits.FBX") + imp("Clothing/MHC_JunePark_Outfits_2.FBX")

KEEP = {"SKM_MHC_JunePark_FaceMesh_LOD0": "June_Face", "SKM_MHC_JunePark_BodyMesh_LOD1": "June_Body",
        "MHC_JunePark_Outfits_LOD3": "June_Outfit", "MHC_JunePark_Outfits_2_LOD2": "June_Shoes"}
for o in list(bpy.data.objects):
    if o.type == 'MESH' and o.name not in KEEP:
        bpy.data.objects.remove(o, do_unlink=True)

# Bring the face skeleton's facial bones into the body skeleton: join, then drop the duplicated body chain.
body_names = {b.name for b in rig.data.bones}
bpy.ops.object.select_all(action='DESELECT')
face_rig.select_set(True); rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.join()
bpy.ops.object.mode_set(mode='EDIT')
eb = rig.data.edit_bones
for b in list(eb):
    base = b.name.rsplit(".", 1)[0] if "." in b.name else None
    if base and base in body_names and b.name not in body_names:
        for c in b.children:
            if c.name.startswith("FACIAL") or c.name not in body_names:
                c.parent = eb.get(base)
        eb.remove(b)
bpy.ops.object.mode_set(mode='OBJECT')

for o in list(bpy.data.objects):
    if o.type == 'MESH':
        o.name = KEEP[o.name]
        mw = o.matrix_world.copy()
        o.parent = rig
        o.matrix_world = mw
        for m in o.modifiers:
            if m.type == 'ARMATURE': m.object = rig
bpy.context.view_layer.update()
rmw = rig.matrix_world.copy()
rig.parent = None
rig.matrix_world = rmw            # keep the FBX's cm->m scale when its parent empty goes away
for o in list(bpy.data.objects):
    if o.type in ('ARMATURE', 'EMPTY') and o is not rig:
        bpy.data.objects.remove(o, do_unlink=True)
print("RIG BONES AFTER JOIN", len(rig.data.bones), [n for n in ("lowerarm_l", "hand_l", "thigh_l", "FACIAL_C_Jaw") if n in rig.data.bones])

# ------------------------------------------------------------------ materials
def tex_mat(name, color_img, normal_img=None, rough=0.6):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; p = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(HERE + color_img)
    nt.links.new(t.outputs["Color"], p.inputs["Base Color"])
    if normal_img:
        n = nt.nodes.new("ShaderNodeTexImage"); n.image = bpy.data.images.load(HERE + normal_img); n.image.colorspace_settings.name = 'Non-Color'
        nm = nt.nodes.new("ShaderNodeNormalMap"); nt.links.new(n.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], p.inputs["Normal"])
    p.inputs["Roughness"].default_value = rough
    return m

def flat(name, hexcol, rough=0.8, metal=0.0):
    h = hexcol.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c]
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*c, 1); p.inputs["Roughness"].default_value = rough; p.inputs["Metallic"].default_value = metal
    return m

SKIN_BODY = tex_mat("June_Skin_Body", "body_bc.jpg", "body_n.png", 0.55)
SKIN_FACE = tex_mat("June_Skin_Face", "face_bc.jpg", "face_n.png", 0.5)
EYE_L = tex_mat("June_Eye_L", "eye_L.jpg", rough=0.1)
EYE_R = tex_mat("June_Eye_R", "eye_R.jpg", rough=0.1)
TEETH = tex_mat("June_Teeth", "teeth.jpg", rough=0.3)
OUTFIT = [flat("June_Jumpsuit", "#8e93b8", 0.85), flat("June_Jumpsuit_Trim", "#7b80a6", 0.8),
          flat("June_Jumpsuit_Elastic", "#9a9ec2", 0.9), flat("June_Jumpsuit_Detail", "#6f7396", 0.7)]
SHOES = [flat("June_Shoe_Upper", "#dfe3e6", 0.6), flat("June_Shoe_Accent", "#3f9fb0", 0.55),
         flat("June_Shoe_Sole", "#f0ece4", 0.75), flat("June_Shoe_Lace", "#cfd6db", 0.8)]

def remap(o, fn):
    for i, slot in enumerate(o.material_slots):
        slot.material = fn(i, slot.material.name if slot.material else "")

remap(bpy.data.objects["June_Body"], lambda i, n: SKIN_BODY)
# The FBX slot names don't line up with the polygon indices, so assign by what the polygons are:
# the big group is skin, the mid group teeth, the two small groups eyes (by side, face looks down -Y).
fobj = bpy.data.objects["June_Face"]
groups = {}
for poly in fobj.data.polygons:
    groups.setdefault(poly.material_index, []).append(poly)
order = sorted(groups, key=lambda k: -len(groups[k]))
assign = {order[0]: SKIN_FACE, order[1]: TEETH}
for k in order[2:]:
    ax = sum((fobj.matrix_world @ p.center).x for p in groups[k]) / len(groups[k])
    assign[k] = EYE_L if ax > 0 else EYE_R
remap(fobj, lambda i, n: assign.get(i, SKIN_FACE))
remap(bpy.data.objects["June_Outfit"], lambda i, n: OUTFIT[min(i, 3)])
remap(bpy.data.objects["June_Shoes"], lambda i, n: SHOES[min(i, 3)])

# ------------------------------------------------------------------ hair: cap + curly bob, weighted to the head
face = bpy.data.objects["June_Face"]
bpy.context.view_layer.update()
fv = [face.matrix_world @ v.co for v in face.data.vertices]
cx = sum(v.x for v in fv) / len(fv)
top = max(v.z for v in fv)
eye_z = 1.582
cy = 0.005             # skull centre front/back (face points -Y)
cz = 1.600
HAIRLINE = 1.628       # forehead hairline height
FRONT = cy - 0.052     # nothing grows in front of this below the hairline
bm = bmesh.new()
# unit sphere by hand (bmesh's create_uvsphere radius argument changed between Blender versions)
U, V = 56, 36
rings = []
for j in range(1, V):
    th = math.pi * j / V
    rings.append([bm.verts.new((math.sin(th) * math.cos(2 * math.pi * i / U), math.sin(th) * math.sin(2 * math.pi * i / U), math.cos(th))) for i in range(U)])
pole_n = bm.verts.new((0, 0, 1)); pole_s = bm.verts.new((0, 0, -1))
for i in range(U):
    k = (i + 1) % U
    bm.faces.new((pole_n, rings[0][i], rings[0][k]))
    bm.faces.new((pole_s, rings[-1][k], rings[-1][i]))
    for j in range(len(rings) - 1):
        bm.faces.new((rings[j][i], rings[j + 1][i], rings[j + 1][k], rings[j][k]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
rx, ry, rz = 0.092, 0.108, 0.112
for v in bm.verts:
    x, y, z = v.co
    if z >= 0.1:
        p = Vector((x * rx, y * ry, z * rz))
    else:                                             # below the temples: a bob that drops to the jaw
        t = (0.1 - z) / 1.1
        drop = 0.1 * rz - t * 0.135
        flare = 1.0 + 0.08 * math.sin(t * math.pi)
        p = Vector((x * rx * flare, y * ry * flare + 0.01 * t, drop))
    v.co = Vector((cx, cy, cz)) + p
kill = [f for f in bm.faces if (lambda c: c.y < FRONT and c.z < HAIRLINE)(f.calc_center_median())]
bmesh.ops.delete(bm, geom=kill, context='FACES')
loose = [v for v in bm.verts if not v.link_faces]
bmesh.ops.delete(bm, geom=loose, context='VERTS')
# curls: lumpy displacement
R = random.Random(4)
seeds = [(Vector((R.uniform(-1, 1), R.uniform(-1, 1), R.uniform(-1, 1))).normalized(), R.uniform(0.004, 0.009)) for _ in range(140)]
bm.normal_update()
for v in bm.verts:
    d = (v.co - Vector((cx, cy, cz))).normalized()
    bump = sum(a * max(0.0, d.dot(s) - 0.93) * 14 for s, a in seeds)
    v.co += v.normal * bump
me = bpy.data.meshes.new("June_Hair"); bm.to_mesh(me); bm.free()
hair = bpy.data.objects.new("June_Hair", me); bpy.context.scene.collection.objects.link(hair)
for p in me.polygons: p.use_smooth = True
# hug the scalp: pull the top of the shell onto the head surface (+ hair thickness), fading out toward the bob
from mathutils.bvhtree import BVHTree
tree = BVHTree.FromPolygons(fv, [tuple(p.vertices) for p in face.data.polygons])
for v in me.vertices:
    w = max(0.0, min(1.0, (v.co.z - 1.575) / 0.06))
    if w <= 0: continue
    hit, nrm, idx, dist = tree.find_nearest(v.co)
    if hit is None: continue
    out = (v.co - hit).normalized() if (v.co - hit).length > 1e-6 else nrm
    v.co = v.co.lerp(hit + out * 0.013, w)
bpy.context.view_layer.objects.active = hair
sm = hair.modifiers.new("smooth", 'SMOOTH'); sm.iterations = 2; sm.factor = 0.5
bpy.ops.object.modifier_apply(modifier="smooth")
sol = hair.modifiers.new("solid", 'SOLIDIFY'); sol.thickness = 0.008
bpy.context.view_layer.objects.active = hair
bpy.ops.object.modifier_apply(modifier="solid")
# ombre: dark roots to the red Andrew picked in Creator
col = me.color_attributes.new("Col", 'BYTE_COLOR', 'POINT')
zmin = min(v.co.z for v in me.vertices); zmax = max(v.co.z for v in me.vertices)
for i, v in enumerate(me.vertices):
    t = 1 - (v.co.z - zmin) / (zmax - zmin)
    t = max(0.0, (t - 0.7) / 0.3)
    root, tip = (0.022, 0.012, 0.010), (0.17, 0.03, 0.03)
    col.data[i].color = (*[root[k] * (1 - t) + tip[k] * t for k in range(3)], 1)
hm = bpy.data.materials.new("June_Hair"); hm.use_nodes = True
nt = hm.node_tree; p = nt.nodes["Principled BSDF"]
va = nt.nodes.new("ShaderNodeVertexColor"); va.layer_name = "Col"; nt.links.new(va.outputs["Color"], p.inputs["Base Color"])
p.inputs["Roughness"].default_value = 0.55
me.materials.append(hm)
bpy.context.view_layer.update()
hair.parent = rig
hair.matrix_parent_inverse = rig.matrix_world.inverted()   # the rig carries the FBX's 0.01 (cm) scale
vg = hair.vertex_groups.new(name="head"); vg.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
am = hair.modifiers.new("Armature", 'ARMATURE'); am.object = rig

# ------------------------------------------------------------------ prune bones nobody uses
used = set()
for o in rig.children:
    if o.type != 'MESH': continue
    weighted = set()
    for v in o.data.vertices:
        for g in v.groups:
            if g.weight > 0.001: weighted.add(g.group)
    used |= {o.vertex_groups[i].name for i in weighted}
used |= {"FACIAL_C_Jaw", "FACIAL_L_Eye", "FACIAL_R_Eye", "head", "neck_01", "neck_02"}
keep = set()
for name in used:
    b = rig.data.bones.get(name)
    while b:
        keep.add(b.name); b = b.parent
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
eb = rig.data.edit_bones
for b in list(eb):
    if b.name not in keep: eb.remove(b)
bpy.ops.object.mode_set(mode='OBJECT')
for o in rig.children:
    for g in list(o.vertex_groups):
        if g.name not in keep: o.vertex_groups.remove(g)
print("BONES", len(rig.data.bones), "TRIS", sum(len(p.vertices) - 2 for o in rig.children if o.type == 'MESH' for p in o.data.polygons))

if RENDER:
    sc = bpy.context.scene; sc.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'CYCLES'
    if sc.render.engine == 'CYCLES': sc.cycles.samples = 24
    sc.render.resolution_x, sc.render.resolution_y = 700, 900
    w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True; w.node_tree.nodes["Background"].inputs[0].default_value = (0.25, 0.25, 0.27, 1)
    ld = bpy.data.lights.new("k", 'AREA'); ld.energy = 300; ld.size = 2; lo = bpy.data.objects.new("k", ld); sc.collection.objects.link(lo)
    lo.location = (1.2, -2.0, 2.4); lo.rotation_euler = (math.radians(55), 0, math.radians(30))
    cam = bpy.data.objects.new("c", bpy.data.cameras.new("c")); sc.collection.objects.link(cam); sc.camera = cam
    for nm, pos, tgt, lens in (("full", (0.9, -3.2, 1.1), (0, 0, 0.88), 50), ("head", (0.25, -0.75, 1.62), (0, 0, 1.57), 60)):
        cam.location = pos; cam.data.lens = lens
        cam.rotation_euler = (Vector(tgt) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = HERE + f"out/prev_{nm}.png"; bpy.ops.render.render(write_still=True)
    sys.exit(0)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=HERE + "out/june.glb", export_format='GLB', export_yup=True, use_selection=True,
                          export_animations=False, export_morph=False, export_image_format='JPEG', export_jpeg_quality=85,
                          export_skins=True, export_all_influences=False, export_lights=False, export_cameras=False)
print("EXPORTED", os.path.getsize(HERE + "out/june.glb"))
