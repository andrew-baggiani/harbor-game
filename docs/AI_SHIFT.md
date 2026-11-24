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

---

# AI agents: "The agents"

The second AI shift. Route: `/week/agents`. Content: `src/content/week/agents.ts`. "The assistant" covers the tool
you were given; this one covers AI that acts: agents that log in, send, install and click. One assistant stars in each
beat so people meet the one they actually use.

Rule for every beat: it's about how people misuse the tool or how attackers abuse it, never "this product is unsafe".
Names appear in text only, no logos.

## Beats

| # | Tool | Set · spot | Scenario | OWASP Agentic (2026) | Real-world basis |
| --- | --- | --- | --- | --- | --- |
| 1 | ChatGPT | Floor · phone | A personal ChatGPT agent asks for your work portal login | ASI03 Identity and privilege abuse | Agent modes that browse and sign in as the user; credentials leaving company control |
| 2 | Copilot (impersonated) | Floor · desk | A fake "Copilot Pro for Outlook" app from an unverified publisher wants to read and send all mail | ASI03 (consent / OAuth abuse) | Illicit consent grants: OAuth apps posing as trusted brands; password resets don't revoke them |
| 3 | Claude | Floor · next desk | A coworker's free community connector needs your email key and BCCs every message out | ASI04 Agentic supply chain | postmark-mcp, first malicious MCP server in the wild: one added line BCC'd every email, v1.0.16, Sept 2025 (Koi Security; https://thehackernews.com/2025/09/first-malicious-mcp-server-found.html) |
| 4 | Copilot | Floor · east pod | A coworker's Copilot agent, owner on vacation, emails unapproved payment terms and rewrites the tracker | ASI10 Rogue agents (with ASI02 tool misuse) | Agents with no owner, limits or off switch; citizen-built agents running on the builder's permissions |
| 5 | Gemini | Home · counter | Hidden white text makes Gemini's email summary show a fake "password compromised, call this number" warning | ASI06 Memory and context poisoning (indirect prompt injection) | 0DIN / Marco Figueroa, July 2025 (https://www.bleepingcomputer.com/news/security/google-gemini-flaw-hijacks-email-summaries-for-phishing/) |
| 6 | Grok | Home · couch | Grok repeats a link hidden in a promoted post; the page is a "press Win+R and paste" fake CAPTCHA | ASI05 Unexpected code execution (and ASI01 goal hijack of the assistant) | "Grokking", Guardio Labs / Nati Tal, Sept 2025: links hidden in the video card's From field, surfaced by Grok, led to fake-CAPTCHA and infostealer pages (https://thehackernews.com/2025/09/cybercriminals-exploit-xs-grok-ai-to.html) |

Not repeated from "The assistant": Copilot oversharing, EchoLeak, DIY forwarding automations, notetaker consent,
invented clauses, fake extensions, deepfake candidates. Wednesday still owns the paste into a personal AI writer.

## Voice lines (ElevenLabs flow "Dry Run Cyber · The agents · voice lines", flow id mL3fQYjwPSbMQccf1pGL)

| File | Voice | Generation id |
| --- | --- | --- |
| `wk-AG-01-chatgpt` | Benjamin (narrator) | BwLQEe5iMDq180VfLWWM |
| `wk-AG-02-copilot-addin` | Benjamin | 1pmVfWMSdFfwda8OJowN |
| `wk-AG-03-claude-connector` | Tasha (desk coworker) | ugF286UNdtQSAlJO6GNo |
| `wk-ag-conn-install-1` | Tasha | 1iyVI6zcbigmwmylPnId |
| `wk-AG-04-copilot-agent` | Benjamin | smRNgpBWQLa0VxENnnDW |
| `wk-AG-05-gemini` | Benjamin | eqUkFTadyiaLhzlt69hJ |
| `wk-ag-gem-call-1` | Jack (fake caller) | t6ObT14qEgsibJV4Bx9o |
| `wk-AG-06-grok` | Benjamin | 8xtpTqZDeLvohrei6UGr |

All eight mp3s are in `public/voice/v2/` (added Nov 24, 2026).
