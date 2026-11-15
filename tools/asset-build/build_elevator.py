"""harbor_elevator_cab.glb: elevator car A interior with its own sliding doors, car operating panel (L / 14
buttons with lit + unlit variants), floor indicator digits, handrail, ceiling light.

ORIGIN = centre of the door threshold (on the landing-door plane). The cab extends behind the origin
(Blender +Y = glTF -Z). Place it with a pure translation (no rotation):
  lobby landing : glTF position (1.5, 0.0, -17.36)     (Blender 1.5, 17.36, 0)
  floor 14      : glTF position (1.5, 50.6, -16.51)    (Blender 1.5, 16.51, 50.6)
Needs harbor_shaft_cut.glb (opening behind the landing doors) to be visible from the landings.
"""
import sys; sys.path.insert(0, '/home/claude/harbor')
from lib2 import *

RENDER = "--render" in sys.argv
reset()

W2 = 0.80          # inner half-width  (1.6 m)
Y_IN0, Y_IN1 = 0.15, 1.41   # inner depth 1.26 m (fits behind the floor-14 wall before the curtain wall)
H = 2.60           # inner height
WT = 0.03          # wall thickness

root = empty("Elevator_Cab")
tag(root, role="elevator_cab", car="A", origin_note="centre of the door threshold, landing-door plane; cab extends to glTF -Z",
    place_lobby=[1.5, 0.0, -17.36], place_f14=[1.5, 50.6, -16.51], rotation="none",
    inner_size_m=[1.6, 1.26, 2.6], player_stand_local=[0.0, 0.0, -0.85],
    note="Show at the landing the player is on; hide when the player is elsewhere. See docs/ASSETS_V2.md")

# ---------------- shell ----------------
sh = MB("Elevator_Cab_Shell")
sh.box(-0.72, 0.02, -0.03, 0.72, Y_IN0, 0.004, "metal_brushed")                       # sill
for i in range(14):                                                                     # sill grooves
    x = -0.68 + i * 0.105
    sh.box(x, 0.03, 0.004, x + 0.012, Y_IN0 - 0.01, 0.006, "steel_black")
sh.box(-W2, Y_IN0, -0.05, W2, Y_IN1, 0.004, "granite_polished")                       # floor
# front wall (door pockets extend beyond the car so open doors park inside the landing wall)
sh.box(-1.45, 0.125, 0, -0.70, Y_IN0, H + 0.05, "metal_brushed")
sh.box(0.70, 0.125, 0, 1.45, Y_IN0, H + 0.05, "metal_brushed")
sh.box(-0.70, 0.125, 2.40, 0.70, Y_IN0, H + 0.05, "metal_brushed")
# side + back walls
sh.box(-W2 - WT, 0.125, 0, -W2, Y_IN1 + WT, H + 0.05, "metal_brushed")
sh.box(W2, 0.125, 0, W2 + WT, Y_IN1 + WT, H + 0.05, "metal_brushed")
sh.box(-W2 - WT, Y_IN1, 0, W2 + WT, Y_IN1 + WT, H + 0.05, "metal_brushed")
# ceiling + roof
sh.box(-W2 - WT, 0.125, H, W2 + WT, Y_IN1 + WT, H + 0.05, "steel_black")
sh.box(-0.56, 0.32, H - 0.012, 0.56, 1.24, H, "steel_black")                           # light frame
sh.box(-0.52, 0.36, H - 0.014, 0.52, 1.20, H - 0.012, "panel_light_on")                # diffuser
for x in (-0.26, 0.0, 0.26):                                                             # diffuser ribs
    sh.box(x - 0.006, 0.36, H - 0.02, x + 0.006, 1.20, H - 0.012, "steel_black")
sh.box(-0.12, Y_IN1 - 0.12, H - 0.006, 0.12, Y_IN1 - 0.02, H, "steel_paint")           # vent
# kick plates + panel reveals
sh.box(-W2, Y_IN1 - 0.004, 0.004, W2, Y_IN1, 0.13, "steel_black")
sh.box(-W2, Y_IN0, 0.004, -W2 + 0.004, Y_IN1, 0.13, "steel_black")
sh.box(W2 - 0.004, Y_IN0, 0.004, W2, Y_IN1, 0.13, "steel_black")
for y in (0.62, 1.02):
    sh.box(-W2, y - 0.008, 0.13, -W2 + 0.003, y + 0.008, H, "steel_black")
    if y > 0.7: sh.box(W2 - 0.003, y - 0.008, 0.13, W2, y + 0.008, H, "steel_black")
for x in (-0.27, 0.27):
    sh.box(x - 0.008, Y_IN1 - 0.003, 0.13, x + 0.008, Y_IN1, H, "steel_black")
sh.box(-0.26, Y_IN1 - 0.004, 1.0, 0.26, Y_IN1 - 0.001, 2.35, "mirror")                # mirror panel
sh.box(-0.28, Y_IN1 - 0.003, 0.98, 0.28, Y_IN1 - 0.0005, 2.37, "steel_black")
sh.box(-W2, Y_IN0, 2.40, W2, Y_IN0 + 0.004, 2.42, "steel_black")                      # header shadow line
# handrails (back + both sides)
def rail(p0, p1):
    d = Vector(p1) - Vector(p0)
    sh.cyl(p0, d, 0.019, d.length, "chrome", seg=10)
rail((-0.62, Y_IN1 - 0.07, 0.9), (0.62, Y_IN1 - 0.07, 0.9))
rail((-W2 + 0.07, 0.72, 0.9), (-W2 + 0.07, Y_IN1 - 0.07, 0.9))
rail((W2 - 0.07, 0.72, 0.9), (W2 - 0.07, Y_IN1 - 0.07, 0.9))
for p, d in (((-0.55, Y_IN1, 0.9), (0, -1, 0)), ((0.55, Y_IN1, 0.9), (0, -1, 0)),
             ((-W2, 0.8, 0.9), (1, 0, 0)), ((-W2, 1.25, 0.9), (1, 0, 0)), ((W2, 0.8, 0.9), (-1, 0, 0)), ((W2, 1.25, 0.9), (-1, 0, 0))):
    sh.cyl(p, d, 0.011, 0.07, "chrome", seg=8)
# car operating panel plate (right-hand wall when you walk in)
sh.box(W2 - 0.006, 0.27, 0.86, W2, 0.57, 1.62, "metal_brushed")
sh.box(W2 - 0.007, 0.36, 1.50, W2 - 0.006, 0.48, 1.58, "glass_dark")                  # COP display bezel
shell = tag(sh.build(), role="elevator_cab_shell", collider="mesh", car="A")
set_parent(shell, root)

lbl = MB("Elevator_Cab_Labels")
label(lbl, (W2 - 0.0075, 0.42, 1.21), 0.24, 0.40, '-x', img("label_cop"))
label(lbl, (-W2 + 0.002, 0.95, 1.62), 0.30, 0.15, '+x', img("label_cert"))
set_parent(lbl.build(fix_normals=False), shell)

# ---------------- cab doors ----------------
for side, sgn in (("L", -1), ("R", 1)):
    d = MB(f"Elevator_Cab_Door_{side}")
    xa, xb = (0.0, 0.70) if sgn > 0 else (-0.70, 0.0)
    d.box(xa, 0.10, 0.006, xb, 0.125, 2.40, "metal_brushed")
    d.box(xa, 0.124, 0.006, xb, 0.126, 0.12, "steel_black")                             # inner kick strip
    eb = 0.0 if sgn > 0 else -0.006                                                         # rubber meeting edge
    d.box(eb, 0.099, 0.006, eb + 0.006, 0.126, 2.40, "rubber")
    o = tag(d.build(origin=(0, 0.1125, 0)), role="elevator_door", part="cab", car="A", slide_axis="x",
            slide_dist=0.72 * sgn, collider="box", interactive=False,
            note="cab door; slides into the landing wall pocket when open")
    set_parent(o, root)

# ---------------- buttons (L and 14 are separate nodes with lit/unlit faces) ----------------
def cab_button(label_txt, y, z, floor):
    b = MB(f"Elevator_Cab_Button_{label_txt}")
    b.cyl((W2 - 0.0075, y, z), (-1, 0, 0), 0.020, 0.004, "chrome", seg=20)
    bo = tag(b.build(origin=(W2 - 0.0075, y, z)), role="elevator_button", floor=floor, car="A", interactive=True,
             collider="none", note="toggle child _Lit/_Unlit; lit = selected floor")
    for st, mat in (("Unlit", img(f"label_btn_{label_txt}_unlit")), ("Lit", imge(f"label_btn_{label_txt}_lit"))):
        face = MB(f"Elevator_Cab_Button_{label_txt}_{st}")
        label(face, (W2 - 0.0118, y, z), 0.032, 0.032, '-x', mat)
        fo = tag(face.build(origin=(W2 - 0.0118, y, z), fix_normals=False), state=st.lower(),
                 default_visible=(st == "Unlit"))
        set_parent(fo, bo)
    set_parent(bo, root)
    return bo
# positions match the printed faceplate (label_cop): '14' top-left, 'L' bottom-right as seen from inside
cab_button("14", 0.42 + 0.044, 1.21 + 0.164, 14)
cab_button("L", 0.42 - 0.044, 1.21 - 0.1048, "L")

# ---------------- floor indicator (above the door, inside) ----------------
ind = MB("Elevator_Cab_Indicator")
ind.box(-0.22, Y_IN0, 2.44, 0.22, Y_IN0 + 0.012, 2.585, "steel_black")
ind.box(-0.20, Y_IN0 + 0.012, 2.45, 0.20, Y_IN0 + 0.014, 2.575, "glass_dark")
indo = tag(ind.build(), role="floor_indicator", car="A", collider="none",
           note="children Elevator_Cab_Indicator_<L|02..14> and _Up/_Down; show exactly one floor + optional arrow")
set_parent(indo, root)
floors = ["L"] + [f"{i:02d}" for i in range(2, 15)]
for f in floors:
    t = text(f"Elevator_Cab_Indicator_{f}", f.lstrip("0") if f != "L" else "L", 0.085, (-0.02, Y_IN0 + 0.016, 2.468),
             "led_amber_soft", rot=(math.radians(90), 0, math.radians(180)), extrude=0.001)
    tag(t, role="indicator_digit", floor=f, default_visible=(f == "L"))
    set_parent(t, indo)
for nm, up in (("Up", True), ("Down", False)):
    a = MB(f"Elevator_Cab_Indicator_{nm}")
    x, z0 = -0.14, 2.512
    pts = [(x - 0.03, Y_IN0 + 0.016, z0 - 0.025), (x + 0.03, Y_IN0 + 0.016, z0 - 0.025), (x, Y_IN0 + 0.016, z0 + 0.03)] if up else \
          [(x - 0.03, Y_IN0 + 0.016, z0 + 0.03), (x, Y_IN0 + 0.016, z0 - 0.025), (x + 0.03, Y_IN0 + 0.016, z0 + 0.03)]
    a.face(pts, "led_amber_soft")
    set_parent(tag(a.build(origin=(x, Y_IN0 + 0.016, z0), fix_normals=False), role="indicator_arrow", direction=nm.lower(),
                   default_visible=False), indo)
# small COP display duplicate digit
cd = text("Elevator_Cab_COP_Display", "L", 0.05, (W2 - 0.0075, 0.42, 1.515), "led_amber_soft",
          rot=(math.radians(90), 0, math.radians(-90)), extrude=0.001)
set_parent(tag(cd, role="indicator_digit", note="COP mini display; swap text by toggling the main indicator instead, or hide"), indo)

lt = light("Elevator_Cab_Light", 'POINT', (0, 0.78, H - 0.15), color='#f1f4ff', energy=45, radius=0.3)
set_parent(tag(lt, role="cab_light"), root)

print("TRIANGLES", stats())
export(f"{OUT}/harbor_elevator_cab.glb")

if RENDER:
    mark_hidden_defaults()
    # demo state: 14 lit, indicator shows 14 going up
    bpy.data.objects["Elevator_Cab_Button_14_Unlit"].hide_render = True
    bpy.data.objects["Elevator_Cab_Button_14_Lit"].hide_render = False
    bpy.data.objects["Elevator_Cab_Indicator_L"].hide_render = True
    bpy.data.objects["Elevator_Cab_Indicator_07"].hide_render = False
    bpy.data.objects["Elevator_Cab_Indicator_Up"].hide_render = False
    cam = setup_render(night=True, res=(960, 640), samples=24)
    shoot(cam, (-0.25, 1.25, 1.7), (0.55, 0.3, 1.25), f"{OUT}/elev_cab_interior.png", lens=18)
    shoot(cam, (0.3, 1.3, 1.65), (-0.1, 0.1, 1.9), f"{OUT}/elev_cab_front.png", lens=18)
    # context: lobby with the shaft cut, landing + cab doors open, looking from the lobby
    for o in [o for o in bpy.data.objects if o.parent is None and o.name == "Elevator_Cab"]:
        o.location = (1.5, 17.36, 0.0)
    for side, s in (("L", -1), ("R", 1)):
        d = bpy.data.objects[f"Elevator_Cab_Door_{side}"]; d.location.x += 0.72 * s
    new = import_glb(f"{OUT}/../out/harbor_block.glb")
    for nm in ("Harbor_Tower", "Lobby_Interior"):
        o = bpy.data.objects.get(nm)
        if o:
            o.hide_render = True
            for c in o.children_recursive: c.hide_render = True
    import_glb(f"{OUT}/harbor_shaft_cut.glb")
    for side, s in (("L", -1), ("R", 1)):
        d = bpy.data.objects.get(f"Elevator_Lobby_A_Door_{side}"); d.location.x += 0.7 * s
    light("R_lobby", 'POINT', (1.5, 14.5, 4.0), color='#ffe3bf', energy=400, radius=0.4)
    mark_hidden_defaults()
    shoot(cam, (0.6, 13.2, 1.7), (1.5, 17.8, 1.3), f"{OUT}/elev_lobby_open.png", lens=26)
