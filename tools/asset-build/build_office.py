"""Floor 14 office (world-aligned with Harbor Tower) + standalone interaction props GLB."""
import sys; sys.path.insert(0, '/home/claude/harbor')
import bpy, math, random
from lib import *

RENDER = "--render" in sys.argv
T = "/home/claude/harbor/textures"
R = random.Random(14)
F = 50.6                     # floor 14 level (lobby 5.0 + 12 x 3.8)
OX0, OX1, OY0, OY1 = -10.0, 10.0, 0.6, 16.6
CEIL = F + 3.0

def chair(mb, x, y, rot=0.0, fabric="fabric_grey"):
    for k in range(5):
        a = rot + k * 2 * math.pi / 5
        mb.box(x, y - 0.02, F + 0.06, x + 0.32, y + 0.02, F + 0.1, "plastic_black", rot=a, pivot=(x, y))
        mb.cyl((x + 0.31 * math.cos(a), y + 0.31 * math.sin(a), F), (0, 0, 1), 0.03, 0.06, "plastic_black", seg=8)
    mb.cyl((x, y, F + 0.08), (0, 0, 1), 0.028, 0.36, "chrome", seg=10)
    mb.box(x - 0.25, y - 0.25, F + 0.44, x + 0.25, y + 0.25, F + 0.52, fabric, rot=rot)
    c, s = math.cos(rot), math.sin(rot)
    bx, by = x - 0.24 * s * -1 * 0 + 0.24 * -s * 0, y            # back offset along local +y
    bx, by = x + s * 0.24, y - c * 0.24
    mb.box(bx - 0.23, by - 0.03, F + 0.56, bx + 0.23, by + 0.03, F + 1.05, fabric, rot=rot)
    mb.box(bx - 0.02, by - 0.02, F + 0.5, bx + 0.02, by + 0.02, F + 0.6, "plastic_black", rot=rot)

def desk(mb, x0, y0, x1, y1, mon_side=+1, screen="screen_off", with_kit=True):
    mb.box(x0, y0, F + 0.71, x1, y1, F + 0.74, "wood_oak")
    for lx in (x0 + 0.04, x1 - 0.08):
        mb.box(lx, y0 + 0.05, F, lx + 0.04, y1 - 0.05, F + 0.71, "steel_black")
    my = y1 - 0.05 if mon_side > 0 else y0 + 0.05
    mb.box(x0 + 0.1, my - 0.01, F + 0.25, x1 - 0.1, my + 0.01, F + 0.71, "steel_black")       # modesty panel
    if with_kit:
        cx = (x0 + x1) / 2
        sy = y1 - 0.18 if mon_side > 0 else y0 + 0.18
        mb.box(cx - 0.08, sy - 0.08, F + 0.74, cx + 0.08, sy + 0.08, F + 0.755, "plastic_black")   # stand base
        mb.box(cx - 0.02, sy - 0.02, F + 0.755, cx + 0.02, sy + 0.02, F + 0.98, "plastic_black")
        mb.box(cx - 0.31, sy - 0.02, F + 0.93, cx + 0.31, sy + 0.015, F + 1.28, "plastic_black")
        face_y = sy - 0.022 * mon_side
        mb.box(cx - 0.29, min(face_y, face_y - 0.003 * mon_side), F + 0.945, cx + 0.29, max(face_y, face_y - 0.003 * mon_side), F + 1.265, screen)
        ky = sy - 0.33 * mon_side
        mb.box(cx - 0.22, ky - 0.07, F + 0.74, cx + 0.22, ky + 0.07, F + 0.758, "plastic_black")
        mb.box(cx + 0.3, ky - 0.05, F + 0.74, cx + 0.36, ky + 0.05, F + 0.765, "plastic_black")

def plant(mb, x, y, h=1.2):
    mb.cyl((x, y, F), (0, 0, 1), 0.22, 0.45, "plastic_white", seg=16, r2=0.18)
    for k in range(10):
        a = k * 2.4; rr = 0.05 + (k % 3) * 0.06
        mb.cyl((x + math.cos(a) * rr, y + math.sin(a) * rr, F + 0.45), (math.cos(a) * 0.3, math.sin(a) * 0.3, 1),
               0.09, h * (0.5 + 0.1 * (k % 5)), "plant_green", seg=6, r2=0.01)

reset()

# ---------------- shell ----------------
sh = MB("Office_F14_Shell")
sh.box(OX0, OY0, F - 0.2, OX1, OY1, F, "carpet")
sh.box(OX0, OY0, CEIL, OX1, OY1, CEIL + 0.1, "ceiling_tile")
sh.box(OX0 - 0.2, OY0, F, OX0, OY1, CEIL, "plaster_white")
sh.box(OX1, OY0, F, OX1 + 0.2, OY1, CEIL, "plaster_white")
sh.box(OX0, OY1, F, OX1, OY1 + 0.2, CEIL, "plaster_white")
for xc in (-5.0, 5.0):                                                    # columns
    for yc in (5.6, 11.6):
        sh.box(xc - 0.3, yc - 0.3, F, xc + 0.3, yc + 0.3, CEIL, "plaster_white")
# ceiling grid of light panels (mostly off)
ON = {(-6, 2), (-4, 2), (6, 11), (2, 15), (-2, 7)}
for gx in range(-8, 9, 2):
    for gy in range(2, 16, 3):
        lit = (gx, gy) in ON
        sh.box(gx - 0.6, gy - 0.3, CEIL - 0.01, gx + 0.6, gy + 0.3, CEIL, "panel_light_on" if lit else "panel_light_off")
# glass wall toward the street (south) with mullions on the tower grid
sh.box(OX0, OY0 - 0.02, F + 0.08, OX1, OY0, CEIL - 0.05, "glass_tint")
for i in range(15):
    xm = -11.0 + i * (22.0 / 14)
    if OX0 - 0.01 <= xm <= OX1 + 0.01:
        sh.box(xm - 0.04, OY0 - 0.06, F, xm + 0.04, OY0 + 0.05, CEIL, "steel_black")
sh.box(OX0, OY0 - 0.06, F, OX1, OY0 + 0.08, F + 0.08, "steel_black")
sh.box(OX0, OY0 - 0.06, CEIL - 0.06, OX1, OY0 + 0.08, CEIL, "steel_black")
# skirting
sh.box(OX0, OY0 + 0.1, F, OX0 + 0.02, OY1, F + 0.1, "plastic_black")
sh.box(OX1 - 0.02, OY0 + 0.1, F, OX1, OY1, F + 0.1, "plastic_black")
# elevator wall dressing (shaft A at x = 1.5) + "14" wayfinding
EX = 1.5
sh.box(EX - 0.85, OY1 - 0.07, F, EX - 0.7, OY1, F + 2.55, "metal_brushed")
sh.box(EX + 0.7, OY1 - 0.07, F, EX + 0.85, OY1, F + 2.55, "metal_brushed")
sh.box(EX - 0.85, OY1 - 0.07, F + 2.4, EX + 0.85, OY1, F + 2.55, "metal_brushed")
sh.box(EX - 0.3, OY1 - 0.05, F + 2.65, EX + 0.3, OY1, F + 2.81, "screen_on")
sh.box(EX + 1.05, OY1 - 0.07, F + 1.0, EX + 1.25, OY1, F + 1.35, "metal_brushed")
sh.cyl((EX + 1.15, OY1 - 0.07, F + 1.12), (0, -1, 0), 0.022, 0.01, "led_amber", seg=12)
sh.cyl((EX + 1.15, OY1 - 0.07, F + 1.24), (0, -1, 0), 0.022, 0.01, "metal_brushed", seg=12)
# whiteboard on west wall
sh.box(OX0, 8.0, F + 0.9, OX0 + 0.03, 10.4, F + 2.1, "plastic_white")
sh.box(OX0, 7.97, F + 0.87, OX0 + 0.04, 10.43, F + 0.9, "metal_brushed")
for p in ((-9.3, 15.9), (9.3, 1.3), (-9.3, 1.3), (9.3, 15.9)): plant(sh, *p)
# printer
sh.box(7.6, 15.6, F, 8.4, 16.2, F + 0.95, "plastic_white"); sh.box(7.65, 15.58, F + 0.95, 8.35, 16.15, F + 1.05, "plastic_grey")
shell = tag(sh.build(), collider="mesh", role="interior", level=14)
set_parent(text("Floor_Number_14", "14", 0.32, (EX - 1.35, OY1 - 0.01, F + 1.6), "paper_white", extrude=0.004), shell)
set_parent(text("Floor_Name", "HARBOR & CO.  ·  OPERATIONS", 0.12, (-5.0, OY1 - 0.01, F + 1.75), "paper_white", extrude=0.002), shell)

for side, sgn in (("L", -1), ("R", 1)):
    ed = MB(f"Elevator_F14_A_Door_{side}")
    xa = EX if sgn > 0 else EX - 0.7
    ed.box(xa, OY1 - 0.11, F, xa + 0.7, OY1 - 0.07, F + 2.4, "metal_brushed")
    tag(ed.build(origin=(EX, OY1 - 0.09, F)), role="elevator_door", slide_axis="x", slide_dist=0.7 * sgn,
        interactive=True, collider="box", elevator="A", level=14)

# ---------------- workstations (two clusters) ----------------
n = 1
for cx0 in (-7.2, 1.6):
    for row, (y0, side) in enumerate(((6.6, +1), (7.4, -1))):
        for k in range(2):
            m = MB(f"Desk_{n:02d}")
            x0 = cx0 + k * 1.7
            desk(m, x0, y0, x0 + 1.6, y0 + 0.8, mon_side=side)
            chair(m, x0 + 0.8, y0 - 0.55 if side > 0 else y0 + 1.35, rot=(0 if side > 0 else math.pi))
            tag(m.build(), role="desk", collider="box"); n += 1

# ---------------- player desk by the glass ----------------
PX0, PX1, PY0, PY1 = -6.6, -5.0, 1.35, 2.15
pd = MB("Desk_Player")
desk(pd, PX0, PY0, PX1, PY1, mon_side=-1, with_kit=False)
pd.box(PX0 - 0.6, PY0 + 0.1, F, PX0 - 0.05, PY1 - 0.1, F + 0.6, "steel_paint")           # pedestal
pd.box(PX0 + 0.1, PY0 + 0.05, F + 0.74, PX0 + 0.45, PY0 + 0.3, F + 0.82, "paper_white")  # paper stack
tag(pd.build(), role="desk", collider="box", owner="player", desk_id="14-03")

mon = MB("Monitor_Player"); cx = (PX0 + PX1) / 2; sy = PY0 + 0.2
mon.box(cx - 0.09, sy - 0.08, F + 0.74, cx + 0.09, sy + 0.08, F + 0.755, "plastic_black")
mon.box(cx - 0.02, sy - 0.02, F + 0.755, cx + 0.02, sy + 0.02, F + 0.98, "plastic_black")
mon.box(cx - 0.32, sy - 0.015, F + 0.92, cx + 0.32, sy + 0.02, F + 1.29, "plastic_black")
monitor = tag(mon.build(), role="monitor", collider="box")
scr = MB("Monitor_Player_Screen")
fy = sy + 0.021
quad_uv(scr, (cx + 0.30, fy, F + 0.94), (cx - 0.30, fy, F + 0.94), (cx - 0.30, fy, F + 1.27), (cx + 0.30, fy, F + 1.27),
        f"imgemit:{T}/label_screen_mail.png")
set_parent(tag(scr.build(fix_normals=False), role="screen", content="mail_gift_card_request"), monitor)

kb = MB("Keyboard_Player"); ky = PY0 + 0.52
kb.box(cx - 0.22, ky - 0.07, F + 0.74, cx + 0.22, ky + 0.07, F + 0.758, "plastic_black")
for r_ in range(4):
    for c_ in range(14):
        kx = cx - 0.2 + c_ * 0.0295; kyy = ky - 0.05 + r_ * 0.028
        kb.box(kx, kyy, F + 0.758, kx + 0.024, kyy + 0.022, F + 0.766, "plastic_grey")
kb.box(cx + 0.3, ky - 0.05, F + 0.74, cx + 0.36, ky + 0.05, F + 0.765, "plastic_black")
tag(kb.build(), role="keyboard", collider="box")

ev = MB("Envelope_Mail")
ex_, ey_ = PX1 - 0.32, PY0 + 0.5
ev.box(ex_ - 0.11, ey_ - 0.05, F + 0.74, ex_ + 0.11, ey_ + 0.05, F + 0.744, "paper_white")
quad_uv(ev, (ex_ + 0.11, ey_ + 0.05, F + 0.7445), (ex_ - 0.11, ey_ + 0.05, F + 0.7445),
        (ex_ - 0.11, ey_ - 0.05, F + 0.7445), (ex_ + 0.11, ey_ - 0.05, F + 0.7445), f"img:{T}/label_envelope.png")
tag(ev.build(origin=(ex_, ey_, F + 0.74), fix_normals=False), role="envelope", interactive=True, default_visible=False,
    note="appears during the mail beat")

ph = MB("DeskPhone")
px_, py_ = PX0 + 0.3, PY0 + 0.55
ph.box(px_ - 0.11, py_ - 0.1, F + 0.74, px_ + 0.11, py_ + 0.1, F + 0.79, "plastic_black", rot=0.25)
ph.box(px_ - 0.12, py_ - 0.03, F + 0.79, px_ - 0.07, py_ + 0.09, F + 0.83, "plastic_black", rot=0.25, pivot=(px_, py_))
ph.box(px_ + 0.07, py_ - 0.03, F + 0.79, px_ + 0.12, py_ + 0.09, F + 0.83, "plastic_black", rot=0.25, pivot=(px_, py_))
ph.box(px_ - 0.12, py_ - 0.03, F + 0.81, px_ + 0.12, py_ + 0.09, F + 0.84, "plastic_black", rot=0.25, pivot=(px_, py_))  # handset
ph.box(px_ - 0.05, py_ - 0.08, F + 0.79, px_ + 0.05, py_ - 0.04, F + 0.792, "screen_on", rot=0.25, pivot=(px_, py_))
for r_ in range(4):
    for c_ in range(3):
        bx = px_ - 0.035 + c_ * 0.03; by = py_ - 0.02 + r_ * 0.0 - 0.0
        ph.box(bx - 0.01, py_ - 0.035 + r_ * 0.0, F + 0.79, bx + 0.01, py_ - 0.025, F + 0.793, "plastic_grey", rot=0.25, pivot=(px_, py_)) if False else None
phone = tag(ph.build(), role="desk_phone", interactive=True, collider="box")
rl = MB("DeskPhone_RingLight")
rl.box(px_ + 0.06, py_ - 0.1, F + 0.79, px_ + 0.09, py_ - 0.07, F + 0.796, "led_amber", rot=0.25, pivot=(px_, py_))
set_parent(tag(rl.build(), role="ring_light", default_visible=False), phone)
pc = MB("Chair_Player"); chair(pc, (PX0 + PX1) / 2, PY1 + 0.55, rot=math.pi, fabric="fabric_navy")
tag(pc.build(), collider="box", owner="player")

# ---------------- break counter ----------------
bc = MB("Break_Counter")
bc.box(9.35, 9.0, F, 10.0, 13.4, F + 0.88, "wood_oak")                       # base run on east wall
bc.box(9.3, 9.0, F + 0.88, 10.0, 13.4, F + 0.92, "granite_polished")
bc.box(9.6, 9.0, F + 1.45, 10.0, 13.4, F + 2.2, "wood_oak")                 # uppers
bc.box(9.5, 13.45, F, 10.0, 14.2, F + 1.9, "metal_brushed")                 # fridge
bc.box(9.4, 10.0, F + 0.92, 9.8, 10.35, F + 1.3, "plastic_black")           # coffee machine
bc.box(9.45, 11.4, F + 0.90, 9.85, 11.9, F + 0.921, "metal_brushed")       # sink
bc.box(6.4, 10.0, F, 8.6, 10.9, F + 0.98, "wood_oak")                       # island / break counter
bc.box(6.35, 9.95, F + 0.98, 8.65, 10.95, F + 1.02, "granite_polished")
for sx in (6.9, 8.1):                                                         # stools
    bc.cyl((sx, 9.5, F), (0, 0, 1), 0.2, 0.02, "steel_black", seg=16)
    bc.cyl((sx, 9.5, F + 0.02), (0, 0, 1), 0.025, 0.66, "chrome", seg=10)
    bc.cyl((sx, 9.5, F + 0.68), (0, 0, 1), 0.18, 0.05, "fabric_grey", seg=16)
tag(bc.build(), role="break_counter", collider="box")

lp = MB("Laptop_Open")
LX, LY_, LZ = 7.2, 10.45, F + 1.02
lp.box(LX - 0.17, LY_ - 0.12, LZ, LX + 0.17, LY_ + 0.12, LZ + 0.016, "metal_brushed")
lp.box(LX - 0.15, LY_ - 0.09, LZ + 0.016, LX + 0.15, LY_ + 0.02, LZ + 0.017, "plastic_black")
# screen tilted back ~110 deg: thin slab from hinge at back edge
from mathutils import Vector
hinge_y, tilt = LY_ + 0.12, math.radians(20)
def sp(x, d, h): return (x, hinge_y + d * math.cos(tilt) + h * math.sin(tilt), LZ + 0.016 + h * math.cos(tilt) - d * math.sin(tilt))
A = [sp(LX - 0.17, 0, 0), sp(LX + 0.17, 0, 0), sp(LX + 0.17, 0, 0.23), sp(LX - 0.17, 0, 0.23)]
B = [sp(LX - 0.17, 0.008, 0), sp(LX + 0.17, 0.008, 0), sp(LX + 0.17, 0.008, 0.23), sp(LX - 0.17, 0.008, 0.23)]
lp.loft([A, B], "metal_brushed")
S = [sp(LX - 0.155, -0.001, 0.015), sp(LX + 0.155, -0.001, 0.015), sp(LX + 0.155, -0.001, 0.215), sp(LX - 0.155, -0.001, 0.215)]
laptop = tag(lp.build(), role="laptop", state="open_unlocked", collider="box")
ls = MB("Laptop_Screen"); ls.face(S, "screen_on")
set_parent(tag(ls.build(fix_normals=False), role="screen"), laptop)

us = MB("USB_SalaryReview")
UX, UY = 7.62, 10.3
us.box(UX - 0.028, UY - 0.009, LZ, UX + 0.028, UY + 0.009, LZ + 0.008, "plastic_black")
us.box(UX + 0.028, UY - 0.006, LZ + 0.0015, UX + 0.04, UY + 0.006, LZ + 0.0065, "metal_brushed")
quad_uv(us, (UX - 0.024, UY - 0.0075, LZ + 0.0081), (UX + 0.024, UY - 0.0075, LZ + 0.0081),
        (UX + 0.024, UY + 0.0075, LZ + 0.0081), (UX - 0.024, UY + 0.0075, LZ + 0.0081), f"img:{T}/label_usb.png")
tag(us.build(origin=(UX, UY, LZ), fix_normals=False), role="usb_stick", label="Salary review", interactive=True,
    pickup=True)

# ---------------- lights (mostly dark floor, cool office light) ----------------
light("F14_Desk_Light", 'POINT', (-5.5, 2.4, CEIL - 0.3), color='#dfe9f5', energy=160, radius=0.4)
light("F14_Break_Light", 'POINT', (7.8, 10.8, CEIL - 0.3), color='#dfe9f5', energy=140, radius=0.4)
light("F14_Elevator_Light", 'POINT', (1.5, 15.2, CEIL - 0.3), color='#dfe9f5', energy=110, radius=0.4)
light("F14_Aisle_Light", 'POINT', (-2.0, 7.5, CEIL - 0.3), color='#dfe9f5', energy=60, radius=0.4)

print("TRIANGLES", stats())
export(f"{OUT}/harbor_office_f14.glb")

if RENDER:
    cam = setup_render(night=True, res=(1400, 800), samples=32)
    which = sys.argv[sys.argv.index("--render") + 1]
    shots = {"office": ((7.5, 14.5, F + 1.7), (-6.0, 2.0, F + 0.9), 20),
             "desk": ((-5.5, 3.3, F + 1.25), (-5.8, 1.5, F + 0.85), 28),
             "break": ((5.6, 8.6, F + 1.45), (7.4, 10.4, F + 1.0), 30)}
    for nm, (pos, tgt, lens) in shots.items():
        if which in ("all", nm): shoot(cam, pos, tgt, f"{OUT}/office_{nm}.png", lens=lens)
