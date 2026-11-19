"""Textures for the week's new rooms: Tidewater cafe and the home. Placeholders until Grok's decor pack lands;
same file names are swapped in later (see docs/grok-handoff-week.md, section 1b)."""
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

T = "/home/claude/harbor/textures"
R = random.Random(9)

def font(size, bold=False):
    for p in (f"/usr/share/fonts/truetype/dejavu/DejaVuSans{'-Bold' if bold else ''}.ttf",
              f"/usr/share/fonts/truetype/liberation/LiberationSans-{'Bold' if bold else 'Regular'}.ttf"):
        try: return ImageFont.truetype(p, size)
        except OSError: pass
    return ImageFont.load_default()

def chalk(path, w, h, title, lines, price=True):
    im = Image.new("RGB", (w, h), (28, 33, 31)); d = ImageDraw.Draw(im)
    for _ in range(w * h // 90):                       # chalk dust
        x, y = R.randrange(w), R.randrange(h); g = R.randrange(36, 58)
        d.point((x, y), (g, g + 3, g + 1))
    d.rectangle((10, 10, w - 11, h - 11), outline=(150, 120, 80), width=12)
    d.text((w // 2, 60), title, font=font(h // 9, True), fill=(236, 230, 214), anchor="mt")
    y = 60 + h // 9 + 40; f = font(h // 20)
    cols = 2 if len(lines) > 8 else 1
    per = (len(lines) + cols - 1) // cols
    for c in range(cols):
        x0 = 70 + c * (w // cols); yy = y
        for name, p in lines[c * per:(c + 1) * per]:
            d.text((x0, yy), name, font=f, fill=(226, 222, 208))
            if price: d.text((x0 + w // cols - 150, yy), p, font=f, fill=(232, 196, 120))
            yy += h // 13
    im.filter(ImageFilter.GaussianBlur(0.6)).save(f"{T}/{path}")

chalk("cafe_menu.png", 2048, 1024, "TIDEWATER", [
    ("Espresso", "3.00"), ("Americano", "3.50"), ("Flat white", "4.25"), ("Latte", "4.50"), ("Cortado", "4.00"),
    ("Drip, harbor roast", "2.75"), ("Cold brew", "4.75"), ("Chai", "4.50"), ("Tea, loose leaf", "3.25"),
    ("Croissant", "3.75"), ("Morning bun", "4.25"), ("Scone, seasonal", "3.50"), ("Egg sandwich", "7.50"),
    ("Soup of the day", "6.00")])
chalk("cafe_specials.png", 1024, 1536, "TODAY", [
    ("Maple oat latte", ""), ("Blueberry scone", ""), ("", ""), ("Free Wi-Fi", ""), ("Tidewater_Guest", ""),
    ("Password at the counter", "")], price=False)

im = Image.new("RGB", (1024, 640), (244, 240, 230)); d = ImageDraw.Draw(im)
d.rectangle((24, 24, 999, 615), outline=(40, 60, 70), width=6)
d.text((512, 90), "TIDEWATER", font=font(72, True), fill=(30, 48, 58), anchor="mt")
d.text((512, 230), "Wi-Fi: Tidewater_Guest", font=font(56), fill=(30, 30, 30), anchor="mt")
d.text((512, 320), "Password: ask at the counter", font=font(48), fill=(30, 30, 30), anchor="mt")
d.text((512, 470), "Only one network is ours.", font=font(40), fill=(120, 60, 40), anchor="mt")
im.save(f"{T}/cafe_wifi.png")

# router label
im = Image.new("RGB", (1024, 640), (238, 238, 236)); d = ImageDraw.Draw(im)
d.text((40, 40), "NETLINK AX3000", font=font(60, True), fill=(20, 20, 20))
for i, t in enumerate(["Model: NL-AX3000", "Admin: http://192.168.0.1", "User: admin   Pass: admin1234",
                       "Wi-Fi: NETLINK-4F2A", "Key: printed on base", "S/N 4F2A-0091-7731"]):
    d.text((40, 150 + i * 72), t, font=font(44), fill=(30, 30, 30))
im.save(f"{T}/router_label.png")

# fridge door: calendar, drawing, menu, magnets. No names.
im = Image.new("RGB", (1024, 1536), (206, 208, 206)); d = ImageDraw.Draw(im)
d.rectangle((90, 120, 560, 640), fill=(250, 250, 246)); d.text((110, 140), "NOVEMBER", font=font(44, True), fill=(160, 40, 40))
for r in range(5):
    for c in range(7):
        x, y = 110 + c * 64, 220 + r * 80; d.rectangle((x, y, x + 58, y + 74), outline=(150, 150, 150))
        d.text((x + 6, y + 4), str(r * 7 + c + 1) if r * 7 + c < 30 else "", font=font(20), fill=(60, 60, 60))
d.rectangle((600, 200, 940, 620), fill=(255, 250, 236))
d.ellipse((660, 260, 800, 400), outline=(240, 170, 20), width=10)
for a in range(8):
    import math
    d.line((730 + 90 * math.cos(a * .785), 330 + 90 * math.sin(a * .785), 730 + 130 * math.cos(a * .785), 330 + 130 * math.sin(a * .785)), fill=(240, 170, 20), width=8)
d.rectangle((620, 480, 920, 600), fill=(90, 170, 90)); d.polygon([(700, 480), (770, 400), (840, 480)], fill=(190, 60, 50))
d.rectangle((140, 760, 520, 1260), fill=(250, 246, 232)); d.text((160, 780), "PIZZA  ·  PASTA", font=font(36, True), fill=(150, 40, 30))
for i in range(9): d.line((160, 860 + i * 40, 500, 860 + i * 40), fill=(170, 160, 150), width=4)
for x, y, col in ((120, 100, (220, 60, 60)), (580, 180, (60, 120, 220)), (500, 740, (240, 200, 40)), (900, 900, (60, 180, 90))):
    d.ellipse((x, y, x + 50, y + 50), fill=col)
im.save(f"{T}/home_fridge.png")

# night street seen through glass: lit shopfronts and windows across the road
def street(path, w, h, warm=True):
    im = Image.new("RGB", (w, h), (9, 13, 22)); d = ImageDraw.Draw(im)
    for y in range(h):
        g = int(9 + 16 * y / h); d.line((0, y, w, y), fill=(g - 2, g + 2, g + 12))
    x = 0
    while x < w:
        bw = R.randrange(160, 340); bh = R.randrange(int(h * .45), int(h * .95))
        base = R.choice([(34, 26, 24), (28, 30, 34), (40, 32, 28)])
        d.rectangle((x, h - bh, x + bw - 6, h), fill=base)
        for wy in range(h - bh + 30, h - 160, 58):
            for wx in range(x + 18, x + bw - 40, 48):
                if R.random() < .45:
                    c = R.choice([(236, 194, 120), (226, 206, 160), (160, 190, 226)]) if warm else (180, 200, 230)
                    d.rectangle((wx, wy, wx + 26, wy + 34), fill=c)
        if R.random() < .6:
            d.rectangle((x + 10, h - 150, x + bw - 16, h - 20), fill=(196, 150, 90))
        x += bw
    d.rectangle((0, h - 24, w, h), fill=(20, 18, 16))
    im.filter(ImageFilter.GaussianBlur(1.2)).save(f"{T}/{path}")

street("street_night.png", 2048, 768)
street("city_night.png", 2048, 768, warm=False)
print("labels ok")
