"""harbor_lobby_detail.glb: physical-security dressing for the Harbor Tower lobby.
World-aligned with harbor_block.glb (load at the origin, no offset). Blender Z-up; exported Y-up.
Secure line: speed gates + glass balustrade at y = 12.0 (glTF z = -12.0). North of it = badge-only zone."""
import sys; sys.path.insert(0, '/home/claude/harbor')
from lib2 import *

RENDER = "--render" in sys.argv
reset()
CZ = 4.45                       # lobby ceiling underside
BW = 17.45                      # granite elevator wall face (y)
GY0, GY1, GYC = 11.3, 12.7, 12.0
CABS = [(-1.9, -1.7), (-0.8, -0.6), (0.3, 0.5), (1.4, 1.6), (2.7, 2.9)]
LANES = [(1, -1.7, -0.8, False), (2, -0.6, 0.3, False), (3, 0.5, 1.4, False), (4, 1.6, 2.7, True)]

# =====================================================================
# SPEED GATES
# =====================================================================
sg = MB("SpeedGate_Bank")
for x0, x1 in CABS:
    sg.box(x0 + 0.01, GY0 + 0.01, 0, x1 - 0.01, GY1 - 0.01, 0.06, "steel_black")       # plinth
    sg.box(x0, GY0, 0.06, x1, GY1, 0.96, "metal_brushed")
    sg.box(x0 - 0.005, GY0 - 0.005, 0.96, x1 + 0.005, GY1 + 0.005, 1.0, "glass_dark")   # dark glass top
    sg.box(x0 + 0.02, GY0 - 0.003, 0.62, x1 - 0.02, GY0, 0.9, "glass_dark")             # end display windows
    sg.box(x0 + 0.02, GY1, 0.62, x1 - 0.02, GY1 + 0.003, 0.9, "glass_dark")
    for xs in (x0 - 0.002, x1):                                                          # sensor strips on lane faces
        sg.box(xs, GY0 + 0.15, 0.55, xs + 0.002, GY1 - 0.15, 0.58, "glass_dark")
gates = tag(sg.build(), role="speed_gate_bank", collider="mesh",
            note="5 cabinets, 4 lanes (L1-L3 0.9 m, L4 accessible 1.1 m). Flaps are separate nodes.")

for n, xa, xb, ada in LANES:
    rc = CABS[n][0] + 0.1                       # reader sits on the cabinet to the lane's right (east)
    if not ada:
        w = (xb - xa) / 2 - 0.012
        for side, hx, sgn in (("W", xa, 1), ("E", xb, -1)):
            f = MB(f"Turnstile_L{n}_Flap_{side}")
            x_in, x_out = sorted((hx, hx + sgn * w))
            f.box(x_in, GYC - 0.008, 0.32, x_out, GYC + 0.008, 1.22, "glass_clear")
            tip = x_out - 0.012 if sgn > 0 else x_in
            f.box(tip, GYC - 0.011, 0.32, tip + 0.012, GYC + 0.011, 1.22, "chrome")
            f.box(x_in, GYC - 0.011, 1.205, x_out, GYC + 0.011, 1.22, "chrome")
            tag(f.build(origin=(hx, GYC, 0)), role="turnstile", lane=n, part="flap", hinge_axis="y",
                open_deg=(90 if sgn > 0 else -90), closed_deg=0, default_state="closed", collider="none",
                blocks_when_closed=True, interactive=False,
                note="glass wing; rotate about glTF Y to open_deg (swings toward the elevators). Gate collision is the "
                     "game's job: block lane while closed (collider none so a missing hook never traps the player)")
    else:
        f = MB("Turnstile_L4_ADA_Gate")
        w = xb - xa - 0.04
        f.box(xa + 0.02, GYC - 0.008, 0.22, xa + 0.02 + w, GYC + 0.008, 1.12, "glass_clear")
        f.box(xa + 0.02, GYC - 0.012, 1.10, xa + 0.02 + w, GYC + 0.012, 1.13, "chrome")
        f.box(xa + 0.02 + w - 0.012, GYC - 0.012, 0.22, xa + 0.02 + w, GYC + 0.012, 1.13, "chrome")
        f.box(xa + 0.0, GYC - 0.02, 0.15, xa + 0.04, GYC + 0.02, 1.15, "steel_black")         # hinge post
        tag(f.build(origin=(xa + 0.02, GYC, 0)), role="turnstile", lane=4, part="ada_swing_gate", ada=True,
            hinge_axis="y", open_deg=90, closed_deg=0, default_state="closed", collider="none", blocks_when_closed=True,
            note="accessible swing gate (1.1 m lane); opens toward the elevators. Wide gates are a classic tailgating spot")
    # reader on the cabinet top at the entry (south) end
    rd = MB(f"Turnstile_L{n}_Reader")
    rd.box(rc - 0.06, GY0 + 0.05, 1.0, rc + 0.06, GY0 + 0.21, 1.03, "plastic_black")
    t0, t1 = GY0 + 0.06, GY0 + 0.20
    rd.face([(rc - 0.055, t0, 1.03), (rc + 0.055, t0, 1.03), (rc + 0.055, t1, 1.075), (rc - 0.055, t1, 1.075)], "plastic_black")
    rd.box(rc - 0.055, t1 - 0.004, 1.03, rc + 0.055, t1, 1.075, "plastic_black")
    rd.face([(rc - 0.055, t0, 1.03), (rc - 0.055, t1, 1.075), (rc - 0.055, t1, 1.03)], "plastic_black")
    rd.face([(rc + 0.055, t0, 1.03), (rc + 0.055, t1, 1.03), (rc + 0.055, t1, 1.075)], "plastic_black")
    reader = tag(rd.build(), role="badge_reader", lane=n, collider="none", interactive=True,
                 note="tap badge here; show one LED child")
    sl = math.atan2(0.045, 0.14)
    for state, mat in (("Off", "plastic_grey"), ("Red", "led_red"), ("Green", "led_green")):
        lm = MB(f"Turnstile_L{n}_Reader_LED_{state}")
        yy = GY0 + 0.175; zz = 1.03 + (yy - t0) / 0.14 * 0.045 + 0.002
        lm.box(rc - 0.012, yy - 0.008, zz, rc + 0.012, yy + 0.008, zz + 0.004, mat)
        set_parent(tag(lm.build(), role="badge_led", state=state.lower(), default_visible=(state == "Off")), reader)
    pl = MB(f"Turnstile_L{n}_Reader_Face")
    yc = GY0 + 0.115; label(pl, (rc, yc, 1.03 + (yc - t0) / 0.14 * 0.045 + 0.0015), 0.07, 0.07,
                            (0, -math.sin(sl), math.cos(sl)), "plastic_grey", up=(0, math.cos(sl), math.sin(sl)))
    set_parent(pl.build(fix_normals=False), reader)
    # lane status light on the entry end of the reader cabinet (green arrow = free / red = denied)
    st = MB(f"Turnstile_L{n}_Status")
    st.box(rc - 0.05, GY0 - 0.004, 0.66, rc + 0.05, GY0, 0.86, "steel_black")
    so = tag(st.build(), role="lane_status", lane=n, collider="none", note="children _Off/_Green/_Red, show one")
    for state, mat in (("Off", "glass_dark"), ("Green", "led_green_soft"), ("Red", "led_red")):
        m = MB(f"Turnstile_L{n}_Status_{state}")
        if state == "Red":                                              # X
            for a in (0.7, -0.7):
                m.box(rc - 0.006, GY0 - 0.007, 0.70, rc + 0.006, GY0 - 0.005, 0.82, mat, rot=a)
        elif state == "Green":                                          # up arrow
            m.box(rc - 0.008, GY0 - 0.007, 0.69, rc + 0.008, GY0 - 0.005, 0.79, mat)
            m.face([(rc - 0.035, GY0 - 0.0065, 0.78), (rc + 0.035, GY0 - 0.0065, 0.78), (rc, GY0 - 0.0065, 0.83)], mat)
        else:
            m.box(rc - 0.04, GY0 - 0.006, 0.68, rc + 0.04, GY0 - 0.005, 0.84, mat)
        set_parent(tag(m.build(), state=state.lower(), default_visible=(state == "Green")), so)

# glass balustrade either side of the gate bank (two nodes so box colliders don't span the lanes)
def balustrade(name, xa, xb):
    b = MB(name)
    b.box(xa, GYC - 0.04, 0, xb, GYC + 0.04, 0.06, "steel_black")
    b.box(xa, GYC - 0.008, 0.06, xb, GYC + 0.008, 1.12, "glass_clear")
    b.box(xa, GYC - 0.025, 1.12, xb, GYC + 0.025, 1.16, "metal_brushed")
    n = max(1, int(round((xb - xa) / 1.6)))
    for i in range(n + 1):
        x = xa + (xb - xa) * i / n
        b.box(x - 0.025, GYC - 0.025, 0, x + 0.025, GYC + 0.025, 1.16, "metal_brushed")
    return tag(b.build(), role="security_barrier", collider="box", note="glass balustrade on the secure line")
balustrade("Gate_Balustrade_West", -10.5, -1.9)
balustrade("Gate_Balustrade_East", 2.9, 10.6)

# gate pendant + tailgating sign
gp = MB("Gate_Pendant_Light")
gp.box(-1.7, GYC - 0.06, 3.35, 2.7, GYC + 0.06, 3.42, "steel_black")
gp.box(-1.68, GYC - 0.045, 3.345, 2.68, GYC + 0.045, 3.35, "pendant_glow")
for x in (-1.5, 2.5): gp.cyl((x, GYC, 3.42), (0, 0, 1), 0.004, CZ - 3.42, "steel_black", seg=6)
tag(gp.build(), role="light_fixture", collider="none")

def stanchion_sign(name, x, y, rz, img_name, tags):
    s = MB(name)
    s.cyl((0, 0, 0), (0, 0, 1), 0.17, 0.02, "steel_black", seg=20)
    s.cyl((0, 0, 0.02), (0, 0, 1), 0.02, 1.0, "metal_brushed", seg=10)
    s.box(-0.25, -0.015, 1.0, 0.25, 0.005, 1.66, "steel_black")
    xform(s, rz, (x, y, 0))
    o = tag(s.build(origin=(x, y, 0)), **tags)
    lb = MB(name + "_Face"); label(lb, (0, -0.017, 1.33), 0.45, 0.6, '-y', img(img_name)); xform(lb, rz, (x, y, 0))
    set_parent(lb.build(origin=(x, y, 0), fix_normals=False), o)
    return o
stanchion_sign("Sign_OneBadgeOnePerson_Lobby", -2.55, 10.85, math.radians(12), "label_tailgate",
               dict(role="sign", hook="tailgating", collider="box"))

# =====================================================================
# RECEPTION SIDE: visitor kiosk, security monitors, visitor log, mailroom shelf, parcel
# =====================================================================
kx, ky, krz = -1.95, 6.3, math.radians(25)
k = MB("Visitor_Kiosk")
k.cyl((0, 0, 0), (0, 0, 1), 0.22, 0.02, "steel_black", seg=24)
k.box(-0.035, -0.035, 0.02, 0.035, 0.035, 1.02, "metal_brushed")
k.box(-0.13, -0.08, 0.55, 0.13, 0.08, 0.72, "plastic_black")                            # badge printer
k.box(-0.08, -0.081, 0.6, 0.08, -0.08, 0.62, "steel_black")                             # printer slot
tilt = math.radians(30)
nrm = Vector((0, -math.cos(tilt), math.sin(tilt))); upv = Vector((0, math.sin(tilt), math.cos(tilt)))
c0 = Vector((0, 0.0, 1.13))
def tq(u, v, d): return tuple(c0 + Vector((u, 0, 0)) + upv * v - nrm * d)
A = [tq(-0.18, -0.24, 0), tq(0.18, -0.24, 0), tq(0.18, 0.24, 0), tq(-0.18, 0.24, 0)]
B = [tq(-0.18, -0.24, 0.035), tq(0.18, -0.24, 0.035), tq(0.18, 0.24, 0.035), tq(-0.18, 0.24, 0.035)]
k.loft([A, B], "plastic_black")
xform(k, krz, (kx, ky, 0))
kiosk = tag(k.build(origin=(kx, ky, 0)), role="visitor_kiosk", interactive=True, collider="box",
            hook="visitor_sign_in", note="tablet sign-in + badge printer; visitors must be escorted past the gates")
ks = MB("Visitor_Kiosk_Screen")
label(ks, tuple(c0 + nrm * 0.002), 0.30, 0.40, tuple(nrm), imge("label_kiosk"), up=tuple(upv))
xform(ks, krz, (kx, ky, 0))
set_parent(tag(ks.build(origin=(kx, ky, 0), fix_normals=False), role="screen", content="visitor_sign_in"), kiosk)

mb_ = MB("Security_Monitor_Bank")
mb_.box(-6.0, 9.45, 0, -2.8, 9.95, 0.72, "wood_oak")
mb_.box(-6.02, 9.43, 0.72, -2.78, 9.97, 0.76, "granite_polished")
for px in (-5.15, -3.65):
    mb_.box(px - 0.03, 9.75, 0.76, px + 0.03, 9.81, 2.05, "steel_black")
mb_.box(-5.3, 9.73, 1.88, -3.5, 9.81, 1.94, "steel_black")
mb_.box(-5.3, 9.73, 1.08, -3.5, 9.81, 1.14, "steel_black")
SCR = []
for i, (cx, cz) in enumerate(((-4.72, 1.71), (-4.08, 1.71), (-4.72, 1.33), (-4.08, 1.33))):
    mb_.box(cx - 0.31, 9.62, cz - 0.185, cx + 0.31, 9.73, cz + 0.185, "plastic_black")
    SCR.append((cx, cz, i + 1))
mb_.box(-3.3, 9.55, 0.76, -3.0, 9.75, 0.8, "plastic_black")                             # radio charger
mb_.box(-3.25, 9.6, 0.8, -3.18, 9.66, 0.98, "plastic_black")
monitors = tag(mb_.build(), role="security_monitors", collider="box",
               note="CCTV feeds behind reception (cams 01-04). Visible to visitors: a hook for 'what can strangers see'")
sc = MB("Security_Monitor_Bank_Screens")
for cx, cz, i in SCR: label(sc, (cx, 9.618, cz), 0.6, 0.34, '-y', imge(f"label_cctv_{i}"))
set_parent(tag(sc.build(fix_normals=False), role="screen", content="cctv_grid"), monitors)

vl = MB("Visitor_Log_Clipboard")
vl.box(-2.95, 7.06, 1.10, -2.7, 7.3, 1.106, "wood_dark")
vl.box(-2.93, 7.08, 1.106, -2.72, 7.28, 1.109, "paper_white")
vl.box(-2.88, 7.26, 1.106, -2.77, 7.3, 1.12, "chrome")
vl.cyl((-2.6, 7.18, 1.1), (1, 0.4, 0.0), 0.004, 0.13, "plastic_blue", seg=6)
tag(vl.build(), role="visitor_log", interactive=True, collider="none", note="paper visitor log on the reception ledge")

ms = MB("Mailroom_Shelf")
X0, X1, Y0, Y1 = -10.5, -10.05, 9.2, 11.6
for y in (Y0, (Y0 + Y1) / 2, Y1 - 0.04):
    for x in (X0, X1 - 0.04):
        ms.box(x, y, 0, x + 0.04, y + 0.04, 1.85, "steel_paint")
import random as _r
RR = _r.Random(5)
PARCEL_LABELS = []
for z in (0.08, 0.6, 1.12, 1.64):
    ms.box(X0, Y0, z, X1, Y1, z + 0.025, "steel_paint")
    if z > 1.6: continue
    y = Y0 + 0.08
    while y < Y1 - 0.3:
        w = RR.uniform(0.22, 0.5); d = RR.uniform(0.22, 0.4); h = RR.uniform(0.12, 0.4)
        if y + w > Y1 - 0.06: break
        x0 = X1 - 0.03 - d
        ms.box(x0, y, z + 0.025, X1 - 0.03, y + w, z + 0.025 + h, "cardboard")
        ms.box(x0, y + w / 2 - 0.025, z + 0.025 + h, X1 - 0.03, y + w / 2 + 0.025, z + 0.027 + h, "tape_brown")
        if RR.random() < 0.6: PARCEL_LABELS.append((X1 - 0.029, y + w / 2, z + 0.025 + h / 2, min(0.16, w * 0.6), min(0.11, h * 0.6)))
        y += w + RR.uniform(0.03, 0.1)
mail = tag(ms.build(), role="mailroom", collider="box", note="parcel shelf; packages are held at reception")
pl = MB("Mailroom_Shelf_Labels")
for x, y, z, w, h in PARCEL_LABELS: label(pl, (x + 0.001, y, z), w, h, '+x', img("label_parcel"))
label(pl, (-10.54, (Y0 + Y1) / 2, 2.15), 0.9, 0.45, '+x', img("label_mailroom"))
set_parent(pl.build(fix_normals=False), mail)

pc = MB("Parcel_Unattended")
pc.box(-2.3, 8.55, 0, -1.92, 8.85, 0.28, "cardboard")
pc.box(-2.3, 8.68, 0.28, -1.92, 8.72, 0.282, "tape_brown")
parcel = tag(pc.build(origin=(-2.11, 8.7, 0)), role="parcel", interactive=True, pickup=True, collider="box",
             hook="unattended_package", default_visible=False,
             note="optional beat: a parcel 'for Finance' left by the reception desk by an unknown courier")
pcl = MB("Parcel_Unattended_Label"); label(pcl, (-2.11, 8.7, 0.283), 0.2, 0.15, '+z', img("label_parcel"), up=(0, 1, 0))
set_parent(pcl.build(origin=(-2.11, 8.7, 0.283), fix_normals=False), parcel)

rp = MB("Reception_Pendant_Light")
rp.box(-5.8, 7.5, 3.2, -3.0, 7.62, 3.27, "steel_black")
rp.box(-5.78, 7.515, 3.195, -3.02, 7.605, 3.2, "pendant_glow")
for x in (-5.6, -3.2): rp.cyl((x, 7.56, 3.27), (0, 0, 1), 0.004, CZ - 3.27, "steel_black", seg=6)
tag(rp.build(), role="light_fixture", collider="none")

# =====================================================================
# CCTV DOMES
# =====================================================================
for nm, x, y, cov in (("CCTV_Lobby_Entrance", 1.2, 2.2, "entrance doors + tailgaters"),
                      ("CCTV_Lobby_Gates", 2.6, 10.9, "speed gates (approach side)"),
                      ("CCTV_Lobby_Elevators", -0.9, 16.3, "elevator landing"),
                      ("CCTV_Lobby_Reception", -5.8, 6.2, "reception desk"),
                      ("CCTV_Lobby_StairDoor", 7.4, 13.3, "stair A alarmed exit")):
    cctv_dome(nm, x, y, CZ, cov)

# =====================================================================
# STAIR A CORE (NE corner) + alarmed exit door
# =====================================================================
SX0, SX1, SY0, SY1 = 8.6, 10.65, 14.4, 17.65
DY0, DY1, DH = 15.1, 16.1, 2.2
WT = 0.15
sc_ = MB("Stair_Core")
sc_.box(SX0, SY0, 0, SX0 + WT, DY0, CZ, "stone_trim")
sc_.box(SX0, DY1, 0, SX0 + WT, SY1, CZ, "stone_trim")
sc_.box(SX0, DY0, DH, SX0 + WT, DY1, CZ, "stone_trim")
sc_.box(SX0, SY0, 0, SX1, SY0 + WT, CZ, "stone_trim")
sc_.box(SX0 + WT, SY0 + WT, 0, SX1, SY1, 0.004, "concrete")                             # stair floor
for x0, y0, x1, y1 in ((SX0 + WT, SY0 + WT, SX0 + WT + 0.01, DY0), (SX0 + WT, DY1, SX0 + WT + 0.01, SY1),
                       (SX0 + WT, SY0 + WT, SX1, SY0 + WT + 0.01), (SX1 - 0.01, SY0 + WT, SX1, SY1),
                       (SX0 + WT, SY1 - 0.01, SX1, SY1)):
    sc_.box(x0, y0, 0.004, x1, y1, CZ, "paint_grey")
sc_.box(SX0 + WT, DY0, DH, SX0 + WT + 0.01, DY1, CZ, "paint_grey")
# door frame (lobby side)
sc_.box(SX0 - 0.03, DY0 - 0.06, 0, SX0 + WT + 0.01, DY0, DH + 0.06, "steel_paint")
sc_.box(SX0 - 0.03, DY1, 0, SX0 + WT + 0.01, DY1 + 0.06, DH + 0.06, "steel_paint")
sc_.box(SX0 - 0.03, DY0 - 0.06, DH, SX0 + WT + 0.01, DY1 + 0.06, DH + 0.06, "steel_paint")
# stair flight rising north along the east wall + landing rail
n_st = 10; run = 0.27; rise = 0.17
for i in range(n_st):
    y0 = 14.95 + i * run
    sc_.box(9.65, y0, 0, SX1 - 0.01, y0 + run + 0.02, (i + 1) * rise, "concrete")
    sc_.box(9.65, y0 - 0.02, (i + 1) * rise - 0.005, SX1 - 0.01, y0 + 0.03, (i + 1) * rise + 0.003, "paint_safety")
p0 = Vector((9.62, 14.95, 0.9)); p1 = Vector((9.62, 14.95 + n_st * run, 0.9 + n_st * rise))
sc_.cyl(tuple(p0), tuple(p1 - p0), 0.022, (p1 - p0).length, "steel_paint", seg=8)
for i in range(0, n_st + 1, 3):
    q = p0.lerp(p1, i / n_st); sc_.cyl((q.x, q.y, q.z - 0.9), (0, 0, 1), 0.015, 0.9, "steel_paint", seg=6)
sc_.box(9.6, 14.6, 0, 9.65, 14.95, 0.95, "steel_paint")                                     # newel
sc_.box(SX0 + WT + 0.02, 17.0, 2.0, SX0 + WT + 0.1, 17.4, 2.25, "led_white")                # wall pack light
stair = tag(sc_.build(), role="stair_core", collider="mesh", name_display="Stair A")
sl_ = MB("Stair_Core_Labels")
label(sl_, (SX0 - 0.062, DY0 + 0.5, DH + 0.2), 0.42, 0.16, '-x', imge("label_exit"))        # EXIT sign over door
sl_.box(SX0 - 0.06, DY0 + 0.27, DH + 0.1, SX0 - 0.03, DY0 + 0.73, DH + 0.3, "steel_black")
label(sl_, (SX0 - 0.002, 14.75, 1.65), 0.5, 0.25, '-x', img("label_stair"))
label(sl_, (SX1 - 0.012, 15.6, 2.4), 0.4, 0.15, '-x', imge("label_exit"))                   # inside, facing the door
set_parent(sl_.build(fix_normals=False), stair)

# door leaf: hinge at the south jamb, swings into the stair (+X) -> open_deg -90 about glTF Y
HX = SX0 + 0.06
dl = MB("Stair_Door")
dl.box(HX - 0.022, DY0 + 0.005, 0.01, HX + 0.022, DY1 - 0.005, DH - 0.01, "door_metal")
dl.box(HX - 0.03, DY0 + 0.1, 0.98, HX - 0.022, DY1 - 0.1, 1.06, "steel_paint")              # push bar (lobby side)
dl.box(HX - 0.07, DY0 + 0.12, 1.0, HX - 0.03, DY1 - 0.12, 1.04, "chrome")
dl.box(HX - 0.07, DY1 - 0.2, 0.96, HX - 0.03, DY1 - 0.1, 1.08, "steel_paint")
dl.box(HX + 0.022, DY1 - 0.15, 1.0, HX + 0.05, DY1 - 0.1, 1.08, "steel_black")              # stair-side lever
dl.box(HX - 0.025, DY0 + 0.3, 1.80, HX - 0.022, DY0 + 0.6, 2.05, "glass_dark")              # vision panel
door = tag(dl.build(origin=(HX, DY0, 0)), role="door", hinge_axis="y", open_deg=-90, propped_deg=-22, closed_deg=0,
           alarmed=True, locked=False, collider="box", interactive=True, hook="propped_stair_door",
           note="ALARMED EXIT into Stair A. Opens away from the lobby. Training beat: someone wedges it at "
                "propped_deg (show Stair_Door_Wedge) so outsiders can bypass the gates; alarm LED goes red")
dsl = MB("Stair_Door_Sign"); label(dsl, (HX - 0.0235, DY0 + 0.5, 1.45), 0.44, 0.33, '-x', img("label_alarmed_exit"))
set_parent(dsl.build(origin=(HX, DY0, 0), fix_normals=False), door)

al = MB("Stair_Door_Alarm")
al.box(SX0 - 0.05, DY1 + 0.12, 2.0, SX0, DY1 + 0.3, 2.16, "plastic_white")
alarm = tag(al.build(), role="door_alarm", collider="none", note="local door alarm; show _LED_Red when the door is propped")
for st, m in (("Off", "plastic_grey"), ("Red", "led_red")):
    lm = MB(f"Stair_Door_Alarm_LED_{st}")
    lm.box(SX0 - 0.054, DY1 + 0.19, 2.06, SX0 - 0.05, DY1 + 0.23, 2.1, m)
    set_parent(tag(lm.build(), state=st.lower(), default_visible=(st == "Off")), alarm)

badge_reader("Stair_Door_Reader", (SX0, DY1 + 0.2, 1.15), rz=-math.pi / 2,
             extra_tags=dict(door="Stair_Door", interactive=True, note="re-entry reader; LED children like BadgeReader"))

# wedge (hidden by default): sits under the latch edge at propped_deg
a = math.radians(22)
wx, wy = HX + math.sin(a) * 0.86, DY0 + math.cos(a) * 0.86
wg = MB("Stair_Door_Wedge")
wg.face([(-0.06, -0.04, 0), (0.06, -0.04, 0), (0.06, 0.04, 0), (-0.06, 0.04, 0)], "rubber")
wg.face([(-0.06, -0.04, 0), (-0.06, 0.04, 0), (0.06, 0.04, 0.035), (0.06, -0.04, 0.035)], "rubber")
wg.face([(0.06, -0.04, 0), (0.06, -0.04, 0.035), (0.06, 0.04, 0.035), (0.06, 0.04, 0)], "rubber")
wg.face([(-0.06, -0.04, 0), (0.06, -0.04, 0.035), (0.06, -0.04, 0)], "rubber")
wg.face([(-0.06, 0.04, 0), (0.06, 0.04, 0), (0.06, 0.04, 0.035)], "rubber")
xform(wg, math.radians(68), (wx - 0.06, wy, 0.002))
tag(wg.build(origin=(wx - 0.06, wy, 0)), role="door_wedge", door="Stair_Door", default_visible=False, interactive=True,
    pickup=True, collider="none", hook="propped_stair_door", note="show together with Stair_Door at propped_deg")

# =====================================================================
# DIRECTORY, ELEVATOR LANDING (call button, lantern, indicator), back-wall lettering
# =====================================================================
dr = MB("Directory_Sign")
dr.box(-0.4, -0.07, 0, 0.4, 0.07, 0.06, "steel_black")
dr.box(-0.38, -0.06, 0.06, 0.38, 0.06, 2.0, "steel_black")
xform(dr, math.radians(-25), (4.55, 10.55, 0))
direc = tag(dr.build(origin=(4.55, 10.55, 0)), role="sign", content="building_directory", collider="box")
dl2 = MB("Directory_Sign_Face"); label(dl2, (0, -0.062, 1.17), 0.62, 1.24, '-y', imge("label_directory"))
xform(dl2, math.radians(-25), (4.55, 10.55, 0))
set_parent(dl2.build(origin=(4.55, 10.55, 0), fix_normals=False), direc)

landing_details("Elevator_Lobby_A", 1.5, BW, BW - 0.05, 0.0, 0.15, BW - 0.08, "L")

ht = text("Elevator_Wall_Lettering", "HARBOR TOWER", 0.16, (0.0, BW - 0.006, 3.35), "metal_brushed", extrude=0.004)
tag(ht, collider="none")

# =====================================================================
# SEATING, RUGS, PLANTS, ART
# =====================================================================
se = MB("Lobby_Seating")
se.box(5.0, 4.1, 0, 8.5, 7.55, 0.008, "rug_charcoal")
se.box(-9.9, 3.5, 0, -6.9, 5.7, 0.008, "rug_sand")
sofa(se, 6.75, 7.05, 0.0, w=2.0, fabric="fabric_sand", z=0.008)
armchair(se, 5.35, 5.8, math.radians(90), z=0.008)
armchair(se, 8.15, 5.8, math.radians(-90), z=0.008)
se.box(6.2, 5.5, 0.36, 7.3, 6.1, 0.4, "wood_oak")                                           # coffee table
for x in (6.25, 7.22):
    for y in (5.55, 6.02): se.box(x, y, 0.008, x + 0.03, y + 0.03, 0.36, "steel_black")
se.box(6.4, 5.6, 0.4, 6.7, 5.82, 0.42, "paper_white"); se.box(6.42, 5.63, 0.42, 6.68, 5.8, 0.425, "fabric_navy")
plant(se, 7.0, 5.85, 0.4, h=0.35, pot="ceramic_white", r=0.08, leaves=6)
armchair(se, -9.2, 4.6, math.radians(90), fabric="fabric_navy", z=0.008)
armchair(se, -7.6, 4.6, math.radians(-90), fabric="fabric_navy", z=0.008)
se.cyl((-8.4, 4.6, 0.008), (0, 0, 1), 0.24, 0.02, "steel_black", seg=20)
se.cyl((-8.4, 4.6, 0.028), (0, 0, 1), 0.025, 0.47, "steel_black", seg=8)
se.cyl((-8.4, 4.6, 0.5), (0, 0, 1), 0.26, 0.03, "wood_oak", seg=24)
mug(se, -8.35, 4.52, 0.53)
tag(se.build(), role="furniture", collider="mesh")

pl_ = MB("Lobby_Plants")
for x, y, h in ((-3.45, 16.95, 2.0), (3.45, 16.95, 2.0), (5.05, 7.95, 1.7), (9.95, 8.75, 1.9), (-9.95, 6.35, 1.8),
                (-9.95, 12.75, 1.9), (-3.0, 12.6, 1.6)):
    tall_plant(pl_, x, y, 0.0, h=h)
plant(pl_, -2.1, 9.6, 0.0, h=1.0, pot="terracotta", r=0.25)
tag(pl_.build(), role="plants", collider="mesh")

art = MB("Lobby_Art")
for i, y in enumerate((4.85, 6.0, 7.15)):
    art.box(10.6, y - 0.42, 1.18, 10.65, y + 0.42, 2.52, "steel_black")
art_o = tag(art.build(), role="art", collider="none")
artl = MB("Lobby_Art_Panels")
for i, y in enumerate((4.85, 6.0, 7.15)): label(artl, (10.598, y, 1.85), 0.8, 1.3, '-x', img(f"label_art_{i}"))
set_parent(artl.build(fix_normals=False), art_o)

dp = MB("Seating_Pendant_Light")
dp.cyl((6.75, 5.8, 3.0), (0, 0, 1), 0.38, 0.14, "steel_black", seg=28)
dp.cyl((6.75, 5.8, 2.995), (0, 0, 1), 0.35, 0.006, "pendant_glow", seg=28)
dp.cyl((6.75, 5.8, 3.14), (0, 0, 1), 0.006, CZ - 3.14, "steel_black", seg=6)
dp.cyl((-8.4, 4.6, 3.2), (0, 0, 1), 0.26, 0.2, "steel_black", seg=24)
dp.cyl((-8.4, 4.6, 3.195), (0, 0, 1), 0.23, 0.006, "pendant_glow", seg=24)
dp.cyl((-8.4, 4.6, 3.4), (0, 0, 1), 0.006, CZ - 3.4, "steel_black", seg=6)
tag(dp.build(), role="light_fixture", collider="none")

print("TRIANGLES", stats())
export(f"{OUT}/harbor_lobby_detail.glb")

if RENDER:
    which = sys.argv[sys.argv.index("--render") + 1] if len(sys.argv) > sys.argv.index("--render") + 1 else "all"
    import_glb(f"{OUT}/harbor_block.glb")
    for nm in ("Harbor_Tower", "Lobby_Interior"):
        o = bpy.data.objects.get(nm)
        if o:
            o.hide_render = True
            for c in o.children_recursive: c.hide_render = True
    import_glb(f"{OUT}/harbor_shaft_cut.glb")
    cab = import_glb(f"{OUT}/harbor_elevator_cab.glb")
    root = bpy.data.objects["Elevator_Cab"]; root.location = (1.5, 17.36, 0.0)
    mark_hidden_defaults()
    # demo states: lane 3 reader green + open flaps, call button lit, up lantern lit, stair door propped + wedge
    def show(nm, v=True): bpy.data.objects[nm].hide_render = not v
    show("Turnstile_L3_Reader_LED_Off", False); show("Turnstile_L3_Reader_LED_Green")
    bpy.data.objects["Turnstile_L3_Flap_W"].rotation_euler.z = math.radians(90)
    bpy.data.objects["Turnstile_L3_Flap_E"].rotation_euler.z = math.radians(-90)
    show("Elevator_Lobby_A_CallButton_Unlit", False); show("Elevator_Lobby_A_CallButton_Lit")
    show("Elevator_Lobby_A_Lantern_Up_Unlit", False); show("Elevator_Lobby_A_Lantern_Up_Lit")
    bpy.data.objects["Stair_Door"].rotation_euler.z = math.radians(-22); show("Stair_Door_Wedge")
    show("Stair_Door_Alarm_LED_Off", False); show("Stair_Door_Alarm_LED_Red")
    show("Parcel_Unattended")
    for i, (x, y) in enumerate(((-4.4, 7.5), (0.5, 12.0), (6.7, 5.8), (1.5, 15.5), (9.6, 16.0), (-8.4, 4.6), (0.0, 3.0))):
        light(f"R_L{i}", 'POINT', (x, y, 3.9), color='#ffe3bf', energy=260, radius=0.4)
    for o in bpy.data.objects:
        if o.type == "LIGHT": o.visible_camera = False; o.visible_transmission = False; o.visible_glossy = False
    cam = setup_render(night=True, res=(1100, 680), samples=20)
    shots = {"entry": ((0.4, 1.8, 1.7), (1.0, 14.0, 1.25), 22),
             "secure": ((2.2, 15.6, 1.7), (-4.5, 8.0, 1.1), 22),
             "stair": ((5.6, 13.4, 1.7), (9.2, 15.7, 1.2), 26),
             "gates": ((-0.8, 9.0, 1.7), (1.0, 12.3, 0.9), 24),
             "seating": ((1.0, 3.0, 1.7), (8.0, 7.0, 1.2), 22)}
    for nm, (pos, tgt, lens) in shots.items():
        if which == "all" or nm in which.split(","): shoot(cam, pos, tgt, f"{OUT}/lobby_{nm}.png", lens=lens)
