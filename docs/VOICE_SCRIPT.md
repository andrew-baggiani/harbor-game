# Harbor & Co. - Monday voice script (v2)

Scope: Monday only. All lines voiced with **ElevenLabs v4 (`eleven_v4`)**, the newest tag-capable TTS model this workspace offers (the list is eleven_v4, eleven_v3, multilingual_v2, turbo_v2_5, flash_v2_5). Audio tags are written inline in square brackets and are *not* part of the subtitle text.

- ElevenLabs flow (all 34 lines, 2 takes each): https://elevenlabs.io/app/flows/pNOO2zzw0OTdQwuWRgev  (flow id `pNOO2zzw0OTdQwuWRgev`, named "Harbor & Co. - Monday voice v2")
- Lines generated: 34 (17 replacements for the existing files, 4 previously unvoiced lines, 13 new debriefs). 68 takes total.
- Credits used: 8,004 (about 1 credit per character per take). An `estimate_only` price check made one empty node on the flow; it cost nothing and can be ignored or deleted.
- Target folder: `public/voice/v2/` (same filenames as `public/voice/`, plus new files). `public/voice/*.mp3` is untouched.

## Status of the audio files

The audio could **not** be downloaded from this session: the cloud container's network proxy blocks `elevenlabsusercontent.com`. So `public/voice/v2/` is not filled yet. Two ways to fill it:

1. **Fast (before 2026-11-15 19:00 UTC / 1:00 PM Central):** from the repo root run `powershell -ExecutionPolicy Bypass -File tools\fetch-voice-v2.ps1`. It downloads take A of every line from the signed links, and if `ffmpeg` is on PATH it trims leading/trailing silence, loudness-normalizes to -16 LUFS (true peak -1.5 dB), and writes mono 44.1 kHz 128 kbps MP3s into `public/voice/v2/`, then prints each file's real duration. The links expire at that time.
2. **Any time:** open the flow link above, play the two takes on each node (node labels are the line text; node ids are in the table below), and download the take you like as `<file name>.mp3` into `public/voice/v2/`. Then optionally run the same ffmpeg command used in the script on each file.

Take A is listed first in each row and is what the script grabs. Listen to the courier, June, the caller and Maya first: those carry the most acting and are where take B may be better.

## Casting

| Character | Voice (ElevenLabs library) | voice_id | Model | Why |
|---|---|---|---|---|
| Narrator (briefing, USB beat, mail read-out, every consequence and debrief) | Benjamin - Calm Professional Male Narrator | `rBBV1yn6Ib1hDeOTrn08` | eleven_v4 | Mature American, measured, made for e-learning and corporate training. Credible without sounding like a trailer announcer. It's a mentor's voice, not a lecturer's. |
| Courier | Mike - Multi Trade Expert | `kSSJYNGo5Kev6qgwVloV` | eleven_v4 | Middle-aged tradesman, light Northeast US accent, "realistically gruff" but relatable. Reads like a real guy on a delivery route, not a villain. |
| June Park (reception) | Diane - Friendly Warm Female Voice | `u91OxrFDaRINovYRRue2` | eleven_v4 | Built for receptionist/front-desk reads: warm, clear, helpful. |
| Fake "Harbor IT" caller ("Dan") | Jake - Natural, Calm and Confident | `CDdUdrzh7qrDE2xpRZyQ` | eleven_v4 | Young, friendly, confident support-desk sound. That's the point: he sounds exactly like real IT. The rush comes from the [hurried] tag. |
| Maya Ruiz (finance) | Tasha - Calm & Friendly | `az2Mp58wQOuqO5SHlCwL` | eleven_v4 | Natural mid-30s American woman, a clearly different timbre from June. [stressed]/[anxious] tags make her pressured but kind. |
| Elena Voss | not voiced | - | - | Email only. The narrator reads the mail aloud (the old build used a generic woman voice). That keeps her an impersonated name, not a character, and leaves room for a real Elena voice on a later day. |
| Three dockworkers | never speak | - | - | Per brief. |

All voices are ElevenLabs library voices picked with `creative_list_voices`. Keep these ids for any future Monday pickups so characters stay consistent.

## What changed in the writing (summary)

- Characters now speak in first person. The old files had a narrator-style lead-in inside the character's voice ("Courier, no badge. He says: ..."). The speaker label is already on screen, so the lead-ins are gone.
- Pressure is more believable: the courier is double-parked, the caller gives a name and a deadline ("before it expires"), Elena gives a cover story ("client thank-yous... it's a surprise"), Maya is worried about being blamed.
- The briefing no longer lists all five asks in advance (that worked as an answer key, which TRAINING_SPEC section 2 rule 5 warns against) and the control hint now matches the real keys (arrows/W walk, Shift runs, E/Enter uses).
- The mail read-out no longer says "the address is not Harbor" before you choose. It now says "Check the address." The address is still shown on the panel (`elena.voss@harborandco-exec.com`), and the debrief names the tell afterward.
- New: one narrator debrief after every choice (13 files). Each names the tell and the right move: the Report button, security@harborandco.com, extension 4400, or calling back on the badge number or the number finance already has. No shaming.
- Choice ids, beat order, flags and scoring are unchanged.

## Full script by beat

Est. durations assume about 2.8 words/second. The fetch script prints the real durations; paste them in here once the files exist.

### Tower / briefing

| File | Speaker | Line as sent to eleven_v4 (tags in brackets) | Est. | Node id | Take A / Take B generation ids |
|---|---|---|---|---|---|
| `brief.mp3` | Narrator | [calmly] Monday night at Harbor and Co. You're the new hire. Tonight, the shift is the training. Arrow keys or W to walk. Shift to run. E to use whatever's in front of you. Follow the gold blip to the tower. [short pause] People are going to ask you for things tonight. Take your time with each one. | ~20s | `HQWAh7lUZa0MGhixmvCN` | `v0HTqNwuc7xG9R4q5bwh` / `ZAoD6iGpMhfAfGzUeDNU` |

### Beat 1: tower door (Courier)

| File | Speaker | Line as sent to eleven_v4 (tags in brackets) | Est. | Node id | Take A / Take B generation ids |
|---|---|---|---|---|---|
| `door.mp3` | Courier | [friendly] Hey, can you grab the door? My badge is back in the van. [hurried] I'm double-parked out there. Two seconds, I swear. | ~8s | `4Pgpm20NFoVkG53GRTha` | `oRCzeD6TUF4SpqPlzy6L` / `BQkUBwno85NFmfdHR7fg` |
| `door-hold.mp3` | Narrator [bad] | You held it. He walked in right behind you. [short pause] The reader never went green for him. | ~6s | `PG9mR11kZIGyx5AyQRuS` | `7ebRlEKp51PUgEQJhfHW` / `s6zyGGYkeAlAE7pOdSvp` |
| `debrief-door-hold.mp3` (new) | Narrator [bad debrief] | That's tailgating. A friendly face and a rush are the whole trick. Let the door close. If he belongs here, he badges in, or reception signs him in. | ~10s | `TXgZ7tX2MERHf9GnIWw2` | `o8h7Gq0jxSq80kwklImQ` / `0o9idiX4OXWdd09DfJ1k` |
| `door-shut.mp3` | Narrator [good] | You let it close. He shrugged and headed back to the van. | ~4s | `duOwiVn8DgzNTeZNLjIM` | `FLs7X7gt7KMvuU66ztPl` / `gYsuzQBu1RCXmGWkVZyw` |
| `debrief-door-shut.mp3` (new) | Narrator [good debrief] | Good call. One badge, one person. If he belongs here, he badges in or checks in at reception. Letting a door close isn't rude. | ~9s | `84x3fhLg6LrIafC9oxcO` | `pQJn6IKwf5anCfEtQKjn` / `6Wpjz1tyVdXVHWGAPTry` |

### Lobby (June Park)

| File | Speaker | Line as sent to eleven_v4 (tags in brackets) | Est. | Node id | Take A / Take B generation ids |
|---|---|---|---|---|---|
| `reception.mp3` | June Park | [warmly] Hi, you must be the new hire. You're on my list for fourteen. Elevator's straight back, gold doors. Badge yourself up. [lightly] Oh, and if anybody asks you to hold a door? They've got a badge. They can use it. | ~14s | `875YsbmDSxmaRxLxRA7a` | `drc1cL8CWdLPSOlt0kvt` / `WCcHE7D5pnYlC5ELPhz2` |
| `reception-ok.mp3` (new) | June Park | [warmly] Straight back, gold doors. Badge in, floor fourteen. Have a good first night. | ~5s | `UygqZATuQTCnjhk7Twrs` | `Mq3KMSPrb9jJT664jtjU` / `u7iSQCooPjvTTSJhMsHF` |

### Beat 2: desk mail ("Elena Voss")

| File | Speaker | Line as sent to eleven_v4 (tags in brackets) | Est. | Node id | Take A / Take B generation ids |
|---|---|---|---|---|---|
| `mail.mp3` | Narrator | New mail. The name says Elena Voss. [short pause] Check the address. [reading] Boarding now, so I can't call. I need eight Apple gift cards, $200 each, for client thank-yous. Reply with the codes. Don't loop in my assistant, it's a surprise. | ~14s | `Wnl98OES8TQmfAA75ahb` | `iWQH9GfQvER0EdCITzmH` / `duLnBOiGV9avWwavGkNX` |
| `mail-codes.mp3` | Narrator [bad] | You sent the codes. That address isn't Harbor's, and the money's gone. | ~4s | `Hs5wjc8Df6WpGzGjJHWf` | `7epBcJy77tRTDFVU0K1w` / `ZB2lY9sDYol3GfkMj82a` |
| `debrief-mail-codes.mp3` (new) | Narrator [bad debrief] | Gift cards, a rush, and keep it quiet. That's a scam every time. Read the address, not the name. Hit the Report button, or send it to security@harborandco.com. | ~10s | `bapfLAn6pIAVhc8oH8MH` | `udj9Jxa4nuNAEGwsTOiz` / `BFROx3Z4IIXwwdTEnBjP` |
| `mail-report.mp3` | Narrator [good] | Reported. Security has it, and you didn't spend a dime. | ~4s | `aov0ZQnIEFJ7NyfCbacg` | `FGpdNodp4IR8T6UykuOc` / `nDpFNOtDgxHo0atPdrXB` |
| `debrief-mail-report.mp3` (new) | Narrator [good debrief] | Right move. The name said Elena. The address said harborandco-exec. Nobody at Harbor buys gift cards over email. Report button, every time. | ~8s | `Ren1TeU7i0Y0ZtAMOZFX` | `RI7xrEtno2EWtaGulKOF` / `tnyfAsFe0QRuS3y7XfQC` |
| `mail-ignore.mp3` (new) | Narrator [partial] | You closed it. It's still sitting in the inbox, and the next person might bite. | ~5s | `56kQ2nIMuceKytW7Ji10` | `DDh0MPtiq7Ttj0MOBayA` / `zf6HligLJmYZA88t1uCH` |
| `debrief-mail-ignore.mp3` (new) | Narrator [partial debrief] | Not replying is half of it. Reporting is the other half. One click on Report warns everyone who got the same mail. | ~8s | `steEk3l71aOjeFnYxLcA` | `8mgUPoUHBg3To9LbJMCl` / `z4g5PrvgCGpuCm24EFAJ` |

### Beat 3: desk phone (fake Harbor IT)

| File | Speaker | Line as sent to eleven_v4 (tags in brackets) | Est. | Node id | Take A / Take B generation ids |
|---|---|---|---|---|---|
| `phone.mp3` | "Dan", fake Harbor IT caller | [confident] Hi, this is Dan with Harbor IT. We just blocked a sign-in on your account from overseas. [hurried] I'm locking it down now. Read me the six-digit code that just hit your phone. Quick, before it expires. | ~13s | `X5NqnmWWtAlGZp63nLBn` | `g9QEiG5GtEBGhdkE3JcR` / `CtMy1fP3C43ZiSkZhNlf` |
| `phone-code.mp3` | Narrator [bad] | You read it out. That code just signed a new device into your account. | ~5s | `n7TFA5VZHKOOkEgjz0IA` | `lvEc42EaL63ktv27jyxu` / `hCcXgbIic0V2RjNhvhDX` |
| `debrief-phone-code.mp3` (new) | Narrator [bad debrief] | IT will never ask for your code. Whoever asks for it is the one logging in. Hang up, and call the help desk number on your badge. | ~10s | `cYR3CW124tK35G4DP5J7` | `rexGQuqLNxGa9ByeU8Rw` / `GJJkt9NEy8mVs5rcFR1B` |
| `phone-hangup.mp3` | Narrator [good] | You hung up. The number on your badge is the one you dial. | ~5s | `LDjYP1NZyE3EgZ5SrqGJ` | `N5cQ3KyzbM9RvRs2LD2l` / `5CLSHbh9tvEQKaR2zDLd` |
| `debrief-phone-hangup.mp3` (new) | Narrator [good debrief] | Exactly. Your code is only for you. Call back on the number on your badge, and report the call to security at extension 4400. | ~9s | `u97ezMoSFf5Y2TzI4uhW` | `8KpsEHUWq6Sfc8Fxx0RM` / `VDGJgkSF3lvy5BJUWgnr` |

### Beat 4: break counter USB

| File | Speaker | Line as sent to eleven_v4 (tags in brackets) | Est. | Node id | Take A / Take B generation ids |
|---|---|---|---|---|---|
| `usb.mp3` | Narrator | There's a USB stick on the break counter. Handwritten label: Salary review. [short pause] An open laptop sits right next to it. | ~7s | `w35o8VhRh33X2luFxnTG` | `ZWGhP6OEVw95gbsYO5Os` / `LkhKUKoVdIuazCWGiVds` |
| `usb-plug.mp3` | Narrator [bad] | You plugged it in. The screen locks, and it wants a payment. | ~4s | `kNnqbtsVVgV7cuH5np3J` | `L8Vj6cu2RTeue1ZIxQov` / `dLk1ZGlqRew4q8wIiDLR` |
| `debrief-usb-plug.mp3` (new) | Narrator [bad debrief] | A found USB stick is bait, and Salary review is the hook. Never plug in a stick that didn't come from IT. Bag it and hand it over. | ~10s | `BdVVia7KQme4aJlXmOAh` | `KT4S9bSokaEeG1f13Gmm` / `pje6pqQxPBOLX40zZ1kJ` |
| `usb-it.mp3` | Narrator [good] | You bagged it for IT. Nobody plugs it in. | ~3s | `3IlUqdnJsmoREkUYkii9` | `xal6R3u9VrG3GxecBnHv` / `8a2CljwtrW7klIxh8KPK` |
| `debrief-usb-it.mp3` (new) | Narrator [good debrief] | That's it. Unknown sticks go to IT, unplugged. Curiosity is exactly what that label was counting on. | ~6s | `3wgHDKpNP4b8F8epaLb0` | `U1l6zCRvNbIOTOomOeaD` / `I5txkFNOeBcVWd7UT9Ru` |
| `usb-leave.mp3` (new) | Narrator [partial] | You left it on the counter. Somebody else will find it. | ~4s | `AIWIyMQT0B2ZFqu7rSmS` | `bKj2U5qtiHF7xCAKforR` / `33oF7vIP0ejOIEDKo2ss` |
| `debrief-usb-leave.mp3` (new) | Narrator [partial debrief] | You didn't plug it in. Good. But the next person might. Bag it and get it to IT, or report it at extension 4400. | ~9s | `GLYYxgzUgLTudtJKQqEX` | `lLkbcjEvHTBoyJpW4IwG` / `W33DvCJjaXv0HspO6LLm` |

### Beat 5: Maya Ruiz, wire release

| File | Speaker | Line as sent to eleven_v4 (tags in brackets) | Est. | Node id | Take A / Take B generation ids |
|---|---|---|---|---|---|
| `maya.mp3` | Maya Ruiz | [stressed] Hey, sorry, you're the new hire, right? Elena says the acquisition wire has to go out now, and the approval form's down. She said you could release it. [anxious] I really don't want to be the one who held this up. | ~14s | `AXuWFp1DTF1aIg5FFqhB` | `WwJvj5cy5EpXjQ7P27pR` / `rFF9YKI3cOggWFuLUXcR` |
| `wire-send.mp3` | Narrator [bad] | The wire's gone. Nobody ever confirmed it was Elena. | ~3s | `YzebRxMWMVWywGy7QAyl` | `t4DNy6s6V6OKmWXWOfl8` / `CebBiHU167OMrFVdWuZo` |
| `debrief-wire-send.mp3` (new) | Narrator [bad debrief] | Urgency, a big name, and a broken form. That's the setup. Money moves on the normal path, or after a callback on a number finance already has. | ~10s | `Pzw4SNxbHKam1CTzg5sx` | `bAODFRzmaQMXvD79zFG7` / `J7t0cFZi7Y2fH6GZC1mZ` |
| `wire-call.mp3` | Narrator [good] | You called the number finance already had. Elena never ordered a wire. | ~4s | `PEfpb5pMMhFgHrTqd5gr` | `bhfdHV42Wuq4fMJ4EqPw` / `oTOfYWUp54ghXxlhQXnu` |
| `debrief-wire-call.mp3` (new) | Narrator [good debrief] | Perfect. A callback on a number you already trust beats any message. Then report it, so security can go after whoever sent it. | ~8s | `NF9jIYgiFp13quCzWSXw` | `qwpeyIHBQiYO3qFN4Sqf` / `Olq47yHkIVyY8acpj4pe` |
| `wire-refuse.mp3` (new) | Narrator [good (partial score)] | You said no. Maya called Elena herself. | ~2s | `06ujfvQUGjXzkYwAe2kR` | `LCJS5egCdMQBD7kEv3RY` / `Dd8jVLYbXmvhvnJDw677` |
| `debrief-wire-refuse.mp3` (new) | Narrator [good (partial score) debrief] | Fair. Wires aren't yours to send. Even better, help Maya verify. Call Elena back on the number finance has on file. | ~8s | `vTn7L1cTgxjARG4pYYDd` | `06ctGGg21gXNRpNmrdOE` / `ESkfmIkpcMi1oN67nGyp` |

Note: `reception-ok`, `mail-ignore`, `usb-leave` and `wire-refuse` already had text in `voiceFor()` but had no MP3, so they fell back to browser speech. They now have files.

## Integration for Grok

Andrew commits; nothing in `src/` was edited.

### 1. Switch the voice path

`src/game/audio.ts`, in `playLine()`: change `fetch(`/voice/${id}.mp3`)` to `fetch(`/voice/v2/${id}.mp3`)`. Keep the speech-synthesis fallback as is.

### 2. Update caption text in `voiceFor()` (`src/game/story.ts`)

Captions come from `voiceFor(id).text`, so these must match the audio. Kinds: keep `narrator` for narrator lines; `door`, `phone` stay `man`; `reception`, `reception-ok`, `maya` stay `woman`; **`mail` changes from `woman` to `narrator`**.

| id | old text | new text |
|---|---|---|
| `brief` | This is Monday night at Harbor and Company, a shipping firm on the quay. You are the new hire. The training is the shift. Walk the dock. Press E to get in a car, W to drive, Shift to run. Follow the gold blip to the tower door. People will ask you to hold a door, send gift card codes, read a login code, plug in a USB stick, and release a wire. The voice tells you who is asking. | Monday night at Harbor and Co. You're the new hire. Tonight, the shift is the training. Arrow keys or W to walk. Shift to run. E to use whatever's in front of you. Follow the gold blip to the tower. People are going to ask you for things tonight. Take your time with each one. |
| `door` | Courier, no badge. He says: hold the door. My badge is in the van. I'll be two seconds. | Hey, can you grab the door? My badge is back in the van. I'm double-parked out there. Two seconds, I swear. |
| `reception` | June Park, reception, Harbor Tower. You are on the list for floor fourteen. The elevator is straight back. Badge yourself. If someone asks you to hold the door, they badge in on their own. | Hi, you must be the new hire. You're on my list for fourteen. Elevator's straight back, gold doors. Badge yourself up. Oh, and if anybody asks you to hold a door? They've got a badge. They can use it. |
| `reception-ok` | June Park. Elevator at the back. Badge yourself. Floor fourteen. | Straight back, gold doors. Badge in, floor fourteen. Have a good first night. |
| `mail` | Email. The name says Elena Voss, but the address is not Harbor. She writes: I'm boarding. Buy eight Apple gift cards and reply with the codes. Don't loop my assistant. | New mail. The name says Elena Voss. Check the address. Boarding now, so I can't call. I need eight Apple gift cards, $200 each, for client thank-yous. Reply with the codes. Don't loop in my assistant, it's a surprise. |
| `phone` | Phone. A man says he is Harbor IT. He says: we blocked a login from overseas. Read me the six digit code that just hit your phone. | Hi, this is Dan with Harbor IT. We just blocked a sign-in on your account from overseas. I'm locking it down now. Read me the six-digit code that just hit your phone. Quick, before it expires. |
| `usb` | On the break counter: a USB stick labeled Salary review, next to an open laptop. Nobody has asked you to plug it in. | There's a USB stick on the break counter. Handwritten label: Salary review. An open laptop sits right next to it. |
| `maya` | Maya Ruiz, finance. She says: Elena says the acquisition wire has to leave now. The form is down. She told me you would release it. | Hey, sorry, you're the new hire, right? Elena says the acquisition wire has to go out now, and the approval form's down. She said you could release it. I really don't want to be the one who held this up. |
| `door-hold` | You held the door. The courier walks in behind you. He never badged in. | You held it. He walked in right behind you. The reader never went green for him. |
| `door-shut` | You let the door close. The courier goes back to the van. | You let it close. He shrugged and headed back to the van. |
| `mail-codes` | You sent the codes. That address is not Harbor. | You sent the codes. That address isn't Harbor's, and the money's gone. |
| `mail-report` | You reported the gift card mail. You did not buy a thing. | Reported. Security has it, and you didn't spend a dime. |
| `mail-ignore` | You left the gift card mail sitting in the inbox. | You closed it. It's still sitting in the inbox, and the next person might bite. |
| `phone-code` | You read the code out loud. That just signed in a new device. | You read it out. That code just signed a new device into your account. |
| `phone-hangup` | You hung up. The number on your badge is the one you would dial. | You hung up. The number on your badge is the one you dial. |
| `usb-plug` | You plugged it in. The laptop locks and asks for a payment. | You plugged it in. The screen locks, and it wants a payment. |
| `usb-it` | You bagged the USB stick for IT. Nobody plugs it in. | You bagged it for IT. Nobody plugs it in. |
| `usb-leave` | You left the USB stick on the counter. | You left it on the counter. Somebody else will find it. |
| `wire-send` | You sent the wire. Nobody confirmed it was Elena. | The wire's gone. Nobody ever confirmed it was Elena. |
| `wire-call` | You called the number finance already had. Elena did not order a wire. | You called the number finance already had. Elena never ordered a wire. |
| `wire-refuse` | You refused the wire. Maya calls Elena herself. | You said no. Maya called Elena herself. |

Add 13 new `voiceFor()` cases, all `kind: "narrator"`:

| id | text |
|---|---|
| `debrief-door-hold` | That's tailgating. A friendly face and a rush are the whole trick. Let the door close. If he belongs here, he badges in, or reception signs him in. |
| `debrief-door-shut` | Good call. One badge, one person. If he belongs here, he badges in or checks in at reception. Letting a door close isn't rude. |
| `debrief-mail-codes` | Gift cards, a rush, and keep it quiet. That's a scam every time. Read the address, not the name. Hit the Report button, or send it to security@harborandco.com. |
| `debrief-mail-report` | Right move. The name said Elena. The address said harborandco-exec. Nobody at Harbor buys gift cards over email. Report button, every time. |
| `debrief-mail-ignore` | Not replying is half of it. Reporting is the other half. One click on Report warns everyone who got the same mail. |
| `debrief-phone-code` | IT will never ask for your code. Whoever asks for it is the one logging in. Hang up, and call the help desk number on your badge. |
| `debrief-phone-hangup` | Exactly. Your code is only for you. Call back on the number on your badge, and report the call to security at extension 4400. |
| `debrief-usb-plug` | A found USB stick is bait, and Salary review is the hook. Never plug in a stick that didn't come from IT. Bag it and hand it over. |
| `debrief-usb-it` | That's it. Unknown sticks go to IT, unplugged. Curiosity is exactly what that label was counting on. |
| `debrief-usb-leave` | You didn't plug it in. Good. But the next person might. Bag it and get it to IT, or report it at extension 4400. |
| `debrief-wire-send` | Urgency, a big name, and a broken form. That's the setup. Money moves on the normal path, or after a callback on a number finance already has. |
| `debrief-wire-call` | Perfect. A callback on a number you already trust beats any message. Then report it, so security can go after whoever sent it. |
| `debrief-wire-refuse` | Fair. Wires aren't yours to send. Even better, help Maya verify. Call Elena back on the number finance has on file. |

### 3. On-screen dialogue text (talk/panel boxes)

| Where | old | new |
|---|---|---|
| `story.ts` `talkFor("door")` text | Hold the door? Badge is in the van. I'll be two seconds. | Hey, can you grab the door? My badge is back in the van. I'm double-parked out there. Two seconds, I swear. |
| `sim.ts` door action, `talk.text` | I'm the courier. Hold the door? My badge is in the van. I'll be two seconds. | Hey, can you grab the door? My badge is back in the van. I'm double-parked out there. Two seconds, I swear. |
| `story.ts` `panelFor("mail")` text | I'm boarding. Buy eight Apple gift cards, two hundred each, and reply with the codes. Don't loop my assistant. | Boarding now, so I can't call. I need eight Apple gift cards, $200 each, for client thank-yous. Reply with the codes. Don't loop in my assistant, it's a surprise. |
| `story.ts` `panelFor("phone")` text | We blocked a login from overseas. Read me the six-digit code that just hit your phone. | Hi, this is Dan with Harbor IT. We just blocked a sign-in on your account from overseas. I'm locking it down now. Read me the six-digit code that just hit your phone. Quick, before it expires. |
| `story.ts` `panelFor("phone")` role | Says he's Harbor IT | Says he's Dan, Harbor IT |
| `story.ts` `panelFor("usb")` text | It's on the break counter, next to an open laptop. | Handwritten label: Salary review. An open laptop sits right next to it. |
| `story.ts` `panelFor("maya")` text | Elena says the acquisition wire has to leave now. The form is down. She told me you'd release it. | Hey, sorry, you're the new hire, right? Elena says the acquisition wire has to go out now, and the approval form's down. She said you could release it. I really don't want to be the one who held this up. |
| `sim.ts` reception action, `talk.text` | June Park, reception. You're on tonight's list for floor fourteen. The elevator is straight back, gold doors. Badge yourself. If someone asks you to hold the door, they badge in on their own. | Hi, you must be the new hire. You're on my list for fourteen. Elevator's straight back, gold doors. Badge yourself up. Oh, and if anybody asks you to hold a door? They've got a badge. They can use it. |
| `sim.ts` lobby greeting `setBark` text | You're on the list. Elevator at the back. Floor fourteen. | You're on my list for fourteen. Straight back, gold doors. |
| `state.ts` `reception-ok` `captionText` | The elevator is at the back of the lobby. Badge yourself. Floor fourteen. | Straight back, gold doors. Badge in, floor fourteen. Have a good first night. |
| `state.ts` `reception-ok` `bark.text` | Elevator at the back. Badge yourself. Floor fourteen. | Straight back, gold doors. Badge in, floor fourteen. |

Choice labels and `barkFor()` can stay as they are; they are short HUD text, not voiced. Optional: `barkFor("phone-hangup")` could become "You hang up. The number on your badge is the one you dial." (it already matches).

### 4. Speaker labels (`speaker` map in `audio.ts`)

- `mail`: `Elena Voss · email, not Harbor` -> `Narrator · mail from "Elena Voss"` (the narrator now reads it; the old label also gave away the tell).
- `phone`: `Caller · says he is Harbor IT` -> `Caller · says he's Dan, Harbor IT`.
- Add `debrief-*` (13 keys) -> `Narrator · debrief`.

### 5. Wire the debriefs after each decision

In `useHarbor.choose(id)` (`state.ts`), `say(id)` plays the consequence line. Queue `say(`debrief-${id}`)` to start when that clip ends. `say()` stops whatever is playing, so it must not fire right away. Suggested approach in `audio.ts`: keep `source.onended` on the current `AudioBufferSourceNode` and let `say()` take an optional `then?: string` id to play next (about 0.4 s gap); fall back to a timer of `caption.t` seconds when speech synthesis is used. If the player starts the next beat first, the new `say()` cancels the queued debrief, which is fine.

Every choice id has exactly one debrief: `debrief-door-hold`, `debrief-door-shut`, `debrief-mail-codes`, `debrief-mail-report`, `debrief-mail-ignore`, `debrief-phone-code`, `debrief-phone-hangup`, `debrief-usb-plug`, `debrief-usb-it`, `debrief-usb-leave`, `debrief-wire-send`, `debrief-wire-call`, `debrief-wire-refuse`.

### 6. Timing notes

- `caption.t = min(16, 5 + text.length/18)` still works for every new line. The brief (~19 s) is the only line past 16 s, so its caption clears a bit early; raise the cap to 20 or special-case `brief`.
- Character lines (`door`, `reception`, `phone`, `maya`) run about 7 to 13 s. Consequence lines are 2 to 5 s, debriefs 6 to 10 s. A consequence plus its debrief is about 10 to 14 s, inside the 20 to 30 s debrief window in TRAINING_SPEC section 2.
- `world.barkT` (5.5 s) is shorter than consequence + debrief audio. That's fine, since the bark is HUD text, but don't tie the next beat's audio to `barkT`.
- Debrief lines mention extension 4400 and security@harborandco.com. When tenant tokens arrive (TRAINING_SPEC section 5: `{{HELPDESK_PHONE}}`, `{{REPORT_CHANNEL}}`), these lines need tenant-specific renders or a neutral variant.
