"""Printed/label textures for interaction props (all fictional, no real logos)."""
from PIL import Image, ImageDraw, ImageFont
import random
OUT = "/home/claude/harbor/textures"
F = "/usr/share/fonts/truetype/liberation/"
def font(sz, bold=False, mono=False, serif=False):
    n = ("LiberationMono" if mono else "LiberationSerif" if serif else "LiberationSans") + ("-Bold" if bold else "-Regular") + ".ttf"
    return ImageFont.truetype(F + n, sz)
NAVY = (30, 58, 110); PAPER = (244, 240, 230); INK = (28, 30, 34)

# ---- player badge (portrait CR80: 54 x 85.6 mm) ----
im = Image.new("RGB", (540, 856), (250, 249, 245)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 540, 170], fill=NAVY)
d.text((270, 62), "HARBOR & CO.", font=font(54, True), fill=PAPER, anchor="mm")
d.text((270, 122), "QUAYSIDE OPERATIONS", font=font(26), fill=(200, 210, 230), anchor="mm")
d.rounded_rectangle([150, 215, 390, 515], 12, fill=(214, 216, 220))
d.ellipse([215, 255, 325, 365], fill=(120, 96, 78))                 # head (brown hair framing)
d.ellipse([228, 275, 312, 368], fill=(205, 170, 140))
d.rounded_rectangle([190, 380, 350, 515], 40, fill=NAVY)           # navy overshirt
d.text((270, 575), "NEW HIRE", font=font(48, True), fill=INK, anchor="mm")
d.text((270, 630), "NIGHT SHIFT  ·  FLOOR 14", font=font(26), fill=(90, 92, 98), anchor="mm")
d.text((270, 672), "IT DESK: EXT 4100 (ON BACK)", font=font(22), fill=(90, 92, 98), anchor="mm")
r = random.Random(3); x = 110
while x < 430:
    w = r.choice([3, 3, 5, 7]); d.rectangle([x, 720, x + w, 800], fill=INK); x += w + r.choice([3, 4, 6])
d.rectangle([0, 836, 540, 856], fill=NAVY)
im.save(f"{OUT}/label_badge.png")

# ---- blank courier card (pure white, slight wear) ----
im = Image.new("RGB", (856, 540), (247, 247, 244)); d = ImageDraw.Draw(im)
for _ in range(40):
    x, y = r.randint(0, 856), r.randint(0, 540); d.line([x, y, x + r.randint(-40, 40), y + r.randint(-3, 3)], fill=(232, 232, 228))
im.save(f"{OUT}/label_blankcard.png")

# ---- USB stick label "Salary review" (handwritten-ish on white tape) ----
im = Image.new("RGB", (512, 128), (238, 236, 228)); d = ImageDraw.Draw(im)
d.text((256, 64), "Salary review", font=font(56, False, serif=True), fill=(25, 35, 80), anchor="mm")
im.save(f"{OUT}/label_usb.png")

# ---- wire form (A4 portrait, 1240x1754) ----
im = Image.new("RGB", (1240, 1754), PAPER); d = ImageDraw.Draw(im)
d.text((90, 90), "HARBOR & CO.", font=font(48, True), fill=NAVY)
d.text((90, 150), "Treasury — Outgoing Wire Request (manual)", font=font(32), fill=INK)
d.line([90, 210, 1150, 210], fill=INK, width=3)
rows = [("Date", "Monday, 21:40"), ("Beneficiary", "Calder & Wynne Holdings Ltd."), ("Beneficiary bank", "Quayline Trust Bank — acct ending 7731"),
        ("Amount", "USD 2,480,000.00"), ("Reference", "Project Lantern — acquisition deposit"),
        ("Requested by", "Elena Voss (verbal, per Maya Ruiz)"), ("Reason for manual form", "Payments portal down — release tonight"),
        ("Callback verified", "☐ Yes   ☐ No   Number used: ____________"), ("Approver signature", "_______________________________")]
y = 260
for k, v in rows:
    d.text((90, y), k.upper(), font=font(22, True), fill=(95, 98, 104)); d.text((90, y + 32), v, font=font(34, mono=(k == "Amount")), fill=INK)
    d.line([90, y + 84, 1150, y + 84], fill=(200, 196, 186), width=2); y += 118
d.rectangle([90, y + 30, 1150, y + 200], outline=(170, 40, 40), width=3)
d.text((110, y + 50), "POLICY: Any new or changed payment instruction must be confirmed", font=font(26), fill=(150, 30, 30))
d.text((110, y + 90), "by calling the requester on a number already on file. Never use", font=font(26), fill=(150, 30, 30))
d.text((110, y + 130), "a number supplied in the request itself.", font=font(26), fill=(150, 30, 30))
d.text((90, 1680), "Form TR-07 · rev 3", font=font(20), fill=(130, 130, 130))
im.save(f"{OUT}/label_wireform.png")

# ---- Maya's phone screen ----
im = Image.new("RGB", (540, 1170), (16, 18, 22)); d = ImageDraw.Draw(im)
d.text((270, 60), "21:41", font=font(40, True), fill=(235, 235, 235), anchor="mm")
d.text((270, 140), "Elena Voss", font=font(36, True), fill=(235, 235, 235), anchor="mm")
d.text((270, 185), "mobile", font=font(24), fill=(150, 150, 150), anchor="mm")
def bubble(y, lines):
    h = 44 * len(lines) + 30
    d.rounded_rectangle([40, y, 470, y + h], 28, fill=(48, 52, 60))
    for i, l in enumerate(lines): d.text((66, y + 18 + i * 44), l, font=font(30), fill=(240, 240, 240))
    return y + h + 24
y = 260
y = bubble(y, ["Need the Lantern wire out", "tonight. Board expects it."])
y = bubble(y, ["Form system's down. Just", "release it and I'll sign", "tomorrow."])
y = bubble(y, ["Don't call, in a meeting."])
im.save(f"{OUT}/label_phone.png")

# ---- envelope front ----
im = Image.new("RGB", (1100, 500), (236, 230, 214)); d = ImageDraw.Draw(im)
d.text((80, 70), "HARBOR & CO. · INTERNAL MAIL", font=font(28, True), fill=NAVY)
d.text((520, 250), "To: New Hire", font=font(40), fill=INK)
d.text((520, 305), "Desk 14-03, Floor 14", font=font(34), fill=INK)
d.rectangle([900, 50, 1030, 170], outline=(170, 160, 140), width=3)
im.save(f"{OUT}/label_envelope.png")

# ---- monitor screen: mail open (gift card request) ----
im = Image.new("RGB", (1280, 720), (238, 240, 244)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 1280, 60], fill=NAVY); d.text((24, 30), "Mail", font=font(28, True), fill=PAPER, anchor="lm")
d.rectangle([0, 60, 330, 720], fill=(224, 227, 233))
for i, (s, b) in enumerate((("Elena Voss", "Quick favour — urgent"), ("Facilities", "Floor 14 access"), ("IT Service Desk", "Welcome to Harbor"))):
    yy = 80 + i * 92
    if i == 0: d.rectangle([0, yy - 12, 330, yy + 72], fill=(204, 214, 232))
    d.text((20, yy), s, font=font(24, True), fill=INK); d.text((20, yy + 34), b, font=font(20), fill=(80, 84, 92))
d.text((370, 90), "Quick favour — urgent", font=font(34, True), fill=INK)
d.text((370, 140), "From: Elena Voss <elena.voss@harbour-co-exec.example>", font=font(22), fill=(150, 40, 40))
body = ["Hi — are you at your desk? I'm stuck in a client dinner.", "", "I need eight Apple gift cards (USD 200 each) for", "the client team tonight. Buy them on your card and reply", "with the codes. I'll reimburse first thing.", "", "Please keep this between us — it's a surprise.", "", "Elena"]
for i, l in enumerate(body): d.text((370, 210 + i * 40), l, font=font(26), fill=INK)
d.rounded_rectangle([370, 640, 560, 690], 8, fill=NAVY); d.text((465, 665), "Reply", font=font(24, True), fill=PAPER, anchor="mm")
d.rounded_rectangle([580, 640, 840, 690], 8, fill=(170, 40, 40)); d.text((710, 665), "Report phishing", font=font(24, True), fill=PAPER, anchor="mm")
im.save(f"{OUT}/label_screen_mail.png")
print("labels ok")
