"""harbor_monday_beats.glb: interactive props for the Monday gap beats 6-9 (floor 14).
World-aligned with harbor_office_f14.glb / harbor_f14_detail.glb: load at the origin, no offset.
Nothing from the existing GLBs is duplicated or moved. Every interactive object is its own named node;
its data is in glTF extras (three.js userData). Variant screens of one prop share one spot: show exactly one.

Beat 6 (CIS 14.7)      Beat_Updates_Laptop        loaner laptop on Desk_08 ("hot desk 14-08")
Beat 7 (HIPAA C, 14.6) Beat_Signin_Phone          personal phone lying on Desk_Player
Beat 8 (CIS 14.5/14.4) Beat_Misdirect_Screen_*    overlays exactly over Monitor_Player_Screen
Beat 9 (CIS 14.4/14.3) Beat_CleanDesk_*           printouts on the printer, sticky + lock-screen overlays

Rebuild: python3 labels_beats.py && python3 build_monday_beats.py [--render all|updates,signin,...]
"""
import sys; sys.path.insert(0, '/home/claude/harbor')
from lib2 import *

RENDER = "--render" in sys.argv
reset()
F = 50.6; CEIL = F + 3.0; FT = F + 0.74

def screen(name, c, w, h, normal, tex, up=None, emit=True, **tags):
    """Single textured quad node (origin at its centre)."""
    mb = MB(name); label(mb, c, w, h, normal, imge(tex) if emit else img(tex), up=up)
    o = mb.build(origin=tuple(c), fix_normals=False)
    tag(o, **tags)
    return o

def child(o, parent):
    set_parent(o, parent); return o

# =====================================================================
# Beat 6: loaner laptop on Desk_08 (x 3.3..4.9, y 7.4..8.2, user sits toward +y)
# Placed right of the keyboard/mouse, clear of the paper tray (y <= 7.71).
# =====================================================================
LX, LY0, LY1 = 4.69, 7.83, 8.07          # base: x LX +-0.17, y LY0..LY1 (hinge at LY0, back edge)
LZ = FT + 0.006                          # sits on the loose papers
TILT = math.radians(15)                  # lid leans back toward -y
lp = MB("Beat_Updates_Laptop")
lp.box(LX - 0.17, LY0, LZ, LX + 0.17, LY1, LZ + 0.016, "metal_brushed")
lp.box(LX - 0.15, LY0 + 0.03, LZ + 0.016, LX + 0.15, LY0 + 0.14, LZ + 0.0172, "plastic_black")   # keys
lp.box(LX - 0.05, LY0 + 0.16, LZ + 0.016, LX + 0.05, LY0 + 0.22, LZ + 0.0168, "plastic_grey")   # trackpad
def lid(x, d, h):  # d: thickness offset (toward -y), h: height along the lid
    return (x, LY0 - h * math.sin(TILT) - d * math.cos(TILT), LZ + 0.016 + h * math.cos(TILT) - d * math.sin(TILT))
A = [lid(LX - 0.17, 0, 0), lid(LX + 0.17, 0, 0), lid(LX + 0.17, 0, 0.225), lid(LX - 0.17, 0, 0.225)]
B = [lid(LX - 0.17, 0.007, 0), lid(LX + 0.17, 0.007, 0), lid(LX + 0.17, 0.007, 0.225), lid(LX - 0.17, 0.007, 0.225)]
lp.loft([A, B], "metal_brushed")
# black glass bezel just in front of the lid face
lp.face([lid(LX - 0.165, -0.0006, 0.006), lid(LX + 0.165, -0.0006, 0.006), lid(LX + 0.165, -0.0006, 0.219), lid(LX - 0.165, -0.0006, 0.219)], "glass_dark")
laptop = tag(lp.build(origin=(LX, LY0, LZ)), role="beat_updates", beat="MON-06-updates", interactive=True, collider="box",
             interact_hint="E  ·  Check the laptop", interact_radius=1.4, desk="Desk_08", desk_label="14-08",
             default_visible=True,
             note="Loaner laptop for the dock log. Children are screen states; show exactly one. "
                  "Default _Normal; at beat start show _Warn_A or _Warn_B (variant); after updates-report show _Ticket.")
SC = (LX, *lid(LX, -0.0012, 0.1125)[1:])
SN = (0, math.cos(TILT), math.sin(TILT)); SU = (0, -math.sin(TILT), math.cos(TILT))
for nm, tex, vis, st, var in (("Normal", "beat_updates_normal", True, "normal", None),
                              ("Warn_A", "beat_updates_warn_A", False, "warning", "A"),
                              ("Warn_B", "beat_updates_warn_B", False, "warning", "B"),
                              ("Ticket", "beat_updates_ticket", False, "reported", None)):
    t = dict(role="beat_updates_screen", state=st, default_visible=vis, collider="none")
    if var: t["variant"] = var
    if st == "warning": t["shows"] = "Updates failed - %s days; Harbor Shield agent OFF" % ("23" if var == "A" else "31")
    child(screen(f"Beat_Updates_Screen_{nm}", SC, 0.30, 0.1875, SN, tex, up=SU, **t), laptop)

# =====================================================================
# Beat 7: the player's own phone, face up on Desk_Player (right of the keyboard, near the front edge)
# Desk_Player: x -6.6..-5.0, y 1.35..2.15; the player sits toward +y and reads the phone top-toward-monitor.
# =====================================================================
PX, PY, RZ = -5.25, 2.02, math.radians(-8)
ph = MB("Beat_Signin_Phone")
ph.box(-0.0375, -0.0775, 0, 0.0375, 0.0775, 0.008, "plastic_black")
ph.box(-0.0385, -0.0785, 0.0005, 0.0385, 0.0785, 0.0075, "alloy")         # thin metal band
ph.box(0.0125, 0.045, -0.0015, 0.03, 0.07, 0.0, "plastic_grey")             # camera bump (underside)
xform(ph, RZ, (PX, PY, FT))
phone = tag(ph.build(origin=(PX, PY, FT)), role="beat_signin", beat="MON-07-signin", interactive=True, pickup=True,
            collider="none", interact_hint="E  ·  Check your phone", interact_radius=1.2, default_visible=True,
            buzz=True, note="Player's personal phone. Children are screen states; show exactly one. Default _Dark. "
                             "Beat start: show _Alert_A or _Alert_B (variant) and jitter the phone (buzz). "
                             "After signin-report show _Secured; after signin-yes / signin-ignore go back to _Dark.")
for nm, tex, vis, st, var in (("Dark", "beat_signin_dark", True, "dark", None),
                              ("Alert_A", "beat_signin_alert_A", False, "alert", "A"),
                              ("Alert_B", "beat_signin_alert_B", False, "alert", "B"),
                              ("Secured", "beat_signin_secured", False, "secured", None)):
    mb = MB(f"Beat_Signin_Phone_Screen_{nm}")
    label(mb, (0, 0, 0.0084), 0.069, 0.1495, '+z', imge(tex) if nm != "Dark" else img(tex), up=(0, -1, 0))
    xform(mb, RZ, (PX, PY, FT))
    t = dict(role="beat_signin_screen", state=st, default_visible=vis, collider="none")
    if var: t["variant"] = var; t["shows"] = "New sign-in from %s. Was this you?" % ("Reno, NV" if var == "A" else "Tulsa, OK")
    child(tag(mb.build(origin=(PX, PY, FT + 0.0084), fix_normals=False), **t), phone)

# =====================================================================
# Beat 8: compose / sent overlays exactly over Monitor_Player_Screen
# Monitor_Player_Screen (harbor_office_f14.glb): centre (-5.8, 1.571, F+1.105), 0.60 x 0.33, faces +y.
# The overlays sit 2 mm in front of it.
# =====================================================================
MCX, MFY, MCZ, MW, MH = -5.8, 1.571, F + 1.105, 0.60, 0.33
for nm, tex, st, var in (("Compose_A", "beat_misdirect_compose_A", "compose", "A"),
                         ("Compose_B", "beat_misdirect_compose_B", "compose", "B"),
                         ("Sent_A", "beat_misdirect_sent_A", "sent", "A"),
                         ("Sent_B", "beat_misdirect_sent_B", "sent", "B")):
    screen(f"Beat_Misdirect_Screen_{nm}", (MCX, MFY + 0.002, MCZ), MW, MH, '+y', tex,
           role="beat_misdirect", beat="MON-08-misdirect", state=st, variant=var, default_visible=False,
           collider="none", overlays="Monitor_Player_Screen", interactive=(st == "compose"),
           interact_hint="E  ·  Send the manifest" if st == "compose" else "",
           shows=("To: Mark Delaney (external), manifest attached" if var == "A" else
                  "To: Mark Delgado (personal), manifest attached") if st == "compose" else "Sent confirmation, Undo gone",
           note="Overlay quad over the player monitor. Show one at a time; hide all when the beat ends.")

# =====================================================================
# Beat 9: clean desk at end of shift
# =====================================================================
# 9a. printouts with customer data on top of the printer (x 7.65..8.35, top at F+1.05),
#     beside the existing Printer_Output_Sheets (x 7.74..7.97), so both can show at once.
for var, tex, kind in (("A", "beat_print_manifest_A", "cargo_manifest"), ("B", "beat_print_contacts_B", "customer_contact_list")):
    cx, cy, z = 8.13, 15.80, F + 1.05
    po = MB(f"Beat_CleanDesk_Printouts_{var}")
    for k in range(4):
        po.box(-0.108, -0.1395, k * 0.0012, 0.108, 0.1395, k * 0.0012 + 0.0012, "paper_white", rot=0.02 * (k - 1.5), pivot=(0, 0))
    xform(po, math.radians(-4), (cx, cy, z))
    o = tag(po.build(origin=(cx, cy, z)), role="beat_cleandesk_printouts", beat="MON-09-cleandesk", variant=var, content=kind,
            interactive=True, pickup=True, collider="none", default_visible=False, hook="unclaimed_printout",
            interact_hint="E  ·  Pick up your printouts", dispose_to="Shred_Bin_Secure",
            note="The player's own print job with customer data. Correct disposal: Shred_Bin_Secure. "
                 "Recycle_Bin_Paper / Trash_Bin / taking it home are wrong.")
    pl = MB(f"Beat_CleanDesk_Printouts_{var}_Print")
    label(pl, (0, 0, 0.0049), 0.212, 0.274, '+z', img(tex), up=(0, 1, 0))
    xform(pl, math.radians(-4) + 0.02 * 1.5, (cx, cy, z))
    child(tag(pl.build(origin=(cx, cy, z + 0.0049), fix_normals=False), collider="none"), o)

# 9b. variant A: the new hire's own password sticky on the player monitor (bottom-right corner as seen by the player)
screen("Beat_CleanDesk_Sticky_Player", (MCX - 0.245, MFY + 0.0065, F + 0.975), 0.075, 0.075, '+y', "beat_sticky_newhire",
       emit=False, role="beat_cleandesk_sticky", beat="MON-09-cleandesk", variant="A", hook="password_sticky_note",
       interactive=True, pickup=True, collider="none", default_visible=False,
       interact_hint="E  ·  Take the sticky note",
       note="Variant A only. Show it from the start of the shift (the new hire wrote the password down). "
            "Variant B uses Sticky_Password_Desk07 in harbor_f14_detail.glb instead.")
# 9c. lock-screen overlays (shown after a lock choice)
screen("Beat_CleanDesk_PlayerScreen_Locked", (MCX, MFY + 0.004, MCZ), MW, MH, '+y', "label_screen_locked",
       role="beat_cleandesk_lockscreen", beat="MON-09-cleandesk", variant="A", state="locked", default_visible=False,
       collider="none", overlays="Monitor_Player_Screen",
       note="Variant A: show after cleandesk-lock or cleandesk-shred. Sits in front of the misdirect overlays.")
D7CX, D7FR = 2.4, 7.58 + 0.0265                     # Desk_07 monitor centre x and screen front (from build_f14_detail.py)
screen("Beat_CleanDesk_Desk07Screen_Locked", (D7CX, D7FR + 0.0006, F + 1.105), 0.58, 0.32, '+y', "label_screen_locked",
       role="beat_cleandesk_lockscreen", beat="MON-09-cleandesk", variant="B", state="locked", default_visible=False,
       collider="none", overlays="Monitor_Desk07_Screen",
       note="Variant B: show after cleandesk-lock or cleandesk-shred (covers the unlocked Vendor_payments_Q4.xlsx).")

print("TRIANGLES", stats())
export(f"{OUT}/harbor_monday_beats.glb")

# =====================================================================
# Cycles previews in context (imports the existing floor-14 GLBs for the render only)
# =====================================================================
if RENDER:
    which = sys.argv[sys.argv.index("--render") + 1] if len(sys.argv) > sys.argv.index("--render") + 1 else "all"
    import_glb(f"{OUT}/harbor_office_f14.glb")
    import_glb(f"{OUT}/harbor_f14_detail.glb")
    mark_hidden_defaults()
    def show(nm, v=True): bpy.data.objects[nm].hide_render = not v
    for i, (x, y) in enumerate(((-5.5, 2.4), (4.2, 8.6), (7.6, 14.8), (2.4, 8.4), (-2.0, 7.5))):
        light(f"R_F{i}", 'POINT', (x, y, CEIL - 0.3), color='#dfe9f5', energy=160, radius=0.4)
    for o in bpy.data.objects:
        if o.type == "LIGHT": o.visible_camera = False; o.visible_transmission = False; o.visible_glossy = False
    cam = setup_render(night=True, res=(1100, 680), samples=24)
    def states(on):
        beat = [o for o in bpy.data.objects if o.name.startswith("Beat_") and o.type == "MESH"]
        for o in beat:
            if o.get("default_visible") is False:
                o.hide_render = True
                for c in o.children_recursive: c.hide_render = True   # three.js hides children with the parent
        upd = any("Updates_Screen" in n for n in on); sig = any("Signin_Phone_Screen" in n for n in on)
        show("Beat_Updates_Screen_Normal", not upd); show("Beat_Signin_Phone_Screen_Dark", not sig)
        for nm in on:
            show(nm)
            for c in bpy.data.objects[nm].children: c.hide_render = False
    shots = {
        "updates":   ((4.75, 8.78, F + 1.45), (4.69, 7.86, F + 0.92), 32, ["Beat_Updates_Screen_Warn_A"]),
        "updates_wide": ((3.6, 9.9, F + 1.62), (4.3, 7.8, F + 0.85), 26, ["Beat_Updates_Screen_Warn_B"]),
        "signin":    ((-5.32, 2.62, F + 1.22), (-5.26, 2.0, FT), 34, ["Beat_Signin_Phone_Screen_Alert_A"]),
        "misdirect": ((-5.72, 2.62, F + 1.24), (-5.8, 1.57, F + 1.08), 32, ["Beat_Misdirect_Screen_Compose_A"]),
        "desk":      ((-4.6, 3.3, F + 1.6), (-5.8, 1.7, F + 0.85), 26, ["Beat_Misdirect_Screen_Sent_B", "Beat_Signin_Phone_Screen_Alert_B",
                                                                          "Beat_CleanDesk_Sticky_Player"]),
        "print":     ((7.75, 14.75, F + 1.62), (8.05, 15.85, F + 1.0), 30, ["Beat_CleanDesk_Printouts_A"]),
        "cleandesk": ((-5.45, 2.75, F + 1.35), (-5.85, 1.57, F + 1.0), 30, ["Beat_CleanDesk_PlayerScreen_Locked", "Beat_CleanDesk_Sticky_Player"]),
        "desk07":    ((2.75, 8.75, F + 1.35), (2.4, 7.6, F + 1.05), 30, ["Beat_CleanDesk_Desk07Screen_Locked"]),
    }
    for nm, (pos, tgt, lens, on) in shots.items():
        if which == "all" or nm in which.split(","):
            states(on)
            shoot(cam, pos, tgt, f"{OUT}/beats_{nm}.png", lens=lens)
