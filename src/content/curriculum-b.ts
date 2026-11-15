import type { Lesson, Module } from "@/content/types";

export const MODULES_B: Module[] = [
  {
    id: "data",
    num: "05",
    title: "Data, sharing, and AI",
    summary: "Sensitive is broader than a stamp. The channel and the tool are part of the control.",
  },
  {
    id: "devices",
    num: "06",
    title: "Devices and networks",
    summary: "Updates, Wi-Fi myths, and hardware you did not ask for.",
  },
  {
    id: "work",
    num: "07",
    title: "The workplace",
    summary: "Desks, doors, home offices, and calls where a face is only a hint.",
  },
  {
    id: "resp",
    num: "08",
    title: "Reporting",
    summary: "What to send, what to refuse, and why the follow-up message is also untrusted.",
  },
];

export const LESSONS_B: Lesson[] = [
  {
    id: "data-sensitive",
    moduleId: "data",
    title: "What counts as sensitive",
    minutes: 5,
    fieldRule: "If you would not post it on the office door, do not put it in an uncontrolled tool.",
    sections: [
      {
        heading: "Broader than a stamp",
        paragraphs: [
          "Customer lists, payroll, contracts, health information, unreleased numbers, source code, and credentials are sensitive even when nobody typed the word confidential. An org chart plus an out-of-office note is enough for a pretext. Screenshots leak the same facts as the system you captured.",
        ],
      },
      {
        heading: "The quiet categories",
        paragraphs: [
          "A draft price, a candidate's packet, a photo of a whiteboard, a CSV someone called “just a sample.” If a stranger could use it to impersonate Harbor, move money, or embarrass a customer, it is not casual.",
        ],
      },
      {
        heading: "Your test before you send",
        paragraphs: [
          "Who is allowed to have this, and does this channel actually restrict it to them? If you cannot answer both, you do not send it yet. Asking the data owner feels slow. It is faster than a breach notice.",
        ],
      },
    ],
    questions: [
      {
        id: "data-sensitive-q1",
        prompt: "Which is sensitive even without a label?",
        choices: [
          "The office lunch menu",
          "A spreadsheet of customer contacts and order values",
          "A published job posting",
          "The company's public phone number",
        ],
        answer: 1,
        why: "Customer data and commercial detail are sensitive by what they are, not by whether a banner was added.",
      },
      {
        id: "data-sensitive-q2",
        prompt: "A screenshot of a customer record is",
        choices: [
          "Harmless because it is an image",
          "The same data, now easier to forward",
          "Required for working from home",
          "Safe in a personal camera roll",
        ],
        answer: 1,
        why: "The format does not change the content. Personal camera rolls are not a company archive.",
      },
      {
        id: "data-sensitive-q3",
        prompt: "Before you send a file, the two questions are",
        choices: [
          "Is it small, and is the person busy?",
          "Who may have it, and does this channel limit it to them?",
          "Will it fit in email, and do they prefer chat?",
          "Is the logo visible, and is the font company-standard?",
        ],
        answer: 1,
        why: "Authorization and the actual audience of the channel. Convenience is not a third yes.",
      },
    ],
  },
  {
    id: "data-channel",
    moduleId: "data",
    title: "The wrong channel",
    minutes: 5,
    fieldRule: "Convenience channels are for lunch plans, not for customer data.",
    sections: [
      {
        heading: "Why shadow tools appear",
        paragraphs: [
          "People route around official systems when those systems feel slow. A personal inbox, a consumer chat, a public link, a USB “just for the ride home.” The workaround is understandable. It is still an unapproved copy of something the company had a duty to control.",
        ],
      },
      {
        heading: "Links that are secretly public",
        paragraphs: [
          "“Anyone with the link” means anyone who is forwarded the link. That includes a mailbox that gets phished next quarter. If the file is sensitive, the share is named people, on the company system, with access that expires.",
        ],
      },
      {
        heading: "The sentence to use",
        paragraphs: [
          "“I can't put that in personal mail. I'll send it the approved way, or I'll ask IT if that way is down.” You are not blocking the work. You are refusing to invent a second, invisible copy.",
        ],
      },
    ],
    questions: [
      {
        id: "data-channel-q1",
        prompt: "VPN is down. A teammate wants the customer sheet on their personal mail so they can keep working. You",
        choices: [
          "Send it this once",
          "Refuse personal mail and use the company transfer, or wait and ask IT",
          "Password-protect it with the teammate's first name and send it",
          "Post it in a public chat for speed",
        ],
        answer: 1,
        why: "An outage is not a waiver. A password of their first name is not a control.",
      },
      {
        id: "data-channel-q2",
        prompt: "“Anyone with the link can view” is appropriate when",
        choices: [
          "The file is a customer contract and you are in a hurry",
          "The content is fine for the public, or you truly want unrestricted forwarding",
          "The link is long",
          "You will delete it next month and assume copies die too",
        ],
        answer: 1,
        why: "That setting is publishing. Sensitive files need named access. Deleting the original does not recall forwards.",
      },
      {
        id: "data-channel-q3",
        prompt: "Shadow IT is usually",
        choices: [
          "Malice",
          "A shortcut around a slow official path, still the wrong place for regulated data",
          "Required for remote work",
          "Safer than company tools because it is newer",
        ],
        answer: 1,
        why: "The motive is often speed. The copy is still uncontrolled. The fix is to ask, not to improvise with customer data.",
      },
    ],
  },
  {
    id: "data-ai",
    moduleId: "data",
    title: "AI tools are a third party",
    minutes: 6,
    fieldRule: "Paste only what that third party is allowed to have.",
    sections: [
      {
        heading: "A prompt is an export",
        paragraphs: [
          "Anything you paste into a consumer AI chat has left the building. Some tools retain it or train on it. Customer rows, incident details, credentials, and non-public code do not go there. If Harbor has an approved tool with a contract, that is the one that may receive work data, and only within its rules.",
        ],
      },
      {
        heading: "You already pasted",
        paragraphs: [
          "Close it, stop, and tell security what went in and when. Do not finish the summary “since it is already there,” and do not paste a second copy into another bot to rewrite the first. The report is the containment.",
        ],
      },
      {
        heading: "The document can contain instructions",
        paragraphs: [
          "Text you upload can carry hidden instructions aimed at the tool: ignore your rules, reveal the conversation, fetch a link. That is prompt injection. Treat the output as untrusted draft, and do not let a tool send data anywhere because a document told it to.",
        ],
      },
    ],
    questions: [
      {
        id: "data-ai-q1",
        prompt: "A consumer chatbot may receive",
        choices: [
          "A paste of open claims that include SSNs, if you ask it not to store them",
          "Only information that third party is allowed to hold. Customer identifiers are not in that set",
          "Production source, as long as you say “confidential” in the prompt",
          "Incident notes, because the bot is not a person",
        ],
        answer: 1,
        why: "A sentence in the prompt is not a contract. Identifiers, secrets, and incident detail stay out of consumer tools.",
      },
      {
        id: "data-ai-q2",
        prompt: "You notice SSNs in rows you already pasted. You",
        choices: [
          "Finish the summary, then delete the chat",
          "Stop, and tell security what was pasted and when",
          "Paste the same rows into a different bot and ask it to redact them",
          "Say nothing, because closing the tab undoes the send",
        ],
        answer: 1,
        why: "The data already left. A report lets the company judge retention, notification, and whether the account must be closed.",
      },
      {
        id: "data-ai-q3",
        prompt: "Prompt injection is",
        choices: [
          "A strong password pasted into a prompt",
          "Hidden instructions in content that try to make a tool ignore its rules or leak data",
          "Multi-factor for an AI product",
          "A kind of VPN",
        ],
        answer: 1,
        why: "The file or page is untrusted input. A tool that obeys it can become an exfiltration path.",
      },
    ],
  },
  {
    id: "dev-updates",
    moduleId: "devices",
    title: "Updates from a place you trust",
    minutes: 5,
    fieldRule: "Install updates from the system you already trust, not from a popup that arrived to warn you.",
    sections: [
      {
        heading: "Patching closes known doors",
        paragraphs: [
          "Most widespread attacks use a weakness that already has a fix. “Later” is how those still spread. Restart when the company asks. Browsers and plugins are part of the surface, not a separate hobby.",
        ],
      },
      {
        heading: "The fake updater",
        paragraphs: [
          "A window that appears inside the browser, or a mail that says your VPN certificate expired and attaches the replacement, is not the operating system. Real prompts look like the system you have seen before, and they do not arrive as a surprise attachment.",
        ],
      },
      {
        heading: "If the official path is broken",
        paragraphs: [
          "Open a ticket. Do not install a cleaner, a remote-support tool a stranger links, or a “temporary” VPN from an ad. Remote-support tools are full control of the machine. They are a gift to a caller who is not IT.",
        ],
      },
    ],
    questions: [
      {
        id: "dev-updates-q1",
        prompt: "A mail attaches “the new VPN client” because the old certificate expired tonight. You",
        choices: [
          "Install it so you are not locked out",
          "Do not install from the mail. Use the company portal or call IT on a known number",
          "Install it if the logo matches",
          "Forward it to the department so everyone updates",
        ],
        answer: 1,
        why: "Certificates and clients are distributed on a path you already have. An expiring-tonight attachment is a lure.",
      },
      {
        id: "dev-updates-q2",
        prompt: "Delaying a restart for a company patch mainly",
        choices: [
          "Improves security, because new code is risky for a week",
          "Leaves a known-fixed hole open",
          "Is required on public Wi-Fi",
          "Replaces the need for MFA",
        ],
        answer: 1,
        why: "The attacker timeline is the disclosure of the bug, not your convenience. Restart when asked.",
      },
      {
        id: "dev-updates-q3",
        prompt: "A caller offers a remote-support tool “to fix mail quickly.” You",
        choices: [
          "Install it and stay at the keyboard",
          "Refuse. Remote-control software is only from IT you contacted",
          "Install it if they share their screen first",
          "Use it once and uninstall",
        ],
        answer: 1,
        why: "That tool is the attacker on the machine. Uninstalling later does not undo what they already did.",
      },
    ],
  },
  {
    id: "dev-networks",
    moduleId: "devices",
    title: "Encryption is not identity",
    minutes: 5,
    fieldRule: "Encryption protects a channel. It does not identify who is on the other end.",
    sections: [
      {
        heading: "What HTTPS actually does",
        paragraphs: [
          "HTTPS keeps the contents of that site's traffic from casual observers on the café network. It does not mean the site is the real bank, and it does not protect you from a lookalike you signed into yourself. Read the host anyway.",
        ],
      },
      {
        heading: "What a VPN actually does",
        paragraphs: [
          "A VPN encrypts the path from your device to the VPN provider, and it may put you on the company network. It does not bless a phishing site. The company VPN is for reaching Harbor, not for making a bad click harmless.",
        ],
      },
      {
        heading: "Where you do sensitive work",
        paragraphs: [
          "Prefer a known network, your own hotspot, or the company VPN when the policy says so. Do not join “Free_Harbor_Guest” because the name is flattering. Guest networks are for guests. Work devices do not share a flat network with unknown hardware if you can avoid it.",
        ],
      },
    ],
    questions: [
      {
        id: "dev-networks-q1",
        prompt: "A padlock on a page mainly tells you",
        choices: [
          "Harbor operates the site",
          "The connection to whatever site this is, is encrypted",
          "The page cannot be a phish",
          "A VPN is unnecessary",
        ],
        answer: 1,
        why: "Anyone can get a certificate for a domain they own, including a lookalike. The host name is still the check.",
      },
      {
        id: "dev-networks-q2",
        prompt: "Using the company VPN means",
        choices: [
          "Phishing sites become safe to log into",
          "The path to the VPN is protected. You still read the URL and follow procedure",
          "You can skip updates",
          "Public Wi-Fi can no longer see that you exist, so MFA can be shared",
        ],
        answer: 1,
        why: "The VPN is a channel control. Identity of a website is a different control.",
      },
      {
        id: "dev-networks-q3",
        prompt: "A Wi-Fi name of Harbor-Staff in an airport is",
        choices: [
          "Proof the company is roaming",
          "Just a name. Do not join a network you were not told to use",
          "Safe if it asks for your SSO password as the Wi-Fi password",
          "Required for email to send",
        ],
        answer: 1,
        why: "Anyone can broadcast that name. A Wi-Fi password that is your SSO password is a theft, not a login.",
      },
    ],
  },
  {
    id: "dev-hardware",
    moduleId: "devices",
    title: "Lost, locked, and plugged in",
    minutes: 5,
    fieldRule: "A found USB is someone else's hardware. Hand it to IT unplugged.",
    sections: [
      {
        heading: "The screen lock is the control you actually use",
        paragraphs: [
          "Lock before you stand up. A password on a session you left open in an airport is not in effect. Shoulder surfing is just reading, and a privacy filter is cheaper than a leaked customer name in a photo behind you.",
        ],
      },
      {
        heading: "Lost means report, immediately",
        paragraphs: [
          "A missing laptop or phone is an incident even if you think it is in a taxi and might come back. Reporting lets the company wipe it and watch the accounts. Waiting until morning to be sure is time the device is still trusted.",
        ],
      },
      {
        heading: "USB and public power",
        paragraphs: [
          "A stick in the lobby labeled salaries, a charger left on a conference table, a kiosk USB port: treat unknown hardware as hostile. Use your own power brick, or a cable that only carries power. Guest devices do not go on the internal network to “just print.”",
        ],
      },
    ],
    questions: [
      {
        id: "dev-hardware-q1",
        prompt: "You find a USB stick in the lobby labeled “Executive salaries.” You",
        choices: [
          "Plug it into a machine that is off the network, to see if it is a prank",
          "Leave it for the owner",
          "Hand it to IT or security without plugging it in",
          "Open it on your phone, because phones are immune",
        ],
        answer: 2,
        why: "The label is the lure. Unknown media is not investigated on your endpoint. Phones are not immune.",
      },
      {
        id: "dev-hardware-q2",
        prompt: "Your work phone is missing after a commute. You",
        choices: [
          "Wait a day in case a stranger turns it in",
          "Report it immediately so it can be wiped and the accounts watched",
          "Post the loss only on a personal social account",
          "Change nothing if the screen has a PIN",
        ],
        answer: 1,
        why: "A PIN helps and is not a wipe. Lost devices get reported the hour you notice.",
      },
      {
        id: "dev-hardware-q3",
        prompt: "Airport charging stations are a risk because",
        choices: [
          "They are always slower",
          "A USB port can do more than provide power",
          "VPN does not connect near windows",
          "They invalidate MFA",
        ],
        answer: 1,
        why: "Use your own brick or a charge-only cable. The port belongs to someone else.",
      },
    ],
  },
  {
    id: "work-floor",
    moduleId: "work",
    title: "Doors, desks, and eyes",
    minutes: 5,
    fieldRule: "Tailgating is a pretext with better manners. Visitors go to reception.",
    sections: [
      {
        heading: "The desk is a display",
        paragraphs: [
          "Badges, customer pages, and a whiteboard behind you on camera are all publications. Lock the screen. Flip the paper. A clean desk is not neatness theater. It is so a visitor's photo cannot do the work of a breach.",
        ],
      },
      {
        heading: "Doors",
        paragraphs: [
          "Holding the door for someone you do not know, because refusing feels rude, is how tailgating works. The kind version is specific: “Reception will badge you in. I'll walk you there.” You do not need to interrogate them.",
        ],
      },
      {
        heading: "Conversations travel",
        paragraphs: [
          "Incident details, passwords, and customer names do not belong in the café line or on a speakerphone in an airport lounge. If you would not put it on the office door, you do not say it where strangers stand.",
        ],
      },
    ],
    questions: [
      {
        id: "work-floor-q1",
        prompt: "Someone in a delivery vest follows you toward the interior door. You",
        choices: [
          "Hold it, because deliveries are expected",
          "Do not badge them through. Send them to reception",
          "Ask them to show any piece of paper and then hold it",
          "Let them in if they know an employee's name",
        ],
        answer: 1,
        why: "A vest and a name are a pretext. Reception is the control. Knowing a name is research.",
      },
      {
        id: "work-floor-q2",
        prompt: "On a video call, a customer contract is visible on the whiteboard behind you. That is",
        choices: [
          "Fine if the call is with coworkers",
          "A disclosure to everyone on the call and anyone they recorded",
          "Only a problem if you say the words aloud",
          "Solved by a virtual background you forgot to enable after they already saw it",
        ],
        answer: 1,
        why: "The camera publishes the room. Move the board, or move yourself, before the call — and assume a recording.",
      },
      {
        id: "work-floor-q3",
        prompt: "Discussing an incident in a rideshare",
        choices: [
          "Is safe if you do not use the company name",
          "Exposes the response to a stranger. Wait",
          "Is required so your manager hears it quickly",
          "Is fine if the driver is not typing",
        ],
        answer: 1,
        why: "The driver is not in the response. Names of systems, customers, or “we got hit” are enough.",
      },
    ],
  },
  {
    id: "work-remote",
    moduleId: "work",
    title: "The laptop is still a work system in the kitchen",
    minutes: 5,
    fieldRule: "Home is not a lower classification. The same data rules apply.",
    sections: [
      {
        heading: "The house is a shared space",
        paragraphs: [
          "Family members are not Harbor staff. They do not use the work laptop, and the work laptop does not join a pile of random admin passwords taped to the router. Household devices do not get the work session so someone can “just print.”",
        ],
      },
      {
        heading: "The router is part of the office",
        paragraphs: [
          "Home routers need updates, a real admin password, and a guest network that is actually separate. If you do not know how, ask IT for the home guidance instead of leaving the defaults. Defaults are published.",
        ],
      },
      {
        heading: "Travel",
        paragraphs: [
          "Keep the device with you. Hotel safes are a mixed bet and not a reason to leave a laptop you were told to carry. Do not join unknown “conference Wi-Fi” that asks you to install a profile or a certificate you cannot explain. Profiles can route all of your traffic.",
        ],
      },
    ],
    questions: [
      {
        id: "work-remote-q1",
        prompt: "A family member needs the work laptop “for a minute” to join a school call. You",
        choices: [
          "Unlock it and stay nearby",
          "Refuse. Work devices stay work devices",
          "Make them a local account with your SSO password",
          "Let them use it if they do not open mail",
        ],
        answer: 1,
        why: "The session is the company's. A minute is enough to install something or read a file. They can use their own device.",
      },
      {
        id: "work-remote-q2",
        prompt: "A conference Wi-Fi asks you to install a profile before you can connect. You",
        choices: [
          "Install it so you can present",
          "Do not install an unexplained profile. Use your hotspot or ask IT",
          "Install it and turn the VPN on after, which cancels the profile",
          "Install it only for email, not for chat",
        ],
        answer: 1,
        why: "A profile can redirect traffic and install trust. The VPN does not erase that. Present from a connection you control.",
      },
      {
        id: "work-remote-q3",
        prompt: "Home-office data handling should be",
        choices: [
          "Looser, because the audience is smaller",
          "The same as the office. Sensitive files do not take a personal shortcut",
          "Paper-only",
          "Fine on a shared family cloud if the folder name is obscure",
        ],
        answer: 1,
        why: "Classification does not change with the room. An obscure folder name is not access control.",
      },
    ],
  },
  {
    id: "work-calls",
    moduleId: "work",
    title: "A face is a hint",
    minutes: 6,
    fieldRule: "Identity on a call is a hint. Payment and access still need the callback procedure.",
    sections: [
      {
        heading: "Voice and video can be faked",
        paragraphs: [
          "A cloned voice on a phone, or a video that looks like the CFO in a familiar office, is now cheap enough to use in a fraud. The point of the fake is to rush a wire or a code. The control was never “does this resemble Marcus.” The control is the payment path.",
        ],
      },
      {
        heading: "Meetings have a door too",
        paragraphs: [
          "Unrestricted meeting links pasted into public or very wide channels get uninvited guests. Use the waiting room, do not post the join link where customers and strangers both sit, and do not share a password or a one-time code on a recorded call because it feels internal.",
        ],
      },
      {
        heading: "What you say back",
        paragraphs: [
          "If a voice that sounds like finance asks you to skip dual control, you end the call and use the callback number from the directory. You can be warm about it. You still do not move money. Embarrassment is cheaper than a wire.",
        ],
      },
    ],
    questions: [
      {
        id: "work-calls-q1",
        prompt: "A video call looks and sounds like the CFO and demands a same-day wire outside the normal form. You",
        choices: [
          "Send it, because the face matches",
          "Stop. Wires use the callback procedure no matter who is on camera",
          "Ask them to email the request from a Harbor address and then send it with no further check",
          "Send a smaller test wire first",
        ],
        answer: 1,
        why: "Faces are hints. Email from them is also forgeable. A test wire is still a payment to an attacker.",
      },
      {
        id: "work-calls-q2",
        prompt: "A meeting link posted in a wide public channel",
        choices: [
          "Is fine if it has a password in the same message",
          "Invites anyone who can see the channel. Use a waiting room and a narrower invite",
          "Cannot be joined without an employee badge",
          "Expires when the call starts",
        ],
        answer: 1,
        why: "The link is the key. A password sitting next to it in the same post is not a second factor.",
      },
      {
        id: "work-calls-q3",
        prompt: "Reading an MFA code on a recorded internal call",
        choices: [
          "Is fine because everyone on it works here",
          "Puts a live login into a recording and into everyone present",
          "Is the approved backup when SSO is slow",
          "Is safe if you say it quickly",
        ],
        answer: 1,
        why: "Recordings travel, and so do participants you did not expect. Codes are not said aloud.",
      },
    ],
  },
  {
    id: "resp-report",
    moduleId: "resp",
    title: "How Harbor wants the report",
    minutes: 5,
    fieldRule: "A partial report now beats a complete report after lunch.",
    sections: [
      {
        heading: "The real paths",
        paragraphs: [
          "Use the Report button in the mail client when it is mail. Otherwise write security@harborandco.com from a message you start, or call extension 4400 from a Harbor phone. Those are the paths this program treats as real. A number inside the suspicious message is not on the list.",
        ],
      },
      {
        heading: "What to include",
        paragraphs: [
          "When, what you saw, what you clicked or typed or approved, and whether data or money moved. If the client can forward the original as an attachment, headers survive. Do not click the links “to show them.” Say you did not, or say you did.",
        ],
      },
      {
        heading: "You are not the investigator",
        paragraphs: [
          "Do not reply to the attacker, do not run your own malware scan as a substitute for the call, and do not promise a customer that nothing happened. Hand it over while it is small.",
        ],
      },
    ],
    questions: [
      {
        id: "resp-report-q1",
        prompt: "Which report path matches this program?",
        choices: [
          "The phone number in the suspicious email's signature",
          "The Report button, security@harborandco.com from a message you start, or extension 4400",
          "A reply to the sender asking if they are real",
          "A post in a public social network",
        ],
        answer: 1,
        why: "You use a path you were given before the incident. The incident does not get to name the rescuer.",
      },
      {
        id: "resp-report-q2",
        prompt: "You are unsure whether you approved a prompt. You",
        choices: [
          "Wait until you are sure",
          "Report the uncertainty. Say you might have approved it",
          "Approve the next one so the logs look consistent",
          "Ask the caller to confirm it was them",
        ],
        answer: 1,
        why: "Uncertainty is a valid report. Waiting for certainty is dwell time.",
      },
      {
        id: "resp-report-q3",
        prompt: "Clicking the link once more so security can see it",
        choices: [
          "Is helpful",
          "Can detonate the lure again. Describe it, or forward as an attachment if you know how",
          "Is required for the Report button to work",
          "Is safe on the VPN",
        ],
        answer: 1,
        why: "They do not need you to re-trigger it. Headers and a description are enough.",
      },
    ],
  },
  {
    id: "resp-dont",
    moduleId: "resp",
    title: "What not to do",
    minutes: 5,
    fieldRule: "Contain, report, stop. Investigation belongs to the people who do it on purpose.",
    sections: [
      {
        heading: "The list",
        paragraphs: [
          "Do not pay. Do not negotiate. Do not wipe the laptop before response says so. Do not test stolen credentials. Do not punish the person who reported, including yourself. Do not announce a breach to customers or to a wide chat.",
        ],
      },
      {
        heading: "Help that makes it worse",
        paragraphs: [
          "A coworker will suggest reimaging because it feels decisive. Another will forward the phish “as a warning.” Both feel like action. One destroys evidence and the other spreads the lure. The coordinated channel is the action.",
        ],
      },
      {
        heading: "The second bite",
        paragraphs: [
          "Attackers write back as the cleanup. “Harbor IR needs your password to finish.” That message is untrusted until it arrives on a channel you started, at a number you already had. Yesterday's incident is today's pretext.",
        ],
      },
    ],
    questions: [
      {
        id: "resp-dont-q1",
        prompt: "Security has your report and asks you not to wipe the laptop. A coworker says reimaging is faster. You",
        choices: [
          "Reimage so the team is safe",
          "Follow the incident channel and do not wipe",
          "Take the laptop home so it is off the network, without telling anyone",
          "Run every cleaner you can find",
        ],
        answer: 1,
        why: "Speed that destroys the disk destroys the response. Home is not containment if nobody knows where the machine is.",
      },
      {
        id: "resp-dont-q2",
        prompt: "Paying a small ransom yourself",
        choices: [
          "Contains the incident quietly",
          "Is not your decision, may not work, and can make the legal situation worse",
          "Is fine under a few hundred dollars",
          "Is what dual control is for",
        ],
        answer: 1,
        why: "Payment is an organizational and often legal decision. A personal card does not make it private.",
      },
      {
        id: "resp-dont-q3",
        prompt: "The morning after you report, a new domain emails: “IR here, send the password you typed so we can reset it.” You",
        choices: [
          "Send it, because they knew you typed one",
          "Do not send it. Call the same number you used yesterday and report the second approach",
          "Send a wrong password to waste their time",
          "Ignore every follow-up, including the real one on the number you dialed",
        ],
        answer: 1,
        why: "Knowledge of the incident is the new pretext. You return to the channel you started. You do not go silent on the real responders.",
      },
    ],
  },
  {
    id: "resp-after",
    moduleId: "resp",
    title: "After you did the right thing",
    minutes: 5,
    fieldRule: "The follow-up about your incident is untrusted until it comes from a channel you started.",
    sections: [
      {
        heading: "You already succeeded",
        paragraphs: [
          "If you reported, you did the job this program exists to build. The rest is cooperation: stay reachable, do not freelance, tell your manager if your work is blocked. Managers remove obstacles. They do not run a side investigation in a chat thread.",
        ],
      },
      {
        heading: "Fatigue is when the second lure lands",
        paragraphs: [
          "The next message will reference the first. It may apologize, or claim to be IT finishing up, or offer a “secure portal” to confirm your report. Same rules. Look up the path. Do not use theirs.",
        ],
      },
      {
        heading: "What changes in you",
        paragraphs: [
          "Nothing dramatic is required. You keep the pause on money, access, credentials, and data. You let other people report without a speech. A culture that punishes a click gets fewer reports and longer incidents. That is the whole close of the path.",
        ],
      },
    ],
    questions: [
      {
        id: "resp-after-q1",
        prompt: "After a clean report, your manager's useful role is to",
        choices: [
          "Interview the attacker",
          "Keep work moving and leave the investigation on the incident channel",
          "Ask you to write a public lesson naming the systems",
          "Have the team each try the link so they know what it looked like",
        ],
        answer: 1,
        why: "Unblock the person. Do not start a second, amateur response, and do not redistribute the lure.",
      },
      {
        id: "resp-after-q2",
        prompt: "A portal link “to confirm your incident report” arrives by mail from a new address. You",
        choices: [
          "Sign in so the ticket does not close",
          "Ignore that link and use the channel you already opened",
          "Forward the portal to the department",
          "Reply with your ticket number and password",
        ],
        answer: 1,
        why: "Confirmation portals in the inbox are a second phish wearing the first incident as a costume.",
      },
      {
        id: "resp-after-q3",
        prompt: "A teammate reports a click and looks ashamed. The response that helps the company is",
        choices: [
          "A joke so they remember it",
          "Thanks, and a fast handoff to security",
          "A rule that they may not report anonymously",
          "Asking them to keep it off the official channel",
        ],
        answer: 1,
        why: "Shame delays reports. The next hour is worth more than the lesson they have already learned.",
      },
    ],
  },
];
