"""Tidewater cafe (Thursday) and the home (Thursday night, Saturday): modeled, Cycles-baked rooms.

    python3 build_rooms.py cafe|home [--samples N] [--resdiv N] [--render]

Blender coords (x east, y north, z up), room centered on the origin, floor at z = 0. glTF: x, y = z, z = -y.
Writes out/baked/harbor_<room>_baked.glb + harbor_<room>_lm.jpg, the same lightmap format as the tower.
Interactive spots are exported as empties named Spot_* (glTF extras: role = "spot") so the game reads positions.
"""
import sys, math, random
sys.path.insert(0, '/home/claude/harbor')
import bpy
from lib2 import *
import lib
import bake_lighting as bk

ROOM = next((a for a in sys.argv[1:] if a in ("cafe", "home")), "cafe")
RENDER = "--render" in sys.argv
R = random.Random(21)

lib.PLAIN.update({
    "brick_paint":  dict(color='#7a4636', rough=0.85),
    "duct":         dict(color='#5b5f63', metal=0.7, rough=0.45),
    "ceiling_dark": dict(color='#22252a', rough=0.9),
    "ceiling_white": dict(color='#e6e3dc', rough=0.85),
    "wood_walnut":  dict(color='#4a3222', rough=0.5),
    "wood_light":   dict(color='#b08a5e', rough=0.55),
    "tile_white":   dict(color='#e8e6e0', rough=0.2),
    "tile_floor":   dict(color='#8d8a83', rough=0.6),
    "marble":       dict(color='#e2ddd3', rough=0.2),
    "steel_satin":  dict(color='#a9adb1', metal=1.0, rough=0.3),
    "cabinet_sage": dict(color='#7f8f7c', rough=0.55),
    "cabinet_white": dict(color='#e8e5dd', rough=0.5),
    "fabric_rust":  dict(color='#8b4a2f', rough=0.9),
    "fabric_olive": dict(color='#5a5a3a', rough=0.9),
    "fabric_cream": dict(color='#cfc6b4', rough=0.9),
    "rug_blue":     dict(color='#2f3c52', rough=0.95),
    "book_a": dict(color='#6b2b2b', rough=0.7), "book_b": dict(color='#2b4a6b', rough=0.7),
    "book_c": dict(color='#c9b27a', rough=0.7), "book_d": dict(color='#2f5a3c', rough=0.7),
    "glass_jar":    dict(color='#cfd8d4', rough=0.05, trans=1.0),
    "pastry":       dict(color='#c48a45', rough=0.6),
    "bulb_warm":    dict(color='#ffe1b0', rough=0.3, emit='#ffcf8a', estr=10.0),
    "shade_black":  dict(color='#141416', metal=0.6, rough=0.4),
    "shade_brass":  dict(color='#9b7a3e', metal=1.0, rough=0.3),
    "curtain":      dict(color='#9a8f7f', rough=0.95),
    "door_wood":    dict(color='#5d4330', rough=0.55),
})

WARM = '#ffdcb4'
def pendant(mb, x, y, top, drop, shade="shade_black"):
    mb.cyl((x, y, top - drop), (0, 0, 1), 0.006, drop, "steel_black", seg=6)
    mb.cyl((x, y, top - drop - 0.22), (0, 0, 1), 0.2, 0.22, shade, seg=20, r2=0.05, cap=False)
    mb.cyl((x, y, top - drop - 0.12), (0, 0, 1), 0.045, 0.06, "bulb_warm", seg=12)

def window_wall_x(mb, x, y0, y1, z0, z1, n, outside, face):
    """Storefront glazing on a wall at x, mullions every (y1-y0)/n, a street picture behind it."""
    for i in range(n + 1):
        y = y0 + (y1 - y0) * i / n
        mb.box(x - 0.05, y - 0.04, z0, x + 0.05, y + 0.04, z1, "steel_black")
    mb.box(x - 0.06, y0, z0 - 0.06, x + 0.06, y1, z0, "steel_black")
    mb.box(x - 0.06, y0, z1, x + 0.06, y1, z1 + 0.08, "steel_black")
    pic = MB(mb.name + "_View")
    label(pic, (x - face * 3.0, (y0 + y1) / 2, (z0 + z1) / 2 + 0.6), (y1 - y0) + 4, (z1 - z0) + 2.4, (face, 0, 0), outside)
    pic.build()

def bentwood(mb, x, y, rot):
    m = MB("tmp")
    m.cyl((0, 0, 0.45), (0, 0, 1), 0.2, 0.03, "wood_walnut", seg=16)
    for a in range(4):
        aa = a * math.pi / 2 + math.pi / 4
        m.cyl((0.15 * math.cos(aa), 0.15 * math.sin(aa), 0), (-0.03 * math.cos(aa), -0.03 * math.sin(aa), 1), 0.016, 0.45, "wood_walnut", seg=6)
    m.box(-0.18, 0.15, 0.48, 0.18, 0.18, 0.86, "wood_walnut")
    m.box(-0.17, 0.155, 0.62, 0.17, 0.175, 0.8, "wood_walnut")
    xform(m, rot, (x, y, 0)); merge(mb, m)

def round_table(mb, x, y, r=0.36, top="marble"):
    mb.cyl((x, y, 0), (0, 0, 1), 0.24, 0.03, "steel_black", seg=16)
    mb.cyl((x, y, 0.03), (0, 0, 1), 0.035, 0.7, "steel_black", seg=10)
    mb.cyl((x, y, 0.72), (0, 0, 1), r, 0.03, top, seg=28)

def spot(name, x, y, z, **kw):
    e = empty(f"Spot_{name}", (x, y, z)); tag(e, role="spot", **kw); return e

# ============================================================================ CAFE
def build_cafe():
    W, D, H = 14.0, 10.0, 3.3
    sh = MB("Cafe_Shell")
    sh.box(-W / 2, -D / 2, -0.1, W / 2, D / 2, 0, "wood_oak")                          # floor
    sh.box(-W / 2, -D / 2, H, W / 2, D / 2, H + 0.1, "ceiling_dark")                  # ceiling
    sh.box(-W / 2, D / 2, 0, W / 2, D / 2 + 0.2, H, "brick_red")                       # north, exposed brick
    sh.box(-W / 2, -D / 2 - 0.2, 0, -1.2, -D / 2, H, "plaster_white")                  # south, door gap at x -1.2..0.2
    sh.box(0.2, -D / 2 - 0.2, 0, W / 2, -D / 2, H, "plaster_white")
    sh.box(-1.2, -D / 2 - 0.2, 2.3, 0.2, -D / 2, H, "plaster_white")
    sh.box(W / 2, -D / 2, 0, W / 2 + 0.2, D / 2, H, "plaster_white")                   # east
    sh.box(-W / 2 - 0.2, -D / 2, 0, -W / 2, D / 2, 0.45, "brick_red")                  # west: knee wall + glazing
    sh.box(-W / 2 - 0.2, -D / 2, 3.05, -W / 2, D / 2, H, "plaster_white")
    sh.box(-W / 2, -D / 2, 0, W / 2, -D / 2 + 0.02, 0.12, "wood_walnut")               # skirting
    for y in (-2.5, 0.0, 2.5):                                                         # exposed ducts
        sh.cyl((-W / 2, y, H - 0.35), (1, 0, 0), 0.16, W, "duct", seg=16)
    sh.box(-0.1, -D / 2 - 0.02, 0, 0.0, -D / 2, 0.01, "steel_black")
    sh.build()
    win = MB("Cafe_Storefront")
    window_wall_x(win, -W / 2 - 0.1, -D / 2, D / 2, 0.45, 3.05, 5, imge("street_night"), +1)
    win.build()
    glass = MB("Cafe_Glass"); glass.box(-W / 2 - 0.12, -D / 2, 0.45, -W / 2 - 0.1, D / 2, 3.05, "glass_clear"); glass.build()

    # counter, back bar, menu
    ct = MB("Cafe_Counter")
    ct.box(3.9, -1.4, 0, 4.6, 4.3, 0.98, "wood_walnut")
    ct.box(3.85, -1.45, 0.98, 4.65, 4.35, 1.03, "marble")
    for y in [-1.2 + i * 0.32 for i in range(18)]:
        ct.box(3.86, y, 0.1, 3.89, y + 0.2, 0.92, "wood_light")                       # slatted front
    ct.box(6.4, -2.0, 0, 7.0, 4.6, 0.92, "cabinet_white")
    ct.box(6.35, -2.05, 0.92, 7.0, 4.65, 0.96, "marble")
    for z in (1.55, 2.05):
        ct.box(6.6, -2.0, z, 7.0, 4.6, z + 0.04, "wood_walnut")                       # open shelves
        for k in range(14):
            y = -1.8 + k * 0.45
            if k % 3 == 0: ct.cyl((6.8, y, z + 0.04), (0, 0, 1), 0.07, 0.2, "glass_jar", seg=12)
            else: mug(ct, 6.78, y, z + 0.04, "ceramic_white" if k % 2 else "terracotta")
    # espresso machine, grinder, register, pastry case
    ct.box(4.0, 1.2, 1.03, 4.55, 2.2, 1.5, "steel_satin"); ct.box(4.0, 1.25, 1.5, 4.55, 2.15, 1.56, "chrome")
    for y in (1.45, 1.95): ct.cyl((3.98, y, 1.25), (-1, 0, 0), 0.03, 0.12, "chrome", seg=10)
    ct.cyl((4.25, 2.6, 1.03), (0, 0, 1), 0.09, 0.32, "steel_black", seg=14); ct.cyl((4.25, 2.6, 1.35), (0, 0, 1), 0.1, 0.18, "glass_jar", seg=14, r2=0.06)
    ct.box(4.05, 3.3, 1.03, 4.5, 3.75, 1.12, "plastic_black"); ct.box(4.1, 3.4, 1.12, 4.45, 3.7, 1.42, "screen_on")
    ct.box(3.95, -1.35, 1.03, 4.55, 0.4, 1.45, "glass_clear")
    for k in range(10): ct.cyl((4.15 + (k % 2) * 0.22, -1.2 + (k // 2) * 0.32, 1.06), (0, 0, 1), 0.07, 0.06, "pastry", seg=10)
    ct.build()
    label_obj("Cafe_Menu_Board", (6.98, 1.3, 2.75), 3.2, 1.6, '-x', img("cafe_menu"))
    # tables, chairs, bench
    fu = MB("Cafe_Furniture")
    tables = [(-5.4, -1.6), (-5.4, 1.4), (-5.4, 3.6), (-2.2, -2.8), (-2.2, 0.4), (0.9, -2.8), (0.9, 0.4)]
    for i, (x, y) in enumerate(tables):
        round_table(fu, x, y)
        bentwood(fu, x + 0.55, y, math.pi / 2 + (0.1 if i % 2 else -0.1))
        if i != 0: bentwood(fu, x - 0.55, y, -math.pi / 2)
    bentwood(fu, -4.75, -2.25, math.pi * 0.85)                                         # the chair the bag was on
    fu.box(-3.4, 4.3, 0, 2.6, 4.9, 0.45, "wood_walnut")                                # banquette along the brick
    fu.box(-3.4, 4.65, 0.45, 2.6, 4.9, 1.0, "fabric_rust")
    fu.box(-3.4, 4.3, 0.45, 2.6, 4.65, 0.55, "fabric_rust")
    for x in (-2.4, -0.4, 1.6):
        fu.box(x - 0.32, 3.55, 0.7, x + 0.32, 4.1, 0.73, "wood_oak"); fu.cyl((x, 3.82, 0), (0, 0, 1), 0.03, 0.7, "steel_black", seg=8)
        bentwood(fu, x, 3.15, math.pi)
    armchair(fu, -0.8, -4.1, 0, "fabric_olive"); armchair(fu, 1.0, -4.1, 0, "fabric_olive")
    fu.cyl((0.1, -3.6, 0), (0, 0, 1), 0.3, 0.42, "wood_walnut", seg=20)
    fu.box(-6.8, -0.2, 0.72, -6.3, 4.8, 0.76, "wood_walnut")                           # window ledge bar
    for k in range(5): mug(fu, -6.55, 0.4 + k * 1.0, 0.76)
    plant(fu, 3.0, -4.4, 0, h=1.0, pot="terracotta"); tall_plant(fu, -6.4, -4.3, 0); tall_plant(fu, 5.4, 4.5, 0)
    fu.box(2.8, 4.85, 1.3, 3.8, 4.9, 2.6, "steel_black")                               # coat rack board
    fu.build()
    # stuff on the player's table: a cup, a phone stand-in; the laptop bag lives on the chair as a beat
    tb = MB("Cafe_Table_Props"); mug(tb, -5.2, -1.45, 0.75); tb.build()
    label_obj("Cafe_Wifi_Card", (-5.6, -1.75, 0.82), 0.16, 0.1, (0.0, 0.7, 0.7), img("cafe_wifi"))
    label_obj("Cafe_Specials", (-0.5, -4.6, 1.0), 0.6, 0.9, '+y', img("cafe_specials"))
    for i, (x, art) in enumerate(((-4.6, "cafe_print_1"), (-2.6, "label_art_0"), (-0.6, "cafe_print_2"))):
        label_obj(f"Cafe_Print_{i}", (x, -4.98, 1.75), 0.6, 0.9, '+y', img(art))
    lt = MB("Cafe_Pendants")
    for x, y in [(4.25, 0.0), (4.25, 2.0), (4.25, 4.0), (-5.4, -1.6), (-5.4, 1.4), (-2.2, -1.2), (0.9, -1.2), (-0.4, 3.8)]:
        pendant(lt, x, y, H, 0.9 if x > 4 else 1.0, "shade_brass" if x > 4 else "shade_black")
    lt.build()
    # bake lights: warm pendants + sodium street spill through the glass
    for i, (x, y) in enumerate([(4.25, 0.0), (4.25, 2.0), (4.25, 4.0), (-5.4, -1.6), (-5.4, 1.4), (-2.2, -1.2), (0.9, -1.2), (-0.4, 3.8)]):
        light(f"Bake_Cafe_{i}", 'POINT', (x, y, H - 1.25), WARM, 90 if x > 4 else 70, radius=0.12)
    for i, y in enumerate((-3.0, 0.0, 3.0)):          # sodium spill, aimed in through the glass (+x)
        light(f"Bake_Street_{i}", 'SPOT', (-W / 2 - 0.6, y, 3.4), '#ff9d45', 220, spot_deg=70, radius=0.3,
              rot=(0, math.radians(-65), 0))
    light("Bake_Fill", 'AREA', (0, 0, H - 0.2), '#ffe6c8', 160, rot=(0, 0, 0))
    light("Bake_Wash_S", 'AREA', (-1.5, -3.6, H - 0.3), '#ffe0bc', 90, rot=(math.radians(-35), 0, 0))
    light("Bake_Wash_E", 'AREA', (5.4, 1.3, H - 0.3), '#ffe0bc', 70, rot=(0, math.radians(-35), 0))
    spot("table", -5.4, -1.6, 0.75, label="Your table")
    spot("chair", -4.75, -2.25, 0.46, label="The chair")
    spot("counter", 4.0, 0.6, 1.03, label="Counter")
    spot("spawn", 2.4, -3.6, 0, yaw_deg=150)
    return ["Cafe_Shell", "Cafe_Storefront", "Cafe_Counter", "Cafe_Furniture", "Cafe_Table_Props", "Cafe_Pendants",
            "Cafe_Menu_Board", "Cafe_Wifi_Card", "Cafe_Specials", "Cafe_Print_0", "Cafe_Print_1", "Cafe_Print_2"], ["Cafe_Glass", "Cafe_Storefront_View"]

# ============================================================================ HOME
def build_home():
    W, D, H = 12.0, 10.0, 2.7
    sh = MB("Home_Shell")
    sh.box(-W / 2, -D / 2, -0.1, 0.0, D / 2, 0, "concrete_slab")                           # kitchen half
    sh.box(0.0, -D / 2, -0.1, W / 2, D / 2, 0, "wood_oak")                              # living half
    sh.box(-W / 2, -D / 2, H, W / 2, D / 2, H + 0.1, "ceiling_white")
    sh.box(-W / 2, D / 2, 0, 0.6, D / 2 + 0.2, H, "plaster_white")                      # north wall, window x 0.6..5.4
    sh.box(5.4, D / 2, 0, W / 2, D / 2 + 0.2, H, "plaster_white")
    sh.box(0.6, D / 2, 0, 5.4, D / 2 + 0.2, 0.8, "plaster_white")
    sh.box(0.6, D / 2, 2.3, 5.4, D / 2 + 0.2, H, "plaster_white")
    sh.box(-W / 2, -D / 2 - 0.2, 0, -3.6, -D / 2, H, "plaster_white")                   # south wall, front door x -3.6..-2.6
    sh.box(-2.6, -D / 2 - 0.2, 0, W / 2, -D / 2, H, "paint_navy")
    sh.box(-3.6, -D / 2 - 0.2, 2.1, -2.6, -D / 2, H, "plaster_white")
    sh.box(-W / 2 - 0.2, -D / 2, 0, -W / 2, D / 2, H, "plaster_white")
    sh.box(W / 2, -D / 2, 0, W / 2 + 0.2, D / 2, H, "plaster_white")
    for x0, x1, y0, y1 in ((-W / 2, W / 2, -D / 2, -D / 2 + 0.02), (-W / 2, W / 2, D / 2 - 0.02, D / 2)):
        sh.box(x0, y0, 0, x1, y1, 0.1, "cabinet_white")
    sh.build()
    win = MB("Home_Window")
    for x in (0.6, 2.2, 3.8, 5.4): win.box(x - 0.04, D / 2 - 0.05, 0.8, x + 0.04, D / 2 + 0.05, 2.3, "cabinet_white")
    win.box(0.6, D / 2 - 0.12, 0.76, 5.4, D / 2 + 0.05, 0.8, "cabinet_white")
    win.build()
    view = MB("Home_Window_View"); label(view, (3.0, D / 2 + 3.0, 1.7), 9.0, 4.0, '-y', imge("city_night")); view.build()
    glass = MB("Home_Glass"); glass.box(0.6, D / 2 + 0.01, 0.8, 5.4, D / 2 + 0.02, 2.3, "glass_clear"); glass.build()
    cu = MB("Home_Curtains")
    for x0 in (0.2, 5.2):
        for k in range(6): cu.box(x0 + k * 0.1, D / 2 - 0.2 - (k % 2) * 0.05, 0.1, x0 + k * 0.1 + 0.1, D / 2 - 0.15 - (k % 2) * 0.05, 2.45, "curtain")
    cu.cyl((0.1, D / 2 - 0.17, 2.5), (1, 0, 0), 0.015, 5.8, "steel_black", seg=8)
    cu.build()
    # kitchen
    kt = MB("Home_Kitchen")
    kt.box(-6.0, 4.3, 0, -5.15, 5.0, 2.05, "steel_satin")                               # fridge
    kt.box(-5.95, 4.28, 1.0, -5.9, 4.3, 1.7, "chrome")
    kt.box(-5.1, 4.35, 0, -0.5, 5.0, 0.86, "cabinet_sage")
    kt.box(-5.12, 4.3, 0.86, -0.48, 5.0, 0.92, "marble")
    for x in [-5.1 + i * 0.6 for i in range(8)]:
        kt.box(x + 0.02, 4.33, 0.12, x + 0.57, 4.35, 0.8, "cabinet_sage"); kt.box(x + 0.25, 4.31, 0.7, x + 0.35, 4.33, 0.72, "chrome")
    kt.box(-5.1, 4.98, 0.92, -0.5, 5.0, 1.5, "tile_white")
    kt.box(-5.1, 4.65, 1.5, -2.4, 5.0, 2.3, "cabinet_white"); kt.box(-1.0, 4.65, 1.5, -0.5, 5.0, 2.3, "cabinet_white")
    kt.box(-3.6, 4.5, 0.86, -2.8, 4.9, 0.92, "steel_satin")                             # sink
    kt.cyl((-3.2, 4.92, 0.92), (0, 0, 1), 0.015, 0.3, "chrome", seg=8); kt.cyl((-3.2, 4.92, 1.22), (0, -1, 0), 0.015, 0.2, "chrome", seg=8)
    kt.box(-2.2, 4.4, 0.92, -1.3, 4.95, 0.94, "steel_black")                            # hob
    for x, y in ((-2.0, 4.55), (-1.5, 4.55), (-2.0, 4.8), (-1.5, 4.8)): kt.cyl((x, y, 0.94), (0, 0, 1), 0.09, 0.005, "plastic_black", seg=16)
    kt.box(-2.25, 4.55, 1.65, -1.25, 5.0, 1.85, "steel_satin"); kt.box(-1.95, 4.75, 1.85, -1.55, 5.0, 2.7, "steel_satin")
    kt.cyl((-0.9, 4.65, 0.92), (0, 0, 1), 0.08, 0.2, "steel_black", seg=12)            # kettle
    kt.box(-4.7, 4.55, 0.92, -4.3, 4.9, 1.05, "wood_light")                             # board
    for k in range(3): kt.cyl((-0.75 - k * 0.12, 4.85, 0.92), (0, 0, 1), 0.045, 0.16, "glass_jar", seg=10)
    kt.build()
    label_obj("Home_Fridge_Door", (-5.575, 4.28, 1.45), 0.75, 1.1, '-y', img("home_fridge"))
    # dining
    dn = MB("Home_Dining")
    dn.box(-3.3, 0.9, 0.72, -1.7, 2.1, 0.76, "wood_light")
    for x in (-3.2, -1.85):
        for y in (1.0, 1.95): dn.box(x, y, 0, x + 0.05, y + 0.05, 0.72, "wood_light")
    for x, y, r in ((-2.9, 0.55, 0), (-2.1, 0.55, 0), (-2.9, 2.45, math.pi), (-2.1, 2.45, math.pi)):
        bentwood(dn, x, y, r + math.pi)
    pendant(dn, -2.5, 1.5, H, 0.95, "shade_brass")
    dn.build()
    # living
    lv = MB("Home_Living")
    lv.box(1.6, -3.4, 0, 5.2, 0.4, 0.012, "rug_blue")
    sofa(lv, 1.5, -1.5, -math.pi / 2, w=2.2, fabric="fabric_cream")
    armchair(lv, 3.4, -3.9, math.pi, "fabric_rust")
    lv.box(2.7, -2.0, 0, 3.6, -1.0, 0.4, "wood_walnut")                                 # coffee table
    mug(lv, 2.9, -1.3, 0.4); lv.box(3.1, -1.8, 0.4, 3.4, -1.55, 0.44, "book_b")
    lv.box(5.55, -2.6, 0, 6.0, -0.4, 0.5, "wood_walnut")                                # media console
    lv.box(5.85, -2.4, 0.95, 5.92, -0.6, 1.75, "screen_off")                            # TV on the wall
    lv.box(5.92, -2.42, 0.93, 5.98, -0.58, 1.77, "plastic_black")
    lv.box(5.6, -0.35, 0.5, 5.95, -0.1, 0.55, "wood_walnut")
    lv.box(4.2, -5.0, 0, 5.8, -4.65, 2.0, "wood_walnut")                                # bookshelf
    for z in (0.4, 0.8, 1.2, 1.6):
        lv.box(4.2, -4.98, z, 5.8, -4.66, z + 0.03, "wood_light")
        x = 4.25
        while x < 5.7:
            w = 0.04 + R.random() * 0.04; h = 0.22 + R.random() * 0.12
            lv.box(x, -4.95, z + 0.03, x + w, -4.72, z + 0.03 + h, R.choice(["book_a", "book_b", "book_c", "book_d"])); x += w + 0.005
    lv.cyl((0.6, -4.3, 0), (0, 0, 1), 0.16, 0.03, "steel_black", seg=16)                # floor lamp
    lv.cyl((0.6, -4.3, 0.03), (0, 0, 1), 0.015, 1.5, "steel_black", seg=8)
    lv.cyl((0.6, -4.3, 1.5), (0, 0, 1), 0.22, 0.3, "fabric_cream", seg=20, r2=0.16, cap=False)
    plant(lv, 5.6, 4.4, 0, h=0.9, pot="terracotta"); tall_plant(lv, 0.3, 4.4, 0)
    lv.build()
    # router on the console, with LEDs
    rt = MB("Home_Router")
    rt.box(5.62, -0.32, 0.55, 5.9, -0.12, 0.6, "plastic_white")
    for k in range(3): rt.cyl((5.64 + k * 0.1, -0.22, 0.6), (0, 0, 1), 0.006, 0.18, "plastic_white", seg=6)
    for k in range(4): rt.box(5.615, -0.3 + k * 0.045, 0.565, 5.62, -0.29 + k * 0.045, 0.575, "led_green_soft")
    rt.build()
    # entry: door, mat, hooks, parcel
    en = MB("Home_Entry")
    en.box(-3.6, -5.05, 0, -2.6, -4.98, 2.1, "door_wood"); en.cyl((-2.75, -4.97, 1.0), (0, 1, 0), 0.02, 0.06, "chrome", seg=10)
    en.box(-3.7, -4.95, 0, -2.5, -4.4, 0.01, "rug_charcoal")
    en.box(-5.6, -4.98, 1.6, -4.4, -4.94, 1.68, "wood_walnut")
    for k in range(4): en.cyl((-5.45 + k * 0.32, -4.94, 1.64), (0, 1, 0), 0.012, 0.08, "steel_black", seg=6)
    en.box(-4.3, -4.7, 0, -3.85, -4.25, 0.32, "cardboard"); en.box(-4.3, -4.48, 0.32, -3.85, -4.47, 0.321, "tape_brown")
    en.build()
    for i, (x, y) in enumerate(((-5.98, -1.0), (-5.98, 1.4))):
        label_obj(f"Home_Print_{i}", (x, y, 1.6), 0.9, 0.6, '+x', img(f"home_print_{i + 1}"))
    label_obj("Home_Router_Label", (5.9, -0.22, 0.551), 0.12, 0.075, '+z', img("router_label"), up=(-1, 0, 0))
    lt = MB("Home_Downlights")
    for x, y in ((-4.5, 2.5), (-1.0, 2.5), (-4.5, -1.5), (-1.0, -1.5), (2.0, 2.5), (4.5, 2.5), (2.0, -2.5), (4.5, -2.5)):
        lt.cyl((x, y, H - 0.005), (0, 0, 1), 0.07, 0.005, "downlight", seg=14)
    lt.build()
    for i, (x, y) in enumerate(((-4.5, 2.5), (-1.0, 2.5), (-4.5, -1.5), (-1.0, -1.5), (2.0, 2.5), (4.5, 2.5), (2.0, -2.5), (4.5, -2.5))):
        light(f"Bake_Home_{i}", 'SPOT', (x, y, H - 0.05), '#ffdcb0', 70, spot_deg=110, radius=0.06)
    light("Bake_Dining", 'POINT', (-2.5, 1.5, H - 1.1), WARM, 55, radius=0.1)
    light("Bake_Lamp", 'POINT', (0.6, -4.3, 1.55), WARM, 45, radius=0.12)
    light("Bake_Hood", 'POINT', (-1.75, 4.7, 1.6), '#fff0d8', 18, radius=0.05)
    light("Bake_Wash_W", 'AREA', (-5.2, 0.0, H - 0.2), '#ffe0bc', 60, rot=(0, math.radians(35), 0))
    light("Bake_City", 'AREA', (3.0, D / 2 - 0.4, 2.2), '#9db4ff', 40, rot=(math.radians(-60), 0, 0))
    light("Bake_Fill", 'AREA', (0, 0, H - 0.1), '#ffe6c8', 110)
    spot("table", -2.5, 1.5, 0.76, label="Kitchen table")
    spot("counter", -4.0, 4.6, 0.92, label="Counter")
    spot("couch", 1.5, -1.0, 0.5, label="Couch")
    spot("shelf", 5.75, -0.22, 0.6, label="Router")
    spot("spawn", -3.1, -3.9, 0, yaw_deg=10)
    return ["Home_Shell", "Home_Window", "Home_Curtains", "Home_Kitchen", "Home_Dining", "Home_Living", "Home_Router",
            "Home_Entry", "Home_Downlights", "Home_Fridge_Door", "Home_Print_0", "Home_Print_1", "Home_Router_Label"], ["Home_Glass", "Home_Window_View"]

if __name__ == "__main__":
    reset()
    baked_names, glass_names = build_cafe() if ROOM == "cafe" else build_home()
    bk.world_night(0.6)
    if RENDER:
        cam = setup_render(res=(1100, 700), samples=32)
        p = ((5.5, -4.2, 1.65), (-4, 2, 0.9)) if ROOM == "cafe" else ((-5.2, -4.2, 1.65), (3, 3, 0.8))
        shoot(cam, p[0], p[1], f"/home/claude/harbor/out/prev_{ROOM}.png", lens=20)
        sys.exit(0)
    bk.snapshot_materials(); bk.prep_scene_materials(); bk.setup_cycles(bk.SAMPLES)
    targets = [bpy.data.objects[n] for n in baked_names]
    meshes = bk.prep_targets(targets)
    spots = [o for o in bpy.data.objects if o.name.startswith("Spot_")]
    glass = [bpy.data.objects[n] for n in glass_names] + spots
    bk.finish(ROOM, f"harbor_{ROOM}_baked.glb", meshes, glass, [], 2048,
              "World space for this room only. Load at the origin on its own; it is not part of the tower.")
