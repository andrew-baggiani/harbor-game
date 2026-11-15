# Harbor & Co. Monday gap beats 6-9: integration note for Grok

Status: content, assets and voice are done. Nothing existing was edited. Andrew commits; this note covers what Grok wires in.
These four beats close the Monday coverage gaps in TRAINING_SPEC section 3: **CIS 14.7** (missing updates), **HIPAA 164.308(a)(5)(ii)(C)** log-in monitoring plus CIS 14.6 (unusual sign-in), **CIS 14.5 / 14.4** (misdirected email) and **CIS 14.4 / 14.3 / HIPAA (D)** (clean desk). With beats 1-5, Monday now covers CIS 14.2 through 14.7. (14.8, insecure networks, stays on Wednesday as the spec plans.)

## New files

| Path | What |
|---|---|
| `src/content/scenarios/mon-06-updates.json` | MON-06-updates, skill `patching`, flagKey `updates` |
| `src/content/scenarios/mon-07-signin.json` | MON-07-signin, skill `login-monitoring`, flagKey `signin` |
| `src/content/scenarios/mon-08-misdirect.json` | MON-08-misdirect, skill `data-exposure`, flagKey `misdirect` (two stages, see below) |
| `src/content/scenarios/mon-09-cleandesk.json` | MON-09-cleandesk, skill `clean-desk`, flagKey `cleandesk` |
| `src/content/scenarios/kc-monday-beats.json` | 24 knowledge-check items (6 per skill), same root-array shape as `kc-monday.json`, plus `why`, `beat`, `controls` |
| `public/assets/models/harbor_monday_beats.glb` (mirror in `assets/models/`) | 21 nodes, 1.16 MB, load at the origin with no offset |
| `tools/asset-build/labels_beats.py`, `tools/asset-build/build_monday_beats.py` | Texture and GLB build scripts (paths hard-coded to `/home/claude/harbor`, like the others) |
| `tools/fetch-voice-v2-beats.ps1` | Downloads take A of all 31 new lines into `public/voice/v2/` |

The scenario files use the exact shape of `mon-01..05` (`id, version, day, location, trigger, roles, skill, controls, variants, prompt, choices[{id,label,outcome,score,verb,flag,ok,debrief,bark,report}], beat, next, flagKey, tenant_tokens, knowledge_check_pool`). Extra keys are additive, so the `as Scenario[]` cast still works:
- scenario: `setup` (`{voice, speaker, text}`, the line that plays when the beat triggers), `tenant_defaults`, and on MON-08 `prompt_after_send`.
- variants: `caller/pressure/tell` as usual, plus per-variant data (`days`, `city`, `ip`, `wrong_recipient`, and the GLB node to show: `screen_node`, `compose_node`, `sent_node`, `printout_node`, `sticky_node`, `lock_node`).
- choices: `voice` (consequence file id), `consequence_text`, `debrief_voice`, `debrief_text`, and optional `show_after` / `hide_after` (node names, may contain variant tokens), `stage`/`then` (MON-08), `dispose_to` (MON-09).

## 1. Shift order and locations

```
tower > door > lobby > desk (MON-02 mail) > misdirect (MON-08) > phone (MON-03) > signin (MON-07)
      > usb (MON-04) > updates (MON-06) > maya (MON-05) > cleandesk (MON-09) > down > leave
```

| # | Beat (`beat`) | Where (glTF coords, y-up; floor 14 is y 50.6) | Trigger | Objective text (suggested) |
|---|---|---|---|---|
| 8 | `misdirect` | Player desk, `DESK` (-5.3, -2.75). Starts right after the mail choice | Play `misdirect.mp3` (Maya, a chat call), then show the compose overlay and open the panel | "Maya needs tonight's manifest sent. Your screen." |
| 7 | `signin` | Player desk. Starts ~3 s after the phone-beat debrief ends | Show `_Alert_A/B`, buzz the phone (small y-jitter, ~0.6 s, twice), play `signin.mp3` | "Your phone just buzzed." |
| 6 | `updates` | Desk_08, laptop at (4.69, 51.35, -7.95). Stand-point about (4.7, 50.6, -8.8) | Walk within 1.4 m (`interact_radius`), E | "Hot desk 14-08. The loaner laptop is yours tonight." |
| 9 | `cleandesk` | Printer top, printouts at (8.13, 51.65, -15.8), next to the shred bin (5.85, -16.3). Variant A also uses the player desk; variant B uses Desk_07 (2.4, -7.6) | After the wire choice: show the printout node (+ variant's sticky), play `cleandesk.mp3`, blip the printer. Open the panel on E at the printer | "Before you go: your print job is still on the printer." |

Existing `next` values Grok must change (I did not edit them): `mon-02 next: "misdirect"`, `mon-03 next: "signin"`, `mon-04 next: "updates"`, `mon-05 next: "cleandesk"`. The new files already chain `misdirect > phone`, `signin > usb`, `updates > maya`, `cleandesk > down`.

Code to touch: add the four ids to `Beat` and the four flag keys (`updates`, `signin`, `misdirect`, `cleandesk`) to `Flags`/`emptyFlags` in `story.ts`; import the four JSON files into `mondayScenarios` and add `kc-monday-beats.json` to `knowledgePool` in `scenarios.ts`; add interaction points in `sim.ts` (laptop and printer stand-points above; signin and misdirect reuse `DESK`); add `objectiveFor` and guide-blip cases. `skillScores`, `reportFromScenarios` and `contentHash` pick the new files up automatically once they are in `mondayScenarios`. `scoreOf` presumably sums per beat; with 9 beats, divide by the number of beats or weight as you like.

**Variants.** Pick one variant per beat at shift start (random, stored on the record so the debrief and xAPI match). Substitute `{{DAYS}}`, `{{CITY}}`, `{{WRONG_RECIPIENT}}`, `{{PRINTOUT}}` and the `*_NODE` tokens from the chosen variant, and `{{COMPANY}}`, `{{HELPDESK_PHONE}}`, `{{SECURITY_PHONE}}`, `{{REPORT_CHANNEL}}` from the tenant (defaults in `tenant_defaults`: Harbor, ext 4100, ext 4400, security@harborandco.com). `{{SECURITY_PHONE}}` is new; spec section 5 only lists the other three. A one-line `fill(text, map)` over `prompt`, `label`, `bark`, `report` is enough. The textures in the GLB are Harbor-branded defaults; tenant renders would need CanvasTextures drawn from the same strings.

## 2. Nodes in `harbor_monday_beats.glb`

Add it to `FILES` in `scenery.tsx` and run the existing `default_visible` traverse (`obj.visible = obj.userData.default_visible !== false`). Nothing here has a collider except the laptop (`box`). Variant/state screens of one prop sit in the same spot: show exactly one.

| Node | Parent | Default | role / key extras | Show / hide |
|---|---|---|---|---|
| `Beat_Updates_Laptop` | - | visible | `beat_updates`, `collider: box`, `interactive`, `interact_hint`, `interact_radius 1.4`, `desk: Desk_08` | Always there (set dressing until the beat) |
| `Beat_Updates_Screen_Normal` | laptop | visible | `beat_updates_screen`, `state: normal` | Hide at beat start |
| `Beat_Updates_Screen_Warn_A` / `_Warn_B` | laptop | hidden | `state: warning`, `variant` | Show the variant's at beat start (23 or 31 days, agent OFF) |
| `Beat_Updates_Screen_Ticket` | laptop | hidden | `state: reported` | After `updates-report` (hide the warning) |
| `Beat_Signin_Phone` | - | visible | `beat_signin`, `interactive`, `pickup`, `buzz: true` | On the player desk all night |
| `Beat_Signin_Phone_Screen_Dark` | phone | visible | `state: dark` | Hide at beat start; show again after `signin-yes` / `signin-ignore` |
| `Beat_Signin_Phone_Screen_Alert_A` / `_B` | phone | hidden | `state: alert`, `variant` (Reno, NV / Tulsa, OK) | Show at beat start |
| `Beat_Signin_Phone_Screen_Secured` | phone | hidden | `state: secured` | After `signin-report` |
| `Beat_Misdirect_Screen_Compose_A` / `_B` | - | hidden | `beat_misdirect`, `state: compose`, `overlays: Monitor_Player_Screen` | Show at beat start (A: Mark Delaney (external); B: Mark Delgado (personal)) |
| `Beat_Misdirect_Screen_Sent_A` / `_B` | - | hidden | `state: sent` | After `misdirect-send` (hide compose). Hide all four when the beat ends (or after `misdirect-check`) |
| `Beat_CleanDesk_Printouts_A` / `_B` (+ `_Print` child) | - | hidden | `beat_cleandesk_printouts`, `pickup`, `dispose_to: Shred_Bin_Secure` | Show the variant's when MON-08 ends (it's the manifest/contact list you printed). Hide after `cleandesk-shred` or `cleandesk-home` |
| `Beat_CleanDesk_Sticky_Player` | - | hidden | `beat_cleandesk_sticky`, `variant: A` | Variant A: show from the start of the shift. Hide after `cleandesk-shred` |
| `Beat_CleanDesk_PlayerScreen_Locked` | - | hidden | `beat_cleandesk_lockscreen`, `variant: A` | Variant A: after `cleandesk-lock` / `cleandesk-shred` |
| `Beat_CleanDesk_Desk07Screen_Locked` | - | hidden | `beat_cleandesk_lockscreen`, `variant: B` | Variant B: after `cleandesk-lock` / `cleandesk-shred` |

Reused existing nodes (from `harbor_f14_detail.glb`): `Shred_Bin_Secure` (the correct disposal), `Recycle_Bin_Paper` / `Trash_Bin` (wrong), and for variant B `Sticky_Password_Desk07` (hide after `cleandesk-shred`) and `Monitor_Desk07_Screen`. `Printer_Output_Sheets` (the wire form) can stay visible: the new printouts sit beside it on the printer, not on top of it.

Overlay depth: the misdirect overlays sit 2 mm in front of `Monitor_Player_Screen`, the lock screen 4 mm, the sticky 6.5 mm. If you see z-fighting at a distance, give those materials `polygonOffset` (factor -1, units -1) or set `renderOrder`.

## 3. Scoring

| Beat | skill | flagKey | Choice id | Label | flag | score | ok | verb | outcome |
|---|---|---|---|---|---|---|---|---|---|
| MON-06-updates | `patching` | `updates` | `updates-ignore` | Dismiss it and start the log | `ignore` | 0 | false | decided | unpatched_unreported |
| MON-06-updates | `patching` | `updates` | `updates-restart` | Restart it and keep working | `restart` | 40 | false | decided | unpatched_unreported |
| MON-06-updates | `patching` | `updates` | `updates-report` | Call IT on the badge number | `report` | 100 | true | reported | reported |
| MON-07-signin | `login-monitoring` | `signin` | `signin-yes` | Tap “Yes, it was me” | `yes` | 0 | false | decided | account_takeover |
| MON-07-signin | `login-monitoring` | `signin` | `signin-ignore` | Swipe it away | `ignore` | 40 | false | decided | session_left_open |
| MON-07-signin | `login-monitoring` | `signin` | `signin-report` | Tap “No, it wasn't me” and report it | `report` | 100 | true | reported | reported |
| MON-08-misdirect | `data-exposure` | `misdirect` | `misdirect-send` (stage 1) | Send | `send` | 0 | false | decided | misdelivered |
| MON-08-misdirect | `data-exposure` | `misdirect` | `misdirect-check` (stage 1) | Check the To line first | `check` | 100 | true | decided | caught_before_send |
| MON-08-misdirect | `data-exposure` | `misdirect` | `misdirect-hide` (stage 2) | Delete it from Sent and move on | `hide` | 0 | false | decided | concealed_exposure |
| MON-08-misdirect | `data-exposure` | `misdirect` | `misdirect-report` (stage 2) | Report it right now | `report` | 60 | true | reported | reported |
| MON-09-cleandesk | `clean-desk` | `cleandesk` | `cleandesk-leave` | Head out. It'll keep till morning | `leave` | 0 | false | decided | data_left_exposed |
| MON-09-cleandesk | `clean-desk` | `cleandesk` | `cleandesk-home` | Take the printouts home to finish | `home` | 0 | false | decided | data_removed |
| MON-09-cleandesk | `clean-desk` | `cleandesk` | `cleandesk-lock` | Lock the screen and go | `lock` | 40 | false | decided | partial_clean |
| MON-09-cleandesk | `clean-desk` | `cleandesk` | `cleandesk-shred` | Shred the printouts, lock the screen, pull the note | `shred` | 100 | true | decided | clean_desk |

- Best = 100, partial = 40-60, wrong = 0, matching TRAINING_SPEC rule 4 (reporting scores above ignoring).
- **MON-08 is two-stage.** Stage 1 shows only `stage: 1` choices (`misdirect-send`, `misdirect-check`). `misdirect-send` is transitional: play `misdirect-send.mp3` (it has no debrief), swap to the `sent` overlay, show `prompt_after_send` and the `then` choices (`misdirect-report`, `misdirect-hide`). The stage-2 choice overwrites the `misdirect` flag, so the final score is check 100, send then report 60, send then hide 0. `talkFromScenario` needs a filter on `stage` (choices without `stage` are always shown). For xAPI, emit both decisions (send, then report/hide).
- `verb`: `reported` for `updates-report`, `signin-report`, `misdirect-report`; `decided` otherwise.

## 4. Full script (voice ids and files)

Each consequence plays on the choice, then its debrief (same queue as the v2 debriefs: `say(id)` then `say("debrief-" + id)`). Setup lines play when the beat triggers.


### Beat 6: missing updates (loaner laptop, hot desk 14-08)

| File | Speaker | Line as sent to eleven_v4 (tags in brackets) | Est. | Node id | Take A / Take B generation ids |
|---|---|---|---|---|---|
| `updates.mp3` | Narrator | [calmly] IT left a loaner laptop at hot desk fourteen-oh-eight for the dock log. It's yours tonight. [short pause] There's a warning in the corner of the screen. | ~9s | `FmBEoj9STSbRYsdkaMwF` | `AgfEEe0ZL0ylpKuskMGy` / `JcMKmQG2V221Z1M7BCDQ` |
| `updates-ignore.mp3` | Narrator [bad] | You closed the warning. The laptop is still weeks behind, and nobody knows. | ~5s | `L1xv3EL2F2ab9AZrRMti` | `YhqOEsYO9tx7Eru1Se2W` / `o4Se4MVU8aEm2aagRHqi` |
| `debrief-updates-ignore.mp3` | Narrator [debrief] | Weeks of failed updates, and the security agent switched off. That's an open window. You don't have to fix it. Just tell IT, on the help desk number on your badge. | ~11s | `yAuSHK4JSgnxb4WilG7u` | `lQ65d4yqOlKCvofeO2vQ` / `VaC3OqH4MaBJhxSOw1JG` |
| `updates-restart.mp3` | Narrator [bad (partial score)] | It restarted. Same warning. The agent is still off. | ~3s | `CaqIgBPNrg0JSwgS2mkR` | `i0B3AI54SWuDpbLv9KdX` / `dlul6WMDwAS8y5i91ly9` |
| `debrief-updates-restart.mp3` | Narrator [debrief] | A restart is a fair first try. When it comes back the same, it's IT's job. Call the help desk on your badge, and leave the security tools alone. | ~10s | `4c5p2EGdoqTIbWSPWrbM` | `H6c6McDmd1JyGFwRdkp0` / `TB1TXCW83IYWVdDO9Smc` |
| `updates-report.mp3` | Narrator [good] | You called the help desk. They're pushing the updates and swapping the laptop. | ~5s | `Q4XKxMRrgdgDV23uCzDd` | `iIsPUShK74hlyWxs9K0a` / `u6ndnTQnEGw9Pw2W4sjT` |
| `debrief-updates-report.mp3` | Narrator [debrief] | That's the move. Failed updates and a security agent that's off both get reported. Don't switch tools off or on yourself. Tell IT, and let them fix it. | ~10s | `ePPC9uqiCIwrr4xaGMcw` | `eXwK01nVtIVO1uS7HMRb` / `fABZghI9kzzzWHbOVS3o` |

### Beat 7: unusual sign-in alert (your phone)

| File | Speaker | Line as sent to eleven_v4 (tags in brackets) | Est. | Node id | Take A / Take B generation ids |
|---|---|---|---|---|---|
| `signin.mp3` | Narrator | [calmly] Your phone buzzes on the desk. A sign-in alert for your Harbor account. | ~5s | `o5x4V2wLzPW86XK3MUSC` | `p02JGtWD10GY9LjIgAuz` / `dPl49DnWuSPlZ9bu8NPV` |
| `signin-yes.mp3` | Narrator [bad] | You tapped yes. Whoever that was is now signed in as you. | ~4s | `iXKJuEDY1A8zTPLN7bHj` | `DX6dz2LWN9G9v1w5kCQz` / `dm9q1A54JgqkcvA2IX5B` |
| `debrief-signin-yes.mp3` | Narrator [debrief] | You were right here, on fourteen. That sign-in came from somewhere else. Never approve one you didn't start. Tap no, then call security at extension 4400. | ~9s | `SvWbCfPKLIeB7AzVg2oU` | `HfwEEVoqnDAE2N0sFnn1` / `XukrgXzVGws5w0vLXKhM` |
| `signin-ignore.mp3` | Narrator [bad (partial score)] | You swiped it away. The session stays open, and nobody is watching it. | ~5s | `SPGuOBhKEfhdLBEYFLp0` | `jcukvwHfZqqREQOXXDfR` / `YMM4XFihSAHRqETmvbb2` |
| `debrief-signin-ignore.mp3` | Narrator [debrief] | Not approving it helps. But a sign-in you didn't make means someone may have your password. Tap no, and report it, so security can shut it down. | ~10s | `hr5Jgc0kYbW6A95dDAHU` | `CteMV0VJgtURpHf4w8nZ` / `Qk66Pcd6NZDBmFoT0Hzs` |
| `signin-report.mp3` | Narrator [good] | You tapped no and called it in. Security ended the session and reset your password. | ~5s | `JqPnkttjLxgMwBw8mlgE` | `UMywLnBEeg9ZMwP1rvDd` / `yaBf5ELkBGes8s4tHpp3` |
| `debrief-signin-report.mp3` | Narrator [debrief] | Exactly. A sign-in you didn't make is an incident, even at midnight. Tap no, then call security at extension 4400, or email security@harborandco.com. | ~8s | `PUFR2nfQwc7kvubpEUSq` | `XyqX3OVEoqo2jYKxjnDE` / `T2KARWUuwYRp6EfQtFlX` |

### Beat 8: misdirected email (autocomplete picks the wrong Mark)

| File | Speaker | Line as sent to eleven_v4 (tags in brackets) | Est. | Node id | Take A / Take B generation ids |
|---|---|---|---|---|---|
| `misdirect.mp3` | Maya Ruiz | [friendly] Hey, it's Maya. Can you send tonight's manifest to Mark Delgado on the dock team? He needs it before the Meridian loads. [lightly] It's the full one, with the customer details. | ~11s | `F8ORmkDigQmLcusc14bF` | `SCdILGVn7fyEU8Pj0lPX` / `kHfBPBUnrcnkpbUyOWJ4` |
| `misdirect-send.mp3` | Narrator [bad] | Sent. Then you read the To line. That's not the Mark on the dock team. | ~5s | `4qSMHU5qJ2edWB9M2SEU` | `emBU7ZMRqCyzndVECHvQ` / `GqRIqC4C7zgAruN73Q92` |
| `misdirect-check.mp3` | Narrator [good] | You caught it. Autocomplete picked the wrong Mark. You fixed the To line and sent it to the right one. | ~7s | `5GdbFe7UL15oU46CNgH9` | `HXfPLbIjxiw5Cnw9lRer` / `vkeO0jlapehlJbDA4O2m` |
| `debrief-misdirect-check.mp3` | Narrator [debrief] | Good catch. Autocomplete guesses, and sometimes it guesses wrong. Read the To line before anything with customer data goes out. | ~7s | `oHDUuGCRhj24FUWml9c7` | `h7M7WKqH4nEdkVREi9pK` / `LHV6cGewOkj0vqZi2fxB` |
| `misdirect-hide.mp3` | Narrator [bad] | You deleted it from Sent. Their copy is still sitting in their inbox. | ~5s | `TbRqYYlKfp0lfbfABw7A` | `dYq8Xhdd1676AQlW28dp` / `3guW60u2s9M1Pwuj8TMH` |
| `debrief-misdirect-hide.mp3` | Narrator [debrief] | Deleting your copy doesn't unsend it. Customer data just left Harbor. Report it right away, so security can try to recall it and contain it. | ~9s | `TkwIwJKcSGX8CskDyJjq` | `aiTGHt1sYOmTVxkCkoAM` / `wRssln7c4cFBwDxRqced` |
| `misdirect-report.mp3` | Narrator [good (partial score)] | You called security straight away. They recalled the message and reached the person who got it. | ~6s | `mTEC3GOm7kntqJv7OTNL` | `3xyLsTgWKkjnaAD9Ghu2` / `eLFoS1WbMwndD1OvkH3d` |
| `debrief-misdirect-report.mp3` | Narrator [debrief] | Right call. Mistakes happen. Reporting in minutes, not days, is what keeps one small. Next time, check the To line before you hit send. | ~9s | `ZhJxfhpOmSrIUUVY02Ih` | `6XcfZ7VCgaKO3Lp9nQBw` / `Jcfj8Zq543NZxuLaaMbm` |

### Beat 9: clean desk, end of shift

| File | Speaker | Line as sent to eleven_v4 (tags in brackets) | Est. | Node id | Take A / Take B generation ids |
|---|---|---|---|---|---|
| `cleandesk.mp3` | Narrator | [calmly] That's the shift. Before you head for the elevator, take one last look around. [short pause] Your print job never got picked up. | ~8s | `egpi5sE3HU3uIHratk2y` | `N3ZI5mdgTdn0Yg61cKTq` / `MpQf3Wu1RLzFdriuKV0f` |
| `cleandesk-leave.mp3` | Narrator [bad] | You left it all out. The night crew walks right past the printer, and the screen is still open. | ~7s | `loxvbErJHYp7lfDsCJ1k` | `J1dWYbzrwefptQfpxXja` / `hY2LD4e14rdxg7oZ4Vlv` |
| `debrief-cleandesk-leave.mp3` | Narrator [debrief] | Customer data on the printer, an open screen, a password on a sticky note. Anyone walking the floor gets all three. Shred the paper, lock the screen, lose the note. | ~11s | `T9EH98Cmh5YxQOFdscWR` | `22n9NXyo5vcLy5pMD3om` / `hUFRAkdNE0MIfgJtIYF4` |
| `cleandesk-home.mp3` | Narrator [bad] | The printouts went home in your bag. Customer data, off the premises. | ~4s | `ZeBp1vasDwKAbHy1z4WB` | `umU22zlwn8b8k8OiI66s` / `2VFHEK7GOkCJBqlyVcOW` |
| `debrief-cleandesk-home.mp3` | Narrator [debrief] | Paper with customer data stays in the building. A bag left on a train is a breach. When you're done with it, it goes in the locked shred bin. | ~10s | `xhaFDAwo6ovLIgVEkFIx` | `CqNsNApoFUk3EOo2x7N7` / `QgzBOyJ8b2USqc8fx6FQ` |
| `cleandesk-lock.mp3` | Narrator [bad (partial score)] | Screen locked. The printouts and the sticky note are still out. | ~4s | `RFXacTg7HVjCQMTkSjKq` | `0sQGq2fJBAtMEGgaWRES` / `JpDdMX6pawQmHyRGLsSC` |
| `debrief-cleandesk-lock.mp3` | Narrator [debrief] | Locking the screen is half the job. The paper goes in the shred bin. The password comes off the monitor and into the password manager. | ~9s | `9nTZ9YHOSjkidaKhXUsF` | `D0hm1gj3QWHNuB9HDVkW` / `MOLT3XBoK9TFzord6I9N` |
| `cleandesk-shred.mp3` | Narrator [good] | Printouts shredded. Screen locked. The note is gone. | ~3s | `7UemR7zfDag5u7mMqKSh` | `8SX4fFqJH9yqtcZfykox` / `LrUnGUZzS1kJbnYjFD5P` |
| `debrief-cleandesk-shred.mp3` | Narrator [debrief] | Clean desk. Confidential paper goes in the locked shred bin, never the recycling. Lock your screen every time you stand up. Passwords live in the password manager, not on a sticky note. | ~11s | `5yEJ0cJVL60OcYn3LzeH` | `paKHNgJmZBTQIAVt1Bna` / `7KUPZBLGZG9OfxkyJPFP` |

Voiced lines name no variant detail (city, recipient, days), so one render fits both variants; the panel text carries the variant. Debriefs mention extension 4400 and security@harborandco.com like the v2 debriefs, so the same tenant caveat applies.

## 5. Addendum to VOICE_SCRIPT.md

(Kept here, not edited into VOICE_SCRIPT.md.)

- Flow: the same ElevenLabs flow, **"Harbor & Co. - Monday voice v2"** (`pNOO2zzw0OTdQwuWRgev`), https://elevenlabs.io/app/flows/pNOO2zzw0OTdQwuWRgev . The 31 new nodes are the ids in section 4 (labelled "New tts node" on the canvas, like the v2 ones).
- Model `eleven_v4`, same cast: Narrator = Benjamin `rBBV1yn6Ib1hDeOTrn08` (30 lines), Maya Ruiz = Tasha `az2Mp58wQOuqO5SHlCwL` (1 line, `misdirect.mp3`). Default 2 takes each, no retries.
- Lines: 31 (4 setups, 14 consequences, 13 debriefs). Takes: 62. Credits: 7,050.
- Audio is not downloaded yet (the cloud proxy blocks elevenlabsusercontent.com). **Before 2026-11-15 22:00 UTC (4:00 PM Central)** run `powershell -ExecutionPolicy Bypass -File tools\fetch-voice-v2-beats.ps1` from the repo root. It's the same as `fetch-voice-v2.ps1`: take A, trims silence, -16 LUFS, mono 44.1 kHz 128 kbps into `public/voice/v2/`, prints durations. After that time, open the flow and download takes by node id.
- Listen first to `misdirect.mp3` (Maya, the only character line) and the longer debriefs; take B may be better there.

Add these `voiceFor()` cases (and the matching `speaker` labels: setups `updates`/`signin`/`cleandesk` -> `Narrator`, `misdirect` -> `Maya Ruiz · chat`, consequences -> `Narrator`, `debrief-*` -> `Narrator · debrief`):

| id | kind | text |
|---|---|---|
| `updates` | narrator | IT left a loaner laptop at hot desk fourteen-oh-eight for the dock log. It's yours tonight. There's a warning in the corner of the screen. |
| `updates-ignore` | narrator | You closed the warning. The laptop is still weeks behind, and nobody knows. |
| `debrief-updates-ignore` | narrator | Weeks of failed updates, and the security agent switched off. That's an open window. You don't have to fix it. Just tell IT, on the help desk number on your badge. |
| `updates-restart` | narrator | It restarted. Same warning. The agent is still off. |
| `debrief-updates-restart` | narrator | A restart is a fair first try. When it comes back the same, it's IT's job. Call the help desk on your badge, and leave the security tools alone. |
| `updates-report` | narrator | You called the help desk. They're pushing the updates and swapping the laptop. |
| `debrief-updates-report` | narrator | That's the move. Failed updates and a security agent that's off both get reported. Don't switch tools off or on yourself. Tell IT, and let them fix it. |
| `signin` | narrator | Your phone buzzes on the desk. A sign-in alert for your Harbor account. |
| `signin-yes` | narrator | You tapped yes. Whoever that was is now signed in as you. |
| `debrief-signin-yes` | narrator | You were right here, on fourteen. That sign-in came from somewhere else. Never approve one you didn't start. Tap no, then call security at extension 4400. |
| `signin-ignore` | narrator | You swiped it away. The session stays open, and nobody is watching it. |
| `debrief-signin-ignore` | narrator | Not approving it helps. But a sign-in you didn't make means someone may have your password. Tap no, and report it, so security can shut it down. |
| `signin-report` | narrator | You tapped no and called it in. Security ended the session and reset your password. |
| `debrief-signin-report` | narrator | Exactly. A sign-in you didn't make is an incident, even at midnight. Tap no, then call security at extension 4400, or email security@harborandco.com. |
| `misdirect` | woman | Hey, it's Maya. Can you send tonight's manifest to Mark Delgado on the dock team? He needs it before the Meridian loads. It's the full one, with the customer details. |
| `misdirect-send` | narrator | Sent. Then you read the To line. That's not the Mark on the dock team. |
| `misdirect-check` | narrator | You caught it. Autocomplete picked the wrong Mark. You fixed the To line and sent it to the right one. |
| `debrief-misdirect-check` | narrator | Good catch. Autocomplete guesses, and sometimes it guesses wrong. Read the To line before anything with customer data goes out. |
| `misdirect-hide` | narrator | You deleted it from Sent. Their copy is still sitting in their inbox. |
| `debrief-misdirect-hide` | narrator | Deleting your copy doesn't unsend it. Customer data just left Harbor. Report it right away, so security can try to recall it and contain it. |
| `misdirect-report` | narrator | You called security straight away. They recalled the message and reached the person who got it. |
| `debrief-misdirect-report` | narrator | Right call. Mistakes happen. Reporting in minutes, not days, is what keeps one small. Next time, check the To line before you hit send. |
| `cleandesk` | narrator | That's the shift. Before you head for the elevator, take one last look around. Your print job never got picked up. |
| `cleandesk-leave` | narrator | You left it all out. The night crew walks right past the printer, and the screen is still open. |
| `debrief-cleandesk-leave` | narrator | Customer data on the printer, an open screen, a password on a sticky note. Anyone walking the floor gets all three. Shred the paper, lock the screen, lose the note. |
| `cleandesk-home` | narrator | The printouts went home in your bag. Customer data, off the premises. |
| `debrief-cleandesk-home` | narrator | Paper with customer data stays in the building. A bag left on a train is a breach. When you're done with it, it goes in the locked shred bin. |
| `cleandesk-lock` | narrator | Screen locked. The printouts and the sticky note are still out. |
| `debrief-cleandesk-lock` | narrator | Locking the screen is half the job. The paper goes in the shred bin. The password comes off the monitor and into the password manager. |
| `cleandesk-shred` | narrator | Printouts shredded. Screen locked. The note is gone. |
| `debrief-cleandesk-shred` | narrator | Clean desk. Confidential paper goes in the locked shred bin, never the recycling. Lock your screen every time you stand up. Passwords live in the password manager, not on a sticky note. |

Timing: setups run 5-11 s; consequences 3-6 s; debriefs 8-12 s, so consequence + debrief stays inside the 20-30 s debrief window. `caption.t = min(16, 5 + text.length/18)` works for all of them.

## 6. Knowledge check

`kc-monday-beats.json`: 24 items, skills `patching`, `login-monitoring`, `data-exposure`, `clean-desk` (6 each), 4 choices, exactly one `correct: true`, plus `why`. `drawKnowledgeCheck` draws from the whole pool, so merge it in; if you want guaranteed coverage, draw at least one per skill that the learner played.

## 7. Things Grok must handle

1. `Beat`/`Flags` types, `next` edits in mon-02..05, the JSON imports, sim.ts interaction points, objectives (sections 1-2).
2. Stage filtering and the second prompt for MON-08.
3. Variant pick + token fill (including node-name tokens in `show_after`/`hide_after`).
4. The phone buzz (jitter + optional vibrate SFX) and showing the printouts when MON-08 ends.
5. Shred interaction: for `cleandesk-shred`, walking the printouts to `Shred_Bin_Secure` is a nice touch but optional; the panel choice alone is enough.
6. Re-check `visible` in `collect()`/`hitScenery` (the laptop is the only collider, and it's always visible).
7. Run the fetch script before 22:00 UTC, then `voiceFor`/speaker entries.
8. Add the four new control rows to the coverage matrix: MON-06 -> CIS-14.7, MON-07 -> 164.308(a)(5)(ii)(C), MON-08 -> CIS-14.5, MON-09 -> CIS-14.4 / 164.308(a)(5)(ii)(D).

## Previews

Cycles renders (in context with `harbor_office_f14.glb` and `harbor_f14_detail.glb`) are in the asset session at `/home/claude/harbor/out/beats_*.png`: updates, updates_wide, signin, misdirect, desk, print, cleandesk, desk07.
