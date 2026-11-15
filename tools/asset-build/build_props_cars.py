"""Standalone GLBs: interaction props (each at its own origin) and the three vehicles."""
import sys; sys.path.insert(0, '/home/claude/harbor')
import bpy, math
from lib import *
from cars import make_car
T = "/home/claude/harbor/textures"

# ---------------- props ----------------
reset()
def card(name, tex, w, h, t=0.0008, x=0.0, portrait=False, role=""):
    mb = MB(name)
    mb.box(x - w/2, -t/2, 0, x + w/2, t/2, h, "plastic_white")
    lab = MB(name + "_Print")
    yf = -t/2 - 0.0002
    quad_uv(lab, (x - w/2, yf, 0), (x + w/2, yf, 0), (x + w/2, yf, h), (x - w/2, yf, h), f"img:{tex}")
    o = mb.build(origin=(x, 0, 0)); set_parent(lab.build(fix_normals=False), o)
    return tag(o, role=role)

# player badge (portrait CR80) + clip + lanyard stub (lanyard itself should be rigged to the character)
badge = card("Badge_Player", f"{T}/label_badge.png", 0.054, 0.0856, x=0.0, role="badge")
tag(badge, works_on_reader=True, note="attach to lanyard bone on the new-hire rig; tap face = -Y (glTF +Z)")
clip = MB("Badge_Clip")
clip.box(-0.007, -0.002, 0.0856, 0.007, 0.002, 0.098, "plastic_grey")
clip.box(-0.009, -0.004, 0.098, 0.009, 0.004, 0.104, "chrome")
clip.box(-0.006, -0.002, 0.104, 0.006, 0.002, 0.14, "fabric_navy")
set_parent(clip.build(), badge)

blank = card("Courier_BlankCard", f"{T}/label_blankcard.png", 0.0856, 0.054, x=0.25, role="blank_card")
tag(blank, works_on_reader=False, note="reader stays red")

# Maya's phone
ph = MB("Maya_Phone")
PX = 0.5
ph.box(PX - 0.036, -0.004, 0, PX + 0.036, 0.004, 0.152, "plastic_black")
ph.box(PX - 0.0365, -0.0035, 0.002, PX + 0.0365, 0.0035, 0.150, "alloy")
phone = tag(ph.build(origin=(PX, 0, 0)), role="phone", owner="maya")
scr = MB("Maya_Phone_Screen")
quad_uv(scr, (PX - 0.033, -0.0042, 0.004), (PX + 0.033, -0.0042, 0.004), (PX + 0.033, -0.0042, 0.148), (PX - 0.033, -0.0042, 0.148),
        f"imgemit:{T}/label_phone.png")
set_parent(scr.build(fix_normals=False), phone)

# wire form (A4, slight curl via 6 strips)
wf = MB("Wire_Form")
FX = 0.85; W, H = 0.210, 0.297
for i in range(6):
    z0, z1 = H * i / 6, H * (i + 1) / 6
    c0 = 0.004 * math.sin(math.pi * i / 6); c1 = 0.004 * math.sin(math.pi * (i + 1) / 6)
    wf.face([(FX - W/2, -c0, z0), (FX + W/2, -c0, z0), (FX + W/2, -c1, z1), (FX - W/2, -c1, z1)], f"img:{T}/label_wireform.png",
            uvs=[(0, i / 6), (1, i / 6), (1, (i + 1) / 6), (0, (i + 1) / 6)])
    wf.face([(FX - W/2, -c1 + 0.0002, z1), (FX + W/2, -c1 + 0.0002, z1), (FX + W/2, -c0 + 0.0002, z0), (FX - W/2, -c0 + 0.0002, z0)], "paper_white")
tag(wf.build(origin=(FX, 0, 0), fix_normals=False), role="wire_form", owner="maya")

# USB + envelope duplicates for hand-held use
us = MB("USB_SalaryReview_Handheld"); UX = 1.1
us.box(UX - 0.028, -0.009, 0, UX + 0.028, 0.009, 0.008, "plastic_black")
us.box(UX + 0.028, -0.006, 0.0015, UX + 0.04, 0.006, 0.0065, "metal_brushed")
usb = tag(us.build(origin=(UX, 0, 0)), role="usb_stick", label="Salary review")
ul = MB("USB_Label")
quad_uv(ul, (UX - 0.024, -0.0075, 0.0081), (UX + 0.024, -0.0075, 0.0081), (UX + 0.024, 0.0075, 0.0081), (UX - 0.024, 0.0075, 0.0081), f"img:{T}/label_usb.png")
set_parent(ul.build(fix_normals=False), usb)
ev = MB("Envelope_Handheld"); EX = 1.4
ev.box(EX - 0.11, -0.002, 0, EX + 0.11, 0.0, 0.1, "paper_white")
evo = tag(ev.build(origin=(EX, 0, 0)), role="envelope")
el = MB("Envelope_Front")
quad_uv(el, (EX - 0.11, -0.0022, 0), (EX + 0.11, -0.0022, 0), (EX + 0.11, -0.0022, 0.1), (EX - 0.11, -0.0022, 0.1), f"img:{T}/label_envelope.png")
set_parent(el.build(fix_normals=False), evo)
# evidence bag for "bag it for IT"
eb = MB("Evidence_Bag"); BX = 1.75
eb.box(BX - 0.08, -0.003, 0, BX + 0.08, 0.003, 0.12, "glass_clear")
eb.box(BX - 0.08, -0.0035, 0.105, BX + 0.08, 0.0035, 0.112, "ship_red")
tag(eb.build(origin=(BX, 0, 0)), role="evidence_bag")
print("PROPS TRIS", stats())
export(f"{OUT}/harbor_props.glb")

cam = setup_render(night=False, res=(1400, 600), samples=24)
light("key", 'AREA', (0.9, -1.2, 0.8), color='#ffffff', energy=60, rot=(math.radians(55), 0, math.radians(-35)))
gm = MB("bg"); gm.box(-1, -1, -0.01, 3, 2, 0, "plaster_white"); gm.box(-1, 0.3, 0, 3, 0.32, 1.0, "plaster_white"); gm.build()
shoot(cam, (0.88, -1.9, 0.35), (0.88, 0, 0.06), f"{OUT}/props_preview.png", lens=50)

# ---------------- vehicles ----------------
for kind, name, paint, drive in (("sedan", "Company_Sedan_Navy", "car_navy", True),
                                  ("hatch", "Traffic_Hatch_Silver", "car_silver", False),
                                  ("suv", "Traffic_SUV_Charcoal", "car_charcoal", False),
                                  ("sedan", "Traffic_Sedan_White", "car_white", False)):
    reset()
    make_car(kind, name, paint=paint, headlights=drive)
    print(name, "TRIS", stats())
    export(f"{OUT}/vehicle_{name}.glb")
