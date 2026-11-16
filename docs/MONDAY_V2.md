# Monday v2: from choosing to doing

Status: design spec plus one working prototype (the mail beat). Owner: Claude for content, specs and prototypes; Grok for wiring into the 3D game.

## 1. The problem

Every Monday beat today works the same way: something happens, a panel opens with 2 to 4 buttons, you pick one, you hear a debrief. That is a quiz with scenery. Players learn which button is "right", not the habit. Auditors see that too: NIST AT-3 and CMMC AT.L2-3.2.2 ask for role-based, practical training, and a menu is weak evidence of it.

## 2. Five rules for every beat

1. **Investigate, don't pick.** Each beat gives the player tools that exist at work: headers, link previews, the staff directory, a call-back number, a badge reader log, the sign-in prompt's location. The tells are there to be found. No button says "this is phishing".
2. **Real actions, real channels.** The safe move is the one they'd do at work: the Report phish button, extension 4400, the incident form, locking the screen. Never a button labeled "Refuse".
3. **Consequences can land later.** Some mistakes pay off an hour later in game time: an account locks, a printer acts up, Maya gets an angry call. The end-of-shift debrief connects cause and effect.
4. **People push back.** NPCs react to what you do. The courier argues. The "CFO" escalates. Holding the line is part of the skill.
5. **Not everything is a trap.** Each run, some requests are legitimate. Retakes reshuffle which. Players learn to verify, not to refuse everything. Reporting a real request is never punished.

## 3. Scoring

Keep the v1 decision scale (0 / 40 / 100 per beat) so pass rules, records and the knowledge check don't move. Add two recorded extras:

- **Evidence:** which tells the player actually found (hovered a link, opened headers, marked a line, checked the directory). Stored on the xAPI statement as `https://harbor.example/evidence`.
- **Verified:** whether they used a second channel (directory, call-back, IT) before acting.

Optional tenant setting: turn evidence into a bonus (up to +30 per beat) for a leaderboard. Never let the bonus rescue a failed decision.

## 4. Beat by beat

Each beat keeps its v1 id, outcomes, voice lines and debriefs. What changes is how the player gets to the outcome.

### MON-01 Door (tailgating). Built.
- Built as a reusable in-world conversation bar (`src/game/talk/`, scene stays visible) + `mon-01-tailgate-v2.json`. Look options (lanyard, parcel, reception through the glass) inspect without answering. Holding the door adds `courier_in` fallout for the clean-desk beat (parcel on desk 07, missing laptop: 3D side still to do).
- Today: Hold the door / Shut it.
- v2: The courier walks up as you badge in, arms full, and says he's late. You can **look at him** (no badge on the lanyard, parcel label says "Finance" but no name), **ask who it's for**, **point to reception**, or **let the door close**. If you shut it, he pushes back once ("I do this every night, man"), and you have to repeat yourself or call reception (ext 1000). Holding the door is still possible and still fails.
- Later: if you let him in, the parcel is on desk 07 in the clean-desk beat and a laptop is missing from the hot desk.

### MON-02 Mail (phishing / BEC). Prototype built.
- v2: A real inbox: five mails, one phish per run (gift-card BEC or fake mailbox sign-in), the rest legitimate (IT maintenance, Maya's manifest note, HR benefits). Tools: click the sender for the full address and Reply-To, hover or tap (i) on links to see where they go, the highlighter to mark what looks wrong, the staff directory with a Call button, and Report phish in the toolbar.
- Outcomes: Report phish = `mail-report`. Reply with codes or type a password on the fake page = `mail-codes`. Close the inbox without reporting = `mail-ignore`. Reporting a legitimate mail costs nothing and gets a "that's fine" note.
- Later: if you typed your password, the sign-in beat (MON-07) gets nastier: the push comes from your own account, and IT calls at 1 AM.

### MON-08 Misdirect (wrong recipient). Built.
- Built as `src/game/mail/ComposeApp.tsx` on the desk monitor (same zoom as mail) + `mon-08-misdirect-v2.json`: Maya's chat, a compose window whose autocomplete offers the wrong Mark first, an EXTERNAL warning, an attachment preview, then Sent / failed recall / Report or Delete. Calls choose() for both v1 steps.
- Today: Send / Check the To line, then Report / Delete.
- v2: Maya's manifest request opens a compose window. The To field autocompletes "Kessler" to two addresses, kessler-logistics.com (real customer) and kesslerlogistics.co (lookalike from last month's thread). The player has to look at the autocomplete. Send to the wrong one and the "Recall" option fails; the right move after is Report to Security (data went outside). Bonus evidence for opening the attachment preview and noticing it has customer data.

### MON-03 Phone (vishing). Built.
- Built as `src/game/phone/` + `mon-03-vishing-v2.json`. Opens as a call screen (no camera move, player frozen), opening line voiced with the existing `phone` clip; the follow-up caller lines are text for now and need voice takes.
- Today: Give the code / Hang up.
- v2: A conversation, not a yes/no. The caller says he's from the IT desk and needs the six-digit code. You can **ask his name**, **ask for his extension**, **say you'll call back**, **give the code**, or **hang up**. He has answers for the first two (fake name, "4401"). The directory shows the real desk is 4400 and 4401 doesn't exist. Calling 4400 back gets "We never ask for codes." Giving the code ends the beat as a fail; hanging up without reporting is the 40-point outcome.
- Later: if you gave the code, your account sends the sign-in push in MON-07.

### MON-07 Sign-in (MFA fatigue). Built.
- Built as `src/game/signin/SigninPush.tsx` + `mon-07-signin-v2.json`: authenticator push with location, device, number matching, "Look at your monitor" (no number there because you didn't start a sign-in), and the request re-pushing every 8 s. Deny then Report = `signin-report`, approve = `signin-yes`, swipe/deny-only = `signin-ignore`. Legit runs still to do (needs a new outcome id).
- Today: Approve / Ignore / Report.
- v2: The desk phone shows an authenticator prompt with a **location** (Lagos, or your own city on legit runs), an **app name** and a **number match**. On some runs it's legit: you just tried to sign into the HR portal yourself, and the number on screen matches. The player has to compare. Prompts repeat every 20 seconds while the beat is open: fatigue is the attack.

### MON-04 USB (removable media). Built.
- Built with the conversation bar in narration mode + `mon-04-usb-v2.json`: look at the label (bait), look at the unlocked laptop, call IT, then bag / leave / plug. Plugging in schedules the printer glitch (75 s of play later) and IT's call (85 s), via `after()` in `fallout.ts`. Sending the manifest to the wrong Kessler schedules Kessler's call (60 s).
- v2: The drive is labeled "Q4 bonuses - CONFIDENTIAL". You can pick it up, look at it, plug it in, hand it to IT, or leave it. If you plug it in, nothing visible happens. Forty minutes later the printer prints garbage and IT calls. If you hand it to IT, the debrief tells you what was on it.

### MON-06 Updates. Built.
- Built with the conversation bar (narration) + `mon-06-updates-v2.json`. Kept the v1 story (a real Device Health warning, not a fake pop-up): open Windows Update, look at the Shield icon, check your badge, restart, call IT (ext 4100).
- v2: The loaner at hot desk 14-08 shows a browser pop-up: "Your Chrome is out of date". On legit runs, it's the real Windows Update tray notice instead. The tells: it's a web page (address bar visible), it asks you to download an .exe, the real updater never does that. Restart via the system tray = fine on legit runs. Click the pop-up = fail.

### MON-05 Wire (payment fraud). Built.
- Built with the conversation bar + `mon-05-wire-v2.json`: see "Elena's" text (unknown number, "don't call"), check the form (it works), ask why you, Maya relays the escalation, call the real Elena on ext 2210.
- v2: Maya relays an "urgent" vendor email changing bank details. You have a phone, the vendor master file and Maya. The right path: call the vendor on the number in the master file (not the one in the email) and report. The "CFO" escalates by email if you stall: "Why is this not done?" Holding firm against that is the skill.

### MON-09 Clean desk. Built.
- Built with the conversation bar as a checklist (shred, lock, pull the note, or bag it home) then Head out; the outcome comes from what you did. If the courier got in, it opens with his parcel on desk 07 and the loaner gone, plus a Call security action.
- v2: End of shift, free roam of your desk area. Things to deal with: the manifest printout, a sticky note with a password on the monitor, an unlocked screen, a visitor badge someone left. No menu: you interact with each object (shred, lock, return to reception). Score is how many you handled before leaving.

## 5. Delayed consequences: how they work

Built: `src/game/fallout.ts`. `choose()` adds fallout from v1 ids (phone-code, usb-plug, door-hold, misdirect-send); the inbox adds `creds_phished` when a password goes into the fake page. Live today: `code_given` / `creds_phished` change the sign-in push (red banner, extra tell). The others are recorded and waiting for their beats.

Add one field to the world flags: `fallout: string[]`. A failed beat pushes an event (`creds_phished`, `usb_plugged`, `courier_in`). A small scheduler fires each event at a set game-time minute:

| Fallout | Fires at | What happens |
|---|---|---|
| `creds_phished` | +30 min | MON-07 push comes from your own account; IT call |
| `code_given` | +20 min | Same as above |
| `usb_plugged` | +40 min | Printer on 14 prints garbage; IT asks if you plugged anything in |
| `courier_in` | clean-desk beat | Parcel on desk 07, laptop missing from 14-08 |
| `misdirect_sent` | +15 min | Kessler's real ops lead calls asking why someone sent a manifest to a stranger |

Each fallout has a short voice line and a line in the end-of-shift debrief: "This happened because of that."

## 6. Mail beat: wired in, with the desk zoom

Built and wired by Claude. Grok: keep these, don't re-implement.

How it plays: at your desk, E on "Email on your desk" glides the camera over your shoulder onto the monitor (0.85 s, no cut). The monitor already shows this shift's inbox as a texture. When the camera settles, the clickable inbox appears exactly over the monitor's screen (same picture, so the swap is invisible) and the HUD dims. When the beat ends, the camera glides back out and the v1 outcome goes to `choose()`, so the debrief voice, flags and records run as before.

Files:
- `src/game/focus.ts`: the desk zoom. `registerScreen`, `enterFocus`, `exitFocus`, `stepFocus`, `applyFocus` (camera blend + projected screen rectangle), `applyScreenImage`. Reusable for the phone, sign-in and laptop beats: register another screen mesh and call `enterFocus(id, app)`.
- `src/game/mail/DeskScreen.tsx`: mounted once in `Harbor.tsx`. Portals the inbox onto `<body>` at the monitor's rectangle. Below 760 px wide (phones), it goes full screen instead.
- `src/game/mail/MailClient.tsx`, `mailLogic.ts`: the inbox and its scoring.
- `src/content/scenarios/mon-02-phishing-v2.json`: inbox content.
- `public/assets/ui/desk_inbox_a.jpg`, `desk_inbox_b.jpg`: the monitor texture per variant (screenshots of the inbox's opening state, 1280×704).
- `src/routes/lab.mail.tsx`: playground at `/lab/mail`. `routeTree.gen.ts` regenerates on dev or build.

Touched in existing files:
- `draw.tsx` Rig: runs the focus blend after the follow camera; hides the gold marker while focused.
- `sim.ts`: the `mail` action calls `enterFocus("desk", "mail")` (falls back to the v1 panel if the screen isn't registered); the sim freezes the player while focused.
- `scenery.tsx`: registers `Monitor_Player_Screen` as the "desk" screen and puts the inbox picture on it.
- `state.ts`: `reset()` calls `resetFocus()`.
- `Harbor.tsx`: mounts `<DeskScreen />`.

Still to do: write `focus.lastResult` (evidence, verified, reportedLegit) into the xAPI statement as context extensions; `window.__focusTest.enter()` exists for automated checks.

## 7. Order of work

1. Mail beat (prototype done) → wire into the night.
2. Phone beat as a conversation, plus the `fallout` scheduler.
3. Sign-in with legit runs and number match.
4. Door with courier pushback.
5. The rest.

Each beat ships on its own and keeps the v1 outcome ids, so nothing else breaks while the rest are still v1.

## 8. Phone numbers (keep consistent)

IT Service Desk ext 4100 (the badge number). Security ext 4400. Elena Voss ext 2210. The fake "Dan" calls from ext 4101.

## 9. Voice for v2 lines

New lines play from `public/voice/v2/<id>.mp3` and fall back to the browser voice until the file exists. Ids: `v2-door-*`, `v2-phone-*`, `v2-usb-it`, `v2-updates-*`, `v2-wire-*`, `v2-fallout-*` (19 clips). ElevenLabs flow "Harbor & Co. - Monday v2 conversations" (`bm1YpGEy8qhT5sXAir0Q`), eleven_v4, 1 take each. Voices: Courier Mike `kSSJYNGo5Kev6qgwVloV`, Dan Jake `CDdUdrzh7qrDE2xpRZyQ`, Maya Tasha `az2Mp58wQOuqO5SHlCwL`, Narrator Benjamin `rBBV1yn6Ib1hDeOTrn08`, plus new: IT Service Desk Olive Lark `MhYVsEu6Sf1YdDhCRTmn`, Elena Voss Lyn Gardez `H4onjBoahJ3LnzTxVZXs`, outside caller David Jones `UyxbZcMvz2Bnex0kFYXU`.
