"""Procedural cars. Forward = Blender -Y (= glTF +Z). Wheels are separate objects with origins at hub centers."""
import bpy, math
from mathutils import Vector
from lib import MB, get_mat, empty, set_parent, light, tag

SPECS = {
 "sedan": dict(paint="car_navy", L=4.85, sf=1.425, sr=-1.425, wr=0.34, track=0.80, tw=0.225,
   lower=[(-2.425,0.38,0.62,0.80),(-2.40,0.30,0.80,0.86),(-2.30,0.27,0.95,0.90),(-1.9,0.26,1.00,0.92),
          (-1.3,0.25,1.00,0.925),(0.0,0.24,0.97,0.93),(0.9,0.25,0.94,0.925),(1.6,0.26,0.86,0.915),
          (2.2,0.28,0.78,0.89),(2.38,0.32,0.70,0.84),(2.425,0.40,0.58,0.76)],
   cabin=[(-1.45,0.99,1.00,0.86,0.80),(-0.75,0.98,1.40,0.87,0.70),(-0.4,0.975,1.445,0.875,0.72),
          (0.3,0.97,1.445,0.875,0.72),(1.15,0.945,0.955,0.87,0.85)],
   head=(2.36,0.72), tail=(-2.36,0.86), belt=0.97, roof_s=(-0.4, 0.3)),
 "hatch": dict(paint="car_silver", L=4.25, sf=1.25, sr=-1.35, wr=0.32, track=0.77, tw=0.205,
   lower=[(-2.125,0.38,0.62,0.78),(-2.10,0.30,0.85,0.85),(-2.0,0.27,0.98,0.88),(-1.5,0.26,1.0,0.89),
          (0,0.24,0.96,0.895),(0.8,0.25,0.93,0.89),(1.4,0.26,0.84,0.88),(1.95,0.28,0.74,0.85),
          (2.10,0.32,0.66,0.80),(2.125,0.40,0.55,0.72)],
   cabin=[(-2.03,0.98,1.36,0.85,0.70),(-1.75,0.98,1.48,0.86,0.71),(0.15,0.965,1.49,0.865,0.71),
          (0.95,0.94,0.95,0.86,0.84)],
   head=(2.06,0.68), tail=(-2.08,0.90), belt=0.97, roof_s=(-1.75, 0.15)),
 "suv": dict(paint="car_charcoal", L=4.75, sf=1.40, sr=-1.45, wr=0.37, track=0.83, tw=0.245,
   lower=[(-2.375,0.48,0.75,0.84),(-2.35,0.40,0.95,0.90),(-2.2,0.36,1.10,0.94),(-1.5,0.35,1.12,0.955),
          (0,0.34,1.10,0.96),(0.9,0.35,1.08,0.955),(1.6,0.37,1.02,0.945),(2.2,0.40,0.95,0.92),
          (2.35,0.45,0.88,0.87),(2.375,0.52,0.75,0.80)],
   cabin=[(-2.25,1.11,1.62,0.90,0.76),(-2.0,1.11,1.72,0.91,0.77),(0.3,1.10,1.74,0.915,0.78),
          (1.25,1.07,1.08,0.91,0.88)],
   head=(2.31,0.88), tail=(-2.33,1.02), belt=1.10, roof_s=(-2.0, 0.3)),
}

def _interp(st, k=6):
    out = []
    for a, b in zip(st[:-1], st[1:]):
        for i in range(k):
            t = i / k; out.append(tuple(x + (y - x) * t for x, y in zip(a, b)))
    out.append(st[-1]); return out

def _lower_sec(s, zb, zt, hw, n=28, e=4.0):
    zc, hh = (zb + zt) / 2, (zt - zb) / 2; pts = []
    for i in range(n):
        a = 2 * math.pi * i / n; c, sn = math.cos(a), math.sin(a)
        x = hw * math.copysign(abs(c) ** (2 / e), c); z = zc + hh * math.copysign(abs(sn) ** (2 / e), sn)
        pts.append((x, -s, z))
    return pts

def _cabin_sec(s, zb, zt, hwb, hwt, n_arc=9):
    pts = [(hwb, -s, zb)]
    r = min(0.12, max(zt - zb - 0.001, 0.001))
    for i in range(n_arc):
        a = math.pi * i / (n_arc - 1)
        x = hwt * math.cos(a) * (1 if i in (0, n_arc - 1) else 1); z = zt - r + r * math.sin(a) if zt - zb > 0.05 else zt
        pts.append((x * (0.98 if 0 < i < n_arc - 1 else 1), -s, z))
    pts.append((-hwb, -s, zb))
    return pts

def _strip(mb, p0, p1, w, mat, d=0.012):
    """Thin pillar between points p0 and p1 (x,y,z), width w along y."""
    p0, p1 = Vector(p0), Vector(p1)
    out = Vector((math.copysign(1, p0.x), 0, 0)) * d
    a = [p0 + Vector((0, -w/2, 0)), p0 + Vector((0, w/2, 0)), p1 + Vector((0, w/2, 0)), p1 + Vector((0, -w/2, 0))]
    b = [p + out for p in a]
    mb.loft([a, b], mat)

def _revolve(mb, profile, cx, mat_fn, seg=36, center=(0, 0, 0)):
    """profile: list of (r, dx) revolved around X axis at center."""
    cxv = Vector(center); secs = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        secs.append([cxv + Vector((dx, r * math.cos(a), r * math.sin(a))) for r, dx in profile])
    for i in range(seg):
        A, B = secs[i], secs[(i + 1) % seg]
        for k in range(len(profile) - 1):
            pts = [A[k], A[k + 1], B[k + 1], B[k]]
            mb.face(pts, mat_fn(k))

def make_wheel(name, sp, side):
    r, tw = sp["wr"], sp["tw"]
    mb = MB(name)
    sgn = 1 if side > 0 else -1
    # tire: rounded profile from inner to outer face (dx along +x outward for right side)
    prof = [(r * 0.66, -tw/2), (r * 0.80, -tw/2 - 0.005), (r * 0.94, -tw/2 + 0.01), (r * 0.99, -tw/2 + 0.04),
            (r, -tw/4), (r, tw/4), (r * 0.99, tw/2 - 0.04), (r * 0.94, tw/2 - 0.01), (r * 0.80, tw/2 + 0.005), (r * 0.66, tw/2)]
    prof = [(rr, dx * sgn) for rr, dx in prof]
    _revolve(mb, prof, 0, lambda k: "rubber", seg=40)
    # rim barrel + face + 5 spokes + hub + brake disc
    ri = r * 0.66; face_x = sgn * (tw/2 - 0.03)
    mb.cyl((-sgn * tw/2, 0, 0), (sgn, 0, 0), ri, tw - 0.02, "alloy", seg=40, cap=False)
    mb.cyl((face_x - sgn*0.01, 0, 0), (sgn, 0, 0), ri * 0.98, 0.02, "alloy", seg=40, cap=False)
    # dark disc behind spokes
    mb.cyl((face_x - sgn*0.06, 0, 0), (sgn, 0, 0), ri * 0.95, 0.005, "plastic_black", seg=32)
    mb.cyl((face_x - sgn*0.09, 0, 0), (sgn, 0, 0), ri * 0.75, 0.025, "metal_brushed", seg=32)  # brake disc
    for i in range(5):
        a = 2 * math.pi * i / 5
        for w_off in (-0.022, 0.022):
            pass
        c, s = math.cos(a), math.sin(a)
        p0 = Vector((face_x, 0, 0)); p1 = Vector((face_x, ri * 0.93 * c, ri * 0.93 * s))
        perp = Vector((0, -s, c)) * 0.028
        A = [p0 + perp * 0.6, p1 + perp, p1 - perp, p0 - perp * 0.6]
        B = [p + Vector((-sgn * 0.035, 0, 0)) for p in A]
        mb.loft([B, A], "alloy")
    mb.cyl((face_x - sgn*0.02, 0, 0), (sgn, 0, 0), 0.065, 0.035, "alloy", seg=20)
    mb.cyl((face_x + sgn*0.012, 0, 0), (sgn, 0, 0), 0.035, 0.008, "chrome", seg=16)
    return mb

def make_car(kind, name, loc=(0, 0, 0), heading=0.0, paint=None, headlights=False):
    sp = SPECS[kind]; paint = paint or sp["paint"]
    root = empty(name)
    # ---- lower body ----
    mb = MB(f"{name}_Body")
    secs = [_lower_sec(*st) for st in _interp(sp["lower"], 4)]
    mb.loft(secs, paint)
    body = mb.build(smooth=True)
    # ---- wheel arch cut (boolean) ----
    cutters = []
    for s in (sp["sf"], sp["sr"]):
        bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=sp["wr"] + 0.06, depth=3.0,
                                            location=(0, -s, sp["wr"]), rotation=(0, math.radians(90), 0))
        cutters.append(bpy.context.active_object)
    for c in cutters:
        m = body.modifiers.new("arch", 'BOOLEAN'); m.operation = 'DIFFERENCE'; m.object = c; m.solver = 'EXACT'
    dg = bpy.context.evaluated_depsgraph_get()
    newme = bpy.data.meshes.new_from_object(body.evaluated_get(dg))
    old = body.data; body.modifiers.clear(); body.data = newme
    for p in newme.polygons: p.use_smooth = True
    for c in cutters: bpy.data.objects.remove(c, do_unlink=True)
    # ---- cabin (glass + roof by normal) ----
    mc = MB(f"{name}_Cabin")
    csecs = [_cabin_sec(*st) for st in _interp(sp["cabin"], 3)]
    def cab_mat(pts):
        n = (Vector(pts[1]) - Vector(pts[0])).cross(Vector(pts[2]) - Vector(pts[0]))
        return paint if (n.length > 0 and abs(n.normalized().z) > 0.80) else "glass_dark"
    mc.loft(csecs, cab_mat, capmat="glass_dark")
    # pillars
    cab = sp["cabin"]
    for side in (1, -1):
        f0, f1 = cab[-1], cab[-2]       # A pillar: windshield base -> roof front
        _strip(mc, (side * f0[3] * 0.99, -f0[0], f0[1]), (side * f1[4] * 0.995, -f1[0], f1[2] - 0.13), 0.07, paint)
        r0, r1 = cab[0], cab[1]         # C pillar
        _strip(mc, (side * r0[3] * 0.99, -(r0[0] + 0.12), r0[1]), (side * r1[4] * 0.995, -(r1[0] + 0.05), r1[2] - 0.13), 0.22, paint)
        bs = (sp["roof_s"][0] + sp["roof_s"][1]) / 2 - 0.15   # B pillar
        _strip(mc, (side * 0.875 * (sp["lower"][5][3] / 0.93), -bs, sp["belt"]), (side * cab[2][4] * 0.995, -bs, cab[2][2] - 0.13), 0.09, "plastic_black")
    cabin = mc.build(smooth=True)
    # ---- details ----
    md = MB(f"{name}_Trim")
    hs, hz = sp["head"]; ts, tz = sp["tail"]; hw = max(st[3] for st in sp["lower"])
    for side in (1, -1):
        md.box(side * 0.42, -(hs + 0.06), hz - 0.05, side * 0.78, -(hs - 0.02), hz + 0.05, "headlight")
        md.box(side * 0.52, -(ts - 0.06), tz - 0.05, side * 0.86, -(ts + 0.03), tz + 0.05, "taillight")
        md.box(side * (hw - 0.02), -(sp["cabin"][-1][0] - 0.12), sp["belt"] + 0.02, side * (hw + 0.13), -(sp["cabin"][-1][0] - 0.25), sp["belt"] + 0.14, paint)  # mirror
        for hs_ in (0.15, -0.75):
            md.box(side * (hw - 0.005), -(hs_ + 0.08), sp["belt"] - 0.08, side * (hw + 0.012), -(hs_ - 0.08), sp["belt"] - 0.055, "chrome")
        for seam in (sp["cabin"][-1][0] - 0.15, (sp["roof_s"][0] + sp["roof_s"][1]) / 2 - 0.15, sp["sr"] + 0.45):
            md.box(side * (hw - 0.01), -(seam - 0.003), sp["lower"][5][1] + 0.1, side * (hw + 0.004), -(seam + 0.003), sp["belt"] - 0.02, "plastic_black")
        md.box(side * (hw - 0.012), -(sp["cabin"][-1][0] - 0.1), sp["belt"] - 0.012, side * (hw + 0.002), -(sp["cabin"][0][0] + 0.15), sp["belt"] + 0.004, "chrome")
    front = sp["lower"][-1][0]; rear = sp["lower"][0][0]
    md.box(-0.42, -(front + 0.005), hz - 0.27, 0.42, -(front - 0.04), hz - 0.10, "plastic_black")   # grille
    md.box(-0.26, -(front + 0.012), hz - 0.36, 0.26, -(front - 0.01), hz - 0.25, "plastic_white")  # plate F
    md.box(-0.26, -(rear - 0.012), tz - 0.30, 0.26, -(rear + 0.01), tz - 0.19, "plastic_white")    # plate R
    for s in (sp["sf"], sp["sr"]):                                     # arch liners
        md.cyl((-hw + 0.02, -s, sp["wr"]), (1, 0, 0), sp["wr"] + 0.055, 0.12, "plastic_black", seg=32, cap=False)
        md.cyl((hw - 0.14, -s, sp["wr"]), (1, 0, 0), sp["wr"] + 0.055, 0.12, "plastic_black", seg=32, cap=False)
    trim = md.build()
    parts = [body, cabin, trim]
    wheels = {}
    for tag_, s, side in (("FL", sp["sf"], 1), ("FR", sp["sf"], -1), ("RL", sp["sr"], 1), ("RR", sp["sr"], -1)):
        wmb = make_wheel(f"{name}_Wheel_{tag_}", sp, side)
        w = wmb.build(smooth=True)
        w.location = (side * sp["track"], -s, sp["wr"])
        tag(w, role="wheel", steer=tag_.startswith("F"), radius=sp["wr"])
        wheels[tag_] = w; parts.append(w)
    if headlights:
        for side in (1, -1):
            l = light(f"{name}_Headlight_{'L' if side < 0 else 'R'}", 'SPOT', (side * 0.6, -(hs + 0.1), hz),
                      color='#f4f6ff', energy=0, spot_deg=50, rot=(math.radians(85), 0, 0))
            parts.append(l)
    for p in parts: set_parent(p, root)
    tag(root, role="vehicle", kind=kind, drivable=headlights)
    root.location = loc; root.rotation_euler = (0, 0, heading)
    return root
