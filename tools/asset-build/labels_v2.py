"""Printed / screen label textures for the v2 detail packs (all fictional, no real brands)."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import random, math
OUT = "/home/claude/harbor/textures"
FD = "/usr/share/fonts/truetype/liberation/"
def font(sz, bold=False, mono=False, serif=False):
    n = ("LiberationMono" if mono else "LiberationSerif" if serif else "LiberationSans") + ("-Bold" if bold else "-Regular") + ".ttf"
    return ImageFont.truetype(FD + n, sz)
def hand(sz):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf",):
        try: return ImageFont.truetype(p, sz)
        except Exception: pass
    return font(sz)
NAVY = (30, 58, 110); PAPER = (244, 240, 230); INK = (28, 30, 34); RED = (176, 28, 28); GREEN = (20, 140, 70)
R = random.Random(2026)

def save(im, name): im.save(f"{OUT}/{name}.png"); print("label", name)

# ---------- CCTV monitor feeds (one image per monitor, 4 feeds) ----------
def cctv(name, title, kind):
    W, H = 640, 360
    im = Image.new("RGB", (W, H), (14, 18, 20)); d = ImageDraw.Draw(im)
    g = lambda v: (int(v * 0.85), int(v), int(v * 0.9))
    # simple perspective room
    d.polygon([(0, H), (W, H), (W * 0.72, H * 0.55), (W * 0.28, H * 0.55)], fill=g(46))
    d.polygon([(0, 0), (W * 0.28, H * 0.18), (W * 0.28, H * 0.55), (0, H)], fill=g(30))
    d.polygon([(W, 0), (W * 0.72, H * 0.18), (W * 0.72, H * 0.55), (W, H)], fill=g(34))
    d.rectangle([W * 0.28, H * 0.18, W * 0.72, H * 0.55], fill=g(24))
    if kind == "door":
        d.rectangle([W * 0.42, H * 0.25, W * 0.58, H * 0.55], fill=g(70)); d.line([W * 0.5, H * 0.25, W * 0.5, H * 0.55], fill=g(20), width=2)
    elif kind == "gates":
        for i in range(5):
            x = W * (0.3 + i * 0.1); d.rectangle([x, H * 0.45, x + 8, H * 0.62], fill=g(80))
    elif kind == "elev":
        for x0 in (0.36, 0.54): d.rectangle([W * x0, H * 0.24, W * (x0 + 0.1), H * 0.55], fill=g(88))
    elif kind == "dock":
        d.rectangle([W * 0.1, H * 0.6, W * 0.45, H * 0.85], fill=g(60)); d.rectangle([W * 0.5, H * 0.58, W * 0.9, H * 0.86], fill=g(52))
    for _ in range(1400):                       # sensor noise
        x, y = R.randrange(W), R.randrange(H); v = R.randrange(20, 70); d.point((x, y), fill=g(v))
    for y in range(0, H, 3): d.line([0, y, W, y], fill=(10, 12, 14))
    d.text((12, 10), title, font=font(22, True, mono=True), fill=(225, 235, 225))
    d.text((W - 12, 10), "REC", font=font(22, True, mono=True), fill=(230, 50, 40), anchor="ra")
    d.ellipse([W - 92, 14, W - 76, 30], fill=(230, 50, 40))
    d.text((12, H - 34), "MON 21:37:12", font=font(20, mono=True), fill=(225, 235, 225))
    save(im, name)
cctv("label_cctv_1", "CAM 01  ENTRANCE", "door")
cctv("label_cctv_2", "CAM 02  SPEED GATES", "gates")
cctv("label_cctv_3", "CAM 03  ELEVATORS", "elev")
cctv("label_cctv_4", "CAM 04  STAIR A / EXIT", "door")

# ---------- visitor kiosk screen ----------
im = Image.new("RGB", (600, 800), (240, 243, 247)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 600, 120], fill=NAVY)
d.text((300, 46), "HARBOR TOWER", font=font(40, True), fill=PAPER, anchor="mm")
d.text((300, 92), "Visitor sign-in", font=font(28), fill=(200, 212, 232), anchor="mm")
for i, (lab, val) in enumerate((("Your name", ""), ("Company", ""), ("Visiting (host)", ""), ("Floor", ""))):
    y = 170 + i * 110
    d.text((50, y), lab, font=font(26, True), fill=INK)
    d.rounded_rectangle([50, y + 38, 550, y + 92], 8, outline=(150, 160, 175), width=3, fill=(255, 255, 255))
d.rounded_rectangle([50, 630, 550, 700], 12, fill=NAVY)
d.text((300, 665), "Print visitor badge", font=font(30, True), fill=PAPER, anchor="mm")
d.text((300, 745), "Visitors must be escorted beyond the gates.", font=font(22), fill=RED, anchor="mm")
save(im, "label_kiosk")

# ---------- building directory ----------
im = Image.new("RGB", (600, 1200), (24, 26, 30)); d = ImageDraw.Draw(im)
d.text((300, 70), "HARBOR TOWER", font=font(52, True), fill=(236, 230, 214), anchor="mm")
d.text((300, 125), "DIRECTORY", font=font(30), fill=(170, 160, 140), anchor="mm")
d.line([60, 160, 540, 160], fill=(170, 150, 110), width=3)
rows = [("14", "Harbor & Co. — Operations"), ("12–13", "Quayline Logistics"), ("9–11", "Meridian Shipping Agency"),
        ("7–8", "Port Survey Partners"), ("5–6", "Tidewater Legal LLP"), ("3–4", "Northdock Insurance"),
        ("2", "Building Management"), ("L", "Reception · Mailroom")]
for i, (fl, nm) in enumerate(rows):
    y = 210 + i * 108
    d.text((80, y), fl, font=font(40, True), fill=(220, 190, 120))
    d.text((210, y + 6), nm, font=font(28), fill=(230, 230, 228))
    d.line([60, y + 80, 540, y + 80], fill=(60, 62, 66), width=2)
d.text((300, 1130), "All visitors sign in at Reception", font=font(24), fill=(170, 160, 140), anchor="mm")
save(im, "label_directory")

# ---------- ALARMED EXIT door sign ----------
im = Image.new("RGB", (800, 600), (250, 248, 242)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 800, 600], outline=RED, width=24)
d.text((400, 150), "ALARMED", font=font(110, True), fill=RED, anchor="mm")
d.text((400, 270), "EXIT", font=font(110, True), fill=RED, anchor="mm")
d.text((400, 390), "EMERGENCY USE ONLY", font=font(48, True), fill=INK, anchor="mm")
d.text((400, 470), "ALARM WILL SOUND IF OPENED", font=font(38), fill=INK, anchor="mm")
d.text((400, 530), "DO NOT PROP OPEN", font=font(38, True), fill=RED, anchor="mm")
save(im, "label_alarmed_exit")

# ---------- green EXIT box sign (emissive) ----------
im = Image.new("RGB", (512, 192), (10, 120, 50)); d = ImageDraw.Draw(im)
d.text((300, 96), "EXIT", font=font(112, True), fill=(235, 255, 240), anchor="mm")
# running figure
d.ellipse([64, 30, 92, 58], fill=(235, 255, 240))
d.line([78, 60, 70, 110], fill=(235, 255, 240), width=12); d.line([70, 110, 40, 150], fill=(235, 255, 240), width=10)
d.line([70, 110, 104, 140], fill=(235, 255, 240), width=10); d.line([75, 75, 50, 95], fill=(235, 255, 240), width=9)
d.line([75, 75, 110, 85], fill=(235, 255, 240), width=9)
d.polygon([(140, 96), (120, 80), (120, 112)], fill=(235, 255, 240))
save(im, "label_exit")

# ---------- AUTHORIZED PERSONNEL ONLY ----------
im = Image.new("RGB", (800, 500), (250, 248, 242)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 800, 130], fill=RED)
d.text((400, 66), "AUTHORIZED PERSONNEL ONLY", font=font(44, True), fill=(255, 255, 255), anchor="mm")
d.text((400, 210), "IT / SERVER ROOM 14-A", font=font(56, True), fill=INK, anchor="mm")
d.text((400, 300), "Badge access required. Keep door closed.", font=font(32), fill=INK, anchor="mm")
d.text((400, 360), "No tailgating. Report unescorted visitors.", font=font(32), fill=INK, anchor="mm")
d.text((400, 440), "IT Service Desk  ·  ext 4100", font=font(30, True), fill=NAVY, anchor="mm")
save(im, "label_authorized")

# ---------- sticky notes ----------
def sticky(name, lines, col=(250, 226, 92), ink=(30, 40, 120), sz=40):
    im = Image.new("RGB", (256, 256), col); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 256, 34], fill=tuple(max(0, c - 18) for c in col))
    for i, l in enumerate(lines): d.text((18, 50 + i * (sz + 12)), l, font=hand(sz), fill=ink)
    save(im, name)
sticky("label_sticky_pw", ["VPN / email", "pw:", "Harbor#14!"], sz=38)
sticky("label_sticky_todo", ["call IT re:", "2nd screen", "- timesheet"], col=(250, 226, 92), sz=34)
sticky("label_sticky_pink", ["Mon 9am", "ops sync"], col=(246, 160, 190), sz=40)
sticky("label_sticky_green", ["ext 4100", "= IT desk"], col=(170, 230, 150), sz=40)

# ---------- whiteboard (meeting room) ----------
im = Image.new("RGB", (1200, 600), (246, 247, 248)); d = ImageDraw.Draw(im)
d.text((50, 40), "Q4 Ops review — Lantern", font=hand(54), fill=(20, 60, 140))
for i, l in enumerate(["- night shift cover: 14 + dock", "- vendor bank change?? -> verify by phone", "- badge audit Fri"]):
    d.text((70, 140 + i * 70), l, font=hand(40), fill=(30, 30, 30))
d.rectangle([800, 360, 1160, 560], outline=(190, 40, 40), width=4)
d.text((820, 380), "Guest Wi-Fi", font=hand(40), fill=(190, 40, 40))
d.text((820, 440), "HarborGuest", font=hand(40), fill=(190, 40, 40))
d.text((820, 495), "pw: Quay2026", font=hand(40), fill=(190, 40, 40))
d.line([80, 520, 300, 470, 520, 540, 720, 440], fill=(20, 120, 60), width=5)
d.text((60, 560), "PLEASE ERASE", font=font(30, True), fill=(120, 120, 120))
save(im, "label_whiteboard")

# ---------- secure shred / recycle labels ----------
im = Image.new("RGB", (512, 512), (30, 58, 110)); d = ImageDraw.Draw(im)
d.text((256, 110), "SECURE", font=font(78, True), fill=PAPER, anchor="mm")
d.text((256, 200), "SHRED", font=font(78, True), fill=PAPER, anchor="mm")
d.line([60, 260, 452, 260], fill=(200, 210, 230), width=4)
for i, l in enumerate(["Confidential paper only", "Locked console", "Collected & shredded on site"]):
    d.text((256, 310 + i * 52), l, font=font(30), fill=(220, 226, 238), anchor="mm")
save(im, "label_shred")
im = Image.new("RGB", (512, 256), (30, 110, 70)); d = ImageDraw.Draw(im)
d.text((256, 80), "PAPER RECYCLING", font=font(46, True), fill=PAPER, anchor="mm")
d.text((256, 160), "NOT for confidential documents", font=font(28), fill=(230, 240, 230), anchor="mm")
save(im, "label_recycle")

# ---------- evacuation plan ----------
im = Image.new("RGB", (600, 800), (250, 250, 246)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 600, 90], fill=GREEN); d.text((300, 45), "EVACUATION PLAN  ·  14", font=font(36, True), fill=(255, 255, 255), anchor="mm")
d.rectangle([60, 140, 540, 620], outline=INK, width=6)
d.rectangle([60, 140, 230, 300], outline=INK, width=3); d.rectangle([250, 140, 360, 250], outline=INK, width=3)
for x, y in ((150, 420), (380, 420)): d.rectangle([x, y, x + 120, y + 60], outline=(120, 120, 120), width=3)
d.rectangle([54, 330, 66, 400], fill=GREEN); d.line([300, 560, 100, 560, 70, 380], fill=GREEN, width=8)
d.ellipse([290, 550, 314, 574], fill=RED); d.text((320, 545), "YOU ARE HERE", font=font(24, True), fill=RED)
d.text((300, 680), "Use stairs. Do not use elevators.", font=font(30, True), fill=INK, anchor="mm")
d.text((300, 730), "Assembly point: Quay apron, Gate 3", font=font(26), fill=INK, anchor="mm")
save(im, "label_evac")

# ---------- badges (props pack) ----------
def badge(name, band, title, sub, note):
    im = Image.new("RGB", (540, 856), (250, 249, 245)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 540, 200], fill=band)
    d.text((270, 100), title, font=font(84 if len(title) < 9 else 62, True), fill=(255, 255, 255), anchor="mm")
    d.text((270, 270), "HARBOR TOWER", font=font(36, True), fill=INK, anchor="mm")
    d.text((270, 330), sub, font=font(30), fill=(90, 92, 98), anchor="mm")
    for i, l in enumerate(["Name: ____________", "Host: ____________", "Date: ____________"]):
        d.text((70, 420 + i * 70), l, font=font(32), fill=INK)
    d.rectangle([0, 700, 540, 856], fill=band)
    d.text((270, 778), note, font=font(34, True), fill=(255, 255, 255), anchor="mm")
    save(im, name)
badge("label_badge_visitor", (196, 40, 40), "VISITOR", "Valid today only", "ESCORT REQUIRED")
badge("label_badge_contractor", (214, 140, 20), "CONTRACTOR", "Temporary · no access rights", "MUST BE ESCORTED")

im = Image.new("RGB", (600, 800), (250, 248, 242)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 600, 150], fill=NAVY)
d.text((300, 75), "ONE BADGE", font=font(70, True), fill=(255, 255, 255), anchor="mm")
d.text((300, 230), "ONE PERSON", font=font(70, True), fill=NAVY, anchor="mm")
# two figures, second crossed out
for x, crossed in ((200, False), (400, True)):
    d.ellipse([x - 40, 320, x + 40, 400], fill=INK); d.rounded_rectangle([x - 60, 410, x + 60, 580], 30, fill=INK)
    if crossed:
        d.line([x - 90, 300, x + 90, 600], fill=RED, width=22); d.line([x + 90, 300, x - 90, 600], fill=RED, width=22)
d.text((300, 660), "Badge in yourself. Every time.", font=font(34, True), fill=INK, anchor="mm")
d.text((300, 720), "Don't hold the gate for others.", font=font(32), fill=INK, anchor="mm")
save(im, "label_tailgate")

# ---------- elevator signage ----------
im = Image.new("RGB", (600, 1000), (60, 62, 66)); d = ImageDraw.Draw(im)       # car operating panel faceplate
labels = ["14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2", "L"]
for i, lab in enumerate(labels):
    col, row = i % 2, i // 2
    cx, cy = 190 + col * 220, 90 + row * 112
    d.ellipse([cx - 40, cy - 40, cx + 40, cy + 40], fill=(120, 122, 126)); d.ellipse([cx - 32, cy - 32, cx + 32, cy + 32], fill=(36, 38, 42))
    d.text((cx, cy), lab, font=font(34, True), fill=(220, 220, 220), anchor="mm")
d.text((300, 900), "<|>   >|<   ALARM", font=font(36, True), fill=(220, 220, 220), anchor="mm")
d.text((300, 960), "CAR A  ·  CAPACITY 1000 kg / 13 PERSONS", font=font(20), fill=(200, 200, 200), anchor="mm")
save(im, "label_cop")
for lab in ("14", "L"):
    for lit in (False, True):
        im = Image.new("RGB", (128, 128), (36, 38, 42) if not lit else (255, 176, 60)); d = ImageDraw.Draw(im)
        d.ellipse([4, 4, 124, 124], outline=(150, 150, 150) if not lit else (255, 230, 170), width=8)
        d.text((64, 64), lab, font=font(60, True), fill=(220, 220, 220) if not lit else (60, 30, 0), anchor="mm")
        save(im, f"label_btn_{lab}_{'lit' if lit else 'unlit'}")

im = Image.new("RGB", (512, 256), (232, 232, 228)); d = ImageDraw.Draw(im)     # in-car certificate
d.text((256, 50), "ELEVATOR CERTIFICATE", font=font(30, True), fill=INK, anchor="mm")
for i, l in enumerate(["Car A · Harbor Tower", "Inspected: Sept · Next: Mar", "In case of fire use stairs"]):
    d.text((256, 110 + i * 44), l, font=font(24), fill=INK, anchor="mm")
save(im, "label_cert")

# ---------- abstract harbor art panels ----------
for k in range(3):
    W, H = 512, 768
    im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
    pal = [[(18, 40, 70), (40, 80, 120), (200, 150, 80), (230, 220, 200)],
           [(30, 30, 34), (120, 60, 40), (210, 170, 110), (240, 236, 226)],
           [(16, 50, 56), (40, 110, 110), (220, 200, 150), (250, 248, 240)]][k]
    for y in range(H):
        t = y / H; c = [int(pal[0][i] * (1 - t) + pal[1][i] * t) for i in range(3)]; d.line([0, y, W, y], fill=tuple(c))
    rr = random.Random(10 + k)
    for i in range(7 + k * 2):
        y0 = rr.randint(int(H * 0.45), H - 40); h = rr.randint(18, 60); x0 = rr.randint(-50, W - 120); w = rr.randint(120, 360)
        d.rectangle([x0, y0, x0 + w, y0 + h], fill=pal[2] if i % 2 else pal[3])
    d.ellipse([W * 0.55, H * 0.12, W * 0.55 + 110, H * 0.12 + 110], fill=pal[3])
    im = im.filter(ImageFilter.GaussianBlur(1.2))
    save(im, f"label_art_{k}")

# ---------- parcels / misc ----------
im = Image.new("RGB", (400, 300), (250, 250, 250)); d = ImageDraw.Draw(im)
d.text((20, 18), "PRIORITY PARCEL", font=font(30, True), fill=INK)
d.text((20, 70), "TO: Harbor & Co. — Fl 14", font=font(24), fill=INK); d.text((20, 105), "ATTN: Finance", font=font(24), fill=INK)
x = 20
while x < 380:
    w = R.choice([2, 3, 5]); d.rectangle([x, 170, x + w, 270], fill=INK); x += w + R.choice([2, 3, 5])
save(im, "label_parcel")

im = Image.new("RGB", (1280, 720), (22, 30, 44)); d = ImageDraw.Draw(im)     # meeting room TV
d.text((80, 80), "Q4 OPERATIONS REVIEW", font=font(64, True), fill=(235, 240, 248))
d.text((80, 170), "Project Lantern · CONFIDENTIAL", font=font(40), fill=(220, 150, 80))
for i, v in enumerate((0.4, 0.65, 0.5, 0.85, 0.7)):
    x = 120 + i * 200; d.rectangle([x, 640 - v * 360, x + 120, 640], fill=(70, 120, 190))
save(im, "label_tv")

im = Image.new("RGB", (1280, 720), (28, 44, 66)); d = ImageDraw.Draw(im)     # locked screen
d.text((640, 300), "21:37", font=font(150, True), fill=(235, 240, 248), anchor="mm")
d.text((640, 430), "Locked  ·  Press Ctrl+Alt+Del", font=font(40), fill=(200, 210, 225), anchor="mm")
save(im, "label_screen_locked")
im = Image.new("RGB", (1280, 720), (236, 238, 242)); d = ImageDraw.Draw(im)  # unlocked spreadsheet screen
d.rectangle([0, 0, 1280, 56], fill=(40, 110, 70)); d.text((20, 28), "Vendor_payments_Q4.xlsx", font=font(26, True), fill=(255, 255, 255), anchor="lm")
for r_ in range(16):
    for c_ in range(7):
        x, y = 20 + c_ * 178, 80 + r_ * 38
        d.rectangle([x, y, x + 176, y + 36], outline=(200, 204, 210), fill=(255, 255, 255) if r_ else (220, 226, 236))
        if r_: d.text((x + 8, y + 8), f"{R.randint(1000, 99999):,}" if c_ > 2 else R.choice(["Quayline", "Meridian", "Tidewater", "Northdock"]), font=font(18), fill=INK)
save(im, "label_screen_sheet")
print("labels v2 ok")

im = Image.new("RGB", (512, 256), (196, 30, 30)); d = ImageDraw.Draw(im)
d.text((256, 90), "FIRE", font=font(80, True), fill=(255, 255, 255), anchor="mm")
d.text((256, 185), "EXTINGUISHER", font=font(56, True), fill=(255, 255, 255), anchor="mm")
save(im, "label_fire_ext")
im = Image.new("RGB", (512, 256), (20, 120, 60)); d = ImageDraw.Draw(im)
d.text((256, 80), "EMERGENCY EXIT", font=font(54, True), fill=(255, 255, 255), anchor="mm")
d.text((256, 170), "PUSH BAR TO OPEN", font=font(40), fill=(235, 250, 240), anchor="mm")
save(im, "label_emergency_exit")
im = Image.new("RGB", (512, 256), (40, 42, 46)); d = ImageDraw.Draw(im)
d.text((256, 80), "STAIR A", font=font(80, True), fill=(240, 240, 236), anchor="mm")
d.text((256, 180), "Floors L – 14  ·  Roof access denied", font=font(28), fill=(200, 200, 196), anchor="mm")
save(im, "label_stair")
im = Image.new("RGB", (512, 256), (238, 236, 230)); d = ImageDraw.Draw(im)
d.text((256, 70), "MAILROOM", font=font(70, True), fill=NAVY, anchor="mm")
d.text((256, 160), "Packages held at Reception", font=font(32), fill=INK, anchor="mm")
d.text((256, 210), "Collect with your badge", font=font(28), fill=(90, 92, 98), anchor="mm")
save(im, "label_mailroom")
