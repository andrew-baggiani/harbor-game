"""harbor_f14_detail.glb: floor-14 completion (world-aligned with harbor_office_f14.glb, load at origin).
Adds: glass meeting room, locked IT/server closet, print/copy + secure shred, desk clutter + clean-desk hook,
coat hooks, fire extinguishers, emergency exit, CCTV, window blinds, plants, elevator landing details.
Nothing from harbor_office_f14.glb is duplicated or moved."""
import sys; sys.path.insert(0, '/home/claude/harbor')
from lib2 import *
import random as _r

RENDER = "--render" in sys.argv
reset()
F = 50.6; CEIL = F + 3.0; FT = F + 0.74
OX0, OX1, OY0, OY1 = -10.0, 10.0, 0.6, 16.6
RR = _r.Random(141)

# =====================================================================
# GLASS MEETING ROOM (NW corner)  x -10..-6.4, y 12.4..16.6
# =====================================================================
MX1, MY0 = -6.4, 12.4
DOOR_Y0, DOOR_Y1 = 12.55, 13.45
def glass_run(mb, a, b, fixed, axis):
    """Glass partition along x (axis='x', fixed=y) or along y (axis='y', fixed=x) from a to b."""
    def bx(p0, p1, q0, q1, z0, z1, m):
        if axis == 'x': mb.box(p0, q0, z0, p1, q1, z1, m)
        else: mb.box(q0, p0, z0, q1, p1, z1, m)
    bx(a, b, fixed - 0.03, fixed + 0.03, F, F + 0.05, "steel_black")
    bx(a, b, fixed - 0.03, fixed + 0.03, CEIL - 0.06, CEIL, "steel_black")
    bx(a, b, fixed - 0.006, fixed + 0.006, F + 0.05, CEIL - 0.06, "glass_clear")
    bx(a, b, fixed - 0.008, fixed + 0.008, F + 1.02, F + 1.12, "glass_frost")          # manifestation band
    n = max(1, int(round((b - a) / 1.2)))
    for i in range(n + 1):
        p = a + (b - a) * i / n
        bx(p - 0.02, p + 0.02, fixed - 0.03, fixed + 0.03, F, CEIL, "steel_black")
gs = MB("MeetingRoom_Glass_South")
glass_run(gs, OX0, MX1, MY0, 'x')
glass_run(gs, MY0, DOOR_Y0, MX1, 'y')
tag(gs.build(), role="glass_partition", collider="mesh")
ge = MB("MeetingRoom_Glass_East")
glass_run(ge, DOOR_Y1, OY1, MX1, 'y')
ge.box(MX1 - 0.03, DOOR_Y0, CEIL - 0.6, MX1 + 0.03, DOOR_Y1, CEIL, "steel_black")       # door header
tag(ge.build(), role="glass_partition", collider="mesh")
md = MB("MeetingRoom_Door")
md.box(MX1 - 0.02, DOOR_Y0 + 0.01, F + 0.01, MX1 + 0.02, DOOR_Y1 - 0.01, F + 0.06, "steel_black")
md.box(MX1 - 0.02, DOOR_Y0 + 0.01, CEIL - 0.66, MX1 + 0.02, DOOR_Y1 - 0.01, CEIL - 0.61, "steel_black")
md.box(MX1 - 0.006, DOOR_Y0 + 0.01, F + 0.06, MX1 + 0.006, DOOR_Y1 - 0.01, CEIL - 0.66, "glass_clear")
md.box(MX1 - 0.008, DOOR_Y0 + 0.01, F + 1.02, MX1 + 0.008, DOOR_Y1 - 0.01, F + 1.12, "glass_frost")
for s in (-1, 1):
    md.cyl((MX1 + s * 0.05, DOOR_Y1 - 0.12, F + 0.75), (0, 0, 1), 0.014, 0.6, "chrome", seg=10)
    md.box(min(MX1, MX1 + s * 0.05), DOOR_Y1 - 0.13, F + 0.85, max(MX1, MX1 + s * 0.05), DOOR_Y1 - 0.11, F + 0.87, "chrome")
tag(md.build(origin=(MX1, DOOR_Y0, F)), role="door", hinge_axis="y", open_deg=90, closed_deg=0, collider="box",
    interactive=True, note="glass door, swings into the meeting room")

mf = MB("MeetingRoom_Furniture")
mf.box(-8.85, 13.3, FT - 0.04, -7.55, 15.7, FT, "wood_oak")
mf.box(-8.3, 14.0, F, -8.1, 15.0, FT - 0.04, "steel_black")
mf.box(-8.55, 14.3, F, -7.85, 14.7, F + 0.02, "steel_black")
for y in (13.8, 14.5, 15.2):
    office_chair(mf, -9.2, y, F, rot=math.radians(90), fabric="fabric_navy")
    office_chair(mf, -7.2, y, F, rot=math.radians(-90), fabric="fabric_navy")
mf.box(-8.35, 14.3, FT, -8.05, 14.42, FT + 0.03, "plastic_black")                     # conference phone
mf.box(-8.4, 13.5, FT, -8.19, 13.8, FT + 0.004, "paper_white")
mug(mf, -7.8, 15.3, FT)
mf.box(-8.9, 16.45, F + 0.95, -7.5, 16.55, F + 1.75, "plastic_black")                  # TV body
tag(mf.build(), role="furniture", collider="mesh")
tv = MB("MeetingRoom_TV_Screen"); label(tv, (-8.2, 16.448, F + 1.35), 1.34, 0.755, '-y', imge("label_tv"))
tag(tv.build(fix_normals=False), role="screen", content="confidential_slides", hook="screen_visible_through_glass",
    note="confidential deck left on the meeting-room TV, readable through the glass")
wb = MB("MeetingRoom_Whiteboard")
wb.box(OX0, 13.0, F + 0.9, OX0 + 0.025, 15.4, F + 2.1, "plastic_white")
wb.box(OX0, 12.97, F + 0.87, OX0 + 0.035, 15.43, F + 0.9, "metal_brushed")
wbo = tag(wb.build(), role="whiteboard", hook="sensitive_info_on_whiteboard", collider="none",
          note="Guest Wi-Fi password + 'vendor bank change' notes left on the board")
wl = MB("MeetingRoom_Whiteboard_Writing"); label(wl, (OX0 + 0.027, 14.2, F + 1.5), 2.3, 1.15, '+x', img("label_whiteboard"))
set_parent(wl.build(fix_normals=False), wbo)

# =====================================================================
# IT / SERVER CLOSET  x -3.6..-0.9, y 14.35..16.6 (badge door, locked)
# =====================================================================
CX0, CX1, CY0 = -3.6, -0.9, 14.35
CDX0, CDX1, CDH = -2.75, -1.85, F + 2.15
WT = 0.12
cw = MB("ServerCloset_Walls")
cw.box(CX0, CY0, F, CDX0, CY0 + WT, CEIL, "plaster_white")
cw.box(CDX1, CY0, F, CX1, CY0 + WT, CEIL, "plaster_white")
cw.box(CDX0, CY0, CDH, CDX1, CY0 + WT, CEIL, "plaster_white")
cw.box(CX0, CY0 + WT, F, CX0 + WT, OY1, CEIL, "plaster_white")
cw.box(CX1 - WT, CY0 + WT, F, CX1, OY1, CEIL, "plaster_white")
cw.box(CX0 + WT, CY0 + WT, F, CX1 - WT, OY1, F + 0.004, "rubber_floor")                    # anti-static floor
for x0, x1 in ((CDX0 - 0.06, CDX0), (CDX1, CDX1 + 0.06)):                                   # door frame
    cw.box(x0, CY0 - 0.015, F, x1, CY0 + WT + 0.01, CDH + 0.06, "steel_paint")
cw.box(CDX0 - 0.06, CY0 - 0.015, CDH, CDX1 + 0.06, CY0 + WT + 0.01, CDH + 0.06, "steel_paint")
cw.box(CX0, CY0 - 0.01, F, CX1, CY0, F + 0.1, "plastic_black")                              # skirting
cw.box(-2.9, 15.2, CEIL - 0.02, -1.6, 15.8, CEIL - 0.005, "panel_light_on")                 # closet light
cw.box(CX0 + WT, 16.25, CEIL - 0.35, CX1 - WT, 16.55, CEIL - 0.3, "steel_paint")            # cable tray
for x in (-2.35, -1.65):
    cw.box(x - 0.08, 16.3, F + 2.0, x + 0.08, 16.5, CEIL - 0.35, "cable_blue")
tag(cw.build(), role="room_walls", collider="mesh", name_display="IT / Server 14-A")

dr = MB("ServerCloset_Door")
dr.box(CDX0 + 0.005, CY0 + 0.005, F + 0.01, CDX1 - 0.005, CY0 + 0.05, CDH - 0.01, "door_metal")
dr.box(CDX1 - 0.16, CY0 - 0.04, F + 1.0, CDX1 - 0.05, CY0 + 0.005, F + 1.04, "chrome")        # lever handle
dr.box(CDX1 - 0.1, CY0 - 0.005, F + 0.97, CDX1 - 0.06, CY0 + 0.005, F + 1.1, "steel_black")
dr.box(CDX1 - 0.12, CY0 + 0.05, F + 1.86, CDX1 - 0.02, CY0 + 0.08, CDH - 0.03, "steel_black")   # closer (inside)
cdoor = tag(dr.build(origin=(CDX0, CY0, F)), role="door", locked=True, hinge_axis="y", open_deg=-90, ajar_deg=-12,
            closed_deg=0, collider="box", interactive=True, hook="unlocked_server_closet", requires_badge=True,
            reader="ServerCloset_Reader",
            note="IT closet. Locked by default. Training beat: set locked=false and rotate to ajar_deg (door left "
                 "open / latch taped) - the player should close it and report it, not go in")
sl = MB("ServerCloset_Door_Sign"); label(sl, (CDX0 + 0.45, CY0 + 0.0035, F + 1.58), 0.48, 0.3, '-y', img("label_authorized"))
set_parent(sl.build(origin=(CDX0, CY0, F), fix_normals=False), cdoor)
badge_reader("ServerCloset_Reader", (CDX1 + 0.32, CY0, F + 1.15), rz=0.0,
             extra_tags=dict(door="ServerCloset_Door", interactive=True))

rk = MB("ServerRacks")
LEDS = {"A": [], "B": [], "F": []}
def rack(x0, kind):
    x1 = x0 + 0.6; y0, y1 = 15.5, 16.55
    rk.box(x0, y0, F, x1, y1, F + 2.0, "server_black", mats={'front': None})
    rk.box(x0, y0, F, x0 + 0.04, y0 + 0.02, F + 2.0, "steel_black")
    rk.box(x1 - 0.04, y0, F, x1, y0 + 0.02, F + 2.0, "steel_black")
    rk.box(x0, y0, F + 1.96, x1, y0 + 0.02, F + 2.0, "steel_black")
    rk.box(x0, y0, F, x1, y0 + 0.02, F + 0.08, "steel_black")
    rk.box(x0 + 0.04, y0 + 0.4, F + 0.08, x1 - 0.04, y0 + 0.42, F + 1.96, "server_black")   # rear of the bay
    z = F + 0.1
    units = [("ups", 0.13)] + [("srv2", 0.088)] * 4 + [("blank", 0.044)] + [("srv1", 0.044)] * 6 + [("blank", 0.088)] + \
            [("switch", 0.044)] * 2 + [("patch", 0.044)] * 2 if kind == "B" else \
            [("srv2", 0.088)] * 8 + [("blank", 0.044)] + [("srv1", 0.044)] * 8 + [("switch", 0.044)] + [("patch", 0.044)]
    for k, (u, h) in enumerate(units):
        if z + h > F + 1.95: break
        mat = {"ups": "plastic_black", "srv2": "server_black", "srv1": "steel_paint", "blank": "steel_black",
               "switch": "plastic_grey", "patch": "plastic_black"}[u]
        rk.box(x0 + 0.045, y0 + 0.03, z + 0.002, x1 - 0.045, y0 + 0.4, z + h - 0.002, mat)
        if u in ("srv2", "srv1"):
            for g in range(3 if u == "srv2" else 2):
                gx = x0 + 0.12 + g * 0.11
                rk.box(gx, y0 + 0.027, z + 0.01, gx + 0.09, y0 + 0.03, z + h - 0.01, "steel_black")   # drive bays
            for i in range(3):
                grp = "A" if (k + i) % 2 == 0 else "B"
                LEDS[grp].append((x1 - 0.12 + i * 0.022, y0 + 0.026, z + h / 2, "led_green" if i < 2 else "led_blue"))
        elif u == "switch":
            for p in range(12):
                px = x0 + 0.09 + p * 0.034
                rk.box(px, y0 + 0.027, z + 0.012, px + 0.022, y0 + 0.03, z + 0.03, "steel_black")
                LEDS["A" if p % 3 else "B"].append((px + 0.011, y0 + 0.026, z + 0.036, "led_amber" if p % 4 == 0 else "led_green"))
        elif u == "patch":
            for p in range(16):
                px = x0 + 0.07 + p * 0.028
                rk.box(px, y0 + 0.02, z + 0.012, px + 0.016, y0 + 0.03, z + 0.03,
                       "cable_blue" if p % 5 else "cable_yellow")
        elif u == "ups":
            rk.box(x0 + 0.08, y0 + 0.027, z + 0.04, x0 + 0.2, y0 + 0.03, z + 0.09, "screen_on")
            LEDS["A"].append((x0 + 0.26, y0 + 0.026, z + 0.065, "led_green"))
        z += h
    LEDS["F"].append((x1 - 0.08, y0 + 0.022, F + 1.9, "led_red"))
rack(-2.65, "A"); rack(-1.95, "B")
tag(rk.build(), role="server_rack", collider="box", note="two racks in the IT closet")
for grp, nm, vis in (("A", "ServerRack_LEDs_A", True), ("B", "ServerRack_LEDs_B", True), ("F", "ServerRack_LED_Fault", False)):
    lm = MB(nm)
    for x, y, z, m in LEDS[grp]:
        lm.box(x - 0.004, y - 0.002, z - 0.003, x + 0.004, y + 0.001, z + 0.003, m)
    tag(lm.build(), role="blink_leds", group=grp, default_visible=vis, collider="none",
        blink_hz=(2.0 if grp == "A" else 1.3 if grp == "B" else 0.0),
        note="toggle visibility to blink; A and B out of phase. Fault LED stays hidden unless needed")

# =====================================================================
# PRINT / COPY AREA (beside the existing printer) + secure shred vs recycling
# =====================================================================
pa = MB("PrintArea")
pa.box(6.85, 16.05, F, 7.5, 16.58, F + 0.9, "plastic_white")                                # paper cabinet
pa.box(6.84, 16.04, F + 0.9, 7.51, 16.59, F + 0.93, "plastic_grey")
for i in range(3):
    pa.box(6.95, 16.15, F + 0.93 + i * 0.055, 7.25, 16.36, F + 0.98 + i * 0.055, "paper_white")
    pa.box(6.95, 16.15, F + 0.975 + i * 0.055, 7.25, 16.36, F + 0.985 + i * 0.055, "plastic_blue")
pa.box(7.3, 16.2, F + 0.93, 7.48, 16.5, F + 1.05, "plastic_black")                          # stapler / tray
tag(pa.build(), role="print_area", collider="box")

sb = MB("Shred_Bin_Secure")
sb.box(5.55, 16.08, F, 6.15, 16.56, F + 0.98, "plastic_grey")
sb.box(5.53, 16.06, F + 0.98, 6.17, 16.58, F + 1.02, "plastic_black")
sb.box(5.65, 16.18, F + 1.02, 6.05, 16.22, F + 1.024, "steel_black")                        # paper slot
sb.cyl((6.0, 16.06, F + 0.85), (0, -1, 0), 0.016, 0.006, "chrome", seg=12)                 # lock
shred = tag(sb.build(), role="shred_bin", locked=True, interactive=True, collider="box", hook="secure_disposal",
            note="locked secure-shred console: correct place for confidential paper (printouts, wire forms)")
sbl = MB("Shred_Bin_Secure_Label"); label(sbl, (5.85, 16.077, F + 0.55), 0.42, 0.42, '-y', img("label_shred"))
set_parent(sbl.build(fix_normals=False), shred)

rb = MB("Recycle_Bin_Paper")
rb.box(6.25, 16.12, F, 6.75, 16.56, F + 0.72, "plastic_green", mats={'top': None})
rb.box(6.28, 16.15, F + 0.02, 6.72, 16.53, F + 0.7, "plastic_green", mats={'top': None})
for i in range(5):
    rb.box(6.32 + RR.uniform(0, 0.15), 16.2 + RR.uniform(0, 0.1), F + 0.5 + i * 0.03, 6.55 + RR.uniform(0, 0.12),
           16.45, F + 0.503 + i * 0.03, "paper_white")
recyc = tag(rb.build(), role="trash_bin", kind="paper_recycling", interactive=True, collider="box",
            hook="secure_disposal", note="open recycling: NOT for confidential paper (contrast with Shred_Bin_Secure)")
rbl = MB("Recycle_Bin_Paper_Label"); label(rbl, (6.5, 16.118, F + 0.45), 0.42, 0.21, '-y', img("label_recycle"))
set_parent(rbl.build(fix_normals=False), recyc)
tb = MB("Trash_Bin")
tb.cyl((8.75, 16.32, F), (0, 0, 1), 0.17, 0.5, "plastic_black", seg=18, r2=0.19, cap=False)
tb.cyl((8.75, 16.32, F), (0, 0, 1), 0.17, 0.004, "plastic_black", seg=18)
tag(tb.build(smooth=True), role="trash_bin", kind="general", interactive=True, collider="box", hook="secure_disposal")

po = MB("Printer_Output_Sheets")
po.box(7.74, 15.68, F + 1.05, 7.95, 15.98, F + 1.056, "paper_white")
po.box(7.76, 15.69, F + 1.056, 7.97, 15.99, F + 1.06, "paper_white", rot=0.06)
tag(po.build(), role="clean_desk_hook", hook="unclaimed_printout", interactive=True, pickup=True, collider="none",
    note="printout left on the printer (vendor payment list); should go to the shred bin or its owner")
pol = MB("Printer_Output_Sheets_Print"); label(pol, (7.865, 15.84, F + 1.0605), 0.19, 0.27, '+z', img("label_wireform"), up=(0, 1, 0))
set_parent(pol.build(fix_normals=False), bpy.data.objects["Printer_Output_Sheets"])
badge_reader("Printer_Release_Reader", (8.3, 15.6, F + 0.8), rz=0.0, scale=0.8,
             extra_tags=dict(interactive=True, note="secure print release: badge to print"))

# =====================================================================
# DESK CLUTTER (around the 8 existing desks) + clean-desk hook on Desk_07
# =====================================================================
cl = MB("Desk_Clutter")
screens = MB("Desk_Monitor_Screens")
stick = MB("Desk_Sticky_Notes")
n = 1
DESKS = {}
for cx0 in (-7.2, 1.6):
    for (y0, side) in ((6.6, +1), (7.4, -1)):
        for k in range(2):
            x0 = cx0 + k * 1.7; x1 = x0 + 1.6; y1 = y0 + 0.8
            DESKS[n] = (x0, x1, y0, y1, side); n += 1
for n, (x0, x1, y0, y1, side) in DESKS.items():
    cx = (x0 + x1) / 2
    sy = y1 - 0.18 if side > 0 else y0 + 0.18
    ky = sy - 0.33 * side
    fs = -side                                     # +1 if the user sits toward +y
    fr = sy - 0.0265 * side                        # just in front of the screen face
    if n != 3: mug(cl, x0 + 0.2, ky + 0.02 * fs, FT, mat=RR.choice(["ceramic_white", "fabric_navy", "paint_red"]))
    # two-tier paper tray at the back corner
    tx0, tx1 = x1 - 0.42, x1 - 0.1
    for t in range(2):
        z = FT + t * 0.07
        cl.box(tx0, sy - 0.13, z, tx1, sy + 0.13, z + 0.008, "plastic_black")
        cl.box(tx0 + 0.02, sy - 0.11, z + 0.008, tx1 - 0.02, sy + 0.11, z + 0.02 + RR.uniform(0, 0.02), "paper_white")
    for xx in (tx0, tx1 - 0.01):
        cl.box(xx, sy - 0.13, FT, xx + 0.01, sy + 0.13, FT + 0.08, "plastic_black")
    # headset on the left back
    if n % 2 == 1:
        hx, hy = x0 + 0.27, sy
        cl.cyl((hx - 0.07, hy, FT), (0, 0, 1), 0.045, 0.03, "plastic_black", seg=12)
        cl.cyl((hx + 0.07, hy, FT), (0, 0, 1), 0.045, 0.03, "plastic_black", seg=12)
        cl.box(hx - 0.075, hy - 0.012, FT + 0.03, hx + 0.075, hy + 0.012, FT + 0.045, "plastic_black")
        cl.box(hx + 0.07, hy - 0.004, FT + 0.01, hx + 0.16, hy + 0.004, FT + 0.016, "plastic_black", rot=0.5)
    else:                                          # pen cup + phone charger
        cl.cyl((x0 + 0.2, sy, FT), (0, 0, 1), 0.035, 0.1, "steel_black", seg=12)
        for p in range(4):
            a = p * 1.6
            cl.cyl((x0 + 0.2 + 0.012 * math.cos(a), sy + 0.012 * math.sin(a), FT + 0.04), (0.05 * math.cos(a), 0.05 * math.sin(a), 1),
                   0.004, 0.13, RR.choice(["plastic_blue", "plastic_black", "paint_red"]), seg=6)
    # loose papers near the keyboard (right)
    for p in range(RR.randint(1, 3)):
        px = x1 - 0.38 + RR.uniform(-0.04, 0.04); py = ky + RR.uniform(-0.05, 0.05)
        cl.box(px - 0.105, py - 0.148, FT + 0.001 * p, px + 0.105, py + 0.148, FT + 0.002 + 0.001 * p, "paper_white",
               rot=RR.uniform(-0.3, 0.3))
    # lockable pedestal under the desk (right side, user side of the modesty panel)
    py0, py1 = (y0 + 0.08, y1 - 0.12) if side > 0 else (y0 + 0.12, y1 - 0.08)
    cl.box(x1 - 0.52, py0, F, x1 - 0.12, py1, F + 0.6, "steel_paint")
    hy0, hy1 = (py0 - 0.012, py0) if side > 0 else (py1, py1 + 0.012)
    for dz in (0.12, 0.3, 0.48):
        cl.box(x1 - 0.4, hy0, F + dz, x1 - 0.24, hy1, F + dz + 0.015, "chrome")
    cl.cyl((x1 - 0.18, hy0 if side > 0 else hy1, F + 0.55), (0, -1 if side > 0 else 1, 0), 0.01, 0.004, "chrome", seg=10)
    # screen overlays
    if n in (1, 4, 6):
        label(screens, (cx, fr, F + 1.105), 0.58, 0.32, '-y' if side > 0 else '+y', imge("label_screen_locked"))
    # ordinary sticky notes on a few bezels
    if n in (2, 5, 8):
        label(stick, (cx - 0.25, fr - 0.0005 * side, F + 1.25), 0.06, 0.06, '-y' if side > 0 else '+y',
              img(RR.choice(["label_sticky_todo", "label_sticky_pink", "label_sticky_green"])))
tag(cl.build(), role="desk_clutter", collider="none", note="mugs, trays, headsets, papers, pedestals on Desk_01..08")
set_parent(tag(screens.build(fix_normals=False), role="screen", content="locked_screen"), bpy.data.objects["Desk_Clutter"])
set_parent(stick.build(fix_normals=False), bpy.data.objects["Desk_Clutter"])

# Desk_07: unlocked spreadsheet + password sticky (the clean-desk hook)
x0, x1, y0, y1, side = DESKS[7]
cx = (x0 + x1) / 2; sy = y0 + 0.18; fr = sy + 0.0265
s7 = MB("Monitor_Desk07_Screen"); label(s7, (cx, fr, F + 1.105), 0.58, 0.32, '+y', imge("label_screen_sheet"))
tag(s7.build(origin=(cx, fr, F + 1.105), fix_normals=False), role="screen", content="unlocked_spreadsheet",
    desk="Desk_07", hook="unlocked_unattended_screen", note="unlocked workstation, owner away")
pw = MB("Sticky_Password_Desk07"); label(pw, (cx + 0.245, fr + 0.0012, F + 0.965), 0.075, 0.075, '+y', img("label_sticky_pw"))
tag(pw.build(origin=(cx + 0.245, fr + 0.0012, F + 0.965), fix_normals=False), role="clean_desk_hook",
    hook="password_sticky_note", desk="Desk_07", interactive=True, pickup=True, collider="none",
    note="sticky note with a password on the monitor bezel. Player should remove it / report it")
pm = MB("Desk_Player_Mug"); mug(pm, -5.15, 1.55, FT, mat="fabric_navy")
tag(pm.build(), collider="none")

# =====================================================================
# WEST WALL: coat hooks, emergency exit, evac plan, extinguisher
# =====================================================================
ch = MB("Coat_Hooks")
ch.box(OX0, 2.5, F + 1.66, OX0 + 0.025, 3.7, F + 1.74, "wood_oak")
for i in range(5):
    y = 2.62 + i * 0.24
    ch.cyl((OX0 + 0.025, y, F + 1.7), (1, 0, 0.35), 0.008, 0.08, "chrome", seg=8)
ch.box(OX0 + 0.03, 2.72, F + 0.82, OX0 + 0.2, 3.22, F + 1.6, "fabric_navy")                   # coat
ch.box(OX0 + 0.03, 2.68, F + 1.45, OX0 + 0.16, 3.26, F + 1.62, "fabric_navy")
ch.box(OX0 + 0.04, 3.3, F + 1.05, OX0 + 0.16, 3.62, F + 1.45, "leather_black")                # tote bag
ch.box(OX0 + 0.06, 3.38, F + 1.45, OX0 + 0.08, 3.54, F + 1.68, "leather_black")
tag(ch.build(), role="coat_hooks", collider="none")

EY0, EY1, EH = 4.4, 5.4, F + 2.15
ef = MB("Emergency_Exit_Frame")
ef.box(OX0, EY0 - 0.06, F, OX0 + 0.05, EY0, EH + 0.06, "steel_paint")
ef.box(OX0, EY1, F, OX0 + 0.05, EY1 + 0.06, EH + 0.06, "steel_paint")
ef.box(OX0, EY0 - 0.06, EH, OX0 + 0.05, EY1 + 0.06, EH + 0.06, "steel_paint")
ef.box(OX0, EY0 + 0.27, EH + 0.12, OX0 + 0.03, EY0 + 0.73, EH + 0.32, "steel_black")           # EXIT box
tag(ef.build(), role="door_frame", collider="none")
efl = MB("Emergency_Exit_Signs")
label(efl, (OX0 + 0.032, (EY0 + EY1) / 2, EH + 0.22), 0.42, 0.16, '+x', imge("label_exit"))
label(efl, (OX0 + 0.002, EY1 + 0.42, F + 1.5), 0.33, 0.44, '+x', img("label_evac"))
label(efl, (OX0 + 0.002, 6.25, F + 1.78), 0.3, 0.15, '+x', img("label_fire_ext"))
set_parent(efl.build(fix_normals=False), bpy.data.objects["Emergency_Exit_Frame"])
ed = MB("Emergency_Exit_Door")
HX = OX0 + 0.025
ed.box(HX - 0.02, EY0 + 0.005, F + 0.01, HX + 0.02, EY1 - 0.005, EH - 0.01, "door_metal")
ed.box(HX + 0.02, EY0 + 0.1, F + 0.98, HX + 0.03, EY1 - 0.1, F + 1.06, "steel_paint")
ed.box(HX + 0.03, EY0 + 0.12, F + 1.0, HX + 0.07, EY1 - 0.12, F + 1.04, "chrome")               # push bar
edo = tag(ed.build(origin=(HX, EY0, F)), role="door", kind="emergency_exit", hinge_axis="y", open_deg=-90, closed_deg=0,
          locked=False, alarmed=True, collider="box", interactive=True,
          note="fire exit to the stair. No stair geometry exists behind the wall: keep closed, or swing it into the "
               "office (open_deg -90) for a 'propped fire door' beat")
edl = MB("Emergency_Exit_Door_Sign"); label(edl, (HX + 0.0205, EY0 + 0.5, F + 1.5), 0.42, 0.21, '+x', img("label_emergency_exit"))
set_parent(edl.build(origin=(HX, EY0, F), fix_normals=False), edo)

def extinguisher(name, x, y, facing_rz, base_z):
    m = MB(name)
    m.box(-0.06, -0.02, base_z + 0.5, 0.06, 0.0, base_z + 0.62, "steel_black")                     # bracket (wall at local y=0)
    m.cyl((0, -0.1, base_z + 0.35), (0, 0, 1), 0.075, 0.48, "paint_red", seg=18)
    m.cyl((0, -0.1, base_z + 0.83), (0, 0, 1), 0.05, 0.05, "paint_red", seg=14, r2=0.025)
    m.box(-0.015, -0.12, base_z + 0.86, 0.015, -0.08, base_z + 0.93, "steel_black")
    m.box(-0.07, -0.12, base_z + 0.91, 0.03, -0.1, base_z + 0.925, "steel_black")
    m.cyl((0.02, -0.16, base_z + 0.88), (0.02, -0.01, -1), 0.012, 0.42, "rubber", seg=8)
    xform(m, facing_rz, (x, y, 0))
    return tag(m.build(origin=(x, y, base_z)), role="fire_extinguisher", collider="box", interactive=True)
extinguisher("Fire_Extinguisher_West", OX0, 6.25, math.pi / 2, F)
extinguisher("Fire_Extinguisher_North", 4.6, OY1, 0.0, F)
fx = MB("Fire_Extinguisher_North_Sign"); label(fx, (4.6, OY1 - 0.002, F + 1.78), 0.3, 0.15, '-y', img("label_fire_ext"))
set_parent(fx.build(fix_normals=False), bpy.data.objects["Fire_Extinguisher_North"])

# =====================================================================
# CCTV, BLINDS, PLANTS, ELEVATOR LANDING
# =====================================================================
cctv_dome("CCTV_F14_Elevator", 0.4, 13.2, CEIL, "floor-14 elevator landing")
cctv_dome("CCTV_F14_ServerCloset", -3.2, 13.4, CEIL, "IT closet door")
cctv_dome("CCTV_F14_PrintArea", 6.6, 14.9, CEIL, "print / shred area")

bl = MB("Window_Blinds")
xs = [OX0] + [-11.0 + i * (22.0 / 14) for i in range(15) if OX0 < -11.0 + i * (22.0 / 14) < OX1] + [OX1]
for a, b in zip(xs[:-1], xs[1:]):
    a2, b2 = a + 0.05, b - 0.05
    bl.box(a2, 0.70, CEIL - 0.13, b2, 0.80, CEIL - 0.01, "plastic_white")                 # cassette
    drop = RR.choice([0.25, 0.4, 0.9, 1.3, 1.6, 2.1, 0.6])
    zb = CEIL - 0.13 - drop
    bl.box(a2 + 0.02, 0.745, zb, b2 - 0.02, 0.752, CEIL - 0.13, "blind_fabric")
    bl.box(a2 + 0.02, 0.738, zb - 0.025, b2 - 0.02, 0.759, zb, "metal_brushed")
    if drop > 0.5:
        bl.box(b2 - 0.08, 0.755, zb - 0.6, b2 - 0.075, 0.76, CEIL - 0.13, "plastic_white")   # chain
tag(bl.build(), role="window_blinds", collider="none")

pp = MB("F14_Plants")
for x, y, h in ((-6.0, 16.15, 1.0), (5.0, 12.4, 1.2), (9.45, 8.45, 1.1), (-9.4, 7.3, 1.1), (0.3, 1.2, 1.0), (4.4, 1.2, 1.2)):
    plant(pp, x, y, F, h=h)
tall_plant(pp, 3.35, 16.18, F, h=1.9, pot="plastic_white")
tag(pp.build(), role="plants", collider="mesh")

landing_details("Elevator_F14_A", 1.5, OY1, OY1 - 0.05, F, 2.65, OY1 - 0.08, "14")

print("TRIANGLES", stats())
export(f"{OUT}/harbor_f14_detail.glb")

if RENDER:
    which = sys.argv[sys.argv.index("--render") + 1] if len(sys.argv) > sys.argv.index("--render") + 1 else "all"
    import_glb(f"{OUT}/harbor_office_f14.glb")
    o = bpy.data.objects.get("Office_F14_Shell")
    if o:
        o.hide_render = True
        for c in o.children_recursive: c.hide_render = True
    import_glb(f"{OUT}/harbor_shaft_cut.glb")
    for nm in ("Lobby_Interior_ShaftCut",):
        if nm in bpy.data.objects: bpy.data.objects[nm].hide_render = True
    import_glb(f"{OUT}/harbor_elevator_cab.glb")
    bpy.data.objects["Elevator_Cab"].location = (1.5, 16.51, F)
    mark_hidden_defaults()
    def show(nm, v=True): bpy.data.objects[nm].hide_render = not v
    # demo: closet ajar + unlocked, call lit, lantern down
    bpy.data.objects["ServerCloset_Door"].rotation_euler.z = math.radians(-35)
    show("Elevator_F14_A_CallButton_Unlit", False); show("Elevator_F14_A_CallButton_Lit")
    show("Elevator_F14_A_Lantern_Down_Unlit", False); show("Elevator_F14_A_Lantern_Down_Lit")
    for side, s in (("L", -1), ("R", 1)):
        d = bpy.data.objects.get(f"Elevator_F14_A_Door_{side}"); d.location.x += 0.7 * s
        d = bpy.data.objects.get(f"Elevator_Cab_Door_{side}"); d.location.x += 0.72 * s
    for i, (x, y) in enumerate(((-5.5, 2.4), (7.8, 10.8), (1.5, 14.2), (-2.0, 7.5), (-8.2, 14.5), (6.8, 15.0), (2.8, 8.0), (-2.3, 12.8))):
        light(f"R_F{i}", 'POINT', (x, y, CEIL - 0.3), color='#dfe9f5', energy=180, radius=0.4)
    for o in bpy.data.objects:
        if o.type == "LIGHT": o.visible_camera = False; o.visible_transmission = False; o.visible_glossy = False
    cam = setup_render(night=True, res=(1100, 680), samples=20)
    shots = {"arrival": ((1.6, 15.2, F + 1.7), (-3.5, 8.0, F + 1.0), 22),
             "closet": ((-0.9, 12.3, F + 1.7), (-2.4, 15.6, F + 1.2), 24),
             "meeting": ((-5.9, 10.3, F + 1.7), (-8.6, 14.6, F + 1.2), 22),
             "print": ((3.6, 13.0, F + 1.7), (6.9, 16.3, F + 0.9), 24),
             "desk07": ((2.75, 8.75, F + 1.35), (2.4, 7.6, F + 1.05), 30),
             "window": ((-3.0, 9.5, F + 1.7), (-8.0, 2.0, F + 1.3), 22),
             "elevator": ((1.5, 13.0, F + 1.7), (1.5, 17.5, F + 1.3), 26)}
    for nm, (pos, tgt, lens) in shots.items():
        if which == "all" or nm in which.split(","): shoot(cam, pos, tgt, f"{OUT}/f14_{nm}.png", lens=lens)
