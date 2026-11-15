"""v2 helpers on top of lib.py: extra materials, oriented label quads, readers with LED variants,
CCTV domes, furniture, plants, and context renders (import the existing GLBs for preview only)."""
import sys; sys.path.insert(0, '/home/claude/harbor')
import bpy, math
from mathutils import Vector
import lib
from lib import *

T = "/home/claude/harbor/textures"

lib.PLAIN.update({
    "paint_red":      dict(color='#a8191b', rough=0.35),
    "paint_grey":     dict(color='#8a8c8e', rough=0.7),
    "paint_safety":   dict(color='#c9a227', rough=0.5),
    "cardboard":      dict(color='#9c7a52', rough=0.9),
    "tape_brown":     dict(color='#b58a55', rough=0.5),
    "glass_frost":    dict(color='#dfe6e8', rough=0.5),
    "leather_black":  dict(color='#16161a', rough=0.45),
    "fabric_teal":    dict(color='#22474a', rough=0.9),
    "fabric_sand":    dict(color='#8f8270', rough=0.9),
    "rug_charcoal":   dict(color='#2a2b2e', rough=0.95),
    "rug_sand":       dict(color='#6d6253', rough=0.95),
    "blind_fabric":   dict(color='#b9b6ae', rough=0.95),
    "plastic_blue":   dict(color='#1f4f8f', rough=0.5),
    "plastic_green":  dict(color='#2f6b3f', rough=0.5),
    "rubber_floor":   dict(color='#26272a', rough=0.9),
    "mirror":         dict(color='#e8ecee', metal=1.0, rough=0.03),
    "led_amber_soft": dict(color='#ffb347', rough=0.3, emit='#ffaa33', estr=4.0),
    "led_green_soft": dict(color='#4dff6a', rough=0.3, emit='#30ff55', estr=5.0),
    "led_blue":       dict(color='#3a7bff', rough=0.3, emit='#2f6bff', estr=8.0),
    "led_white":      dict(color='#ffffff', rough=0.3, emit='#f4f8ff', estr=6.0),
    "pendant_glow":   dict(color='#fff1dc', rough=0.4, emit='#ffe8c8', estr=6.0),
    "ceramic_white":  dict(color='#ece9e2', rough=0.25),
    "coffee":         dict(color='#2a170c', rough=0.1),
    "wood_dark":      dict(color='#3a2a1e', rough=0.55),
    "foliage_dark":   dict(color='#1f3a1c', rough=0.75),
    "terracotta":     dict(color='#8e4b32', rough=0.8),
    "server_black":   dict(color='#0e0f11', metal=0.6, rough=0.45),
    "cable_blue":     dict(color='#2a5fb0', rough=0.6),
    "cable_yellow":   dict(color='#c8a020', rough=0.6),
})

def img(name):  return f"img:{T}/{name}.png"
def imge(name): return f"imgemit:{T}/{name}.png"

# ---------- geometry transforms (bake rotation into vertices so node rotations stay identity) ----------
def xform(mb, rz=0.0, off=(0, 0, 0), start=0):
    """Rotate vertices [start:] about Z by rz (radians) around the local origin, then translate by off."""
    c, s = math.cos(rz), math.sin(rz)
    ox, oy, oz = off
    for i in range(start, len(mb.v)):
        x, y, z = mb.v[i]
        mb.v[i] = (ox + x * c - y * s, oy + x * s + y * c, oz + z)

def merge(dst, src):
    """Append src MB geometry into dst."""
    i0 = len(dst.v); dst.v.extend(src.v)
    for idx, m, uvs in src.f:
        dst.f.append((tuple(i + i0 for i in idx), m, uvs))

NORMALS = {'-y': (0, -1, 0), '+y': (0, 1, 0), '-x': (-1, 0, 0), '+x': (1, 0, 0), '+z': (0, 0, 1), '-z': (0, 0, -1)}

def label(mb, c, w, h, facing, mat, up=None):
    """Textured quad centered at c, w x h, readable from the side the normal points to.
    facing: '-y' etc, or a 3-vector normal. up: up vector (default +Z, or +Y for flat faces)."""
    n = Vector(NORMALS[facing]) if isinstance(facing, str) else Vector(facing).normalized()
    u = Vector(up) if up else (Vector((0, 1, 0)) if abs(n.z) > 0.9 else Vector((0, 0, 1)))
    r = u.cross(n).normalized(); u = n.cross(r).normalized()
    c = Vector(c)
    p0 = c - r * w / 2 - u * h / 2; p1 = c + r * w / 2 - u * h / 2
    p2 = c + r * w / 2 + u * h / 2; p3 = c - r * w / 2 + u * h / 2
    quad_uv(mb, tuple(p0), tuple(p1), tuple(p2), tuple(p3), mat)

def label_obj(name, c, w, h, facing, mat, up=None, parent=None, **tags):
    mb = MB(name); label(mb, c, w, h, facing, mat, up)
    o = mb.build(origin=tuple(c), fix_normals=False)
    if tags: tag(o, **tags)
    if parent: set_parent(o, parent)
    return o

def hemi(mb, center, r, mat, seg=16, rings=4, down=True):
    cx, cy, cz = center; sg = -1 if down else 1
    prev = [(cx + r * math.cos(2 * math.pi * i / seg), cy + r * math.sin(2 * math.pi * i / seg), cz) for i in range(seg)]
    for k in range(1, rings + 1):
        a = (math.pi / 2) * k / rings
        rr = r * math.cos(a); zz = cz + sg * r * math.sin(a)
        if k == rings:
            for i in range(seg):
                j = (i + 1) % seg
                mb.face([prev[i], prev[j], (cx, cy, zz)], mat)
        else:
            cur = [(cx + rr * math.cos(2 * math.pi * i / seg), cy + rr * math.sin(2 * math.pi * i / seg), zz) for i in range(seg)]
            for i in range(seg):
                j = (i + 1) % seg
                mb.face([prev[i], prev[j], cur[j], cur[i]], mat)
            prev = cur

def tri(mb, pts, mat): mb.face(pts, mat)

# ---------- interactive building blocks ----------
def badge_reader(name, pos, rz=0.0, scale=1.0, extra_tags=None):
    """Wall reader like the existing BadgeReader. Local frame: mounted on a wall whose face points -Y.
    pos = point on the wall face (center of the reader), rz rotates the facing (0 -> faces -Y).
    Children <name>_LED_Off|Red|Green share one spot; show one at a time."""
    s = scale
    mb = MB(name)
    mb.box(-0.06 * s, -0.045 * s, -0.10 * s, 0.06 * s, 0, 0.10 * s, "plastic_black")
    mb.box(-0.045 * s, -0.05 * s, -0.08 * s, 0.045 * s, -0.045 * s, 0.03 * s, "plastic_grey")
    xform(mb, rz, pos)
    o = tag(mb.build(origin=pos), role="badge_reader", collider="none", **(extra_tags or {}))
    for state, m in (("Off", "plastic_grey"), ("Red", "led_red"), ("Green", "led_green")):
        lm = MB(f"{name}_LED_{state}")
        lm.box(-0.01 * s, -0.054 * s, 0.055 * s, 0.01 * s, -0.045 * s, 0.075 * s, m)
        xform(lm, rz, pos)
        lo = tag(lm.build(origin=pos), role="badge_led", state=state.lower(), default_visible=(state == "Off"))
        if state != "Off": lo.hide_set(False)
        set_parent(lo, o)
    return o

def cctv_dome(name, x, y, zc, covers, fov=100):
    """Ceiling dome camera. zc = ceiling underside height."""
    mb = MB(name)
    mb.cyl((x, y, zc), (0, 0, -1), 0.085, 0.03, "plastic_white", seg=20)
    hemi(mb, (x, y, zc - 0.03), 0.065, "glass_dark", seg=16, rings=4)
    o = tag(mb.build(origin=(x, y, zc), smooth=True), role="camera", covers=covers, fov_deg=fov, collider="none",
            note="ceiling dome CCTV; child _LED is a small red recording light")
    led = MB(f"{name}_LED"); led.box(x + 0.07, y - 0.006, zc - 0.034, x + 0.082, y + 0.006, zc - 0.03, "led_red")
    set_parent(tag(led.build(origin=(x, y, zc)), role="camera_led", default_visible=True), o)
    return o

# ---------- furniture ----------
def office_chair(mb, x, y, z, rot=0.0, fabric="fabric_grey"):
    for k in range(5):
        a = rot + k * 2 * math.pi / 5
        mb.box(x, y - 0.02, z + 0.06, x + 0.32, y + 0.02, z + 0.1, "plastic_black", rot=a, pivot=(x, y))
        mb.cyl((x + 0.31 * math.cos(a), y + 0.31 * math.sin(a), z), (0, 0, 1), 0.03, 0.06, "plastic_black", seg=8)
    mb.cyl((x, y, z + 0.08), (0, 0, 1), 0.028, 0.36, "chrome", seg=10)
    mb.box(x - 0.25, y - 0.25, z + 0.44, x + 0.25, y + 0.25, z + 0.52, fabric, rot=rot)
    c, s = math.cos(rot), math.sin(rot)
    bx, by = x - s * 0.24, y + c * 0.24
    mb.box(bx - 0.23, by - 0.03, z + 0.56, bx + 0.23, by + 0.03, z + 1.05, fabric, rot=rot)
    mb.box(bx - 0.02, by - 0.02, z + 0.5, bx + 0.02, by + 0.02, z + 0.6, "plastic_black", rot=rot)

def plant(mb, x, y, z, h=1.2, pot="plastic_white", r=0.22, leaves=10, mat="plant_green"):
    mb.cyl((x, y, z), (0, 0, 1), r, 0.45, pot, seg=16, r2=r * 0.82)
    mb.cyl((x, y, z + 0.43), (0, 0, 1), r * 0.8, 0.01, "soil", seg=16)
    for k in range(leaves):
        a = k * 2.4; rr = 0.04 + (k % 3) * 0.05
        mb.cyl((x + math.cos(a) * rr, y + math.sin(a) * rr, z + 0.44), (math.cos(a) * 0.3, math.sin(a) * 0.3, 1),
               0.09, h * (0.5 + 0.1 * (k % 5)), mat if k % 3 else "foliage_dark", seg=6, r2=0.01)

def tall_plant(mb, x, y, z, h=1.9, pot="steel_black"):
    """Fiddle-leaf style: pot, trunk, leaf clusters."""
    mb.cyl((x, y, z), (0, 0, 1), 0.26, 0.55, pot, seg=18, r2=0.22)
    mb.cyl((x, y, z + 0.53), (0, 0, 1), 0.21, 0.01, "soil", seg=16)
    mb.cyl((x, y, z + 0.54), (0, 0, 1), 0.025, h - 0.55, "wood_dark", seg=8)
    for k in range(16):
        a = k * 2.399; zz = z + 0.9 + (k / 16) * (h - 1.0); rr = 0.12 + 0.1 * ((k * 7) % 3) / 2
        p = (x + math.cos(a) * 0.05, y + math.sin(a) * 0.05, zz)
        mb.cyl(p, (math.cos(a) * rr * 2.5, math.sin(a) * rr * 2.5, 0.35), 0.075, 0.34, "plant_green" if k % 2 else "foliage_dark",
               seg=5, r2=0.02)

def armchair(mb, x, y, rot, fabric="fabric_teal", z=0.0):
    """Lounge armchair, local front faces -Y before rotation (rot about Z around x,y)."""
    m = MB("tmp")
    m.box(-0.42, -0.4, z + 0.1, 0.42, 0.4, z + 0.42, fabric)          # seat base
    m.box(-0.42, 0.22, z + 0.42, 0.42, 0.4, z + 0.85, fabric)          # back
    m.box(-0.42, -0.4, z + 0.42, -0.3, 0.22, z + 0.62, fabric)         # arms
    m.box(0.3, -0.4, z + 0.42, 0.42, 0.22, z + 0.62, fabric)
    m.box(-0.36, -0.36, z + 0.42, 0.36, 0.2, z + 0.5, fabric)          # cushion
    for lx in (-0.36, 0.33):
        for ly in (-0.34, 0.33):
            m.box(lx, ly, z, lx + 0.03, ly + 0.03, z + 0.1, "steel_black")
    xform(m, rot, (x, y, 0)); merge(mb, m)

def sofa(mb, x, y, rot, w=2.0, fabric="fabric_sand", z=0.0):
    m = MB("tmp"); hw = w / 2
    m.box(-hw, -0.45, z + 0.1, hw, 0.45, z + 0.42, fabric)
    m.box(-hw, 0.25, z + 0.42, hw, 0.45, z + 0.85, fabric)
    m.box(-hw, -0.45, z + 0.42, -hw + 0.14, 0.25, z + 0.64, fabric)
    m.box(hw - 0.14, -0.45, z + 0.42, hw, 0.25, z + 0.64, fabric)
    for i in range(2):
        m.box(-hw + 0.16 + i * (w - 0.32) / 2, -0.4, z + 0.42, -hw + 0.14 + (i + 1) * (w - 0.32) / 2, 0.22, z + 0.5, fabric)
    for lx in (-hw + 0.05, hw - 0.08):
        for ly in (-0.4, 0.38):
            m.box(lx, ly, z, lx + 0.03, ly + 0.03, z + 0.1, "steel_black")
    xform(m, rot, (x, y, 0)); merge(mb, m)

def mug(mb, x, y, z, mat="ceramic_white"):
    mb.cyl((x, y, z), (0, 0, 1), 0.04, 0.095, mat, seg=12)
    mb.cyl((x, y, z + 0.08), (0, 0, 1), 0.034, 0.012, "coffee", seg=12)
    mb.box(x + 0.038, y - 0.006, z + 0.025, x + 0.065, y + 0.006, z + 0.075, mat)

def landing_details(prefix, ex, wall_y, screen_y, z0, call_x, call_face_y, floor_default):
    """Hall call button overlay (covers the existing amber LED), hall lantern, landing indicator digits."""
    cb = MB(f"{prefix}_CallButton")
    cb.cyl((call_x, call_face_y + 0.008, z0 + 1.12), (0, -1, 0), 0.034, 0.004, "chrome", seg=20)
    cbo = tag(cb.build(origin=(call_x, call_face_y, z0 + 1.12)), role="elevator_call_button", car="A", interactive=True,
              collider="none", direction=("up" if z0 < 1 else "down"),
              note="sits over the old always-on amber LED; toggle _Lit/_Unlit")
    for st, mat in (("Unlit", "metal_brushed"), ("Lit", "led_amber")):
        m = MB(f"{prefix}_CallButton_{st}")
        m.cyl((call_x, call_face_y + 0.004, z0 + 1.12), (0, -1, 0), 0.026, 0.007, mat, seg=20)
        set_parent(tag(m.build(origin=(call_x, call_face_y, z0 + 1.12)), state=st.lower(), default_visible=(st == "Unlit")), cbo)
    ln = MB(f"{prefix}_Lantern")
    lx = ex + 0.48
    ln.box(lx - 0.08, wall_y - 0.035, z0 + 2.64, lx + 0.08, wall_y, z0 + 2.92, "steel_black")
    lno = tag(ln.build(), role="hall_lantern", car="A", collider="none",
              note="children _Up_Lit/_Up_Unlit/_Down_Lit/_Down_Unlit; light the car's travel direction on arrival")
    for dname, zc, up in (("Up", z0 + 2.835, True), ("Down", z0 + 2.725, False)):
        for st, mat in (("Unlit", "glass_dark"), ("Lit", "led_amber" if up else "led_amber")):
            m = MB(f"{prefix}_Lantern_{dname}_{st}")
            yy = wall_y - 0.036 - (0.001 if st == "Lit" else 0)
            pts = [(lx - 0.045, yy, zc - 0.035), (lx + 0.045, yy, zc - 0.035), (lx, yy, zc + 0.04)] if up else \
                  [(lx - 0.045, yy, zc + 0.035), (lx, yy, zc - 0.04), (lx + 0.045, yy, zc + 0.035)]
            m.face(pts, mat)
            set_parent(tag(m.build(fix_normals=False), direction=dname.lower(), state=st.lower(),
                           default_visible=(st == "Unlit")), lno)
    ind = empty(f"{prefix}_Indicator", (ex, screen_y, z0 + 2.72))
    tag(ind, role="floor_indicator", car="A", note="children _L and _14 digits in front of the existing landing screen")
    for f in ("L", "14"):
        t = text(f"{prefix}_Indicator_{f}", f, 0.11, (ex, screen_y - 0.002, z0 + 2.725), "led_amber_soft", extrude=0.001)
        set_parent(tag(t, floor=f, default_visible=(f == floor_default)), ind)

def import_glb(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.data.objects if o not in before]

def mark_hidden_defaults():
    """Hide default_visible=False nodes in the render (export keeps them; the game reads extras)."""
    for o in bpy.data.objects:
        if o.get("default_visible") is False:
            o.hide_render = True
