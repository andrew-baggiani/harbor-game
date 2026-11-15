"""Tileable PBR texture generator (numpy). Writes <name>_color.png, _normal.png, _rough.png."""
import numpy as np, os
from PIL import Image

OUT = "/home/claude/harbor/textures"
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)

def noise(n, beta=2.0, seed=None):
    """Tileable fractal noise via spectral synthesis, normalized 0..1."""
    r = np.random.default_rng(seed) if seed is not None else rng
    w = r.standard_normal((n, n))
    f = np.fft.fft2(w)
    fx = np.fft.fftfreq(n)[:, None]; fy = np.fft.fftfreq(n)[None, :]
    k = np.sqrt(fx**2 + fy**2); k[0, 0] = 1
    out = np.real(np.fft.ifft2(f / k**(beta / 2)))
    out -= out.min(); out /= out.max()
    return out

def blur(a, r=2):
    out = a.copy()
    for _ in range(r):
        out = (out + np.roll(out, 1, 0) + np.roll(out, -1, 0) + np.roll(out, 1, 1) + np.roll(out, -1, 1)) / 5
    return out

def normal_from_height(h, strength=4.0):
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * strength
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * strength
    n = np.stack([-dx, dy, np.ones_like(h)], -1)   # OpenGL (+Y up), glTF convention
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return ((n * 0.5 + 0.5) * 255).astype(np.uint8)

def save(name, color, height, rough, nstrength=4.0):
    c = np.clip(color, 0, 1)
    Image.fromarray((c * 255).astype(np.uint8)).save(f"{OUT}/{name}_color.png")
    Image.fromarray(normal_from_height(height, nstrength)).save(f"{OUT}/{name}_normal.png")
    Image.fromarray((np.clip(rough, 0, 1) * 255).astype(np.uint8)).save(f"{OUT}/{name}_rough.png")
    print("tex", name)

def rgb(hexs):
    h = hexs.lstrip('#'); return np.array([int(h[i:i+2], 16) / 255 for i in (0, 2, 4)])

def lerp(a, b, t): return a + (b - a) * t[..., None]

N = 1024
yy, xx = np.mgrid[0:N, 0:N] / N

# ---------- BRICK (tile = 0.9 m x 0.9 m : 4 bricks x 12 courses) ----------
def brick(name, base, var, mortar_col, soot=0.0, seed=1):
    r = np.random.default_rng(seed)
    cols, rows = 4, 12
    v = yy * rows; row = np.floor(v).astype(int)
    u = xx * cols + (row % 2) * 0.5; col = np.floor(u).astype(int) % cols
    fu, fv = u % 1, v % 1
    mu, mv = 0.045, 0.13                          # mortar fractions
    edge = np.minimum(np.minimum(fu, 1 - fu) / mu, np.minimum(fv, 1 - fv) / mv)
    is_brick = np.clip((edge - 1) * 3, 0, 1)
    ids = (row * 31 + col * 17) % 997
    tint = r.random(1000)[ids]; tint2 = r.random(1000)[(ids * 7) % 997]
    n1, n2 = noise(N, 2.2, seed), noise(N, 1.2, seed + 1)
    bcol = base + var * (tint - 0.5)[..., None] + (n2[..., None] - 0.5) * 0.08
    bcol = bcol * (0.85 + 0.3 * tint2)[..., None]
    bcol *= (0.75 + 0.25 * np.clip(edge / 3, 0, 1))[..., None]      # edge darkening
    col_ = lerp(np.broadcast_to(mortar_col, (N, N, 3)) * (0.8 + 0.4 * n2[..., None]), bcol, is_brick)
    grime = np.clip(noise(N, 2.6, seed + 2) * 1.6 - 0.6, 0, 1) * soot
    col_ = col_ * (1 - grime[..., None] * 0.6)
    h = is_brick * (0.8 + 0.2 * n2) - 0.1 * (n1 > 0.8)
    rough = 0.82 + 0.12 * n1 - 0.05 * is_brick
    save(name, col_, blur(h, 1), rough, 3.0)

brick("brick_red", rgb('#7a3a2a'), np.array([0.12, 0.05, 0.03]), rgb('#8a8378'), soot=0.6, seed=11)
brick("brick_dark", rgb('#4a2c24'), np.array([0.08, 0.04, 0.03]), rgb('#6c675f'), soot=0.8, seed=21)
brick("brick_buff", rgb('#9b7f5e'), np.array([0.1, 0.08, 0.05]), rgb('#7d776c'), soot=0.7, seed=31)

# ---------- CONCRETE SLABS sidewalk (tile = 3 m, 2x2 slabs, damp patches) ----------
n1, n2, n3 = noise(N, 2.4, 3), noise(N, 1.0, 4), noise(N, 3.0, 5)
fu, fv = (xx * 2) % 1, (yy * 2) % 1
joint = np.minimum(np.minimum(fu, 1 - fu), np.minimum(fv, 1 - fv))
is_slab = np.clip((joint - 0.004) * 400, 0, 1)
slab_id = (np.floor(xx * 2) + np.floor(yy * 2) * 2).astype(int)
slab_t = np.array([0.0, 0.05, -0.04, 0.03])[slab_id]
damp = np.clip(n3 * 2.2 - 1.1, 0, 1)
base = rgb('#8e8b84') * (0.85 + 0.25 * n2[..., None] + slab_t[..., None])
col_ = base * (1 - 0.35 * damp[..., None]) * (0.55 + 0.45 * is_slab[..., None])
h = is_slab * 0.8 + 0.15 * n2 + 0.05 * (n2 > 0.75)
save("concrete_slab", col_, blur(h, 1), 0.85 - 0.55 * damp + 0.08 * n1, 2.5)

# ---------- GENERIC CONCRETE (quay apron / walls) tile 4 m ----------
n1, n2, n3 = noise(N, 2.0, 6), noise(N, 1.0, 7), noise(N, 2.8, 8)
stain = np.clip(n3 * 1.8 - 0.7, 0, 1)
col_ = rgb('#7c7a74') * (0.8 + 0.35 * n2[..., None]) * (1 - 0.3 * stain[..., None])
save("concrete", col_, 0.2 * n2 + 0.05 * n1, 0.88 - 0.3 * stain, 2.0)

# ---------- WET ASPHALT tile 4 m ----------
n1 = noise(N, 0.6, 9); n2 = noise(N, 2.0, 10); n3 = noise(N, 3.0, 12)
agg = (n1 > 0.62).astype(float) * 0.5 + n1 * 0.3
puddle = np.clip(n3 * 2.6 - 1.4, 0, 1)
col_ = rgb('#2a2a2c') * (0.7 + 0.6 * agg[..., None]) * (0.9 + 0.2 * n2[..., None]) * (1 - 0.35 * puddle[..., None])
rough = np.clip(0.55 - 0.45 * puddle + 0.2 * agg - 0.15, 0.04, 1)
save("asphalt_wet", col_, agg * (1 - puddle), rough, 3.0)

# ---------- WOOD (oak veneer) tile 1 m ----------
n1, n2 = noise(N, 2.5, 13), noise(N, 1.4, 14)
g = np.sin((yy * 60 + n1 * 6) * np.pi * 2) * 0.5 + 0.5
plank = np.floor(xx * 5); pt = np.random.default_rng(3).random(8)[plank.astype(int)]
col_ = lerp(np.broadcast_to(rgb('#6b4428'), (N, N, 3)), np.broadcast_to(rgb('#a0703f'), (N, N, 3)), g * 0.6 + n2 * 0.4)
col_ *= (0.88 + 0.2 * pt)[..., None]
save("wood_oak", col_, g * 0.15 + n2 * 0.05, 0.42 + 0.1 * g, 1.5)

# ---------- POLISHED GRANITE tile 1.2 m with tiles ----------
n1, n2, n3 = noise(N, 0.4, 15), noise(N, 1.8, 16), noise(N, 3.0, 17)
fl = (np.minimum(np.minimum((xx*2) % 1, 1 - (xx*2) % 1), np.minimum((yy*2) % 1, 1 - (yy*2) % 1)) > 0.003).astype(float)
speck = (n1 > 0.7) * 0.5 + (n1 < 0.2) * -0.3
col_ = rgb('#2b2b2e') * (1 + speck[..., None] + 0.2 * n2[..., None]) * (0.6 + 0.4 * fl[..., None])
save("granite_polished", col_, fl * 0.5, 0.12 + 0.06 * n3, 1.0)

# ---------- CARPET TILE tile 1 m ----------
n1, n2 = noise(N, 0.2, 18), noise(N, 2.0, 19)
cf = (np.minimum(np.minimum((xx*2) % 1, 1 - (xx*2) % 1), np.minimum((yy*2) % 1, 1 - (yy*2) % 1)) > 0.004).astype(float)
col_ = rgb('#3a3f47') * (0.85 + 0.3 * n1[..., None] + 0.1 * n2[..., None]) * (0.8 + 0.2 * cf[..., None])
save("carpet", col_, n1 * 0.6, 0.95 + 0 * n1, 2.0)

# ---------- BRUSHED METAL tile 0.5 m ----------
streak = blur(np.random.default_rng(2).random((N, N)), 0)
streak = np.mean(np.stack([np.roll(streak, k, 1) for k in range(0, 40, 2)]), 0)
streak = (streak - streak.min()) / (streak.max() - streak.min())
col_ = rgb('#b9b9bb')[None, None, :] * (0.9 + 0.15 * streak[..., None])
save("metal_brushed", col_, streak * 0.3, 0.25 + 0.15 * streak, 0.8)

# ---------- CONTAINER corrugated steel (tile 2.4 m) in 4 muted colors ----------
n1, n2, n3 = noise(N, 2.2, 20), noise(N, 3.0, 21), noise(N, 1.2, 22)
corr = np.abs(np.sin(xx * np.pi * 2 * 8))          # 8 corrugations per tile
streaks = np.clip(blur(np.random.default_rng(5).random((N, N)) * (np.random.default_rng(6).random((1, N)) > 0.8), 0), 0, 1)
streaks = np.cumsum(streaks, 0) % 1 * 0  # placeholder no-op keeps tileable
rust = np.clip(n2 * 2.0 - 1.15, 0, 1) + np.clip(n1 * (yy > 0.9), 0, 1) * 0.5
for nm, hx in (("container_rust", '#7d3b26'), ("container_blue", '#2b4a6a'), ("container_green", '#3c5a45'), ("container_grey", '#80807a')):
    col_ = rgb(hx) * (0.85 + 0.2 * n3[..., None]) * (0.85 + 0.15 * corr[..., None])
    col_ = lerp(col_, np.broadcast_to(rgb('#5a2e18'), (N, N, 3)) * (0.7 + 0.5 * n1[..., None]), np.clip(rust, 0, 1) * 0.85)
    save(nm, col_, corr * 1.0 + 0.1 * rust, 0.6 + 0.3 * np.clip(rust, 0, 1), 6.0)

# ---------- SHIP HULL paint (tile 4 m), dark navy with rust runs ----------
n1, n2 = noise(N, 2.0, 23), noise(N, 1.0, 24)
runs = np.zeros((N, N)); rr = np.random.default_rng(9)
for _ in range(60):
    x = rr.integers(0, N); y0 = rr.integers(0, N); L = rr.integers(60, 500); w = rr.integers(2, 7)
    for dy in range(L):
        runs[(y0 + dy) % N, (x - w//2):(x + w//2)] += (1 - dy / L) * 0.7
runs = blur(np.clip(runs, 0, 1), 2)
col_ = rgb('#1c2430') * (0.85 + 0.3 * n2[..., None])
col_ = lerp(col_, np.broadcast_to(rgb('#6a3a20'), (N, N, 3)), runs * 0.8)
save("hull_paint", col_, 0.05 * n1 + 0.1 * runs, 0.55 + 0.25 * runs + 0.1 * n1, 1.5)
col_ = rgb('#6e2a22') * (0.8 + 0.3 * n2[..., None])
save("hull_antifoul", col_, 0.1 * n1, 0.7 + 0.1 * n1, 1.5)

# ---------- STONE trim (lintels, sills) tile 1 m ----------
n1, n2 = noise(N, 2.2, 25), noise(N, 1.0, 26)
col_ = rgb('#a39c8d') * (0.85 + 0.3 * n2[..., None]) * (1 - 0.3 * np.clip(n1 * 2 - 1.1, 0, 1)[..., None])
save("stone_trim", col_, 0.2 * n2 + 0.1 * n1, 0.8 + 0.1 * n1, 2.0)

# ---------- PAINTED PLASTER (shop fronts, interior walls) tile 2 m ----------
n1, n2 = noise(N, 2.2, 27), noise(N, 1.0, 28)
for nm, hx in (("plaster_white", '#d9d4c8'), ("paint_navy", '#1e3a6e'), ("paint_green", '#2f4a3a'), ("paint_oxblood", '#5a2328')):
    col_ = rgb(hx) * (0.9 + 0.15 * n2[..., None]) * (1 - 0.15 * np.clip(n1 * 2 - 1.2, 0, 1)[..., None])
    save(nm, col_, 0.08 * n2, 0.75 + 0.1 * n1, 1.0)

# ---------- TIMBER fender / dock planks tile 2 m ----------
n1, n2 = noise(N, 2.5, 29), noise(N, 1.3, 30)
g = np.sin((xx * 30 + n1 * 5) * np.pi * 2) * 0.5 + 0.5
pl = (np.minimum(yy * 8 % 1, 1 - yy * 8 % 1) > 0.02).astype(float)
col_ = rgb('#3d3226') * (0.7 + 0.4 * g[..., None] * 0.5 + 0.3 * n2[..., None]) * (0.5 + 0.5 * pl[..., None])
save("timber_weathered", col_, pl * 0.6 + g * 0.2, 0.85 + 0.1 * n1, 3.0)
