# Grok handoff: batch 5 (the rest of the week)

Paste everything below the line into Grok. Attach `docs/scenes-tue-fri.md`, `docs/cast-sheet.md`, `docs/voice-sheet.csv`, and the source files named below.

---

Dry Run Cyber now has a playable Tuesday through Sunday, three role tracks (Admins, Finance, Help desk) and twelve monthly reminders. Claude is building the 3D for all of it in Blender, the same way Monday was built: modeled rooms, real props, Cycles-baked lighting. Floor 14 and the lobby are reused from Monday. New rooms are a cafe, a home (kitchen and living room), and a server room with a service desk on floor 14. Andrew is making the characters.

You are not doing any 3D. Everything you make here is 2D or text: images that go onto screens, phones, papers, posters and signs inside those rooms, plus voice lines, questions and a fact check. Return one zip with the folders below. Keep file names exactly as given.

Rules that apply to everything:

- No personal names, no real company names. Harbor & Co. is the only company. Fictional outside firms are fine.
- No working links, domains, phone numbers or wallet addresses. Defang anything that looks like one (hxxp, [.]).
- Do not tie skin, accent, gender or size to who is lying.
- Do not invent incidents or statistics. If you cite a fact, give the source.
- Plain words. Short sentences. Same voice as the Monday and Tuesday–Friday drafts.

## 1. Prop textures (folder `textures/`)

Same style as `grok-art-tue-fri.zip`. Screens are 1600×900, phones 900×1950, papers and badges 1024×1024. WebP. An A file is the moment the player walks up; a B file is what it looks like after the wrong choice.

Screens and phones the game currently draws from text. Make A and B for each:

| File stem | What it shows (A → B) |
|---|---|
| `sat-delivery` (phone) | Text: parcel held, $1.99 fee, short link → a card-number form |
| `sat-breach` (screen, laptop) | Breach notice email from a streaming service → password reset with the same password plus a new number |
| `sat-post` (phone) | Draft post, desk photo, readable badge and whiteboard → posted, view count |
| `sat-router` (paper) | Router sticker, default admin login → router app showing old firmware and an unknown device |
| `adm-push` (phone) | 12th MFA prompt for an admin account → approved |
| `adm-vendor` (screen) | Role assignment page, Global Administrator selected for a vendor → assigned |
| `adm-daily` (screen) | Admin portal open, chat message with a lunch link → none needed, A only |
| `adm-script` (screen) | Forum answer with a download-and-run one-liner (defanged) → shell output with an outbound connection |
| `fin-payroll` (screen) | Email asking to change direct deposit → payroll record showing the new account |
| `fin-gift` (phone) | Text from "the owner" asking for gift card codes → A only |
| `fin-master` (screen) | Vendor bank change pending approval, entered by coworker → approved |
| `hlp-reset` (screen) | Service desk ticket, VIP password reset, urgent → temp password shown |
| `hlp-mfa` (screen) | Chat ticket asking to clear MFA → MFA methods cleared |
| `hlp-audit` (phone) | Desk phone display, inbound, "external audit" → A only |
| `wed-sheet` (paper) | Customer list marked INTERNAL → the same rows pasted into a slide |
| `thu-home-laptop` (screen) | Work laptop unlocked on a kitchen table → a personal upload in progress |
| `fri-aisle-laptop` (screen) | Copy dialog, 2,418 files to a USB drive → lid closed, copy finished |

Also fix one: `wed-share-dialog-a.webp` shows "Only people at Harbor" selected, but the beat starts with the share window already set to "Anyone with the link". Redo A with that option selected and the send button lit.

## 1b. Set dressing for the new rooms (folder `decor/`)

These go onto walls, boards and shelves so the new rooms are as lived-in as floor 14. Same painterly-photo style as `f14-print-quay.webp`. No real brands, no logos, no readable personal names. Night lighting in mind: nothing neon-bright.

| File | Size | What |
|---|---|---|
| `cafe-menu-board.webp` | 2048×1024 | Chalkboard menu behind the counter. Coffee, tea, pastries, prices. Fictional cafe name: Tidewater |
| `cafe-specials.webp` | 1024×1536 | A-frame chalkboard: today's specials, and "Free Wi-Fi: Tidewater_Guest, ask for the password" |
| `cafe-print-1.webp`, `cafe-print-2.webp` | 1024×1536 | Framed harbor photos for the cafe wall |
| `cafe-wifi-card.webp` | 1024×640 | Table tent: network name and password for the real cafe Wi-Fi |
| `home-print-1.webp`, `home-print-2.webp` | 1536×1024 | Framed prints for the living room |
| `home-fridge.webp` | 1024×1536 | A fridge door: a calendar, a takeout menu, a school drawing, magnets. No names |
| `home-router-sticker.webp` | 1024×640 | Close-up of a router label: model, default admin login, Wi-Fi name. Fictional brand |
| `srv-rack-labels.webp` | 2048×1024 | A sheet of rack and patch-panel labels (CORE-SW-01, FW-01, BACKUP-NAS…) |
| `srv-door-sign.webp` | 1024×1024 | "IT Room · Authorized staff only · Badge required" |
| `desk-queue-screen.webp` | 1600×900 | Service desk queue dashboard: open tickets, priorities, wait times |
| `desk-verify-poster.webp` | 1024×1536 | Poster on the service desk wall: "Verify before you reset. Call back on the directory number." |

## 2. Voice lines (file `voice/voice-sheet-week.csv`)

Same columns as `docs/voice-sheet.csv`: `day,beat_id,speaker_role,line,delivery_note,max_seconds`. One row per prompt and one per fallout line that has a speaker (not "Screen", "Phone", "Mail"). Source text is in `src/content/week/weekend.ts`, `src/content/week/tracks.ts`, and the `timeline` entries in `src/content/week/days.ts`. Keep each line under 12 seconds. Reuse Monday voices where the cast sheet says to. The fake finance lead (THU-03), the fake CFO caller (HLP-01), the fake auditor (HLP-03) and the fake owner (FIN-02) must all sound different from each other and from the real help desk.

## 3. Cast additions (file `cast/cast-sheet-additions.md`)

Same format as `docs/cast-sheet.md`. Add:

- **Admin peer**: the coworker in the server room on the Admins track (ADM-02). On screen and voice.
- **At home, Saturday**: no new body. Say which existing body, if any, appears.
- Voice-only roles for HLP-01, HLP-03 and FIN-02.

## 4. More knowledge-check questions (folder `kc/`)

Each pool has five questions today, and the check draws five, so every run is the same. Write ten more for each of: `kc-saturday.json`, `kc-track-admin.json`, `kc-track-finance.json`, `kc-track-helpdesk.json`, and six more each for Tuesday to Friday. Same shape as `src/content/drafts/kc-tuesday.json`. One right answer, two plausible wrong ones. Don't repeat a question already in the pool.

## 5. Fact check (file `review/fact-check.md`)

Read `src/content/week/tracks.ts` and `src/content/week/reminders.ts`. For each claim a security lead could challenge, say "fine" or give the fix and a source. Specifically:

- ADM-01: is "deny, reset password, revoke sessions, raise an incident" the right order for an admin MFA storm?
- ADM-02: is a time-limited scoped role (for example Entra PIM) the right answer for a vendor that asks for Global Admin?
- HLP-02: is live video with ID, or manager confirmation, a reasonable bar before an MFA reset?
- The control ids on every scenario. Flag any that don't fit the beat.

## 6. More Sunday sort items (file `sort/sunday-extra.json`)

`src/content/week/weekend.ts` has `SUNDAY_SORT` with sixteen items. Write sixteen more in the same shape (`id`, `from`, `subject`, `body`, `risky`, `why`). Mix of safe and risky, about half each. Ids `s17` to `s32`.

Do not send code or 3D. Content only. Claude models the rooms and wires it in.
