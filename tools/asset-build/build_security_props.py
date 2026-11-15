"""harbor_security_props.glb: reusable physical-security props. Each prop is ONE root node whose origin is the
prop's natural pivot (base centre, or card centre for badges). They are laid out in a row along glTF +X at
z = 0 purely for preview; reposition freely in code."""
import sys; sys.path.insert(0, '/home/claude/harbor')
from lib2 import *

RENDER = "--render" in sys.argv
reset()

def card(name, x, z, img_name, role, tags):
    """CR80 badge in a clear holder with a clip slot; origin at card centre, front faces glTF +Z (Blender -Y)."""
    m = MB(name)
    m.box(x - 0.030, -0.0025, z - 0.047, x + 0.030, 0.0025, z + 0.047, "glass_clear")       # holder
    m.box(x - 0.027, -0.0006, z - 0.0428, x + 0.027, 0.0006, z + 0.0428, "paper_white")      # card edge/back
    m.box(x - 0.008, -0.003, z + 0.043, x + 0.008, 0.003, z + 0.052, "chrome")              # clip
    o = tag(m.build(origin=(x, 0, z)), role=role, interactive=True, pickup=True, collider="none", **tags)
    f = MB(name + "_Print"); label(f, (x, -0.0007, z), 0.054, 0.0856, '-y', img(img_name))
    set_parent(f.build(origin=(x, 0, z), fix_normals=False), o)
    return o

card("Visitor_Badge", 0.0, 1.2, "label_badge_visitor", "visitor_badge",
     dict(escort_required=True, hook="visitor_without_escort",
          note="red VISITOR badge. A visitor wearing this north of the gates with no host nearby = training beat"))
card("Contractor_Badge_Temp", 0.2, 1.2, "label_badge_contractor", "contractor_badge",
     dict(escort_required=True, access_rights="none", hook="contractor_tailgating",
          note="temporary contractor badge, no door access; contractors asking to be let through is a classic pretext"))

def lanyard(name, x, z_clip, mat, length=0.42):
    """Flat ribbon hanging in a V from the neck down to a clip at the origin."""
    m = MB(name)
    w = 0.009; top = z_clip + length; spread = 0.09
    for s in (-1, 1):
        p0 = Vector((x + s * 0.008, 0, z_clip + 0.02)); p1 = Vector((x + s * spread, 0.0, top))
        d = (p1 - p0).normalized(); n_ = Vector((0, 1, 0)).cross(d).normalized() * w
        m.face([tuple(p0 - n_), tuple(p0 + n_), tuple(p1 + n_), tuple(p1 - n_)], mat)
    # neck loop (behind)
    pts = []
    for i in range(9):
        a = math.pi * i / 8
        pts.append(Vector((x + spread * math.cos(a), 0.08 * math.sin(a), top + 0.03 * math.sin(a))))
    for a_, b_ in zip(pts[:-1], pts[1:]):
        m.face([tuple(a_ - Vector((0, 0, w))), tuple(b_ - Vector((0, 0, w))), tuple(b_ + Vector((0, 0, w))), tuple(a_ + Vector((0, 0, w)))], mat)
    m.box(x - 0.008, -0.004, z_clip, x + 0.008, 0.004, z_clip + 0.025, "chrome")
    m.cyl((x, 0, z_clip - 0.004), (0, 1, 0), 0.006, 0.003, "chrome", seg=10)
    return tag(m.build(origin=(x, 0, z_clip)), role="lanyard", collider="none", interactive=True, pickup=True,
               note="origin = clip; hang a badge just below it")
lanyard("Lanyard_Visitor_Red", 0.45, 1.1, "paint_red")
lanyard("Lanyard_Staff_Navy", 0.7, 1.1, "fabric_navy")

# A-frame floor sign "ONE BADGE / ONE PERSON"
X = 1.3
a = MB("Sign_OneBadgeOnePerson_AFrame")
ang = math.radians(12); H = 0.95; W = 0.62
for s in (-1, 1):
    top = Vector((0, 0, H)); bot = Vector((0, s * math.tan(ang) * H, 0))
    ys = [bot.y, top.y]
    a.face([(X - W / 2, bot.y, 0.0), (X + W / 2, bot.y, 0.0), (X + W / 2, 0.0, H), (X - W / 2, 0.0, H)], "steel_black")
    a.face([(X - W / 2, bot.y + s * 0.012, 0.0), (X + W / 2, bot.y + s * 0.012, 0.0), (X + W / 2, s * 0.012, H), (X - W / 2, s * 0.012, H)], "steel_black")
a.box(X - W / 2, -0.02, H - 0.02, X + W / 2, 0.02, H + 0.01, "steel_black")
a.box(X - 0.06, -0.01, H + 0.01, X + 0.06, 0.01, H + 0.05, "steel_black")
ao = tag(a.build(origin=(X, 0, 0)), role="sign", hook="tailgating", collider="box", interactive=False,
         note="portable A-frame for the speed gates / side doors")
for s in (-1, 1):
    f = MB(f"Sign_OneBadgeOnePerson_AFrame_Face{'F' if s < 0 else 'B'}")
    n_ = Vector((0, s * math.cos(ang), math.sin(ang)))
    u_ = Vector((0, -s * math.sin(ang), math.cos(ang)))
    c = Vector((X, s * math.tan(ang) * H * 0.5 + s * 0.013, H * 0.5)) + n_ * 0.001
    label(f, tuple(c), W - 0.08, (H - 0.12) / math.cos(ang), tuple(n_), img("label_tailgate"), up=tuple(u_))
    set_parent(f.build(origin=(X, 0, 0), fix_normals=False), ao)

# rubber door wedge
X = 2.0
wg = MB("Door_Wedge")
L, Wd, Hh = 0.15, 0.06, 0.04
P = [(X - L / 2, -Wd / 2, 0), (X + L / 2, -Wd / 2, 0), (X + L / 2, Wd / 2, 0), (X - L / 2, Wd / 2, 0),
     (X + L / 2, -Wd / 2, Hh), (X + L / 2, Wd / 2, Hh)]
wg.face([P[0], P[3], P[2], P[1]], "rubber"); wg.face([P[0], P[1], P[4]], "rubber"); wg.face([P[3], P[5], P[2]], "rubber")
wg.face([P[1], P[2], P[5], P[4]], "rubber"); wg.face([P[0], P[4], P[5], P[3]], "rubber")
for i in range(4):                                                                         # grip ridges
    x = X - 0.04 + i * 0.025; z = (x - (X - L / 2)) / L * Hh
    wg.box(x, -Wd / 2 + 0.004, z, x + 0.006, Wd / 2 - 0.004, z + 0.004, "rubber")
tag(wg.build(origin=(X, 0, 0)), role="door_wedge", hook="propped_door", interactive=True, pickup=True, collider="none",
    note="slide under a door's latch edge to show it propped open")

# lockable drawer pedestal (3 drawers, lock with optional key left in it)
X = 2.7
PW, PD, PH = 0.40, 0.55, 0.60
pb = MB("Drawer_Pedestal_Lockable")
pb.box(X - PW / 2, -PD / 2 + 0.02, 0.0, X + PW / 2, PD / 2, PH, "steel_paint", mats={'front': None})
pb.box(X - PW / 2, -PD / 2 + 0.02, 0.0, X + PW / 2, -PD / 2 + 0.025, 0.02, "steel_black")
for cx_ in (X - PW / 2 + 0.04, X + PW / 2 - 0.04):
    for cy in (-PD / 2 + 0.06, PD / 2 - 0.06):
        pb.cyl((cx_, cy, 0), (0, 0, 1), 0.018, 0.02, "rubber", seg=8)
ped = tag(pb.build(origin=(X, 0, 0)), role="drawer_pedestal", locked=True, collider="box", interactive=True,
          hook="unlocked_drawer_or_key_left_in_lock",
          note="drawers slide along glTF +Z by slide_dist when unlocked; Drawer_Pedestal_Lock_Key = key left in the lock")
for i, (z0, z1) in enumerate(((0.025, 0.21), (0.215, 0.40), (0.405, 0.59))):
    d = MB(f"Drawer_Pedestal_Drawer_{i + 1}")
    d.box(X - PW / 2 + 0.005, -PD / 2, z0, X + PW / 2 - 0.005, -PD / 2 + 0.02, z1, "steel_paint")
    d.box(X - PW / 2 + 0.02, -PD / 2 + 0.02, z0 + 0.01, X + PW / 2 - 0.02, PD / 2 - 0.03, z0 + 0.02, "steel_paint")
    d.box(X - 0.08, -PD / 2 - 0.02, z1 - 0.04, X + 0.08, -PD / 2, z1 - 0.025, "chrome")
    set_parent(tag(d.build(origin=(X, -PD / 2, z0)), role="drawer", slide_axis="z", slide_dist=0.35, collider="none",
                   interactive=True, note="glTF axis; pull toward +Z"), ped)
lk = MB("Drawer_Pedestal_Lock")
lk.cyl((X + PW / 2 - 0.05, -PD / 2, 0.56), (0, -1, 0), 0.012, 0.006, "chrome", seg=14)
lk.box(X + PW / 2 - 0.0515, -PD / 2 - 0.0062, 0.552, X + PW / 2 - 0.0485, -PD / 2 - 0.0058, 0.568, "steel_black")
lko = tag(lk.build(origin=(X + PW / 2 - 0.05, -PD / 2, 0.56)), role="lock", locked=True, collider="none")
set_parent(lko, ped)
ky = MB("Drawer_Pedestal_Lock_Key")
kx = X + PW / 2 - 0.05
ky.box(kx - 0.002, -PD / 2 - 0.03, 0.553, kx + 0.002, -PD / 2 - 0.006, 0.567, "alloy")
ky.box(kx - 0.002, -PD / 2 - 0.05, 0.545, kx + 0.002, -PD / 2 - 0.03, 0.575, "plastic_black")
ky.cyl((kx, -PD / 2 - 0.058, 0.56), (1, 0, 0), 0.012, 0.004, "alloy", seg=10)
set_parent(tag(ky.build(origin=(kx, -PD / 2, 0.56)), role="key", default_visible=False, hook="key_left_in_lock"), lko)

# monitor with a privacy filter (filter is a separate child so it can be toggled)
X = 3.5
mn = MB("Monitor_Privacy_Filter")
mn.box(X - 0.1, -0.08, 0, X + 0.1, 0.08, 0.015, "plastic_black")
mn.box(X - 0.02, -0.0, 0.015, X + 0.02, 0.04, 0.24, "plastic_black")
mn.box(X - 0.31, -0.02, 0.19, X + 0.31, 0.015, 0.54, "plastic_black")
mon = tag(mn.build(origin=(X, 0, 0)), role="monitor", collider="box", note="desk monitor with optional privacy filter")
sc = MB("Monitor_Privacy_Filter_Screen"); label(sc, (X, -0.0215, 0.365), 0.58, 0.32, '-y', imge("label_screen_sheet"))
set_parent(tag(sc.build(origin=(X, 0, 0), fix_normals=False), role="screen", content="spreadsheet"), mon)
pf = MB("Monitor_Privacy_Filter_Panel")
pf.box(X - 0.305, -0.029, 0.195, X + 0.305, -0.025, 0.535, "glass_dark")
for xx in (X - 0.29, X + 0.27):
    pf.box(xx, -0.031, 0.53, xx + 0.02, -0.01, 0.55, "plastic_black")                   # hanging tabs
set_parent(tag(pf.build(origin=(X, 0, 0)), role="privacy_filter", default_visible=True, collider="none",
               note="hide to show the unfiltered screen; from >30 deg off-axis a filtered screen should read as black"), mon)

print("TRIANGLES", stats())
export(f"{OUT}/harbor_security_props.glb")

if RENDER:
    mark_hidden_defaults()
    bpy.data.objects["Drawer_Pedestal_Drawer_3"].location.y -= 0.25
    bpy.data.objects["Drawer_Pedestal_Lock_Key"].hide_render = False
    fl = MB("R_Floor"); fl.box(-1, -2, -0.02, 5, 2, 0, "concrete_slab"); fl.build()
    light("R_Key", 'AREA', (1.8, -2.0, 2.5), color='#ffffff', energy=500, rot=(math.radians(50), 0, 0))
    light("R_Fill", 'POINT', (1.8, 0.8, 2.0), color='#ffe9cf', energy=150)
    cam = setup_render(night=True, res=(1400, 600), samples=24)
    shoot(cam, (1.85, -2.6, 1.15), (1.85, 0, 0.55), f"{OUT}/props_security.png", lens=22)
    shoot(cam, (0.25, -0.45, 1.25), (0.3, 0, 1.15), f"{OUT}/props_badges.png", lens=35)
