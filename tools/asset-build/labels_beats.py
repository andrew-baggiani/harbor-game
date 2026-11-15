"""Screen and paper textures for the Monday gap beats 6-9 (harbor_monday_beats.glb).
All names, addresses, numbers and products are fictional. No real logos or brands.
Run: python3 labels_beats.py   (writes textures/beat_*.png)"""
from PIL import Image, ImageDraw, ImageFont
import random
OUT = "/home/claude/harbor/textures"
F = "/usr/share/fonts/truetype/liberation/"
def font(sz, bold=False, mono=False, serif=False):
    n = ("LiberationMono" if mono else "LiberationSerif" if serif else "LiberationSans") + ("-Bold" if bold else "-Regular") + ".ttf"
    return ImageFont.truetype(F + n, sz)
NAVY = (30, 58, 110); PAPER = (244, 240, 230); INK = (28, 30, 34); GREY = (96, 100, 108)
RED = (176, 38, 38); AMBER = (214, 140, 20); GREEN = (40, 130, 70); WHITE = (255, 255, 255)
R = random.Random(906)

def save(im, name):
    im.save(f"{OUT}/{name}.png"); print("wrote", name, im.size)

# =====================================================================
# Beat 6: loaner laptop at hot desk 14-08 (16:10 screen, 1024 x 640)
# =====================================================================
def dock_log(d, W, H):
    """Background app: the dock log the player is meant to fill in."""
    d.rectangle([0, 0, W, H], fill=(226, 230, 236))
    d.rectangle([40, 30, W - 40, H - 70], fill=WHITE, outline=(190, 196, 204))
    d.rectangle([40, 30, W - 40, 72], fill=NAVY)
    d.text((58, 51), "Dock Log  ·  Berth 3  ·  Night", font=font(22, True), fill=PAPER, anchor="lm")
    cols = ["Time", "Container", "Vessel", "Seal", "Checked"]
    xs = [60, 170, 360, 560, 740]
    for x, c in zip(xs, cols): d.text((x, 90), c, font=font(18, True), fill=GREY)
    d.line([56, 116, W - 56, 116], fill=(200, 204, 210), width=2)
    for i in range(8):
        y = 128 + i * 38
        row = [f"{21 + (i // 4):02d}:{(i * 7) % 60:02d}", f"HRBU {R.randint(100000, 999999)}", "M/V MERIDIAN",
               f"S-{R.randint(10000, 99999)}", "" if i > 4 else "yes"]
        for x, v in zip(xs, row): d.text((x, y), v, font=font(18, mono=(x in (170, 560))), fill=INK)
        d.line([56, y + 30, W - 56, y + 30], fill=(232, 234, 238), width=1)

def taskbar(d, W, H, shield_on=True, update_ok=True, clock="22:07"):
    d.rectangle([0, H - 52, W, H], fill=(24, 28, 36))
    d.rounded_rectangle([14, H - 42, 120, H - 10], 6, fill=(44, 50, 62))
    d.text((67, H - 26), "Harbor", font=font(18, True), fill=(220, 226, 236), anchor="mm")
    for i in range(4):
        d.rounded_rectangle([140 + i * 46, H - 42, 176 + i * 46, H - 10], 6, fill=(54, 62, 76))
    x = W - 250
    # network bars
    for k in range(4): d.rectangle([x + k * 7, H - 18 - k * 5, x + k * 7 + 4, H - 14], fill=(210, 214, 220))
    # update icon (circular arrows) with badge
    cx, cy = x + 62, H - 26
    d.arc([cx - 12, cy - 12, cx + 12, cy + 12], 30, 330, fill=(210, 214, 220), width=3)
    if not update_ok:
        d.ellipse([cx + 4, cy - 16, cx + 18, cy - 2], fill=AMBER); d.text((cx + 11, cy - 9), "!", font=font(12, True), fill=INK, anchor="mm")
    # security agent shield
    sx, sy = x + 108, H - 26
    shield = [(sx - 11, sy - 13), (sx + 11, sy - 13), (sx + 11, sy), (sx, sy + 13), (sx - 11, sy)]
    d.polygon(shield, fill=(46, 170, 90) if shield_on else (110, 114, 120))
    if not shield_on:
        d.line([sx - 14, sy + 12, sx + 14, sy - 14], fill=(230, 60, 50), width=4)
    d.text((W - 60, H - 26), clock, font=font(18), fill=(220, 226, 236), anchor="mm")

def updates_screen(name, days, nfail, warn=True, ticket=None):
    W, H = 1024, 640
    im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
    dock_log(d, W, H)
    taskbar(d, W, H, shield_on=not warn and ticket is None, update_ok=not warn and ticket is None)
    if warn:
        # Device Health toast (bottom right, above the taskbar)
        x0, y0, x1, y1 = W - 470, H - 330, W - 16, H - 62
        d.rounded_rectangle([x0 + 4, y0 + 6, x1 + 4, y1 + 6], 10, fill=(150, 154, 160))
        d.rounded_rectangle([x0, y0, x1, y1], 10, fill=(250, 250, 252), outline=(200, 60, 50), width=3)
        d.rectangle([x0 + 3, y0 + 3, x1 - 3, y0 + 46], fill=(200, 60, 50))
        d.text((x0 + 20, y0 + 25), "Device Health", font=font(22, True), fill=WHITE, anchor="lm")
        d.text((x0 + 20, y0 + 64), f"Updates failed — {days} days", font=font(30, True), fill=RED)
        d.text((x0 + 20, y0 + 108), f"{nfail} security updates could not install.", font=font(19), fill=INK)
        d.text((x0 + 20, y0 + 134), f"Last successful update: {days} days ago.", font=font(19), fill=INK)
        # agent row with grey crossed shield
        sx, sy = x0 + 34, y0 + 186
        d.polygon([(sx - 14, sy - 16), (sx + 14, sy - 16), (sx + 14, sy), (sx, sy + 16), (sx - 14, sy)], fill=(120, 124, 130))
        d.line([sx - 17, sy + 15, sx + 17, sy - 17], fill=(230, 60, 50), width=4)
        d.text((x0 + 62, sy - 12), "Harbor Shield agent: OFF", font=font(20, True), fill=RED)
        d.text((x0 + 62, sy + 12), "Real-time protection is not running", font=font(16), fill=GREY)
        d.rounded_rectangle([x0 + 20, y1 - 46, x0 + 190, y1 - 12], 6, fill=(226, 228, 232))
        d.text((x0 + 105, y1 - 29), "Remind me later", font=font(17), fill=INK, anchor="mm")
        d.rounded_rectangle([x0 + 204, y1 - 46, x1 - 20, y1 - 12], 6, fill=NAVY)
        d.text(((x0 + 204 + x1 - 20) // 2, y1 - 29), "Restart now", font=font(17, True), fill=WHITE, anchor="mm")
    if ticket:
        x0, y0, x1, y1 = W - 470, H - 250, W - 16, H - 62
        d.rounded_rectangle([x0, y0, x1, y1], 10, fill=(250, 250, 252), outline=GREEN, width=3)
        d.rectangle([x0 + 3, y0 + 3, x1 - 3, y0 + 46], fill=GREEN)
        d.text((x0 + 20, y0 + 25), "IT Help Desk", font=font(22, True), fill=WHITE, anchor="lm")
        d.text((x0 + 20, y0 + 64), f"Ticket {ticket} opened", font=font(26, True), fill=INK)
        d.text((x0 + 20, y0 + 106), "A technician is pushing the updates.", font=font(19), fill=INK)
        d.text((x0 + 20, y0 + 132), "Keep the laptop on and plugged in.", font=font(19), fill=INK)
    save(im, name)

updates_screen("beat_updates_normal", 0, 0, warn=False)
updates_screen("beat_updates_warn_A", 23, 3)
updates_screen("beat_updates_warn_B", 31, 5)
updates_screen("beat_updates_ticket", 0, 0, warn=False, ticket="HD-48213")

# =====================================================================
# Beat 7: personal phone, sign-in alert (portrait 9:19.5, 480 x 1040)
# =====================================================================
def phone_base(clock="22:18"):
    W, H = 480, 1040
    im = Image.new("RGB", (W, H), (14, 18, 26)); d = ImageDraw.Draw(im)
    for y in range(H):  # dusk-blue lock-screen gradient
        t = y / H; d.line([0, y, W, y], fill=(int(18 + 20 * t), int(28 + 22 * t), int(52 + 30 * t)))
    d.text((W // 2, 150), clock, font=font(110, True), fill=(236, 240, 246), anchor="mm")
    d.text((W // 2, 228), "Monday", font=font(30), fill=(190, 198, 210), anchor="mm")
    d.rounded_rectangle([W // 2 - 70, H - 26, W // 2 + 70, H - 18], 4, fill=(200, 205, 214))
    return im, d, W, H

def signin_alert(name, city, ip, when):
    im, d, W, H = phone_base()
    x0, y0, x1, y1 = 22, 290, W - 22, 940
    d.rounded_rectangle([x0, y0, x1, y1], 26, fill=(244, 246, 250))
    d.rounded_rectangle([x0 + 22, y0 + 22, x0 + 70, y0 + 70], 10, fill=NAVY)
    d.text((x0 + 46, y0 + 46), "H", font=font(30, True), fill=PAPER, anchor="mm")
    d.text((x0 + 86, y0 + 30), "HARBOR SIGN-IN", font=font(20, True), fill=GREY)
    d.text((x1 - 24, y0 + 30), "now", font=font(20), fill=GREY, anchor="ra")
    d.text((x0 + 26, y0 + 98), "New sign-in to your", font=font(34, True), fill=INK)
    d.text((x0 + 26, y0 + 140), "Harbor account", font=font(34, True), fill=INK)
    rows = [("Where", city), ("When", when), ("Device", "Unknown browser"), ("IP address", ip)]
    y = y0 + 206
    for k, v in rows:
        d.text((x0 + 26, y), k, font=font(20), fill=GREY); d.text((x0 + 26, y + 26), v, font=font(26, True if k == "Where" else False), fill=INK)
        y += 66
    d.text((x0 + 26, y + 4), "Was this you?", font=font(30, True), fill=INK)
    d.rounded_rectangle([x0 + 22, y1 - 82, (x0 + x1) // 2 - 8, y1 - 24], 14, fill=(222, 226, 234))
    d.text((((x0 + 22) + (x0 + x1) // 2 - 8) // 2, y1 - 53), "Yes, it was me", font=font(22, True), fill=INK, anchor="mm")
    d.rounded_rectangle([(x0 + x1) // 2 + 8, y1 - 82, x1 - 22, y1 - 24], 14, fill=RED)
    d.text(((((x0 + x1) // 2 + 8) + x1 - 22) // 2, y1 - 53), "No, it wasn't me", font=font(22, True), fill=WHITE, anchor="mm")
    save(im, name)

signin_alert("beat_signin_alert_A", "Reno, NV, USA", "198.51.100.47", "Today, 22:17")
signin_alert("beat_signin_alert_B", "Tulsa, OK, USA", "203.0.113.82", "Today, 22:16")

im, d, W, H = phone_base()
x0, y0, x1, y1 = 22, 360, W - 22, 700
d.rounded_rectangle([x0, y0, x1, y1], 26, fill=(244, 246, 250))
d.ellipse([W // 2 - 40, y0 + 30, W // 2 + 40, y0 + 110], fill=GREEN)
d.line([W // 2 - 20, y0 + 72, W // 2 - 4, y0 + 88], fill=WHITE, width=8); d.line([W // 2 - 4, y0 + 88, W // 2 + 24, y0 + 54], fill=WHITE, width=8)
d.text((W // 2, y0 + 150), "Thanks. We blocked it.", font=font(30, True), fill=INK, anchor="mm")
for i, l in enumerate(["That session was signed out.", "Security has been notified and", "will help you reset your password."]):
    d.text((W // 2, y0 + 200 + i * 34), l, font=font(21), fill=GREY, anchor="mm")
save(im, "beat_signin_secured")

im = Image.new("RGB", (480, 1040), (6, 7, 9)); d = ImageDraw.Draw(im)  # screen off: near-black with faint reflection
for y in range(1040):
    t = y / 1040; v = int(6 + 10 * max(0, 1 - abs(t - 0.3) * 3))
    d.line([0, y, 480, y], fill=(v, v + 1, v + 3))
save(im, "beat_signin_dark")

# =====================================================================
# Beat 8: compose window over the player monitor (16:9, 1280 x 720)
# =====================================================================
def mail_chrome(d, W, H, title):
    d.rectangle([0, 0, W, H], fill=(238, 240, 244))
    d.rectangle([0, 0, W, 60], fill=NAVY); d.text((24, 30), "Mail", font=font(28, True), fill=PAPER, anchor="lm")
    d.rectangle([0, 60, 300, H], fill=(224, 227, 233))
    for i, s in enumerate(["Inbox", "Drafts", "Sent", "Archive", "Junk"]):
        d.text((26, 90 + i * 46), s, font=font(24, i == (2 if title == "sent" else 1)), fill=INK)

def compose(name, to_name, to_tag, to_addr, suggestions):
    W, H = 1280, 720
    im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
    mail_chrome(d, W, H, "compose")
    x0, y0 = 330, 80
    d.rectangle([x0, y0, W - 30, H - 20], fill=WHITE, outline=(196, 200, 208))
    d.rectangle([x0, y0, W - 30, y0 + 46], fill=(214, 220, 232))
    d.text((x0 + 18, y0 + 23), "New message", font=font(22, True), fill=INK, anchor="lm")
    # To line with the recipient chip
    d.text((x0 + 18, y0 + 66), "To", font=font(22), fill=GREY)
    chip = f"{to_name} ({to_tag})"
    cw = d.textlength(chip, font=font(22, True)) + 36
    ext = to_tag != "Harbor"
    d.rounded_rectangle([x0 + 60, y0 + 58, x0 + 60 + cw, y0 + 94], 16, fill=(252, 236, 214) if ext else (222, 232, 248),
                        outline=AMBER if ext else (120, 150, 200), width=2)
    d.text((x0 + 78, y0 + 76), chip, font=font(22, True), fill=INK, anchor="lm")
    d.text((x0 + 76 + cw, y0 + 76), f"<{to_addr}>", font=font(19), fill=GREY, anchor="lm")
    # autocomplete dropdown still open under the To line
    dy = y0 + 102
    d.rectangle([x0 + 60, dy, x0 + 640, dy + 30 + 44 * len(suggestions)], fill=WHITE, outline=(170, 176, 186), width=2)
    d.text((x0 + 74, dy + 6), "Suggested", font=font(16), fill=GREY)
    for i, (n, tag, addr) in enumerate(suggestions):
        yy = dy + 28 + i * 44
        if i == 0: d.rectangle([x0 + 62, yy, x0 + 638, yy + 42], fill=(222, 232, 248))
        d.text((x0 + 76, yy + 4), f"{n} ({tag})", font=font(19, True), fill=INK)
        d.text((x0 + 76, yy + 24), addr, font=font(15), fill=GREY)
    by = dy + 40 + 44 * len(suggestions)
    d.line([x0 + 18, by, W - 48, by], fill=(220, 222, 228))
    d.text((x0 + 18, by + 14), "Subject", font=font(22), fill=GREY)
    d.text((x0 + 110, by + 14), "Tonight's manifest — M/V MERIDIAN, Berth 3", font=font(22, True), fill=INK)
    d.line([x0 + 18, by + 52, W - 48, by + 52], fill=(220, 222, 228))
    # attachment chip
    ay = by + 66
    d.rounded_rectangle([x0 + 18, ay, x0 + 470, ay + 56], 8, fill=(244, 246, 250), outline=(196, 200, 208))
    d.rectangle([x0 + 30, ay + 10, x0 + 62, ay + 46], fill=(40, 110, 70))
    d.text((x0 + 46, ay + 28), "X", font=font(18, True), fill=WHITE, anchor="mm")
    d.text((x0 + 74, ay + 8), "Manifest_MERIDIAN_Mon.xlsx", font=font(19, True), fill=INK)
    d.text((x0 + 74, ay + 32), "212 KB · Customer names, addresses, phone", font=font(15), fill=GREY)
    for i, l in enumerate(["Mark,", "", "Here's tonight's full manifest for the Meridian load.", "", "Thanks"]):
        d.text((x0 + 18, ay + 80 + i * 32), l, font=font(21), fill=INK)
    d.rounded_rectangle([x0 + 18, H - 74, x0 + 158, H - 32], 8, fill=NAVY)
    d.text((x0 + 88, H - 53), "Send", font=font(22, True), fill=WHITE, anchor="mm")
    d.text((x0 + 180, H - 53), "Discard", font=font(20), fill=GREY, anchor="lm")
    if ext:
        d.text((W - 50, H - 53), "! 1 recipient is outside Harbor", font=font(18, True), fill=AMBER, anchor="rm")
    save(im, name)

def sent(name, to_name, to_tag, to_addr):
    W, H = 1280, 720
    im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
    mail_chrome(d, W, H, "sent")
    x0 = 330
    d.rectangle([x0, 80, W - 30, H - 20], fill=WHITE, outline=(196, 200, 208))
    d.rectangle([x0, 80, W - 30, 136], fill=(252, 236, 214))
    d.text((x0 + 18, 108), f"Sent to {to_name} ({to_tag}) · Undo is no longer available", font=font(21, True), fill=(120, 70, 10), anchor="lm")
    items = [(f"To: {to_name} ({to_tag})", "Tonight's manifest — M/V MERIDIAN, Berth 3", "22:31", True),
             ("To: IT Service Desk", "Re: second screen", "19:02", False),
             ("To: June Park", "Badge pickup", "18:40", False)]
    for i, (a, b, t, hi) in enumerate(items):
        y = 150 + i * 92
        if hi: d.rectangle([x0 + 2, y - 6, W - 32, y + 78], fill=(240, 244, 250))
        d.text((x0 + 22, y), a, font=font(22, True), fill=INK); d.text((x0 + 22, y + 34), b, font=font(20), fill=GREY)
        d.text((W - 54, y), t, font=font(18), fill=GREY, anchor="ra")
        if hi: d.text((x0 + 22, y + 58), f"{to_addr}  ·  1 attachment", font=font(15), fill=GREY)
    save(im, name)

compose("beat_misdirect_compose_A", "Mark Delaney", "external", "m.delaney@calderfreight.example",
        [("Mark Delaney", "external", "m.delaney@calderfreight.example"), ("Mark Delgado", "Harbor", "mark.delgado@harborandco.com")])
compose("beat_misdirect_compose_B", "Mark Delgado", "personal", "markd.home@inboxly.example",
        [("Mark Delgado", "personal", "markd.home@inboxly.example"), ("Mark Delgado", "Harbor", "mark.delgado@harborandco.com")])
sent("beat_misdirect_sent_A", "Mark Delaney", "external", "m.delaney@calderfreight.example")
sent("beat_misdirect_sent_B", "Mark Delgado", "personal", "markd.home@inboxly.example")

# =====================================================================
# Beat 9: printouts with customer data (Letter portrait, 850 x 1100)
# =====================================================================
FIRST = ["Alma", "Desmond", "Priya", "Tomasz", "Lucia", "Grant", "Noor", "Wendell", "Ines", "Rafael", "Odette", "Kofi", "Marisol", "Bram"]
LAST = ["Okafor", "Lindqvist", "Varga", "Castellano", "Pruitt", "Haddad", "Moreau", "Tanaka", "Brennan", "Szabo", "Achebe", "Whitlock"]
STREETS = ["Quarry Ln", "Ferris Ave", "Tidewater Rd", "Lantern St", "Pier 9 Way", "Gull Ct", "Mast Ave", "Cooper Row"]
TOWNS = ["Port Calder", "Wynne Harbor", "Northdock", "Saltmere", "Eastquay"]

def page_head(d, W, title, sub):
    d.text((50, 40), "HARBOR & CO.", font=font(30, True), fill=NAVY)
    d.text((W - 50, 46), "CONFIDENTIAL · CUSTOMER DATA", font=font(18, True), fill=RED, anchor="ra")
    d.text((50, 86), title, font=font(24, True), fill=INK)
    d.text((50, 120), sub, font=font(17), fill=GREY)
    d.line([50, 150, W - 50, 150], fill=INK, width=2)

def manifest(name):
    W, H = 850, 1100
    im = Image.new("RGB", (W, H), PAPER); d = ImageDraw.Draw(im)
    page_head(d, W, "Cargo Manifest — M/V MERIDIAN · Berth 3", "Printed Mon 22:34 by New Hire (14-03) · page 1 of 6")
    cols = [("Consignee", 50), ("Address", 250), ("Phone", 520), ("Acct", 690)]
    for c, x in cols: d.text((x, 166), c, font=font(16, True), fill=GREY)
    for i in range(22):
        y = 196 + i * 38
        n = f"{R.choice(FIRST)} {R.choice(LAST)}"
        a = f"{R.randint(12, 980)} {R.choice(STREETS)}, {R.choice(TOWNS)}"
        p = f"(555) 01{R.randint(0, 9)}-{R.randint(1000, 9999)}"
        ac = f"HC-{R.randint(100000, 999999)}"
        for v, (_, x) in zip((n, a, p, ac), cols): d.text((x, y), v, font=font(15, mono=(x >= 520)), fill=INK)
        d.line([50, y + 30, W - 50, y + 30], fill=(214, 208, 196), width=1)
    d.text((50, H - 50), "Internal use only. Dispose of in the locked shred console.", font=font(15), fill=GREY)
    save(im, name)

def contacts(name):
    W, H = 850, 1100
    im = Image.new("RGB", (W, H), PAPER); d = ImageDraw.Draw(im)
    page_head(d, W, "Customer Contact List — Q4 Renewals", "Printed Mon 22:34 by New Hire (14-03) · page 1 of 4")
    for i in range(10):
        y = 170 + i * 88
        n = f"{R.choice(FIRST)} {R.choice(LAST)}"
        d.text((50, y), n, font=font(19, True), fill=INK)
        d.text((50, y + 28), f"{R.randint(12, 980)} {R.choice(STREETS)}, {R.choice(TOWNS)}", font=font(15), fill=INK)
        d.text((50, y + 50), f"{n.split()[0].lower()}.{n.split()[1].lower()}@mail.example · (555) 01{R.randint(0, 9)}-{R.randint(1000, 9999)}", font=font(15), fill=GREY)
        d.text((W - 50, y), f"Card on file: •••• {R.randint(1000, 9999)}", font=font(15, mono=True), fill=INK, anchor="ra")
        d.text((W - 50, y + 28), f"Contract HC-{R.randint(100000, 999999)}", font=font(15, mono=True), fill=GREY, anchor="ra")
        d.line([50, y + 76, W - 50, y + 76], fill=(214, 208, 196), width=1)
    d.text((50, H - 50), "Internal use only. Dispose of in the locked shred console.", font=font(15), fill=GREY)
    save(im, name)

manifest("beat_print_manifest_A")
contacts("beat_print_contacts_B")
print("labels beats ok")

# ---- the new hire's own sticky note (variant A of the clean-desk beat) ----
im = Image.new("RGB", (256, 256), (250, 226, 92)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 255, 22], fill=(238, 210, 70))
try:
    hand = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf", 36)
except OSError:
    hand = font(36, serif=True)
for i, l in enumerate(["Harbor login", "newhire14", "Quay-Night-14"]):
    d.text((128, 70 + i * 58), l, font=hand, fill=(25, 35, 90), anchor="mm")
save(im, "beat_sticky_newhire")
