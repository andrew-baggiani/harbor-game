# Dry Run Cyber · DESIGN.md

Direction: **a thriller's opening titles.** Night, one lit desk, quiet tension. The site should feel like
the first two minutes of a film about a breach, not like a SaaS template. Dark only (no light mode).

Not based on UXKIN references (not connected); built from the game's own look and the brief.

## Color (each has one job)

| Token | Value | Role |
|---|---|---|
| `night` | `#07090E` | Page background |
| `panel` | `#0E121A` | Raised surfaces: mock app windows, cards |
| `line` | `#1C2330` | Borders, dividers |
| `bone` | `#F2EEE4` | Primary text (contrast 17:1 on night) |
| `ash` | `#A9A69C` | Secondary text (7.9:1) |
| `smoke` | `#6E6C66` | Tertiary text, timestamps on large type only |
| `lamp` | `#D9A85B` | **Primary.** CTAs, links, the "one lit thing" in every scene (9.1:1) |
| `harbor` | `#5FB8C4` | Accent. System UI, verified/safe states, data lines |
| `flag` | `#F0564F` | Red flags only: the tell in a phishing email, a wrong choice |

No gradients on text. One glow allowed: `lamp` light falling on a surface.

## Typography

- Display: **Barlow Condensed** 600/700, uppercase, tight leading. Headlines and timestamps.
- Body/UI: **Barlow** 400/500/600.
- Mono: system mono for timestamps inside mock UI and control IDs.

Scale (px / line-height): 12/16 · 14/20 · 16/26 (body) · 20/30 · 28/32 · 44/44 · 72/68 · 120/104 (hero, desktop).
Tracking: +0.28em on 12–14px uppercase labels; −0.01em on display.
Body max width 60ch.

## Spacing

8-based: 4, 8, 12, 16, 24, 32, 48, 64, 96, 160. Sections 160 desktop / 96 mobile. Content width 1200px, text column 640px.

## Shape and depth

Radius: 6px (buttons, inputs), 12px (mock windows). One shadow: `0 30px 80px -20px rgba(0,0,0,.7)` on mock windows. Borders 1px `line`.

## Components

- **Primary button**: `lamp` fill, `night` text, Barlow Condensed 600 uppercase +0.14em. Hover: brighten 8%. Focus: 2px `bone` outline offset 3px.
- **Secondary**: 1px `bone/25%` border, `bone` text. Hover: `bone/8%` fill.
- **Quiet link**: `ash` → `bone` on hover, underline offset 4px.
- **Timestamp label**: mono 13px `lamp`, e.g. `19:10`.
- **Mock app window**: `panel`, 12px radius, thin title bar, real-looking but invented content (no real brands).
- **Red flag marker**: `flag` underline + small numbered pin on the suspicious detail.
- **Nav**: wordmark left, two quiet links, one secondary button. Sticky, blurs `night/70%` after scroll.

## Imagery and motion

- Imagery: cinematic AI key art (no people's faces, no text, no logos). Never game screenshots until graphics are final.
- Icons: lucide, 1.5px stroke, only where they carry meaning.
- Motion: scroll-driven, one idea per scene, 300–700ms `cubic-bezier(.22,1,.36,1)`. Everything respects `prefers-reduced-motion` (show final states, no movement).
