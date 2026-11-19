import type { Lesson, Module } from "@/content/types";

export const MODULES_A: Module[] = [
  {
    id: "human",
    num: "01",
    title: "The human layer",
    summary: "The attacks that reach a person are built from ordinary reflexes. The control is a pause, not a personality.",
  },
  {
    id: "phish",
    num: "02",
    title: "Phishing and impersonation",
    summary: "Read the address, then the real destination. Familiar names and calm tone are not proof.",
  },
  {
    id: "cred",
    num: "03",
    title: "Credentials and access",
    summary: "Length, uniqueness, and a second factor that you never read aloud.",
  },
  {
    id: "mal",
    num: "04",
    title: "Malware and the click",
    summary: "What arrives, what ransomware wants, and the first minutes after a mistake.",
  },
];

export const LESSONS_A: Lesson[] = [
  {
    id: "human-pause",
    moduleId: "human",
    title: "The job is the pause",
    minutes: 5,
    fieldRule: "If it is hard to undo, it does not happen on the first ask.",
    sections: [
      {
        heading: "What still gets through",
        paragraphs: [
          "Filters remove bulk noise. A message that reaches you has already been shaped to look like work: a vendor, a manager, a system you use. The dangerous part is rarely a cartoon spelling error. It is a request that is expensive to undo.",
        ],
      },
      {
        heading: "A procedure, not a vibe",
        paragraphs: [
          "Awareness is the step tools cannot take. Notice that money, data, credentials, or access is about to move. Slow down. Confirm identity on a channel you chose, not one the requester just handed you.",
        ],
      },
      {
        heading: "Reporting is the success path",
        paragraphs: [
          "People act because the message was designed to produce that action. If you clicked, the useful move is an early report. Quiet embarrassment is how a small mistake becomes a long incident. Harbor Security would rather have a partial story now than a perfect one after lunch.",
        ],
      },
    ],
    questions: [
      {
        id: "human-pause-q1",
        prompt: "The practical point of this training is to",
        choices: [
          "Rank people by how careful they seem",
          "Put a human check on requests tools cannot judge",
          "Replace email filters and multi-factor authentication",
          "Make you inspect every header on every message",
        ],
        answer: 1,
        why: "Filters reduce volume. Whether a real-looking request should be obeyed is a judgment, and it needs a procedure.",
      },
      {
        id: "human-pause-q2",
        prompt: "Which moment deserves the pause?",
        choices: [
          "A newsletter you already receive",
          "A request to pay, share data, reset access, or read a code",
          "A calendar hold from a teammate you expect",
          "Locking your screen before you step away",
        ],
        answer: 1,
        why: "The pause belongs on actions that move money, data, or trust. Routine reading does not need a ceremony.",
      },
      {
        id: "human-pause-q3",
        prompt: "A teammate says they typed a password into a fake page. You should",
        choices: [
          "Tell them they failed a basic test",
          "Thank them and get the report to security immediately",
          "Keep it inside the team so the story does not spread",
          "Have them retry that password on the real site",
        ],
        answer: 1,
        why: "Early reporting cuts the time an attacker can use the secret. Retrying it can spread the compromise onto another device.",
      },
    ],
  },
  {
    id: "human-levers",
    moduleId: "human",
    title: "Name the pressure",
    minutes: 5,
    fieldRule: "Name the lever. Named pressure is weaker pressure.",
    sections: [
      {
        heading: "Six levers",
        paragraphs: [
          "Most social engineering pulls urgency, authority, fear, curiosity, reward, or helpfulness. The story changes. The lever does not. The CEO is boarding. Your mailbox will close. A customer is stuck and only you can fix it.",
        ],
      },
      {
        heading: "Harbor, on a normal Tuesday",
        paragraphs: [
          "A lookalike of Elena Voss asks for gift cards before a client dinner. That is authority, urgency, and secrecy together. A text about a package fee is curiosity plus a small payment. A coworker asking you to approve something just this once is helpfulness. Naming the lever makes the request inspectable.",
        ],
      },
      {
        heading: "Pressure is not evidence",
        paragraphs: [
          "A deadline can be real and the sender still wrong. Real Harbor work survives a short confirmation. Fraud often cannot, which is why the script tells you not to loop in Accounting, and not to hang up and call a number you looked up yourself.",
        ],
      },
    ],
    questions: [
      {
        id: "human-levers-q1",
        prompt: "“Do not tell Accounting. I am boarding. Send the wire.” is mainly",
        choices: [
          "A routine network notice",
          "Authority, urgency, and secrecy together",
          "A patch reminder",
          "Dual control working as designed",
        ],
        answer: 1,
        why: "Rank, a clock, and a request to skip the people who would notice. That is a classic payment-fraud script, even when the details feel specific.",
      },
      {
        id: "human-levers-q2",
        prompt: "Helpfulness becomes the risk when you",
        choices: [
          "Like the people you work with",
          "Skip a control to unstick someone",
          "File a ticket",
          "Ask the requester to use the normal queue",
        ],
        answer: 1,
        why: "Attackers ask for the exception, not the process. The useful act is to put them on the real path.",
      },
      {
        id: "human-levers-q3",
        prompt: "A real deadline means you should",
        choices: [
          "Skip confirmation because delay has a cost",
          "Confirm on a channel you chose, then move quickly",
          "Wait until the next week no matter what",
          "Forward the request to as many people as possible",
        ],
        answer: 1,
        why: "Confirmation is the control. Speed comes after the identity and the request are real. A crowd is not a verification.",
      },
    ],
  },
  {
    id: "human-pretext",
    moduleId: "human",
    title: "Familiar is not authentication",
    minutes: 6,
    fieldRule: "Familiar details are research. They are not a credential.",
    sections: [
      {
        heading: "Pretext is a story",
        paragraphs: [
          "A pretext is the scene that makes a strange request feel due. Attackers read the site, job posts, out-of-office notes, and vendor names. They will know the CFO's name. That knowledge is cheap.",
        ],
      },
      {
        heading: "Details you did not give them",
        paragraphs: [
          "“I saw you on the Q3 lane review” can be true because a calendar invite leaked, or because a mailbox is already taken. Recognition should raise your care, not lower it. A correct project name does not authenticate the sender.",
        ],
      },
      {
        heading: "What actually checks a person",
        paragraphs: [
          "For a payment change, use the callback number on an invoice you already paid, not the signature of the email you are doubting. For access, use the ticket queue. For an executive, use the directory number you already had, not the video in front of you.",
        ],
      },
    ],
    questions: [
      {
        id: "human-pretext-q1",
        prompt: "An email mentions your real project and your manager. That proves",
        choices: [
          "The sender is your manager",
          "The sender did basic research, or already has a mailbox",
          "The link is safe to open",
          "The request can skip approval",
        ],
        answer: 1,
        why: "True context is inexpensive. It is a reason to slow down, not a login.",
      },
      {
        id: "human-pretext-q2",
        prompt: "A known vendor asks to change a bank account. The number you trust is",
        choices: [
          "The phone in this email's signature",
          "The number on a prior invoice you look up yourself",
          "The first number suggested in a side chat",
          "A mobile number they text five minutes later",
        ],
        answer: 1,
        why: "The message that creates the change does not get to supply the proof. You use a record that predates the request.",
      },
      {
        id: "human-pretext-q3",
        prompt: "Which is the strongest check of a person, for a payment?",
        choices: [
          "They know the CEO's name",
          "Their voice sounds right on a call you did not place",
          "They answer the directory number you dialed, and the payment still uses the normal control",
          "The display name matches",
        ],
        answer: 2,
        why: "You start the channel. Even then, money follows the written procedure, because a real person can be rushed too.",
      },
    ],
  },
  {
    id: "phish-anatomy",
    moduleId: "phish",
    title: "The address, not the name",
    minutes: 6,
    fieldRule: "Read the address, then read where the link actually goes.",
    sections: [
      {
        heading: "The display name is a costume",
        paragraphs: [
          "The name Elena Voss or Microsoft 365 is typed by the sender. The address beside it is the part worth reading. harborandco.com is the company. harborandco-exec.com is a different site anyone can register.",
        ],
      },
      {
        heading: "The link or the file is the action",
        paragraphs: [
          "The sentence can be polite and the link still wrong. Read the destination, not the blue text. Unexpected attachments — especially documents that say enable content, and HTML files that look like a login — stay closed until the sender confirms on another channel.",
        ],
      },
      {
        heading: "Tone is a hint",
        paragraphs: [
          "Threats, secrecy, and gift cards are loud. Quiet phishing exists too: a document share, a payroll change, a reply on a real thread from a mailbox that is no longer only theirs. You still read the address, and you still match the request to the procedure for that kind of ask.",
        ],
      },
    ],
    questions: [
      {
        id: "phish-anatomy-q1",
        prompt: "The display name on an email",
        choices: [
          "Is verified by the mail provider",
          "Is chosen by the sender and can say anything",
          "Always matches the address",
          "Is safe when it shows a coworker",
        ],
        answer: 1,
        why: "Nothing cryptographic sits behind the friendly name. The address, and then the request, do the work.",
      },
      {
        id: "phish-anatomy-q2",
        prompt: "An unexpected spreadsheet says “Enable content to view.” You",
        choices: [
          "Open it, because that is normal encryption",
          "Stop, and confirm with the sender on another channel before enabling anything",
          "Trust it if the icon looks like a spreadsheet",
          "Open it on a personal laptop instead",
        ],
        answer: 1,
        why: "That prompt is how malicious content has asked for years. A different laptop is not a control if you then sign in.",
      },
      {
        id: "phish-anatomy-q3",
        prompt: "A quiet message with no threats and a real project name",
        choices: [
          "Can be treated as obviously safe",
          "Can still be wrong if the address or the request is off",
          "Is safe whenever it came from inside the company",
          "Does not need the link checked",
        ],
        answer: 1,
        why: "A careful lure, or a stolen mailbox, does not shout. The procedure still applies.",
      },
    ],
  },
  {
    id: "phish-hosts",
    moduleId: "phish",
    title: "The host is the whole game",
    minutes: 6,
    fieldRule: "Trust the company name you already know. Anything glued on is a different site.",
    sections: [
      {
        heading: "Where the name actually ends",
        paragraphs: [
          "The site you mean is a name plus its real ending: harborandco.com. A subdomain Harbor owns can still be Harbor. Words after .com are someone else's site. harborandco.com.login-renew.net is login-renew.net, wearing Harbor as a costume on the left.",
        ],
      },
      {
        heading: "Cousins and lookalikes",
        paragraphs: [
          "harborandco-secure.com, a misspelling, and a Harbor name that swaps in a letter from another alphabet are different registrations. On a phone there is often no hover. The habit is to find the host before you tap, which is why the link lab shows the real target instead of hiding it.",
        ],
      },
      {
        heading: "Short links and QR codes",
        paragraphs: [
          "A shortener and a QR code are a link you have not read. If you cannot see the host, you do not have enough to trust it. A padlock only means the connection to that site is encrypted. It does not mean the site is the one you meant.",
        ],
      },
    ],
    questions: [
      {
        id: "phish-hosts-q1",
        prompt: "Which host is Harbor's site?",
        choices: [
          "harborandco.com.payroll-update.net",
          "harborandco-secure.com",
          "harborandco.com",
          "login.harborandco.com.attacker.example",
        ],
        answer: 2,
        why: "The real name ends at harborandco.com. Labels to the right are the actual site. A hyphenated cousin is a different registration.",
      },
      {
        id: "phish-hosts-q2",
        prompt: "A QR code on a parking flyer in the lobby",
        choices: [
          "Is safe because it is printed",
          "Is a link. Read the host before you open it, and do not sign in if you cannot",
          "Can be trusted when the logo looks right",
          "Is only a risk on personal phones",
        ],
        answer: 1,
        why: "Paper does not authenticate a URL. The code can point at a fake badge or sign-in page.",
      },
      {
        id: "phish-hosts-q3",
        prompt: "The blue text says https://portal.office.com and the target is a different site. You",
        choices: [
          "Trust the blue text, because that is what people see",
          "Treat it as a mismatch and do not enter credentials",
          "Continue if the page shows a lock icon",
          "Forward it so the team can each try",
        ],
        answer: 1,
        why: "Visible text is not the destination. A lock icon only encrypts the trip to whatever site that is.",
      },
    ],
  },
  {
    id: "phish-channels",
    moduleId: "phish",
    title: "Not only the inbox",
    minutes: 6,
    fieldRule: "Call back on a number you looked up. Never on the number the urgent message provided.",
    sections: [
      {
        heading: "Text, voice, and chat",
        paragraphs: [
          "Smishing is phishing by text. Vishing is a phone call. The same levers show up, with less room to inspect an address. Caller ID is chosen by the caller often enough that “Harbor IT” on the screen is not Harbor IT.",
        ],
      },
      {
        heading: "The callback trap",
        paragraphs: [
          "A message says the account is locked and gives a number to call. That number belongs to the person who wrote the message. Look up IT, the bank, or the vendor yourself: the directory, the back of the card, or a bookmark. Then you talk.",
        ],
      },
      {
        heading: "The second call",
        paragraphs: [
          "A common follow-up pretends to be the rescue. “We saw the fake call. Give us the password so we can lock the account.” You did not dial them. They do not get secrets. You call the published number, and you report both attempts.",
        ],
      },
    ],
    questions: [
      {
        id: "phish-channels-q1",
        prompt: "Caller ID shows Harbor IT. That means",
        choices: [
          "The phone system authenticated an employee",
          "Very little. You still use a number you looked up",
          "You should read the code if they are polite",
          "The call is a test you pass by complying",
        ],
        answer: 1,
        why: "A name on a phone is not the directory. The directory is the thing you dial.",
      },
      {
        id: "phish-channels-q2",
        prompt: "A text says your card is frozen and to call the number in the text. You",
        choices: [
          "Call it immediately to save the card",
          "Use the number on the card or in the official app",
          "Reply with the card number so they can verify you",
          "Forward the text and ask coworkers what they think",
        ],
        answer: 1,
        why: "The channel that announced the emergency does not get to choose the rescue number.",
      },
      {
        id: "phish-channels-q3",
        prompt: "After you refuse a fake IT caller, someone else calls to “finish the lockdown” and asks for your password. You",
        choices: [
          "Cooperate, because they knew about the first call",
          "Refuse, dial the published IT number yourself, and report both calls",
          "Give a password you do not use for work",
          "Change the password on a link they text you",
        ],
        answer: 1,
        why: "Knowing about the first call is part of the script. A link they send is their site.",
      },
    ],
  },
  {
    id: "cred-length",
    moduleId: "cred",
    title: "Secrets you can actually remember",
    minutes: 6,
    fieldRule: "Length and uniqueness beat clever substitutions.",
    sections: [
      {
        heading: "What modern guidance actually says",
        paragraphs: [
          "Current password guidance, including NIST SP 800-63B, prefers length over composition theater. Forcing Summer2026! and rotating it every month trains people to make small, predictable edits. A long secret you do not reuse is stronger than a short one with a symbol.",
        ],
      },
      {
        heading: "A passphrase is a pattern, not a proverb",
        paragraphs: [
          "Several unrelated words, plus something random, is a sound shape. The famous comic sentence is now on attacker lists, so that particular string is burned. A line from a song, the company name plus the year, or a family's names are guesses, not secrets.",
        ],
      },
      {
        heading: "Let a generator do it",
        paragraphs: [
          "The company password manager can invent a long random secret and remember it. You remember one strong vault passphrase. Everything else can be impossible to type from memory, which is a feature. Dry Run Cyber never stores what you type in the forge.",
        ],
      },
    ],
    questions: [
      {
        id: "cred-length-q1",
        prompt: "Which secret is the better work password, if it is unique?",
        choices: [
          "Harbor2026!",
          "A 20-character string from the password manager",
          "The CFO's name and a year",
          "The same phrase you use on three other sites, but longer",
        ],
        answer: 1,
        why: "Random length from a manager beats a predictable pattern. Reuse throws the length away the moment any one site is breached.",
      },
      {
        id: "cred-length-q2",
        prompt: "Scheduled password changes every 30 days are",
        choices: [
          "Still the primary control NIST recommends",
          "Mostly outdated, unless there is a reason to think the secret leaked",
          "Required because attackers wait 31 days",
          "A substitute for multi-factor authentication",
        ],
        answer: 1,
        why: "Change a secret when it may be compromised, not because the calendar turned. Forced rotation creates predictable variants.",
      },
      {
        id: "cred-length-q3",
        prompt: "“correct horse battery staple” is a poor choice now because",
        choices: [
          "Spaces are not allowed anywhere",
          "The idea of several words is wrong",
          "That exact example is famous and will be in wordlists",
          "Four words can never be enough",
        ],
        answer: 2,
        why: "The pattern can be sound. This particular sentence has been copied for years, so it is no longer secret.",
      },
    ],
  },
  {
    id: "cred-reuse",
    moduleId: "cred",
    title: "One breach should not be every account",
    minutes: 5,
    fieldRule: "If a site is breached, only that site's password should die.",
    sections: [
      {
        heading: "Reuse is the multiplier",
        paragraphs: [
          "Credential stuffing is trying stolen passwords from one site on many others. If your work email password is also your forum password from 2019, their breach becomes Harbor's problem. Uniqueness contains the blast.",
        ],
      },
      {
        heading: "The manager is the program",
        paragraphs: [
          "A password manager is a vault plus a generator. Work secrets stay in the work vault. Personal sites stay in a personal one. The browser's casual “save password” on a shared or borrowed machine is not that program.",
        ],
      },
      {
        heading: "What to do when a site notifies you",
        paragraphs: [
          "Change that site's password from a device you trust, and anywhere else you reused it, starting with email and single sign-on. Turn on the strongest second factor that service offers. You do not need to invent a story. You need to stop the reuse.",
        ],
      },
    ],
    questions: [
      {
        id: "cred-reuse-q1",
        prompt: "Credential stuffing works because",
        choices: [
          "Firewalls remember old passwords",
          "People reuse secrets, so one breach opens other sites",
          "Multi-factor codes last for a year",
          "Display names can be edited",
        ],
        answer: 1,
        why: "Attackers do not need to guess if a password from another dump still fits.",
      },
      {
        id: "cred-reuse-q2",
        prompt: "A reasonable split of vaults is",
        choices: [
          "One password for everything, stored in notes",
          "Work secrets in the work manager, personal sites in a personal one",
          "Work passwords saved in a personal browser on a shared laptop",
          "The same manager passphrase as your email password",
        ],
        answer: 1,
        why: "Separation means a personal breach is not automatically a company one, and a shared machine is not your vault.",
      },
      {
        id: "cred-reuse-q3",
        prompt: "A site you use tells you its passwords leaked. First you",
        choices: [
          "Wait to see if anyone logs in",
          "Change that password and any place you reused it, especially email and SSO",
          "Only add a symbol to the end",
          "Post the notice in a public chat with your username",
        ],
        answer: 1,
        why: "Email and single sign-on are the keys to everything else. A tiny edit of a leaked password is still a guess.",
      },
    ],
  },
  {
    id: "cred-mfa",
    moduleId: "cred",
    title: "The second factor is not a favor",
    minutes: 6,
    fieldRule: "Never read a code or tap Approve because a caller is waiting.",
    sections: [
      {
        heading: "Not all second factors are equal",
        paragraphs: [
          "A texted code is better than a password alone, and it can still be fished: you type it into a fake page, or a SIM is taken over. An app code has the same “you typed it into their site” problem. A push prompt can be worn down by fatigue until someone taps yes.",
        ],
      },
      {
        heading: "Phishing-resistant means the site name is bound in",
        paragraphs: [
          "Passkeys and hardware security keys check the real site as part of the cryptography. A lookalike page cannot replay that login the way it can replay a six-digit code. When Harbor offers them, use them for email and SSO first.",
        ],
      },
      {
        heading: "The wait is the attack",
        paragraphs: [
          "No caller, coworker, or “vendor at my desk” gets a live code or an approval. Unexpected prompts get denied and reported. If you did approve one you do not recognize, treat it like a password you typed into the wrong page: report it now.",
        ],
      },
    ],
    questions: [
      {
        id: "cred-mfa-q1",
        prompt: "Someone on the phone asks for the six-digit code that just arrived. You",
        choices: [
          "Read it if caller ID looks internal",
          "Refuse. Codes and approvals are never read to a caller",
          "Read it, then change your password later",
          "Send it in chat instead of saying it",
        ],
        answer: 1,
        why: "The code is the login. Handing it over is handing over the session. The urgency is the technique.",
      },
      {
        id: "cred-mfa-q2",
        prompt: "Repeated approval prompts you did not start are",
        choices: [
          "A glitch to clear by tapping yes once",
          "MFA fatigue. Deny them and report",
          "Proof that IT is doing maintenance",
          "Safe if the app logo looks right",
        ],
        answer: 1,
        why: "The attack is the repetition. Approving to make it stop is the failure mode.",
      },
      {
        id: "cred-mfa-q3",
        prompt: "A passkey is harder to phish than a texted code because",
        choices: [
          "It is shorter",
          "The login is bound to the real site, so a fake page cannot use it",
          "It is sent from Harbor's mail server",
          "It replaces the need to report incidents",
        ],
        answer: 1,
        why: "Phishing-resistant factors do not produce a code you can be talked into pasting on the wrong host.",
      },
    ],
  },
  {
    id: "mal-arrival",
    moduleId: "mal",
    title: "How it arrives",
    minutes: 5,
    fieldRule: "Unexpected attachments stay closed until the sender confirms on another channel.",
    sections: [
      {
        heading: "Ordinary doors",
        paragraphs: [
          "Malware still arrives as attachments, fake installers, “updates” that pop into the browser, cracked software, and USBs. The useful question is not whether you are clever. It is whether you expected this file, from this person, by this path.",
        ],
      },
      {
        heading: "Enable content, and HTML that looks like a login",
        paragraphs: [
          "Documents that will not show until you enable content are asking to run something. An HTML attachment can be a whole fake sign-in page sitting in your downloads. Neither is a normal way for Harbor to send a form.",
        ],
      },
      {
        heading: "Installers only from the place you already use",
        paragraphs: [
          "Updates come from the company portal, the operating system, or the vendor site you looked up. A popup that arrived to warn you is not that place. If a tool you need is blocked, the path is a ticket, not a personal download of a “cleaner.”",
        ],
      },
    ],
    questions: [
      {
        id: "mal-arrival-q1",
        prompt: "Which file deserves a stop?",
        choices: [
          "A document you asked Sara for, from her Harbor address, that you were waiting on",
          "An unexpected invoice that only displays after you enable content",
          "A handbook already on the intranet",
          "A calendar file from a meeting you scheduled",
        ],
        answer: 1,
        why: "Unexpected plus “enable content” is a classic execution ask. Expected files from the real person are a different case.",
      },
      {
        id: "mal-arrival-q2",
        prompt: "A browser popup says your codec is out of date and offers a download. You",
        choices: [
          "Install it so the meeting works",
          "Close it and update only through the system or the company portal",
          "Install it on a personal computer and then join from there with your work account",
          "Forward the popup to the team",
        ],
        answer: 1,
        why: "The warning that brought its own installer is not your update channel. Signing in afterward from another machine still exposes the account.",
      },
      {
        id: "mal-arrival-q3",
        prompt: "An HTML attachment named Secure-Message.html is",
        choices: [
          "Safer than a document because it is just text",
          "Often a fake page. Do not open it to “see what it says”",
          "Required for encrypted Harbor mail",
          "Fine if you open it offline",
        ],
        answer: 1,
        why: "HTML files render as pages, including password forms. Offline does not make a fake form honest.",
      },
    ],
  },
  {
    id: "mal-ransom",
    moduleId: "mal",
    title: "Ransomware is a business",
    minutes: 5,
    fieldRule: "After a suspected infection, your job is containment and a call, not heroics.",
    sections: [
      {
        heading: "What they want",
        paragraphs: [
          "Modern ransomware often steals copies and encrypts what it can, then asks to be paid to unlock and to stay quiet. That is double extortion. It is aimed at the organization, not at your willingness to be brave at your desk.",
        ],
      },
      {
        heading: "You do not decide to pay",
        paragraphs: [
          "Paying, negotiating, and talking to the criminal are not individual decisions. They can be illegal, useless, or both, and they interfere with the response. You also do not wipe the laptop to be helpful. Evidence and a clean containment plan belong to the people who do this on purpose.",
        ],
      },
      {
        heading: "Contain, then the published number",
        paragraphs: [
          "If the machine is acting on its own — files renaming, a ransom note, a drive you do not recognize encrypting — disconnect it from the network and Wi-Fi if you can do that quickly, and call the incident line. Do not start a private investigation. Do not announce “we are hacked” to customers.",
        ],
      },
    ],
    questions: [
      {
        id: "mal-ransom-q1",
        prompt: "Double extortion means the attacker",
        choices: [
          "Asks two employees for the same password",
          "Both locks systems and steals data, then threatens to publish",
          "Sends two copies of the same phish",
          "Requires two factors from the victim",
        ],
        answer: 1,
        why: "Encryption plus theft is why “we have backups” is not the whole incident. The copies are the second lever.",
      },
      {
        id: "mal-ransom-q2",
        prompt: "A ransom note appears on your work laptop. You",
        choices: [
          "Pay from a personal account so the company is not involved",
          "Disconnect from the network if you can, call the incident line, and do not wipe the machine",
          "Reboot repeatedly until the note leaves",
          "Email the address on the note and ask for proof",
        ],
        answer: 1,
        why: "Contain and report. Payment and negotiation are not yours. Wiping can destroy what responders need.",
      },
      {
        id: "mal-ransom-q3",
        prompt: "Telling customers yourself, before the response is coordinated,",
        choices: [
          "Is always faster and therefore better",
          "Can be wrong, unlawful, or chaotic. Let the incident owners speak",
          "Is required by the ransom note",
          "Replaces the need to call security",
        ],
        answer: 1,
        why: "Public statements have legal and operational consequences. Your job is the internal report, not the press release.",
      },
    ],
  },
  {
    id: "mal-clicked",
    moduleId: "mal",
    title: "You already clicked",
    minutes: 6,
    fieldRule: "The speed of the report matters more than a perfect retelling.",
    sections: [
      {
        heading: "Stop adding fuel",
        paragraphs: [
          "If you entered a password or approved a prompt on a page you reached from a message, do not “test” that password on the real site from the same machine. Do not delete the only copy of the evidence first. Do not forward the message in a way that makes coworkers click it too.",
        ],
      },
      {
        heading: "Who you tell, and from where",
        paragraphs: [
          "Report from a different device if the one you used may be running something: the security address, the Report button, or extension 4400 from a Harbor phone. Say the time, what you clicked, and whether you typed a secret or approved a prompt. Incomplete is allowed.",
        ],
      },
      {
        heading: "Secrets, after that",
        paragraphs: [
          "From a device you trust, change the password you exposed and anywhere it was reused, especially email and single sign-on, and tell security you did. If they ask you to wait so they can watch an account, follow that. Do not freelance a cleanup.",
        ],
      },
    ],
    questions: [
      {
        id: "mal-clicked-q1",
        prompt: "You typed your password into a fake SSO page. The next move is",
        choices: [
          "Try it on the real SSO to see if it still works",
          "Report to security now, ideally from a device you did not use for the click, and say you entered credentials",
          "Delete the email and empty the trash",
          "Reply to the sender and demand they stop",
        ],
        answer: 1,
        why: "The report starts the response. Testing the password can hand it to whatever is on that machine. Deleting the mail hides headers.",
      },
      {
        id: "mal-clicked-q2",
        prompt: "Forwarding the phish to the whole team",
        choices: [
          "Is the standard way to preserve headers",
          "Puts the lure in front of more people, who may click",
          "Replaces a ticket",
          "Proves you did not fall for it",
        ],
        answer: 1,
        why: "Warn through security, not by redistributing the bait. If your client can forward as an attachment to the security mailbox, that keeps headers without a crowd.",
      },
      {
        id: "mal-clicked-q3",
        prompt: "Changing the exposed password is best done",
        choices: [
          "On the same laptop, immediately, while you are still on the suspicious page",
          "From a different trusted device, then tell security",
          "Next month, so you do not tip anyone off",
          "By adding a symbol to the password you just typed",
        ],
        answer: 1,
        why: "The machine that opened the lure is the wrong place to type the new secret. A small edit of the old one will be guessed.",
      },
    ],
  },
];
