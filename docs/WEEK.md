# The week after Monday

Tuesday to Sunday, the three role tracks, and the monthly reminder. Monday stays on its own engine (`src/game/Harbor.tsx`). Everything here is newer and data-driven.

## Where things live

| What | File |
|---|---|
| Shift definitions (beats, rooms, props, fallout timelines) | `src/content/week/days.ts`, `weekend.ts`, `tracks.ts` |
| Monthly reminders | `src/content/week/reminders.ts` |
| Registry, choice lookup for the server, names for the portal | `src/content/week/index.ts` |
| Rooms and their spots (where each beat happens) | `src/game/weekplay/sets.ts` |
| Monday's tower (floor 14, lobby) with Monday's lights and post stack | `src/game/weekplay/HarborStage.tsx` |
| The cafe and the home: modeled, Cycles-baked GLBs | `src/game/weekplay/BakedRoom.tsx`, built by `build_rooms.py` |
| Props, cast stand-ins, first-person walker | `src/game/weekplay/Scene.tsx` |
| Flow: intro, beats, fallout, debrief, knowledge check, result | `src/game/weekplay/ShiftGame.tsx` |
| Sunday's 90-second sort | `src/game/weekplay/SundaySort.tsx` |
| Routes | `/week`, `/week/<id>`, `/reminder` |

Tuesday to Friday still read their scenario text from `src/content/drafts/*.json` (Grok's drafts). `days.ts` adds the room, the prop and the fallout timeline.

## How a beat works

The player walks to the gold ring, presses E (or taps), reads the prop, and picks. A wrong choice doesn't end the night: the timeline plays out over the next 30 seconds or so while they walk to the next beat (scripted seconds × 0.4). Steps with `flip: true` swap the prop to its B texture. After the last beat: debrief, then five knowledge-check questions (80% to pass). Passing logs `shift_complete` with the shift id.

## Swapping greybox for MetaHumans

Every speaking figure is a `CastFigure` with a `slot` (`desk-coworker`, `contractor`, `last-day`, `at-home`, `night-desk`, `admin-peer`, `dock-runner`). Slots match `docs/cast-sheet.md`. To swap in a character:

1. Export the MetaHuman as GLB with idle and talk animations.
2. In `Scene.tsx`, have `CastFigure` load `/assets/models/cast/<slot>.glb` when it exists, and fall back to the greybox `Figure` when it doesn't.
3. Voice-only roles (`caller`) never get a body.

## Rooms

- **Floor 14 and the lobby** (Tuesday, Wednesday, Friday, all three role tracks) are Monday's own models, rendered by Monday's `HarborWorld`, so the detail and baked lighting are identical. Screen beats at the player's desk paint onto the real `Monitor_Player_Screen` mesh. The Admins track uses the IT closet door on floor 14.
- **The cafe and the home** (Thursday, Saturday) are new rooms built in Blender with the same pipeline as Monday (`/home/claude/harbor/build_rooms.py cafe|home`): textured materials, real furniture, Cycles-baked lightmaps (`harbor_cafe_baked.glb` + `harbor_cafe_lm.jpg`, same for home). Decor placeholders (menu board, fridge, router label, street views) come from `labels_rooms.py` and get replaced by Grok's decor pack.
- The old greybox room in `Scene.tsx` is only a fallback now.

## Records

- Decisions post to `/api/events` with the choice id. The server finds the scenario (Monday or week) and records `shift` from the scenario's `day`.
- Tracks are campaigns with `shifts = ["track-…"]`. They're assigned per person in the portal (People → Tracks). Monday's campaign lookups ignore track campaigns.
- Reminders record as `shift = "reminder"`, one decision each. The portal shows who answered this month and can send this month's link.

## Coverage

`/coverage` reads controls from Monday and every week scenario. Role-based controls (AT-3, 3.2.2, AT.L2-3.2.2, CIS 14.9, PR.AT-02) come from the tracks; HIPAA 164.308(a)(5)(ii)(A) comes from the reminders. Nothing is listed as a gap now. That doesn't mean a client is compliant: the tracks still have to be assigned and the reminders sent.
