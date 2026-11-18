# AI at work: "The assistant"

A standalone shift everyone plays, on top of the week. Route: `/week/ai`. Content: `src/content/week/ai.ts`.

Positioning: most awareness training teaches people to spot AI-written phishing and stops there. This shift covers how
people actually meet AI at work: the assistant they were given, the answers it invents, the apps that want their
mailbox, and the people using AI against them. No regulation is named in the pitch.

## Beats

| # | Set · spot | Scenario | Real-world basis |
| --- | --- | --- | --- |
| 1 | Floor · desk | Copilot surfaces an overshared HR salary file | Copilot answers from anything the user's account can reach; oversharing is the top Copilot rollout issue (guide, chapter on oversharing) |
| 2 | Floor · desk | Hidden text in a vendor email makes the assistant draft a reply with the customer export | EchoLeak, CVE-2025-32711, a zero-click prompt injection in Microsoft 365 Copilot (Aim Security, June 2025; https://arxiv.org/abs/2509.10540v1) |
| 3 | Floor · next desk | A coworker's homemade automation forwards customer mail to a personal AI account | Shadow AI / DIY automations on personal accounts |
| 4 | Floor · phone | An AI notetaker asks to read and send mail, read calendars and files | OAuth consent abuse; notetakers that auto-join and email transcripts to all attendees |
| 5 | Floor · desk | An AI draft promises a refund under a contract clause that doesn't exist | Hallucinated facts in AI-drafted customer communication |
| 6 | Home · couch | A fake "ChatGPT" browser extension asks for access to all sites | Fake AI extensions as a credential/session theft vector |
| 7 | Home · table | A remote IT candidate shows deepfake tells and wants the laptop shipped elsewhere | FBI IC3 PSA, June 28, 2022, on deepfakes and stolen PII in remote job interviews (https://www.infosecurity-magazine.com/news/fbi-beware-deepfakes-remote-jobs) |

Thursday already covers the cloned-voice payment request, and Wednesday the paste into a personal AI writer, so neither is repeated here.

## Art still to make (props are text screens for now)

Each beat's prop renders from its `text` / `textB` until art exists. For Grok, two 16:10 screens per beat
(calm `a`, gone-wrong `b`), same style as the Wednesday AI writer screens, named `ai-<beat>-a.webp` / `-b.webp`:
overshare, inject, diy (laptop), notes (phone, 9:16), invent, ext (laptop), cand (laptop video call).
Use invented brands only (no real app logos); "Copilot" may appear as plain text.

## Follow-ups

- Per-client approved tool name: the scenarios say "Copilot" and "the approved assistant". Once orgs store their approved
  assistant (from the policy builder), swap it in by name.
- Voice lines for the seven beats go through the same ElevenLabs pass as the rest of the week.
