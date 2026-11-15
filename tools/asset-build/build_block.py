"""Harbor & Co. — Monday night quay block (exterior + Harbor Tower lobby).
Blender Z-up; exported Y-up. Origin = street level (sidewalk top) in front of the tower doors.
Buildings on +Y (glTF -Z), harbor water on -Y (glTF +Z). Road runs east-west along X."""
import sys; sys.path.insert(0, '/home/claude/harbor')
import bpy, math, random
from mathutils import Vector
from lib import *
from cars import make_car

RENDER = "--render" in sys.argv
reset()
R = random.Random(42)

def beam(mb, p0, p1, w, mat, h=None):
    """Square/rect beam between two 3D points."""
    p0, p1 = Vector(p0), Vector(p1); d = (p1 - p0).normalized()
    up = Vector((0, 0, 1)) if abs(d.z) < 0.95 else Vector((1, 0, 0))
    s1 = d.cross(up).normalized() * (w / 2); s2 = d.cross(s1).normalized() * ((h or w) / 2)
    sec = lambda p: [p + s1 + s2, p - s1 + s2, p - s1 - s2, p + s1 - s2]
    mb.loft([sec(p0), sec(p1)], mat)

# =====================================================================
# GROUND: sidewalk, curbs, road, markings, quay apron, quay wall, water
# =====================================================================
X0, X1 = -100, 100
g = MB("Sidewalk"); g.box(X0, -6.0, -0.30, X1, 0.0, 0.0, "concrete_slab")
g.box(X0, 0.0, -0.30, X1, 60.0, -0.02, "concrete")        # yards/alleys behind facades
sidewalk = tag(g.build(), collider="mesh", surface="concrete")

c = MB("Curbs")
c.box(X0, -6.20, -0.45, X1, -6.0, 0.0, "stone_trim")
c.box(X0, -16.40, -0.45, X1, -16.20, -0.05, "stone_trim")
tag(c.build(), collider="mesh")

r = MB("Road")
r.box(X0, -16.20, -0.65, X1, -6.20, -0.15, "asphalt_wet")
x = X0 + 2
while x < X1 - 3:                                           # dashed centre line
    r.box(x, -11.28, -0.15, x + 3.0, -11.12, -0.147, "paint_white_line"); x += 9.0
r.box(X0, -7.0, -0.15, X1, -6.88, -0.147, "paint_white_line")          # edge line building side
for xb in range(-96, 100, 6):                                           # parking bay ticks water side
    r.box(xb - 0.06, -16.2, -0.15, xb + 0.06, -14.0, -0.147, "paint_white_line")
r.box(X0, -14.06, -0.15, X1, -13.94, -0.147, "paint_white_line")
tag(r.build(), collider="mesh", surface="asphalt_wet")

q = MB("Quay")
q.box(X0, -26.0, -2.6, X1, -16.40, -0.05, "concrete")
q.box(X0, -25.35, -0.05, X1, -25.2, -0.047, "paint_yellow_line")
for xf in range(-96, 100, 6):                                           # timber fenders on quay face
    q.box(xf - 0.2, -26.35, -2.55, xf + 0.2, -26.0, -0.2, "timber_weathered")
q.box(X0, -26.12, -0.35, X1, -26.0, -0.05, "iron_black")                # steel edge angle
tag(q.build(), collider="mesh", surface="concrete")

bl = MB("Mooring_Bollards")
for xb in range(-90, 100, 12):
    bl.cyl((xb, -25.6, -0.05), (0, 0, 1), 0.22, 0.55, "iron_black", seg=20)
    bl.cyl((xb, -25.6, 0.50), (0, 0, 1), 0.32, 0.10, "iron_black", seg=20)
tag(bl.build(smooth=True), collider="mesh")

w = MB("Water")
w.box(-260, -260, -3.0, 260, -26.0, -2.6, "water", mats={'bottom': None})
tag(w.build(), collider="none", surface="water")

# =====================================================================
# WAREHOUSES (brick, recessed windows, varied heights and widths)
# =====================================================================
WIN_FRAME = ["steel_black", "paint_green", "paint_oxblood", "steel_paint"]

def window(mb, xa, xb, za, zb, yf, frame, lit_p=0.18, warm=True, panes=(2, 3)):
    gm = ("window_lit_warm" if warm else "window_lit") if R.random() < lit_p else "glass_dark"
    yg = yf + 0.28
    mb.box(xa, yg, za, xb, yg + 0.02, zb, gm)
    t = 0.06
    mb.box(xa, yg - 0.04, za, xb, yg + 0.02, za + t, frame); mb.box(xa, yg - 0.04, zb - t, xb, yg + 0.02, zb, frame)
    mb.box(xa, yg - 0.04, za, xa + t, yg + 0.02, zb, frame); mb.box(xb - t, yg - 0.04, za, xb, yg + 0.02, zb, frame)
    nx, nz = panes
    for i in range(1, nx):
        xm = xa + (xb - xa) * i / nx; mb.box(xm - 0.018, yg - 0.03, za, xm + 0.018, yg, zb, frame)
    for k in range(1, nz):
        zm = za + (zb - za) * k / nz; mb.box(xa, yg - 0.03, zm - 0.018, xb, yg, zm + 0.018, frame)
    mb.box(xa - 0.08, yf - 0.07, za - 0.09, xb + 0.08, yg, za, "stone_trim")        # sill
    mb.box(xa - 0.12, yf - 0.02, zb, xb + 0.12, yf + 0.44, zb + 0.24, "stone_trim")  # lintel

def warehouse(name, x0, x1, depth, floors, brick, ground="plain", setback=0.0, fh=4.0, gh=4.6,
              frame=None, cornice=True, roof_bits=True, lit_p=0.18):
    mb = MB(name); yf = setback; W = x1 - x0
    H = gh + (floors - 1) * fh; T = 0.45
    frame = frame or R.choice(WIN_FRAME)
    # back mass (sides + back + roof)
    mb.box(x0, yf + T, 0, x1, yf + depth, H, brick, mats={'top': "tar_roof", 'bottom': None, 'front': None})
    # parapet around roof
    P = 1.0
    mb.box(x0, yf + depth - 0.35, H, x1, yf + depth, H + P, brick)
    mb.box(x0, yf, H, x0 + 0.35, yf + depth, H + P, brick)
    mb.box(x1 - 0.35, yf, H, x1, yf + depth, H + P, brick)
    mb.box(x0, yf, H, x1, yf + T, H + P, brick)
    mb.box(x0 - 0.05, yf - 0.06, H + P, x1 + 0.05, yf + T + 0.05, H + P + 0.12, "stone_trim")   # coping
    if cornice:
        mb.box(x0 - 0.05, yf - 0.32, H - 0.35, x1 + 0.05, yf + T, H - 0.05, "stone_trim")
        mb.box(x0 - 0.05, yf - 0.20, H - 0.55, x1 + 0.05, yf + T, H - 0.35, brick)
    # upper floors: spandrel/header bands + piers + windows
    n = max(3, int(round(W / 3.4))); ww = min(1.6, W / n * 0.48)
    pier = (W - n * ww) / (n + 1)
    for fl in range(1, floors):
        za = gh + (fl - 1) * fh; sill = 0.95; wh = fh - sill - 0.75
        mb.box(x0, yf, za, x1, yf + T, za + sill, brick)
        mb.box(x0, yf, za + sill + wh, x1, yf + T, za + fh, brick)
        for i in range(n + 1):
            xa = x0 + i * (pier + ww)
            mb.box(xa, yf, za + sill, xa + pier, yf + T, za + sill + wh, brick)
        for i in range(n):
            xa = x0 + pier + i * (pier + ww)
            window(mb, xa, xa + ww, za + sill, za + sill + wh, yf, frame, lit_p=lit_p)
        if fl == 1:   # string course above ground floor
            mb.box(x0 - 0.02, yf - 0.12, za - 0.05, x1 + 0.02, yf + T, za + 0.15, "stone_trim")
    # ground floor
    if ground == "plain":
        mb.box(x0, yf, 0, x1, yf + T, 1.2, brick); mb.box(x0, yf, 3.6, x1, yf + T, gh, brick)
        for i in range(n + 1):
            xa = x0 + i * (pier + ww); mb.box(xa, yf, 1.2, xa + pier, yf + T, 3.6, brick)
        for i in range(n):
            xa = x0 + pier + i * (pier + ww); window(mb, xa, xa + ww, 1.2, 3.6, yf, frame, lit_p=lit_p * 0.5)
    elif ground == "loading":
        bays = 2; bw = 3.6; gap = (W - bays * bw) / (bays + 1)
        mb.box(x0, yf, 4.0, x1, yf + T, gh, brick)
        for i in range(bays + 1):
            xa = x0 + i * (gap + bw); mb.box(xa, yf, 0, xa + gap, yf + T, 4.0, brick)
        for i in range(bays):
            xa = x0 + gap + i * (gap + bw)
            mb.box(xa, yf + 0.30, 0, xa + bw, yf + 0.36, 4.0, "roller_shutter")
            for k in range(1, 40): mb.box(xa, yf + 0.27, k * 0.1, xa + bw, yf + 0.30, k * 0.1 + 0.025, "roller_shutter")
            mb.box(xa - 0.1, yf - 0.05, 4.0, xa + bw + 0.1, yf + T, 4.25, "steel_black")     # steel lintel
            mb.box(xa - 0.12, yf - 0.12, 0, xa, yf + 0.1, 1.0, "paint_yellow_line")           # bump guards
            mb.box(xa + bw, yf - 0.12, 0, xa + bw + 0.12, yf + 0.1, 1.0, "paint_yellow_line")
    return mb, H

def roof_details(mb, x0, x1, yf, depth, H, kind):
    cx = (x0 + x1) / 2
    if kind == "tank":
        for dx in (-1.2, 1.2):
            for dy in (-1.2, 1.2):
                mb.box(cx + dx - 0.1, yf + 8 + dy - 0.1, H, cx + dx + 0.1, yf + 8 + dy + 0.1, H + 3.0, "timber_weathered")
        mb.cyl((cx, yf + 8, H + 3.0), (0, 0, 1), 1.8, 3.2, "timber_weathered", seg=20)
        mb.cyl((cx, yf + 8, H + 6.2), (0, 0, 1), 1.85, 0.9, "tar_roof", seg=20, r2=0.05)
    if kind in ("ac", "tank"):
        for i in range(3):
            mb.box(x0 + 3 + i * 2.6, yf + depth - 6, H, x0 + 5 + i * 2.6, yf + depth - 4.6, H + 1.3, "steel_paint")
    if kind == "stair":
        mb.box(x1 - 6, yf + depth - 7, H, x1 - 2.5, yf + depth - 2.5, H + 3.0, "brick_dark")
        mb.box(x1 - 6.2, yf + depth - 7.2, H + 3.0, x1 - 2.3, yf + depth - 2.3, H + 3.15, "stone_trim")
    for i in range(2):     # vent stacks
        mb.cyl((x0 + 2 + i * 1.3, yf + depth - 2, H), (0, 0, 1), 0.12, 2.2, "steel_paint", seg=12)

def shopfront(mb, x0, x1, yf, sign_text, awning, glow, door_left=True, sign_mat="sign_warm"):
    """Ground floor shop: piers, glazing with mullions, door, awning, lit sign."""
    T = 0.45
    mb.box(x0, yf, 3.6, x1, yf + T, 4.6, "paint_navy" if awning == "awning_navy" else "paint_green")   # fascia
    mb.box(x0, yf, 0, x0 + 0.6, yf + T, 3.6, "stone_trim"); mb.box(x1 - 0.6, yf, 0, x1, yf + T, 3.6, "stone_trim")
    mb.box(x0 + 0.6, yf + 0.25, 0, x1 - 0.6, yf + 0.45, 0.6, "paint_navy" if awning == "awning_navy" else "paint_green")  # stall riser
    mb.box(x0 + 0.6, yf + 0.33, 0.6, x1 - 0.6, yf + 0.35, 3.6, glow)                       # lit glazing
    nb = max(3, int((x1 - x0) / 2.2))
    for i in range(nb + 1):
        xm = x0 + 0.6 + (x1 - x0 - 1.2) * i / nb
        mb.box(xm - 0.04, yf + 0.25, 0.6, xm + 0.04, yf + 0.33, 3.6, "steel_black")
    mb.box(x0 + 0.6, yf + 0.25, 2.75, x1 - 0.6, yf + 0.33, 2.82, "steel_black")
    mb.box(x0 + 0.6, yf + 0.25, 0.6, x1 - 0.6, yf + 0.33, 0.66, "steel_black")
    dx = x0 + 1.0 if door_left else x1 - 2.1                                                # recessed door
    mb.box(dx, yf + 0.36, 0, dx + 1.1, yf + 0.40, 2.6, "door_metal")
    mb.box(dx + 0.1, yf + 0.34, 0.9, dx + 1.0, yf + 0.36, 2.4, glow)
    # awning (sloped) + brackets
    aw0, aw1 = x0 + 0.5, x1 - 0.5
    pts0 = [Vector((aw0, yf, 3.55)), Vector((aw1, yf, 3.55)), Vector((aw1, yf - 1.6, 2.95)), Vector((aw0, yf - 1.6, 2.95))]
    pts1 = [p + Vector((0, 0, 0.04)) for p in pts0]
    mb.loft([pts0, pts1], awning)
    mb.box(aw0, yf - 1.62, 2.70, aw1, yf - 1.58, 2.99, awning)                               # valance
    # lit sign: dark board + emissive letters
    sw = min(len(sign_text) * 0.42 + 0.8, x1 - x0 - 1.6)
    cx = (x0 + x1) / 2
    mb.box(cx - sw / 2, yf - 0.12, 3.75, cx + sw / 2, yf, 4.45, "sign_board")
    return text(f"Sign_{sign_text.replace(' ', '_')}", sign_text, 0.42, (cx, yf - 0.125, 3.88), sign_mat, extrude=0.02)

BUILD = []
def place_building(name, x0, x1, depth, floors, brick, ground, setback, roof, shop=None, **kw):
    mb, H = warehouse(name, x0, x1, depth, floors, brick, ground=ground, setback=setback, **kw)
    roof_details(mb, x0, x1, setback, depth, H, roof)
    sign = None
    if shop: sign = shopfront(mb, x0, x1, setback, *shop)
    o = tag(mb.build(), collider="mesh", role="building")
    if sign: set_parent(sign, o)
    BUILD.append((name, x0, x1, H))
    return o, H

place_building("Warehouse_West_End",  -100, -71.0, 26, 5, "brick_dark", "loading", 0.5, "stair")
place_building("Warehouse_Ropewalk",  -70.6, -53.0, 22, 4, "brick_red", "plain", 0.0, "ac", fh=4.2)
place_building("Warehouse_Bonded",    -52.6, -34.0, 30, 6, "brick_buff", "loading", 0.3, "tank", fh=3.9)
place_building("Coffee_Building",     -33.6, -11.6, 24, 6, "brick_red", "shop", 0.0, "ac", fh=3.8,
               shop=("QUAYSIDE COFFEE", "awning_green", "window_lit_warm", False, "sign_warm"))
place_building("Chandlery_Building",   11.6,  30.0, 22, 4, "brick_buff", "shop", 0.0, "stair", fh=4.3,
               shop=("MERCER CHANDLERY", "awning_navy", "window_lit_warm", True, "sign_cool"))
place_building("Warehouse_Cooperage",  30.4,  52.0, 28, 6, "brick_dark", "loading", 0.6, "tank", fh=3.9)
place_building("Warehouse_Sailloft",   52.4,  68.0, 20, 3, "brick_red", "plain", 0.2, "ac", fh=4.4)

# =====================================================================
# GATE HOUSE + palisade fence + yard
# =====================================================================
gh = MB("GateHouse")
gx0, gx1 = 69.5, 74.5
gh.box(gx0, 1.0, 0, gx1, 5.0, 3.0, "plaster_white", mats={'bottom': None})
gh.box(gx0 - 0.6, 0.2, 3.0, gx1 + 0.6, 5.6, 3.25, "steel_black")                      # flat roof slab
for xa in (gx0 + 0.5, gx0 + 2.7):
    gh.box(xa, 0.97, 1.0, xa + 1.8, 1.0, 2.5, "window_lit")
gh.box(gx1 - 0.03, 1.6, 1.0, gx1, 4.4, 2.5, "window_lit")
gh.box(gx0 + 0.5, 0.92, 0.0, gx0 + 2.3, 1.0, 0.95, "plaster_white")
gh.box(gx0 + 1.0, 0.75, 3.28, gx1 - 1.0, 0.95, 3.9, "sign_board")
gate_house = tag(gh.build(), collider="mesh", role="building")
set_parent(text("Sign_GATE_3", "GATE 3", 0.42, ((gx0 + gx1) / 2, 0.74, 3.37), "sign_cool", extrude=0.02), gate_house)
light("GateHouse_Light", 'POINT', ((gx0 + gx1) / 2, -0.5, 2.8), color='#dbe7ff', energy=150, radius=0.2)

fe = MB("Yard_Fence")
fy = 0.4
x = 75.5
while x < 100:
    if not (77.0 < x < 85.0):                       # vehicle gate opening
        fe.box(x, fy, 0, x + 0.04, fy + 0.04, 2.4, "steel_black")
    x += 0.16
for xa, xb in ((75.5, 77.0), (85.0, 100)):
    for z in (0.15, 2.2):
        fe.box(xa, fy - 0.02, z, xb, fy + 0.06, z + 0.06, "steel_black")
tag(fe.build(), collider="box", role="fence")
# barrier arm (red/white) — separate object, pivots at post
bp = MB("Gate_Barrier_Post"); bp.box(76.4, -0.1, 0, 76.9, 0.4, 1.1, "steel_paint"); tag(bp.build(), collider="box")
ba = MB("Gate_Barrier_Arm")
for i in range(8):
    ba.box(76.9 + i * 1.0, 0.08, 0.95, 77.9 + i * 1.0, 0.18, 1.05, "ship_red" if i % 2 == 0 else "plastic_white")
tag(ba.build(origin=(76.65, 0.13, 1.0)), role="barrier", hinge="y", open_deg=80)
light("Yard_Light", 'POINT', (88, 10, 6), color='#ffb060', energy=900, radius=0.3)

# =====================================================================
# HARBOR TOWER — curtain wall shell, lobby glazing, entrance, HARBOR sign
# =====================================================================
TX0, TX1, TY0, TY1 = -11.0, 11.0, 0.0, 18.0
LOBBY_H, FH, NFL = 5.0, 3.8, 14
TOP = LOBBY_H + (NFL - 1) * FH          # 54.4
LY = 0.8                                  # lobby glass line

tw = MB("Harbor_Tower")
# core floor slabs edges + floor bands (visible spandrels)
bays_x = 14; bx = (TX1 - TX0) / bays_x
bays_y = 12; by = (TY1 - TY0) / bays_y
lit_floors = {3: .5, 6: .25, 9: .35, 13: .4, 14: .6}
for fl in range(2, NFL + 1):
    z0 = LOBBY_H + (fl - 2) * FH
    lp = lit_floors.get(fl, 0.08)
    # four faces
    for face in ("S", "N", "W", "E"):
        nb = bays_x if face in "SN" else bays_y
        for i in range(nb):
            if face in "SN":
                xa = TX0 + i * bx; xb = xa + bx
                yy0 = TY0 if face == "S" else TY1 - 0.05
                tw.box(xa, yy0, z0, xb, yy0 + 0.05, z0 + 0.9, "steel_paint")               # spandrel
                tw.box(xa, yy0, z0 + 0.9, xb, yy0 + 0.05, z0 + FH,
                       "glass_tint" if fl == 14 else ("window_lit" if R.random() < lp else "glass_dark"))
            else:
                ya = TY0 + i * by; yb = ya + by
                xx0 = TX0 if face == "W" else TX1 - 0.05
                tw.box(xx0, ya, z0, xx0 + 0.05, yb, z0 + 0.9, "steel_paint")
                tw.box(xx0, ya, z0 + 0.9, xx0 + 0.05, yb, z0 + FH,
                       "glass_tint" if fl == 14 else ("window_lit" if R.random() < lp * 0.6 else "glass_dark"))
    # horizontal transoms (protruding)
    for zz in (z0, z0 + 0.9):
        tw.box(TX0 - 0.10, TY0 - 0.10, zz - 0.04, TX1 + 0.10, TY0 + 0.06, zz + 0.04, "steel_black")
        tw.box(TX0 - 0.10, TY1 - 0.06, zz - 0.04, TX1 + 0.10, TY1 + 0.10, zz + 0.04, "steel_black")
        tw.box(TX0 - 0.10, TY0, zz - 0.04, TX0 + 0.06, TY1, zz + 0.04, "steel_black")
        tw.box(TX1 - 0.06, TY0, zz - 0.04, TX1 + 0.10, TY1, zz + 0.04, "steel_black")
# vertical mullion fins full height above lobby
for i in range(bays_x + 1):
    xm = TX0 + i * bx
    d = 0.32 if i % 2 == 0 else 0.14
    tw.box(xm - 0.04, TY0 - d, LOBBY_H, xm + 0.04, TY0 + 0.05, TOP, "steel_black")
    tw.box(xm - 0.04, TY1 - 0.05, LOBBY_H, xm + 0.04, TY1 + d, TOP, "steel_black")
for i in range(bays_y + 1):
    ym = TY0 + i * by
    tw.box(TX0 - 0.14, ym - 0.04, LOBBY_H, TX0 + 0.05, ym + 0.04, TOP, "steel_black")
    tw.box(TX1 - 0.05, ym - 0.04, LOBBY_H, TX1 + 0.14, ym + 0.04, TOP, "steel_black")
# crown + roof + mechanical penthouse
tw.box(TX0 - 0.15, TY0 - 0.35, TOP, TX1 + 0.15, TY1 + 0.35, TOP + 2.2, "steel_black")
tw.box(TX0 + 0.3, TY0 + 0.3, TOP - 0.2, TX1 - 0.3, TY1 - 0.3, TOP + 0.4, "tar_roof")
tw.box(-6, 5, TOP, 6, 14, TOP + 4.0, "steel_paint")
for i in range(8):
    tw.box(-5.8 + i * 1.5, 4.9, TOP + 0.5, -5.2 + i * 1.5, 5.0, TOP + 3.6, "steel_black")    # louvres
# lobby level structure: slab edge over lobby, columns, side walls (stone), back wall
tw.box(TX0 - 0.1, TY0 - 0.1, LOBBY_H - 0.45, TX1 + 0.1, TY1 + 0.1, LOBBY_H, "steel_black")
for xc in (TX0, -5.5, 5.5, TX1):
    tw.box(xc - 0.35 if xc != TX1 else xc - 0.7, TY0, 0, xc + 0.35 if xc != TX0 else xc + 0.7, TY0 + 0.7, LOBBY_H - 0.45, "stone_trim")
tw.box(TX0, TY0 + 0.7, 0, TX0 + 0.35, TY1, LOBBY_H - 0.45, "stone_trim")                 # west wall
tw.box(TX1 - 0.35, TY0 + 0.7, 0, TX1, TY1, LOBBY_H - 0.45, "stone_trim")                 # east wall
tw.box(TX0, TY1 - 0.35, 0, TX1, TY1, LOBBY_H - 0.45, "stone_trim")                        # north wall
tower = tag(tw.build(), collider="mesh", role="building", name_display="Harbor Tower")

# ---- lobby front glazing (fixed lites) ----
lg = MB("Lobby_Glazing")
def glazing(xa, xb):
    lg.box(xa, LY - 0.02, 0.05, xb, LY, LOBBY_H - 0.5, "glass_clear")
    nb = max(1, int(round((xb - xa) / 1.6)))
    for i in range(nb + 1):
        xm = xa + (xb - xa) * i / nb
        lg.box(xm - 0.04, LY - 0.10, 0, xm + 0.04, LY + 0.06, LOBBY_H - 0.45, "steel_black")
    for zz in (0.0, 3.05, LOBBY_H - 0.55):
        lg.box(xa, LY - 0.10, zz, xb, LY + 0.06, zz + 0.1, "steel_black")
glazing(TX0 + 0.35, -1.5)
glazing(1.5, TX1 - 0.35)
# entrance frame: left jamb, right jamb pier (badge reader mounts here), transom with glass above
lg.box(-1.5, LY - 0.12, 0, -1.25, LY + 0.10, 3.05, "steel_black")
lg.box(1.25, LY - 0.12, 0, 1.5, LY + 0.10, 3.05, "metal_brushed")
lg.box(-1.5, LY - 0.12, 2.75, 1.5, LY + 0.10, 3.05, "steel_black")
lg.box(-1.5, LY - 0.02, 3.05, 1.5, LY, LOBBY_H - 0.5, "glass_clear")
lg.box(-1.25, LY - 0.06, -0.01, 1.25, LY + 0.06, 0.012, "metal_brushed")                     # threshold
tag(lg.build(), collider="mesh", role="glazing")

set_parent(text("HARBOR_Sign", "HARBOR", 0.36, (0, LY - 0.025, 3.14), "paper_white", extrude=0.004), tower)

# ---- entrance canopy ----
cp = MB("Entrance_Canopy")
cp.box(-3.2, -1.9, 3.6, 3.2, LY, 3.78, "steel_black")
for xx in (-2.0, 0.0, 2.0):
    cp.cyl((xx, -0.6, 3.598), (0, 0, -1), 0.09, 0.004, "downlight", seg=16)
for xr in (-3.0, 3.0):
    beam(cp, (xr, LY, 4.4), (xr, -1.7, 3.78), 0.04, "chrome")                                    # tie rods
tag(cp.build(), collider="none")
light("Canopy_Light_A", 'SPOT', (-1.0, -0.6, 3.55), color='#ffe6c4', energy=180, spot_deg=100)
light("Canopy_Light_B", 'SPOT', (1.0, -0.6, 3.55), color='#ffe6c4', energy=180, spot_deg=100)

# ---- glass double doors (separate, hinged, swing in) ----
def door_leaf(name, x_hinge, sgn):
    m = MB(name); xa, xb = sorted((x_hinge, x_hinge + sgn * 1.2))
    m.box(xa, LY - 0.03, 0.02, xb, LY + 0.03, 2.72, None, mats={})                             # placeholder none
    m.f.clear()
    m.box(xa + 0.07, LY - 0.012, 0.15, xb - 0.07, LY + 0.012, 2.62, "glass_clear")
    m.box(xa, LY - 0.03, 0.02, xb, LY + 0.03, 0.15, "steel_black")
    m.box(xa, LY - 0.03, 2.62, xb, LY + 0.03, 2.72, "steel_black")
    m.box(xa, LY - 0.03, 0.15, xa + 0.07, LY + 0.03, 2.62, "steel_black")
    m.box(xb - 0.07, LY - 0.03, 0.15, xb, LY + 0.03, 2.62, "steel_black")
    hx = xb - 0.16 if sgn > 0 else xa + 0.16                                                     # pull handles both sides
    for yo in (-0.09, 0.09):
        m.cyl((hx, LY + yo, 0.75), (0, 0, 1), 0.016, 1.2, "chrome", seg=12)
        m.box(hx - 0.01, min(LY, LY + yo), 0.85, hx + 0.01, max(LY, LY + yo), 0.87, "chrome")
        m.box(hx - 0.01, min(LY, LY + yo), 1.83, hx + 0.01, max(LY, LY + yo), 1.85, "chrome")
    o = m.build(origin=(x_hinge, LY, 0))
    return tag(o, role="door", hinge="z", open_deg=(90 if sgn > 0 else -90), collider="box",
               note="swings inward (+Y Blender / -Z glTF)")
door_leaf("Lobby_Door_L", -1.2, +1)
door_leaf("Lobby_Door_R", 1.2, -1)

# ---- badge reader on right jamb (outside face) ----
br = MB("BadgeReader")
br.box(1.315, LY - 0.165, 1.02, 1.435, LY - 0.12, 1.22, "plastic_black")
br.box(1.33, LY - 0.170, 1.04, 1.42, LY - 0.165, 1.15, "plastic_grey")                         # card tap face
reader = tag(br.build(), role="badge_reader", collider="box")
for state, mat_ in (("Off", "plastic_grey"), ("Red", "led_red"), ("Green", "led_green")):
    lm = MB(f"BadgeReader_LED_{state}")
    lm.box(1.365, LY - 0.174, 1.175, 1.385, LY - 0.165, 1.195, mat_)
    o = tag(lm.build(), role="badge_led", state=state.lower(), default_visible=(state == "Off"))
    set_parent(o, reader)

# =====================================================================
# LOBBY INTERIOR
# =====================================================================
lb = MB("Lobby_Interior")
lb.box(TX0 + 0.35, LY, -0.2, TX1 - 0.35, TY1 - 0.35, 0.0, "granite_polished")                 # floor
lb.box(TX0 + 0.35, LY, LOBBY_H - 0.55, TX1 - 0.35, TY1 - 0.35, LOBBY_H - 0.45, "plaster_white")  # ceiling
for ix in range(-4, 5, 2):
    for iy in range(3, 16, 3):
        lb.cyl((ix * 1.9, iy, LOBBY_H - 0.552), (0, 0, -1), 0.08, 0.004, "downlight", seg=16)
# west feature wall: oak slats
for i in range(60):
    y0 = 2.0 + i * 0.25
    lb.box(TX0 + 0.35, y0, 0.0, TX0 + 0.45, y0 + 0.16, LOBBY_H - 0.55, "wood_oak")
# east wall stone + bench
lb.box(TX1 - 2.0, 4.0, 0, TX1 - 0.35, 8.0, 0.45, "stone_trim")
lb.box(TX1 - 1.9, 4.05, 0.45, TX1 - 0.45, 7.95, 0.50, "wood_oak")
# planters with shrubs (low)
for px, py in ((-8.5, 2.0), (8.5, 2.0)):
    lb.box(px - 0.6, py - 0.6, 0, px + 0.6, py + 0.6, 0.7, "steel_black")
    lb.box(px - 0.55, py - 0.55, 0.62, px + 0.55, py + 0.55, 0.66, "soil")
    for k in range(9):
        a = k * 0.7; rr = 0.18 + (k % 3) * 0.12
        lb.cyl((px + math.cos(a) * rr, py + math.sin(a) * rr, 0.66), (0, 0, 1), 0.16, 0.35 + (k % 4) * 0.12, "plant_green", seg=8, r2=0.05)
# elevator lobby back wall: stone portals
lb.box(-4.0, TY1 - 0.55, 0, 4.0, TY1 - 0.35, LOBBY_H - 0.55, "granite_polished")
for ex in (-1.5, 1.5):                     # two cars: B (left, decorative) and A (right, interactive)
    lb.box(ex - 0.85, TY1 - 0.62, 0, ex - 0.7, TY1 - 0.55, 2.55, "metal_brushed")
    lb.box(ex + 0.7, TY1 - 0.62, 0, ex + 0.85, TY1 - 0.55, 2.55, "metal_brushed")
    lb.box(ex - 0.85, TY1 - 0.62, 2.4, ex + 0.85, TY1 - 0.55, 2.55, "metal_brushed")
    lb.box(ex - 0.3, TY1 - 0.60, 2.7, ex + 0.3, TY1 - 0.55, 2.86, "screen_on")              # floor indicator
lb.box(0.05, TY1 - 0.62, 1.0, 0.25, TY1 - 0.55, 1.35, "metal_brushed")                     # call panel
lb.cyl((0.15, TY1 - 0.62, 1.12), (0, -1, 0), 0.022, 0.01, "led_amber", seg=12)
lb.cyl((0.15, TY1 - 0.62, 1.24), (0, -1, 0), 0.022, 0.01, "metal_brushed", seg=12)
# floor rug at door
lb.box(-1.6, LY + 0.1, 0.0, 1.6, LY + 2.2, 0.012, "carpet")
tag(lb.build(smooth=False), collider="mesh", role="interior")

for ex, nm, inter in ((1.5, "A", True), (-1.5, "B", False)):
    for side, sgn in (("L", -1), ("R", 1)):
        ed = MB(f"Elevator_Lobby_{nm}_Door_{side}")
        xa = ex if sgn > 0 else ex - 0.7
        ed.box(xa, TY1 - 0.66, 0.0, xa + 0.7, TY1 - 0.62, 2.4, "metal_brushed")
        o = ed.build(origin=(ex, TY1 - 0.64, 0))
        tag(o, role="elevator_door", slide_axis="x", slide_dist=0.7 * sgn, interactive=inter, collider="box",
            elevator=nm, level="lobby")

# reception desk
rd = MB("Reception_Desk")
dx0, dx1, dy0, dy1 = -6.4, -2.4, 7.0, 7.8
rd.box(dx0, dy0, 0.0, dx1, dy0 + 0.06, 1.05, "wood_oak")                    # front fascia
rd.box(dx0, dy0, 0.0, dx0 + 0.06, dy1 + 0.6, 1.05, "wood_oak")             # returns
rd.box(dx1 - 0.06, dy0, 0.0, dx1, dy1 + 0.6, 1.05, "wood_oak")
rd.box(dx0 - 0.04, dy0 - 0.08, 1.05, dx1 + 0.04, dy0 + 0.34, 1.10, "granite_polished")  # transaction ledge
rd.box(dx0 + 0.06, dy0 + 0.3, 0.72, dx1 - 0.06, dy1 + 0.6, 0.76, "wood_oak")          # work surface
rd.box(dx0, dy0 - 0.02, 0.0, dx1, dy0, 0.1, "steel_black")                               # kick
rd.box(-4.85, dy0 - 0.03, 0.70, -3.95, dy0 - 0.005, 0.86, "sign_board")                 # RECEPTION plaque
rd.box(-3.6, dy0 + 0.75, 0.76, -3.1, dy0 + 0.79, 1.1, "screen_on", rot=0.3)            # monitor
rd.box(-3.42, dy0 + 0.78, 0.76, -3.28, dy0 + 0.85, 0.92, "plastic_black")
desk = tag(rd.build(), role="reception_desk", collider="box")
set_parent(text("Reception_Sign", "RECEPTION", 0.075, (-4.4, dy0 - 0.032, 0.745), "paper_white", extrude=0.002), desk)
ch = MB("Reception_Chair")
ch.cyl((-4.4, 8.9, 0.0), (0, 0, 1), 0.3, 0.05, "plastic_black", seg=5)
ch.cyl((-4.4, 8.9, 0.05), (0, 0, 1), 0.03, 0.4, "chrome", seg=10)
ch.box(-4.65, 8.65, 0.45, -4.15, 9.15, 0.53, "fabric_grey")
ch.box(-4.62, 9.10, 0.55, -4.18, 9.17, 1.05, "fabric_grey")
tag(ch.build(smooth=True), collider="box")

for i, (lx, ly) in enumerate(((-5, 4), (0, 4), (5, 4), (-5, 11), (0, 11), (5, 11))):
    light(f"Lobby_Light_{i}", 'POINT', (lx, ly, LOBBY_H - 0.8), color='#ffe3bf', energy=220, radius=0.3)

# =====================================================================
# STREET FURNITURE: sodium lamps, mast lights, hydrant, bins, bench
# =====================================================================
sf = MB("Street_Furniture")
LAMPS = [-84, -60, -38, -16, 16, 38, 60, 84]
for i, lx in enumerate(LAMPS):
    sf.cyl((lx, -5.5, 0), (0, 0, 1), 0.16, 0.5, "iron_black", seg=12)
    sf.cyl((lx, -5.5, 0.5), (0, 0, 1), 0.085, 7.3, "iron_black", seg=12, r2=0.065)
    beam(sf, (lx, -5.5, 7.6), (lx, -7.6, 7.85), 0.07, "iron_black")
    sf.box(lx - 0.22, -8.0, 7.62, lx + 0.22, -7.3, 7.92, "iron_black")
    sf.box(lx - 0.18, -7.95, 7.60, lx + 0.18, -7.35, 7.62, "sodium_lamp")
    light(f"Street_Sodium_{i}", 'SPOT', (lx, -7.65, 7.5), color='#ff9e45', energy=2600, spot_deg=125, radius=0.15)
for i, mx in enumerate((-44, 44)):
    sf.cyl((mx, -24.2, -0.05), (0, 0, 1), 0.22, 16, "steel_paint", seg=12, r2=0.14)
    sf.box(mx - 1.2, -24.4, 15.8, mx + 1.2, -24.0, 16.0, "steel_paint")
    for k, dx in enumerate((-0.9, 0.9)):
        sf.box(mx + dx - 0.3, -24.7, 15.6, mx + dx + 0.3, -24.1, 15.8, "sodium_lamp")
        light(f"Quay_Mast_{i}_{k}", 'SPOT', (mx + dx, -24.6, 15.5), color='#ffa04a', energy=9000, spot_deg=120,
              rot=(math.radians(-25), 0, 0), radius=0.2)
# hydrant
hx_, hy_ = 7.5, -5.3
sf.cyl((hx_, hy_, 0), (0, 0, 1), 0.13, 0.6, "ship_red", seg=16)
sf.cyl((hx_, hy_, 0.6), (0, 0, 1), 0.15, 0.12, "ship_red", seg=16, r2=0.06)
sf.cyl((hx_ - 0.2, hy_, 0.42), (1, 0, 0), 0.05, 0.4, "ship_red", seg=10)
# bins + bench
for bx_ in (-24.0, 26.0):
    sf.cyl((bx_, -5.4, 0), (0, 0, 1), 0.3, 0.95, "steel_black", seg=18)
    sf.cyl((bx_, -5.4, 0.95), (0, 0, 1), 0.32, 0.06, "steel_black", seg=18)
sf.box(-47.0, -1.4, 0.42, -45.0, -0.9, 0.47, "wood_oak")
sf.box(-47.0, -0.95, 0.47, -45.0, -0.88, 0.9, "wood_oak")
for xx in (-46.9, -45.1):
    sf.box(xx - 0.03, -1.4, 0, xx + 0.03, -0.9, 0.45, "iron_black")
# steel bollards at tower kerb
for bx_ in (-4.5, -3.0, 3.0, 4.5):
    sf.cyl((bx_, -5.2, 0), (0, 0, 1), 0.11, 0.95, "steel_black", seg=14)
# manhole + drain grates
for mx in (-30.0, 34.0):
    sf.cyl((mx, -10.0, -0.155), (0, 0, 1), 0.33, 0.01, "iron_black", seg=24)
for gx in range(-90, 100, 20):
    sf.box(gx - 0.45, -6.55, -0.152, gx + 0.45, -6.22, -0.145, "iron_black")
tag(sf.build(smooth=True), collider="mesh", role="street_furniture")

# =====================================================================
# PARKED CARS (water side bays) — same generator as the drivable sedan
# =====================================================================
make_car("hatch", "Parked_Hatch", loc=(-31.0, -15.1, -0.15), heading=math.radians(90))
make_car("suv", "Parked_SUV", loc=(24.5, -15.1, -0.15), heading=math.radians(-90))
make_car("sedan", "Parked_Sedan_White", loc=(49.0, -15.1, -0.15), heading=math.radians(90), paint="car_white")
make_car("sedan", "Company_Sedan_Navy", loc=(-12.5, -15.1, -0.15), heading=math.radians(90), headlights=True)

# =====================================================================
# QUAY CONTAINERS + SHIP M/V MERIDIAN + CRANE
# =====================================================================
CCOL = ["container_rust", "container_blue", "container_green", "container_grey"]
def container(mb, x0, y0, z0, mat, L=6.06, rot90=False):
    W, H = 2.44, 2.59
    sx, sy = (L, W) if not rot90 else (W, L)
    mb.box(x0, y0, z0, x0 + sx, y0 + sy, z0 + H, mat)
    # corner posts & rails (darker)
    for cx in (x0, x0 + sx - 0.12):
        for cy in (y0, y0 + sy - 0.12):
            mb.box(cx - 0.005, cy - 0.005, z0, cx + 0.125, cy + 0.125, z0 + H, "steel_paint")
    # door end locking bars
    if not rot90:
        for k in range(4):
            yy = y0 + 0.35 + k * 0.55
            mb.box(x0 + sx, yy, z0 + 0.15, x0 + sx + 0.03, yy + 0.04, z0 + H - 0.15, "steel_paint")

yc = MB("Quay_Containers")
for i, (x0_, n) in enumerate(((-88.0, 2), (-81.5, 1), (-75.0, 2))):
    for k in range(n):
        container(yc, x0_, -23.6, -0.05 + k * 2.6, CCOL[(i + k) % 4])
for i, (x0_, y0_, n) in enumerate(((80.0, 6.0, 3), (86.5, 6.0, 2), (80.0, 9.0, 1), (90.0, 14.0, 2))):
    for k in range(n):
        container(yc, x0_, y0_, -0.02 + k * 2.6, CCOL[(i * 3 + k) % 4])
tag(yc.build(), collider="mesh", role="containers")

# ---- ship hull (lofted) ----
SHIP_CY = -35.6; DECK = 3.0
def deck_z(x): return DECK + max(0.0, (x - 36) / 14) * 2.2
st = [(-50, 7.4, 0.50, -3.8), (-48.5, 8.1, 0.72, -7.0), (-45, 8.5, 0.92, -9.0), (24, 8.5, 0.94, -9.0),
      (32, 8.3, 0.86, -9.0), (39, 7.4, 0.66, -9.0), (44, 5.6, 0.42, -8.8), (48, 3.2, 0.18, -8.2),
      (50.5, 1.2, 0.05, -6.5), (51.3, 0.25, 0.02, -3.5)]
def interp_st(st, k=3):
    out = []
    for a, b in zip(st[:-1], st[1:]):
        for i in range(k): t = i / k; out.append(tuple(p + (q - p) * t for p, q in zip(a, b)))
    out.append(st[-1]); return out
def hull_sec(x, bd, bb, zk, n=10):
    zd = deck_z(x); pts = []
    # starboard deck edge -> down side -> bilge -> keel -> port bilge -> port side -> port deck edge
    side = [(bd, zd), (bd * 0.995, 0.0), (bd * 0.97, -4.0)]
    for i in range(n + 1):
        a = math.pi / 2 * i / n
        pts_y = bb * bd + (bd * 0.97 - bb * bd) * math.cos(a)
        pts_z = zk + (-4.0 - zk) * (1 - math.sin(a)) if False else (-4.0) + (zk - (-4.0)) * math.sin(a)
        side.append((pts_y, pts_z))
    side.append((0.0, zk))
    full = side + [(-y, z) for y, z in reversed(side[:-1])]
    return [(x, SHIP_CY + y, z) for y, z in full]
hs = interp_st(st, 4)
secs = [hull_sec(*s_) for s_ in hs]
def hull_mat(pts):
    zc = sum(p[2] for p in pts) / 4
    n = (Vector(pts[1]) - Vector(pts[0])).cross(Vector(pts[2]) - Vector(pts[0]))
    if n.length > 0 and abs(n.normalized().z) > 0.9 and zc > 2.0: return "steel_paint"
    if zc < -2.15: return "hull_antifoul"
    return "hull_paint"
sh = MB("Ship_MV_MERIDIAN")
# loop is open at the deck: close it by adding deck face per section strip
for sct in secs:
    pass
sh.loft(secs, hull_mat, close=True, cap=True, capmat="hull_paint")
# boot-top stripe (white) along both sides near waterline
for sx0 in range(-44, 24, 4):
    for sgn in (1, -1):
        y = SHIP_CY + sgn * (8.5 * 0.995 + 0.012)
        sh.box(sx0, min(y, y - sgn * 0.01), -2.3, sx0 + 4, max(y, y - sgn * 0.01), -1.9, "ship_white")
# hatch covers + containers stow
for i in range(11):
    bx0 = -31.5 + i * 6.4
    sh.box(bx0 - 0.15, SHIP_CY - 7.6, DECK, bx0 + 6.25, SHIP_CY + 7.6, DECK + 0.6, "steel_paint")
    tiers = R.choice([1, 2, 2, 3, 3, 2])
    for j in range(6):
        if R.random() < 0.12: continue
        hgt = max(1, tiers - (1 if R.random() < 0.3 else 0))
        for k in range(hgt):
            container(sh, bx0, SHIP_CY - 7.5 + j * 2.5, DECK + 0.6 + k * 2.6, R.choice(CCOL))
# accommodation block, bridge, funnel
ax0, ax1 = -47.5, -38.5
for k, (wd, z0) in enumerate(((7.2, DECK), (7.0, DECK + 2.8), (6.8, DECK + 5.6), (8.4, DECK + 8.4))):
    sh.box(ax0 + k * 0.3, SHIP_CY - wd, z0, ax1, SHIP_CY + wd, z0 + 2.8, "ship_white")
    nwin = 9
    for wi in range(nwin):
        yy = SHIP_CY - wd + 0.8 + wi * (2 * wd - 1.6) / (nwin - 1)
        sh.box(ax1, yy - 0.35, z0 + 1.0, ax1 + 0.03, yy + 0.35, z0 + 2.0,
               "window_lit_warm" if R.random() < 0.3 else "glass_dark")
    for xi in range(4):
        xx = ax0 + 1.2 + k * 0.3 + xi * 2.0
        for sgn in (1, -1):
            y = SHIP_CY + sgn * wd
            sh.box(xx, min(y, y + sgn * 0.03), z0 + 1.0, xx + 0.8, max(y, y + sgn * 0.03), z0 + 1.9,
                   "window_lit_warm" if R.random() < 0.25 else "glass_dark")
sh.box(ax1 - 0.05, SHIP_CY - 8.4, DECK + 10.2, ax1 + 0.04, SHIP_CY + 8.4, DECK + 10.9, "glass_dark")   # bridge windows band
sh.box(ax0 + 1.5, SHIP_CY - 1.8, DECK + 11.2, ax0 + 4.5, SHIP_CY + 1.8, DECK + 17.0, "steel_paint")    # funnel
sh.box(ax0 + 1.45, SHIP_CY - 1.85, DECK + 15.4, ax0 + 4.55, SHIP_CY + 1.85, DECK + 16.2, "ship_red")
beam(sh, (ax1 - 2.0, SHIP_CY, DECK + 11.2), (ax1 - 2.0, SHIP_CY, DECK + 16.5), 0.18, "ship_white")    # mast
sh.box(ax1 - 2.6, SHIP_CY - 0.05, DECK + 15.0, ax1 - 1.4, SHIP_CY + 0.05, DECK + 15.1, "ship_white")
# forecastle bulwark + mooring winch
sh.box(40, SHIP_CY - 6.5, deck_z(40), 41.0, SHIP_CY + 6.5, deck_z(40) + 1.2, "hull_paint")
sh.cyl((44, SHIP_CY - 2.0, deck_z(44)), (0, 1, 0), 0.6, 4.0, "steel_paint", seg=16)
ship = tag(sh.build(smooth=False), collider="mesh", role="ship", name_display="M/V MERIDIAN")
# name on the quay-facing side (+Y) at the bow, and on the stern transom
set_parent(text("Ship_Name_Bow", "MERIDIAN", 1.5, (26.0, SHIP_CY + 8.5 * 0.995 + 0.03, 0.2), "ship_white",
                rot=(math.radians(90), 0, math.radians(180)), extrude=0.03), ship)
set_parent(text("Ship_Name_Stern", "MERIDIAN", 1.1, (-50.05, SHIP_CY, 1.0), "ship_white",
                rot=(math.radians(90), 0, math.radians(-90)), extrude=0.03), ship)
nav = MB("Ship_NavLights")
nav.box(ax1 - 0.3, SHIP_CY + 8.3, DECK + 11.2, ax1, SHIP_CY + 8.45, DECK + 11.45, "led_green")   # starboard
nav.box(ax1 - 0.3, SHIP_CY - 8.45, DECK + 11.2, ax1, SHIP_CY - 8.3, DECK + 11.45, "led_red")     # port
nav.box(ax1 - 2.1, SHIP_CY - 0.1, DECK + 16.5, ax1 - 1.9, SHIP_CY + 0.1, DECK + 16.7, "downlight")
set_parent(nav.build(), ship)
light("Ship_Deck_Light", 'POINT', (ax1 + 1.5, SHIP_CY + 6, DECK + 9), color='#ffd9a0', energy=1200, radius=0.3)

# ---- portal crane (modest) ----
cr = MB("Quay_Crane")
CX, CYc = 64.0, -21.0
legs = [(CX - 3.5, -25.0), (CX + 3.5, -25.0), (CX - 3.5, -17.2), (CX + 3.5, -17.2)]
for lx, ly in legs:
    cr.box(lx - 0.6, ly - 0.4, -0.05, lx + 0.6, ly + 0.4, 0.6, "crane_yellow")             # bogie
    for k in range(3): cr.cyl((lx - 0.4 + k * 0.4, ly - 0.42, 0.25), (0, 1, 0), 0.22, 0.84, "iron_black", seg=12)
    beam(cr, (lx, ly, 0.6), (CX + (lx - CX) * 0.35, CYc + (ly - CYc) * 0.45, 9.0), 0.55, "crane_yellow")
cr.box(CX - 2.4, CYc - 2.6, 9.0, CX + 2.4, CYc + 2.6, 9.8, "crane_yellow")                   # portal deck
for a, b in ((0, 1), (2, 3), (0, 2), (1, 3)):
    pa, pb = Vector((*legs[a], 3.5)), Vector((*legs[b], 3.5))
    beam(cr, pa.lerp(Vector((CX, CYc, 3.5)), 0.12), pb.lerp(Vector((CX, CYc, 3.5)), 0.12), 0.3, "crane_yellow")
cr.cyl((CX, CYc, 9.8), (0, 0, 1), 1.6, 0.8, "steel_paint", seg=24)                           # slew ring
cr.box(CX - 2.0, CYc - 0.5, 10.6, CX + 2.4, CYc + 4.2, 13.8, "crane_yellow")                 # machinery house
cr.box(CX - 1.4, CYc - 1.6, 10.6, CX + 0.4, CYc - 0.5, 12.6, "crane_yellow")                 # cab
cr.box(CX - 1.42, CYc - 1.62, 11.4, CX + 0.42, CYc - 1.58, 12.4, "glass_dark")
cr.box(CX - 1.8, CYc + 3.6, 10.6, CX + 2.2, CYc + 5.6, 12.4, "concrete")                     # counterweight
# A-frame
for dx in (-1.0, 1.0):
    beam(cr, (CX + dx, CYc + 3.6, 13.8), (CX + dx * 0.4, CYc + 1.0, 21.0), 0.35, "crane_yellow")
    beam(cr, (CX + dx, CYc - 0.3, 13.8), (CX + dx * 0.4, CYc + 1.0, 21.0), 0.35, "crane_yellow")
# boom lattice toward the ship (-Y), angled up
B0 = Vector((CX, CYc - 0.6, 11.5)); B1 = Vector((CX, CYc - 22.0, 30.0))
for dx, dz in ((-0.7, 0.5), (0.7, 0.5), (-0.7, -0.5), (0.7, -0.5)):
    beam(cr, B0 + Vector((dx, 0, dz)), B1 + Vector((dx * 0.4, 0, dz * 0.5)), 0.18, "crane_yellow")
for k in range(12):
    t0, t1 = k / 12, (k + 1) / 12
    p0, p1 = B0.lerp(B1, t0), B0.lerp(B1, t1)
    for dx in (-0.7, 0.7):
        beam(cr, p0 + Vector((dx * (1 - 0.6 * t0), 0, 0.5 * (1 - 0.5 * t0))), p1 + Vector((dx * (1 - 0.6 * t1), 0, -0.5 * (1 - 0.5 * t1))), 0.07, "crane_yellow")
    beam(cr, p0 + Vector((-0.7 * (1 - 0.6 * t0), 0, -0.5 * (1 - 0.5 * t0))), p0 + Vector((0.7 * (1 - 0.6 * t0), 0, 0.5 * (1 - 0.5 * t0))), 0.07, "crane_yellow")
beam(cr, (CX, CYc + 1.0, 21.0), B1 + Vector((0, 0, 0.5)), 0.05, "iron_black")                 # luffing stays
beam(cr, (CX, CYc + 1.0, 21.0), (CX, CYc + 4.6, 12.4), 0.05, "iron_black")
beam(cr, B1, B1 - Vector((0, 0, 18.0)), 0.025, "iron_black")                                 # hoist rope
cr.box(B1.x - 0.4, B1.y - 0.3, B1.z - 19.2, B1.x + 0.4, B1.y + 0.3, B1.z - 18.0, "crane_yellow")  # hook block
cr.box(CX - 0.2, CYc - 1.65, 12.62, CX + 0.2, CYc - 1.25, 12.8, "led_amber")                  # beacon
tag(cr.build(), collider="mesh", role="crane")

# =====================================================================
# EXPORT
# =====================================================================
print("TRIANGLES", stats())
print("OBJECTS", len(bpy.data.objects))
export(f"{OUT}/harbor_block.glb")

if RENDER:
    cam = setup_render(night=True, res=(1400, 800), samples=24)
    # faint moonlight so silhouettes read
    light("Moon", 'SUN', (0, 0, 50), color='#9db4ff', energy=0.06, rot=(math.radians(50), 0, math.radians(-140)))
    which = sys.argv[sys.argv.index("--render") + 1] if len(sys.argv) > sys.argv.index("--render") + 1 else "all"
    shots = {
        "street": ((-9.0, -12.5, 1.7), (1.5, 2.0, 4.5), 24),
        "door": ((1.2, -4.8, 1.65), (0.3, 1.0, 1.6), 30),
        "overview": ((-55.0, -70.0, 28.0), (5.0, -8.0, 8.0), 24),
        "lobby": ((-6.5, 2.0, 1.7), (1.0, 14.0, 1.4), 20),
        "quay": ((30.0, -20.5, 2.0), (-10.0, -36.0, 6.0), 24),
    }
    for nm, (pos, tgt, lens) in shots.items():
        if which in ("all", nm):
            shoot(cam, pos, tgt, f"{OUT}/block_{nm}.png", lens=lens)
