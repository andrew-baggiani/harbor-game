# The week remembers

Monday's choices plant consequences that show up later in the week.

## Seeds
| Monday choice | Seed |
|---|---|
| `mail-codes`, `phone-code`, `signin-yes` | creds |
| `usb-plug` | usb |

## Stages (per day, see `stageFor` in `src/content/week/world.ts`)
- **clean**: nothing planted.
- **planted**: a seed exists and nobody reported it. Tue–Thu show signs (session-expired screens, the svc_backup2 note, slow VPN).
- **contained**: the learner called IT (card button or the "Call IT · 4100" HUD button) before Friday. Friday opens with "Restored overnight".
- **breach**: planted and still unreported on Friday. Every screen on floor 14 shows the grey message, banners go up, and the file-share beat (`FRI-03-hour`) opens the night.

## Storage
- Signed-in learners: D1 table `world_state` (`migrations-d1/0003_world_state.sql`), written only from recorded decision events and `POST /api/world`.
- Anonymous players: localStorage `drc-week-world`.
- A new Monday run resets the week.

## Panel decisions applied
No heat bar. The IR fuse detonates Friday. Flat grey screens, no ransom art. Keep the gold ring. The player is never the attacker.
