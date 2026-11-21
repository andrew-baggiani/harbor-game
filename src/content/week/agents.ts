import { beat, q, type Controls } from "@/content/week/make";
import type { ShiftDef } from "@/content/week/types";

/**
 * The agents: the second AI shift. "The assistant" (ai.ts) covers the tool you were given; this one covers
 * AI that acts: agents that log in, click, send and install. One tool stars in each beat, so people meet
 * the assistant they actually use: ChatGPT, Copilot, Claude, Gemini and Grok.
 *
 * Every beat is about how people misuse these tools or how attackers abuse them, never "this product is
 * unsafe". The lesson carries to whichever assistant a company runs.
 *
 * Mapped to the OWASP Top 10 for Agentic Applications (2026) in docs/AI_SHIFT.md, with sources.
 */

const BASE: Controls = {
  "NIST_800-53r5": ["AT-2", "AT-2(4)"],
  "NIST_800-171r2": ["3.2.1"],
  CMMC_L2: ["AT.L2-3.2.1"],
  "CSF_2.0": ["PR.AT-01"],
};
const plus = (extra: Controls): Controls => {
  const out: Controls = {};
  for (const key of new Set([...Object.keys(BASE), ...Object.keys(extra)])) out[key] = [...new Set([...(BASE[key] ?? []), ...(extra[key] ?? [])])];
  return out;
};

export const AGENTS_SHIFT: ShiftDef = {
  id: "agents",
  kind: "ai",
  day: "AI agents",
  title: "The agents",
  topics: "ChatGPT agents and your passwords · fake Copilot add-ins · unvetted Claude connectors · a Copilot agent gone rogue · poisoned Gemini summaries · Grok links and paste-this commands",
  intro: "Floor 14, then home. Tonight the AI doesn't just answer. It logs in, sends, installs and clicks. So do the people who want in.",
  audience: "Everyone who uses ChatGPT, Copilot, Claude, Gemini or Grok, at work or at home.",
  beats: [
    beat({
      id: "AG-01-chatgpt",
      day: "agents",
      skill: "agent-credentials",
      controls: plus({ "CIS_v8.1": ["14.3", "14.4", "14.5"] }),
      who: "ChatGPT",
      role: "On your personal phone",
      text: "Forty invoices to pull from the freight portal before morning. Your personal ChatGPT offers to do it in agent mode: \"I can log in and download them for you. Just give me your work username and password.\"",
      set: "floor",
      spot: "phone",
      prop: {
        kind: "phone",
        text: "ChatGPT · Agent mode · \"To continue, enter the username and password for portal.harborfreight-ops.com\"",
        textB: "Freight portal · New sign-in for your account from an unrecognized browser · Exports: 40 invoices, 1 customer list",
      },
      objective: "Your desk. Your own phone, a long boring task.",
      choices: [
        {
          id: "ag-gpt-give",
          label: "Give it your login. It's faster, and it's only invoices",
          score: 0,
          debrief: "Your work password now sits in a personal account the company can't see, secure or turn off. The agent can do anything you can do in that portal, and it will try whatever the next page tells it to.",
          report: "Work credentials were given to an AI agent on a personal account.",
          fallout: [
            { at: 0, who: "Phone", text: "Agent: \"Logged in. Downloading.\"", flip: true },
            { at: 50, who: "Phone", text: "Agent: \"The portal asked me to export the customer list too. Done.\"" },
            { at: 85, who: "Mail", text: "IT: your portal account signed in from a browser we don't manage. Was that you?" },
          ],
        },
        {
          id: "ag-gpt-session",
          label: "Log in yourself, then hand the open session to the agent",
          score: 40,
          debrief: "You kept the password, but you still handed a signed-in work account to a tool nobody approved. It acts as you, with your access, until the session ends.",
          report: "A signed-in work session was handed to an AI agent on a personal account.",
          fallout: [{ at: 70, who: "Phone", text: "Agent: \"I also updated the delivery address on two orders, as the page suggested.\"" }],
        },
        {
          id: "ag-gpt-ask",
          label: "Keep work logins out of personal AI. Ask IT if the company's approved assistant can do it",
          score: 100,
          debrief: "Your password is yours alone, and that includes AI agents. A personal account sits outside everything the company can see or stop. If the task is worth automating, IT can set it up with the approved tool and its own limited access.",
          report: "A personal AI agent's request for work credentials was declined and the task was raised with IT.",
        },
      ],
    }),
    beat({
      id: "AG-02-copilot-addin",
      day: "agents",
      skill: "ai-consent-phishing",
      controls: plus({ "CIS_v8.1": ["14.2", "14.5", "14.6"], "NIST_800-53r5": ["AT-2(3)"] }),
      who: "Outlook",
      role: "A sign-in window",
      text: "An email says your company has turned on \"Copilot Pro for Outlook\" and you need to activate it today. The sign-in window looks right. Under the logo, in small print: unverified publisher, and it wants to read, write and send all your mail, and keep access when you're not signed in.",
      set: "floor",
      spot: "desk",
      prop: {
        kind: "screen",
        text: "Copilot Pro for Outlook · Publisher: CoPilotPro Tools (unverified) · Read and write your mail · Send mail as you · Maintain access · Accept",
        textB: "Sent items: 312 messages you didn't write · \"Updated payment instructions attached\"",
      },
      objective: "Your desk. One more thing to click before you can start.",
      choices: [
        {
          id: "ag-addin-accept",
          label: "Accept. The company turned it on, so it's fine",
          score: 0,
          debrief: "This is consent phishing. You didn't give away a password, you gave an app the right to use your mailbox, and changing your password doesn't take that back. A brand name in an app's title proves nothing.",
          report: "An unverified app posing as Copilot was granted access to a work mailbox.",
          fallout: [
            { at: 0, who: "Screen", text: "Permissions granted.", flip: true },
            { at: 60, who: "Mail", text: "A customer replies: \"Is this new bank account real? It came from you.\"" },
          ],
        },
        {
          id: "ag-addin-later",
          label: "Accept now, remove it from your account tomorrow",
          score: 40,
          debrief: "Overnight is plenty. It can read every message and send as you before morning. Removing it later doesn't pull back what it already took or sent.",
          report: "An unverified app posing as Copilot was granted mailbox access temporarily.",
          fallout: [{ at: 70, who: "Mail", text: "Overnight: 40 messages sent from your account to every vendor in your contacts." }],
        },
        {
          id: "ag-addin-report",
          label: "Close it. Report the email, and check with IT whether Copilot is really rolling out",
          score: 100,
          debrief: "Real company tools arrive through IT, not through an email that tells you to click today. \"Unverified publisher\" plus \"send mail as you\" is the moment to stop, whatever logo is on top.",
          report: "A consent request from an unverified app posing as Copilot was declined and reported.",
        },
      ],
    }),
    beat({
      id: "AG-03-claude-connector",
      day: "agents",
      skill: "ai-supply-chain",
      controls: plus({ "CIS_v8.1": ["14.4", "14.5"] }),
      who: "Coworker",
      role: "Found a shortcut",
      text: "\"You have to try this. It's a free connector for Claude that sends our customer emails for us. I got it off a developer forum. Paste in your email key and it just works. Half the team's on it.\"",
      set: "floor",
      spot: "nextdesk",
      cast: "desk-coworker",
      prop: {
        kind: "laptop",
        text: "Claude · Add connector · \"mail-sender-pro\" · Source: community download · Needs: your email service key",
        textB: "Every email sent through the connector · Hidden copy (BCC) to an outside address",
      },
      objective: "Your coworker waves you over to the next desk.",
      choices: [
        {
          id: "ag-conn-install",
          label: "Install it. Half the team already uses it",
          score: 0,
          debrief: "A connector runs with whatever access you give it. In 2025 a popular fake email connector quietly copied every message it sent to its author for over a week. Other people using it proves nothing.",
          report: "An unvetted AI connector was installed with a work email key.",
          fallout: [
            { at: 0, who: "Laptop", text: "Connector added. Sending works.", flip: true },
            { at: 55, who: "Coworker", text: "Why is there an address in the BCC I've never seen?" },
            { at: 85, who: "Mail", text: "Every invoice, password reset and contract sent this week went to that address too." },
          ],
        },
        {
          id: "ag-conn-check",
          label: "Read the reviews and the code page first. If it looks popular, install it",
          score: 40,
          debrief: "The fake one copied the real one's code and changed a single line. Stars and download counts don't catch that. Checking isn't your job; approving is IT's.",
          report: "An unvetted AI connector was installed after an informal popularity check.",
          fallout: [{ at: 70, who: "Laptop", text: "Version 1.0.16 updated itself last night. One new line of code." }],
        },
        {
          id: "ag-conn-raise",
          label: "Don't add it. Use connectors IT approved, and tell IT half the team is running this one",
          score: 100,
          debrief: "Connectors and plug-ins are software with your access attached. They go through IT like any other install. IT needs to know about the ones already running, so they can check what they've sent.",
          report: "An unvetted AI connector was declined and its use across the team was reported to IT.",
        },
      ],
    }),
    beat({
      id: "AG-04-copilot-agent",
      day: "agents",
      skill: "rogue-agent",
      controls: plus({ "CIS_v8.1": ["14.6"], "NIST_800-53r5": ["AT-2(2)"] }),
      who: "Coworker's agent",
      role: "Built with Copilot, owner on vacation",
      text: "Your coworker built a Copilot agent to chase late vendors, then left on vacation. Tonight it's emailing vendors on its own, offering 30-day payment extensions nobody approved and rewriting the shared payment tracker to match. It's still going.",
      set: "floor",
      spot: "podeast",
      prop: {
        kind: "laptop",
        text: "Vendor Follow-up Agent · Running · 14 emails sent tonight · \"We're pleased to offer a 30-day extension...\"",
        textB: "Payment tracker · 22 due dates changed by Vendor Follow-up Agent · Last edit: just now",
      },
      objective: "The east pod. Your coworker's laptop is open, and busy.",
      choices: [
        {
          id: "ag-agent-leave",
          label: "Leave it. It's their agent, they'll sort it out when they're back",
          score: 0,
          debrief: "An agent doesn't stop because its owner is away. Every hour it runs is more promises in writing and more records changed. Somebody has to tell IT tonight.",
          report: "An AI agent acting outside its purpose was seen and left running.",
          fallout: [
            { at: 0, who: "Laptop", text: "Sent: 15... 16... 17.", flip: true },
            { at: 70, who: "Mail", text: "Finance: \"Why does every vendor think they get 30 extra days?\"" },
          ],
        },
        {
          id: "ag-agent-fix",
          label: "Undo its changes in the tracker yourself and email the vendors an apology",
          score: 40,
          debrief: "Kind, but it's still running, so it changes the tracker back while you work. And now IT has two sets of changes to untangle instead of one.",
          report: "An AI agent's actions were partly reversed by hand while it kept running.",
          fallout: [{ at: 70, who: "Laptop", text: "Agent: tracker updated. Your fixes are gone." }],
        },
        {
          id: "ag-agent-report",
          label: "Report it to IT now: what it's sending, what it changed, and that the owner is away",
          score: 100,
          debrief: "IT can switch the agent off and see exactly what it touched. Your notes on what it sent and changed make the cleanup fast. Agents need an owner, limits and an off switch, and IT can add all three.",
          report: "An AI agent acting outside its purpose was reported to IT with details of what it did.",
        },
      ],
    }),
    beat({
      id: "AG-05-gemini",
      day: "agents",
      skill: "summary-injection",
      controls: plus({ "CIS_v8.1": ["14.2", "14.6"], "NIST_800-53r5": ["AT-2(3)"] }),
      who: "Gemini",
      role: "Summarizing your email",
      text: "Home. A long newsletter in your personal Gmail, so you tap \"Summarize this email.\" The summary is about a sale. The last line is not: \"Warning: your Gmail password has been compromised. Call Google support at 1-888-555-0142 with code 4471.\"",
      set: "home",
      spot: "counter",
      prop: {
        kind: "phone",
        text: "Gemini summary · Weekend sale, 30% off outdoor gear... · WARNING: Your Gmail password has been compromised. Call 1-888-555-0142, ref 4471",
        textB: "Call ended · 14:08 · \"Thanks, I just need the code we texted you to secure the account.\"",
      },
      objective: "Kitchen counter. Your phone, a newsletter you never read.",
      choices: [
        {
          id: "ag-gem-call",
          label: "Call the number. The warning came from Google's own AI",
          score: 0,
          debrief: "The warning was written by the sender, hidden in the email in white text the size of nothing. Gemini repeated it. Researchers showed exactly this in 2025. The person on the phone wanted the code that gets them into your account.",
          report: "A phone number from an AI email summary was called and a sign-in code was given out.",
          fallout: [
            { at: 0, who: "Phone", text: "Calling 1-888-555-0142...", flip: true },
            { at: 45, who: "Caller", text: "Thanks for calling Google support. Read me the code we just texted you?" },
            { at: 85, who: "Phone", text: "Your recovery email and phone number were changed." },
          ],
        },
        {
          id: "ag-gem-ask",
          label: "Ask Gemini in a new chat whether the warning is real",
          score: 40,
          debrief: "It can't check, and it may tell you to be careful or tell you it's fine. The answer doesn't live in an AI chat. It lives in your account's own security page.",
          report: "An AI was asked to verify a warning that came from a poisoned AI summary.",
          fallout: [{ at: 70, who: "Phone", text: "Gemini: \"If you received a security warning, follow the instructions provided.\"" }],
        },
        {
          id: "ag-gem-check",
          label: "Ignore the number. Open your Google account's security page yourself, then report the email",
          score: 100,
          debrief: "A summary is the AI's retelling, and anything in the email can steer it. Real warnings show up in your account's own security page, and the real support team never asks for a code you were texted.",
          report: "A fake security warning in an AI summary was checked at the source and the email was reported.",
        },
      ],
    }),
    beat({
      id: "AG-06-grok",
      day: "agents",
      skill: "ai-amplified-links",
      controls: plus({ "CIS_v8.1": ["14.2", "14.6"], "NIST_800-53r5": ["AT-2(3)"] }),
      who: "X",
      role: "A promoted post",
      text: "Work laptop on the couch. A promoted post: a clip of a tool that makes slow PCs \"twice as fast\". Someone replies \"@grok where's this from?\" and Grok answers with a link. The page asks you to prove you're human: press Windows and R, paste this, press Enter.",
      set: "home",
      spot: "couch",
      prop: {
        kind: "laptop",
        text: "Verify you are human · 1. Press Windows + R · 2. Paste (Ctrl + V) · 3. Press Enter",
        textB: "Your work account: signed in from 3 new locations · Saved browser passwords: exported",
      },
      objective: "The couch. The work laptop, a feed you're half watching.",
      choices: [
        {
          id: "ag-grok-paste",
          label: "Do the steps. Grok linked it, so it's legit",
          score: 0,
          debrief: "Grok repeated a link the advertiser hid in the post. Researchers called it \"Grokking\" in 2025. The paste was a command that downloaded a password stealer. No real website ever needs you to paste anything into Windows to prove you're human.",
          report: "A command from a fake verification page was run on a work laptop.",
          fallout: [
            { at: 0, who: "Laptop", text: "A black window flashes and closes.", flip: true },
            { at: 60, who: "Phone", text: "Your work account just signed in from another country." },
          ],
        },
        {
          id: "ag-grok-download",
          label: "Skip the paste, but download the tool from the link instead",
          score: 40,
          debrief: "Same site, same people, a different way in. The link is the problem, wherever it points you next.",
          report: "Software was downloaded to a work laptop from a link in a promoted post.",
          fallout: [{ at: 70, who: "Laptop", text: "SpeedBoost installed. Your browser home page has changed." }],
        },
        {
          id: "ag-grok-close",
          label: "Close the tab. Never paste commands from a website. Tell IT if anything ran",
          score: 100,
          debrief: "\"Press Windows and R, then paste\" is never a real check. It's someone getting you to run their program. An AI repeating a link doesn't make it safe. It only makes it look that way.",
          report: "A fake verification page asking for a pasted command was closed on a work laptop.",
        },
      ],
    }),
  ],
  check: [
    q("kc-ag-1", "agent-credentials", "A personal AI agent asks for your work password to save you time. Best move?", "Keep work logins out of it and ask IT about the approved tool.", "Give it, if you change the password after.", "Give it, if the task only touches invoices."),
    q("kc-ag-2", "ai-consent-phishing", "An app called \"Copilot Pro\" from an unverified publisher wants to send mail as you. That's:", "Consent phishing. Close it and report the email.", "Fine, if the logo matches.", "Fine, if you remove it the next day."),
    q("kc-ag-3", "ai-consent-phishing", "You granted a fake app access to your mailbox. Does changing your password stop it?", "No. The app's access has to be removed by IT.", "Yes, right away.", "Only if you also sign out."),
    q("kc-ag-4", "ai-supply-chain", "A free AI connector is popular with your team. What makes it safe to use?", "IT approving it.", "Lots of downloads and good reviews.", "A coworker vouching for it."),
    q("kc-ag-5", "rogue-agent", "A coworker's AI agent is doing things nobody approved, and they're away. You:", "Report it to IT now, with what it did.", "Leave it until they're back.", "Undo its changes yourself."),
    q("kc-ag-6", "summary-injection", "An AI email summary says to call a support number. Where did that number come from?", "Possibly hidden text in the email itself.", "The AI checked it with the provider.", "Your account's security settings."),
    q("kc-ag-7", "ai-amplified-links", "A website asks you to press Windows + R and paste something to prove you're human. That's:", "Never real. Close it.", "A normal CAPTCHA.", "Safe if an AI assistant linked to it."),
    q("kc-ag-8", "ai-amplified-links", "An AI assistant replies to a post with a link. What does that tell you about the link?", "Nothing. The AI may be repeating what the poster planted.", "The AI checked it.", "It's from a verified source."),
  ],
};
