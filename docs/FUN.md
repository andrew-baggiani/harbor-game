# Optional play in the week shifts

Content: `src/content/week/play.ts`. Engine: `src/game/weekplay/ShiftGame.tsx` and `Scene.tsx` (`FindProp`, `Poke`, `Walker` items).
Plan and research: the "Dry Run Cyber: making it fun" doc.

- **Toys.** Press Space (or E) near an object that's already in the room: printer, coffee machine, elevator button, camera,
  barista bell, fridge and so on. Each press gives the next line; the last one repeats. No score.
- **Finds.** Small security slip-ups placed in each room: sticky-note password, loose badge, printout in the tray,
  USB stick, whiteboard login, QR flyer, dropped badge, fridge password note, a family tablet signed in to work.
  They glint now and then until found. Optional; counted in the HUD (FINDS n/m) and on the debrief ("Sharp eye"),
  with a one-line why for each. The week page shows how many are still hidden after a shift is played.
- **The coworker.** "Next desk" on floor 14: says hello (the kayak story, never finished), reacts to finds,
  and nudges you back to the gold light after 45 s away from it. Off floor 14 the nudge comes from your phone.
- **Rules.** The beat always wins: optional things only offer themselves when the beat isn't in reach.
  Nothing optional gates a beat, the check or the score. No jokes in the decision panel or the debrief.
  No names in lines, so the company-name swap keeps working.

- **Monday.** The same toys and finds on floor 14 and in the lobby (`src/game/mondayPlay.ts`), minus the finds Monday
  already teaches as beats (badge on the counter, printer tray, USB). Two lobby-only finds: the CCTV login on the
  monitors and the propped stair door. Monday's report gets the same "Sharp eye" section. No coworker on Monday.
- **Mistakes play out in the room.** Every wrong-choice fallout step jolts the beat's prop; a step that flips the
  prop also sets off a red pulse with a two-tone alarm blip. `fx: "papers"` on a fallout step (or `papers` on a toy)
  throws a dozen sheets out into the room. The printer does it on its third poke.
- **Voices.** Every new line has a stable id and plays `/voice/v2/<id>.mp3` when the file exists, the browser voice
  otherwise. `node tools/voice/build-sheet.mjs` writes `docs/voice-all.json` (every week, AI-shift and play line with
  its ElevenLabs voice); `tools/voice/generate.ps1` records the missing ones on a Windows PC.

Not yet: finds sent to the portal record, exploring time tracked separately, watchable fallout on Monday.

## Music, room tone and sound effects

`src/content/audio.ts` lists every track and effect with its ElevenLabs prompt; `src/game/sound.ts` plays them.
- **Beds:** office music + office room tone on floor 14 (server room: fans only), lobby music + echo in the lobby,
  cafe jazz + chatter, home lo-fi + fridge hum, the water outside on Monday, and elevator muzak for Monday's ride.
  Music crossfades into itself, dips while someone talks, and has a Music on/off button in the week HUD
  (remembered per browser).
- **Effects:** each toy has its own (the printer escalates to a full spew), a chime for a find, a two-tone alert
  when a prop flips, a phone buzz on other wrong-choice steps, an elevator ding on Monday's arrival.
- Missing files are silent and effects fall back to the old synthesized blips, so nothing breaks before recording.
- `tools/voice/generate.ps1` records all of it (`-What music`, `-What sfx` or `-What voices` for one group).
