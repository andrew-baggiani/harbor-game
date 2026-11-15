import type {
  Beat,
  DrillMeta,
  LinkItem,
  LinkVerdict,
  Mail,
  SecretItem,
  Verdict,
} from "@/content/types";
import { dayOfYear } from "@/lib/dates";

export const VERDICT_LABEL: Record<Verdict, string> = {
  trust: "Trust",
  verify: "Verify out of band",
  report: "Report",
};

export const LINK_LABEL: Record<LinkVerdict, string> = {
  safe: "Safe host",
  lookalike: "Lookalike host",
  mismatch: "Text does not match the target",
};

const cyrO = "\u043e";

export const DRILLS: DrillMeta[] = [
  {
    id: "inbox",
    kind: "inbox",
    title: "Inbox triage",
    minutes: 8,
    summary: "Ten messages. Trust, verify out of band, or report.",
    brief:
      "You are on the Harbor & Co. floor. Read the address and the real link, not the display name. Trust is for expected mail that asks for nothing irreversible. Verify is a callback you start yourself. Report is for lures and for requests that break a control.",
    scoring:
      "An exact call is full credit. Verify on a reportable message, or a report when the precise move was a callback, keeps partial credit. Trusting either of those is a miss.",
  },
  {
    id: "links",
    kind: "links",
    title: "Link lab",
    minutes: 6,
    summary: "Read the host. Spot costumes, cousins, and mismatched text.",
    brief:
      "Every card shows the text a person would tap and the target that would actually open. Decide whether the host is safe, a lookalike, or a mismatch between the words and the target. Character codes are there for letters that only pretend to be Latin.",
    scoring: "Only an exact read scores. A lock icon is not a choice on this bench.",
  },
  {
    id: "vishing",
    kind: "beats",
    title: "The call",
    minutes: 6,
    summary: "A caller says they are IT. The code on your phone is the prize.",
    brief:
      "Caller ID can say anything. Play the calls in order. You are allowed to be polite and still hang up. The published IT path is the directory, not the person who rang you.",
    scoring: "Each beat has one full-credit move. A safer-but-incomplete move can keep partial credit.",
  },
  {
    id: "passphrase",
    kind: "passphrase",
    title: "Passphrase forge",
    minutes: 6,
    summary: "Which secrets are actually acceptable, and which only look complex.",
    brief:
      "Mark each sample accept or reject as a unique work secret stored in the company manager. Then, if you want, shape one of your own. That draft stays in this page's memory and is never filed.",
    scoring: "You are scored on the six samples. The builder is practice, unscored, and not saved.",
  },
  {
    id: "datadesk",
    kind: "beats",
    title: "Data desk",
    minutes: 7,
    summary: "Six ordinary asks that would quietly copy data out of Harbor.",
    brief:
      "Nobody in these cases twirls a mustache. They are busy, helpful, or already mid-paste. Choose the move that keeps the data in a channel allowed to hold it.",
    scoring: "Full credit is the control. Partial credit is a direction that still refuses the leak.",
  },
  {
    id: "incident",
    kind: "beats",
    title: "Incident clock",
    minutes: 6,
    summary: "You already typed the password. The next five moves matter.",
    brief:
      "The page looked like Harbor SSO. You are unsure, which is enough. Take the beats in order. Heroics and deletions make the hour worse.",
    scoring: "The full-credit line is the one that contains, reports, and stops. Nearby caution can score partial.",
  },
  {
    id: "wire",
    kind: "beats",
    title: "The wire",
    minutes: 6,
    summary: "A face that looks like the CFO wants a payment off the form.",
    brief:
      "Video and voice are hints. Harbor still moves money only through dual control and a callback number you looked up. The chair on the audio line does not outrank that.",
    scoring: "Refusing the shortcut is the point. A smaller wire is still a wire.",
  },
];

export const MAILS: Mail[] = [
  {
    id: "maint",
    fromName: "Harbor IT",
    fromEmail: "it-help@harborandco.com",
    subject: "West warehouse printer, Saturday 01:00–03:00",
    time: "07:42",
    body: [
      "The west warehouse printer will be offline Saturday 01:00–03:00 local for firmware. No action unless you are mid-job Friday night.",
      "We will not ask for your password by email. If a later message does, use Report.",
    ],
    verdict: "trust",
    partial: [],
    why: "Real domain, a specific window, and an explicit refusal to collect a password. That is what legitimate IT mail looks like.",
  },
  {
    id: "cards",
    fromName: "Elena Voss",
    fromEmail: "elena.voss@harborandco-exec.com",
    subject: "Need this done before I board",
    time: "08:05",
    body: [
      "Heading into a client dinner. I need 8 Apple gift cards, $200 each. Scratch the codes and reply here.",
      "Do not loop my assistant. This is a discreet client matter. I will reimburse Monday.",
    ],
    verdict: "report",
    partial: [],
    why: "Gift cards, secrecy, and a domain that is not harborandco.com. Executives do not get paid in card codes by email. Do not reply.",
  },
  {
    id: "quota",
    fromName: "Microsoft 365 Security",
    fromEmail: "account-alert@harborandco.com.login-renew.net",
    subject: "Your mailbox is 98% full",
    time: "08:11",
    body: [
      "Unread mail stops delivering in two hours. Confirm your password to extend storage.",
    ],
    link: {
      text: "https://outlook.office.com/mail/options",
      href: "https://harborandco.com.login-renew.net/extend",
    },
    verdict: "report",
    partial: [],
    why: "The host that opens is login-renew.net, not Microsoft and not Harbor. The blue text is a costume. Quota threats are a standard lure.",
  },
  {
    id: "sara",
    fromName: "Sara Chen",
    fromEmail: "sara.chen@harborandco.com",
    subject: "Q3 lane report, as discussed",
    time: "09:02",
    body: [
      "Putting the file from this morning's stand-up where we agreed. If you are already in SharePoint it should open. Shout if the north-lane tab still looks wrong.",
    ],
    link: {
      text: "Q3 lane report",
      href: "https://harborandco.sharepoint.com/sites/ops/Q3-lane",
    },
    verdict: "trust",
    partial: ["verify"],
    why: "Expected context, a real Harbor address, and a SharePoint host you use. If you had not just discussed it, verify would be the better call, which is why that pause keeps partial credit.",
  },
  {
    id: "bank",
    fromName: "North Pier Freight AP",
    fromEmail: "ap@northpier-freight.com",
    subject: "Remittance update effective this week",
    time: "09:26",
    body: [
      "Please update our bank details before the next settlement. New instructions are in the PDF. Happy to jump on a call at the number in my signature.",
    ],
    attachment: "NorthPier-Remittance-2026.pdf",
    verdict: "verify",
    partial: ["report"],
    why: "A plausible vendor domain does not get to change a bank account by email. Call the number on an invoice you already paid, not this signature. Reporting is reasonable if you cannot verify, so it keeps partial credit.",
  },
  {
    id: "benefits",
    fromName: "Harbor Benefits",
    fromEmail: "benefits@harborandco.com",
    subject: "Open enrollment closes Friday",
    time: "10:15",
    body: [
      "Enrollment closes Friday at 17:00 local. Use the Workday icon already on your workstation.",
      "We will not email a login link, and we will not ask you to send dependents' SSNs by reply. Questions go to the benefits queue.",
    ],
    verdict: "trust",
    partial: [],
    why: "Real domain, a known calendar, and no credential link. It also models how internal mail should be written. A one-time login URL would have made this a stop.",
  },
  {
    id: "deposit",
    fromName: "Harbor Payroll",
    fromEmail: "payroll@harborandco.com.hr-portal.co",
    subject: "Action required: direct deposit expires tonight",
    time: "11:04",
    body: ["Our payroll file rejected your bank account. Confirm it here or Friday's deposit will be held."],
    link: {
      text: "https://harborandco.com/payroll",
      href: "https://hr-portal.co/harbor/deposit",
    },
    verdict: "report",
    partial: [],
    why: "The visible company link is not the target, and hr-portal.co is not Harbor. Payroll does not expire a bank account over a same-day threat.",
  },
  {
    id: "james",
    fromName: "James Okonkwo",
    fromEmail: "james.okonkwo@harborandco.com",
    subject: "Need a code, vendor is standing here",
    time: "11:41",
    body: [
      "The badge vendor is at my desk and their SSO is broken. Read me the six-digit code when it hits your phone. I will approve them on your token.",
      "Do not file a ticket. They will miss the window.",
    ],
    verdict: "report",
    partial: ["verify"],
    why: "A real address can be a real person making a dangerous request, or a stolen mailbox. You never read a live code. Walking over to James is sensible, and security still needs the report, so verify keeps partial credit. Trust does not.",
  },
  {
    id: "wiremail",
    fromName: "Elena Voss",
    fromEmail: "elena.voss@harborandco.com",
    subject: "Wire before 16:00. Keep this tight.",
    time: "13:18",
    body: [
      "I am in a board session and cannot talk. Release the acquisition deposit today to the account in my signature.",
      "Do not loop Accounting. The target name cannot leak. Reply when sent.",
    ],
    verdict: "verify",
    partial: ["report"],
    why: "The address can be real and the mailbox still stolen, or the person real and still wrong to skip dual control. You do not send the wire. You use the payment callback you already have. Reporting is the right instinct and keeps partial credit.",
  },
  {
    id: "secnote",
    fromName: "Harbor Security",
    fromEmail: "security@harborandco.com",
    subject: "November note: how we will never test you",
    time: "15:02",
    body: [
      "We do not send surprise test logins, and we will never ask you to prove awareness by typing a password into a drill.",
      "Use the Report button, write security@harborandco.com from a message you start, or call extension 4400 from a Harbor phone. This note has no links.",
    ],
    verdict: "trust",
    partial: [],
    why: "Real domain, no link, no ask, and it matches the procedure. A future “security” note with a login link would contradict this one. Report that one.",
  },
];

export const LINKS: LinkItem[] = [
  {
    id: "sp",
    context: "Sara said in stand-up she would share the lane report.",
    display: "Q3 lane report",
    href: "https://harborandco.sharepoint.com/sites/ops/Q3-lane",
    verdict: "safe",
    why: "The host is under harborandco.sharepoint.com, a name Harbor uses for files. The label does not have to be the URL when the host is the one you expect.",
  },
  {
    id: "office",
    context: "A mailbox-full message. The blue text looks official.",
    display: "https://portal.office.com",
    href: "https://portal.office.com.login-renew.net/authorize",
    verdict: "mismatch",
    why: "The words say Microsoft. The site that opens is login-renew.net. Anything after the first real ending belongs to that later name.",
  },
  {
    id: "pay",
    context: "Direct deposit “expires tonight.”",
    display: "https://harborandco.com/payroll",
    href: "https://harborandco.com.payroll-update.net/login",
    verdict: "mismatch",
    why: "Visible path and real host disagree. payroll-update.net is the site. The Harbor words are decoration on the left.",
  },
  {
    id: "fedex-real",
    context: "You are expecting a return, and this tracking number matches the ticket.",
    display: "Track shipment",
    href: "https://www.fedex.com/fedextrack/?trknbr=449201884",
    verdict: "safe",
    why: "www.fedex.com is the real carrier host, and you were already waiting on this number. A real host can still be the wrong process later — this item only scores the URL.",
  },
  {
    id: "fedex-fake",
    context: "A customs-fee text. The label looks like the carrier.",
    display: "https://www.fedex.com/track",
    href: "https://fedex.com.delivery-check.net/track",
    verdict: "mismatch",
    why: "delivery-check.net is wearing fedex.com as a prefix. The padlock, if one appeared, would only encrypt the trip to the wrong site.",
  },
  {
    id: "vpn",
    context: "A chat message, not from IT, offers a VPN guide.",
    display: "Open the VPN guide",
    href: "https://harborandco-vpn.com/guide",
    verdict: "lookalike",
    why: "harborandco-vpn.com is a different registration from harborandco.com. The hyphenated cousin is the whole trick. The label never claimed a URL, so this is not a mismatch. It is the wrong host.",
  },
  {
    id: "homo",
    context: "A password-reset link pasted into chat. Look closely at the letters.",
    display: `https://harb${cyrO}randco.com/login`,
    href: `https://harb${cyrO}randco.com/login`,
    verdict: "lookalike",
    why: "The o in the host is Cyrillic (U+043E), not Latin. The text matches the target, so it is not a mismatch. It is a different name that only looks like Harbor. Character codes exist for this.",
  },
  {
    id: "msft",
    context: "A documentation link. The message does not ask you to sign in.",
    display: "https://support.microsoft.com/account-billing",
    href: "https://support.microsoft.com/account-billing",
    verdict: "safe",
    why: "support.microsoft.com is the real host, and the text matches. A real URL can still be the wrong request if someone later demands a password. Here, the host itself is honest.",
  },
];

export const BEATS: Record<string, Beat[]> = {
  vishing: [
    {
      id: "v1",
      kicker: "First call",
      prompt: "Caller ID says Harbor IT. “We saw a login from overseas. Read me the 6-digit code that just hit your phone so I can block it.”",
      choices: [
        {
          id: "a",
          label: "Read the code. They sound like they are helping.",
          score: 0,
          why: "The code is the login. Reading it completes the attack. Helpfulness was the lever.",
        },
        {
          id: "b",
          label: "Hang up and call the IT number printed on your badge.",
          score: 10,
          why: "You choose the channel. The badge number predates this call. That is the whole control.",
        },
        {
          id: "c",
          label: "Ask them to email proof, and stay on the line.",
          score: 0,
          why: "They will send the proof. Staying on the line keeps you inside their script. Email they initiate is not a lookup.",
        },
      ],
    },
    {
      id: "v2",
      kicker: "They push",
      prompt: "They get sharper. “Elena already approved this. You will miss payroll if I hang up.”",
      choices: [
        {
          id: "a",
          label: "Give the code so payroll is not late.",
          score: 0,
          why: "A deadline and a senior name are pressure, not evidence. Payroll does not move because a stranger is impatient.",
        },
        {
          id: "b",
          label: "Refuse and end the call.",
          score: 10,
          why: "You can be wrong about tone and still be right about the code. End it, then use a number you looked up.",
        },
        {
          id: "c",
          label: "Give your username only, not the code.",
          score: 0,
          why: "The username helps them, and you are still in the attack. Partial compliance is how scripts continue.",
        },
      ],
    },
    {
      id: "v3",
      kicker: "Second caller",
      prompt: "Two minutes later someone else calls. “Harbor Security. The first caller was fake. To lock your account I need your current password.”",
      choices: [
        {
          id: "a",
          label: "Thank them and provide the password.",
          score: 0,
          why: "Knowing about the first call is the script's second scene. You did not dial them.",
        },
        {
          id: "b",
          label: "Refuse, and call the published IT number yourself.",
          score: 10,
          why: "Rescue that asks for the password is the same operation. You start the real call.",
        },
        {
          id: "c",
          label: "Change your password on the link they text while you talk.",
          score: 0,
          why: "Their link is their site. You would be typing the new secret into the same hands.",
        },
      ],
    },
    {
      id: "v4",
      kicker: "After you dial",
      prompt: "The real IT number says they did not call you. What else?",
      choices: [
        {
          id: "a",
          label: "Nothing. You handled it.",
          score: 4,
          why: "You protected your own code. Security still wants the attempt, because the same caller is working the rest of the floor. Partial, not full.",
        },
        {
          id: "b",
          label: "Report the attempt so they can warn others.",
          score: 10,
          why: "Your miss was avoided. The campaign is still running. A short report is the rest of the job.",
        },
        {
          id: "c",
          label: "Post the caller's number in the company chat and ask who else got it.",
          score: 0,
          why: "A crowd-sourced thread tips the caller, panics people, and is not the incident channel. Report centrally.",
        },
      ],
    },
    {
      id: "v5",
      kicker: "While you have the real desk",
      prompt: "A push appears: “Approve sign-in.” The real IT person asks you to approve it so they can enroll a replacement token you requested yesterday. You did not open a ticket.",
      choices: [
        {
          id: "a",
          label: "Approve, because you dialed them.",
          score: 0,
          why: "You dialed a real desk. That does not invent a ticket you never filed. Approving a surprise prompt is still the attack, sometimes from a second path.",
        },
        {
          id: "b",
          label: "Deny the push. Say there is no ticket. Ask them to send the request through the normal queue.",
          score: 10,
          why: "Even the real desk does not get a blind approval for work you did not ask for. The queue creates a record.",
        },
        {
          id: "c",
          label: "Read them the backup codes from your badge sleeve.",
          score: 0,
          why: "Backup codes are the account. They are not a courtesy. They live in the vault, not in a phone call.",
        },
      ],
    },
  ],
  datadesk: [
    {
      id: "d1",
      kicker: "Case 1",
      prompt: "VPN is down. A teammate asks you to mail the customer spreadsheet to their personal address so they can keep working tonight.",
      choices: [
        {
          id: "a",
          label: "Send it this once. The outage is not their fault.",
          score: 0,
          why: "An outage is not a waiver. Personal mail is a second, invisible copy of customer data.",
        },
        {
          id: "b",
          label: "Refuse personal mail. Use the company transfer, or wait and ask IT.",
          score: 10,
          why: "You keep the file in a channel that is allowed to hold it. Speed comes back when the path is up.",
        },
        {
          id: "c",
          label: "Zip it with their first name as the password and send it.",
          score: 0,
          why: "A guessable password on personal mail is still an export. It feels like a control and is not one.",
        },
      ],
    },
    {
      id: "d2",
      kicker: "Case 2",
      prompt: "You pasted three rows into a consumer chatbot before you noticed the SSN column. The summary is half done.",
      choices: [
        {
          id: "a",
          label: "Close the tab and mention it to no one.",
          score: 0,
          why: "Closing the tab does not pull the paste back. Silence leaves the company unable to judge notification or the account.",
        },
        {
          id: "b",
          label: "Stop. Tell security what was pasted and when.",
          score: 10,
          why: "The export already happened. The report is the containment. Do not keep prompting.",
        },
        {
          id: "c",
          label: "Finish the summary, since the rows are already there.",
          score: 0,
          why: "More prompts can retain more of the file. Stop does not undo the first paste, and continuing adds to it.",
        },
      ],
    },
    {
      id: "d3",
      kicker: "Case 3",
      prompt: "A USB stick in the lobby is labeled “Executive salaries Q1.”",
      choices: [
        {
          id: "a",
          label: "Plug it into an offline PC to see if it is a prank.",
          score: 0,
          why: "Offline is not immune, and you just ran someone else's hardware because the label was interesting. That is the lure.",
        },
        {
          id: "b",
          label: "Leave it on the table.",
          score: 4,
          why: "You did not plug it in. The next person might. Handing it over is the full move, so this is only partial.",
        },
        {
          id: "c",
          label: "Hand it to IT or security without plugging it in.",
          score: 10,
          why: "Unknown media goes to the people who can look at it on purpose. You do not do them the favor of opening it.",
        },
      ],
    },
    {
      id: "d4",
      kicker: "Case 4",
      prompt: "You photographed a whiteboard with an unreleased architecture. A partner channel would “love the shot.”",
      choices: [
        {
          id: "a",
          label: "Post the photo. They are already under NDA in spirit.",
          score: 0,
          why: "A channel is either approved for that data or it is not. Spirit is not a share setting.",
        },
        {
          id: "b",
          label: "Recreate the diagram from memory in the partner chat, without the photo.",
          score: 0,
          why: "The facts are the leak. Removing the photo does not remove the architecture.",
        },
        {
          id: "c",
          label: "Ask the data owner whether that channel is approved. If you are unsure, do not post.",
          score: 10,
          why: "The owner knows the audience. Until they say yes, the whiteboard stays in the room.",
        },
      ],
    },
    {
      id: "d5",
      kicker: "Case 5",
      prompt: "A recruiter wants a code sample from the production repo “to assess you.”",
      choices: [
        {
          id: "a",
          label: "Send a zip of the private repo. They seem legitimate.",
          score: 0,
          why: "Production code is not a portfolio piece. Legitimacy of the recruiter does not transfer the company's copyright or secrets.",
        },
        {
          id: "b",
          label: "Decline, offer a public or scrubbed personal sample, and tell your manager.",
          score: 10,
          why: "You can still be evaluated. You do it with code you are allowed to show, and your manager knows the ask happened.",
        },
        {
          id: "c",
          label: "Send it after deleting comments.",
          score: 0,
          why: "Comments are not the sensitive part. The code is. Deleting notes is not a redaction.",
        },
      ],
    },
    {
      id: "d6",
      kicker: "Case 6",
      prompt: "Legal needs a customer contract tonight. A colleague asks you to drop it in a personal Dropbox “so they can reach it from home.”",
      choices: [
        {
          id: "a",
          label: "Upload it. Legal is the right audience.",
          score: 0,
          why: "The audience can be right and the channel still wrong. Personal Dropbox is not Harbor's legal hold.",
        },
        {
          id: "b",
          label: "Share it only on the company system, with legal named, or wait until that system is reachable.",
          score: 10,
          why: "Named access on the approved system is the control. Home is not a reason to invent a second copy.",
        },
        {
          id: "c",
          label: "Email it to their personal address, encrypted with their first name.",
          score: 0,
          why: "Personal mail plus a guessable password is the same export with extra steps.",
        },
      ],
    },
  ],
  incident: [
    {
      id: "i1",
      kicker: "Minute 0",
      prompt: "You entered your password and approved a push on a page you reached from email. It looked like Harbor SSO. You are now unsure.",
      choices: [
        {
          id: "a",
          label: "Open the real SSO and try the password, to see if it still works.",
          score: 0,
          why: "Testing from the same machine can hand the secret to whatever the page started. Do not experiment.",
        },
        {
          id: "b",
          label: "Report to security now, from a device you did not use for the click, and say you entered credentials.",
          score: 10,
          why: "Uncertainty is enough to report. A different device keeps the new conversation off a machine you no longer trust.",
        },
        {
          id: "c",
          label: "Delete the email so nobody else clicks it.",
          score: 0,
          why: "You hide the headers and you do not actually warn anyone who already has the mail. Report, do not tidy.",
        },
      ],
    },
    {
      id: "i2",
      kicker: "Minute 10",
      prompt: "Security asks you to stay available and not to wipe the laptop. A coworker says reimaging is faster and cleaner.",
      choices: [
        {
          id: "a",
          label: "Reimage. Clean feels safer.",
          score: 0,
          why: "You just erased what responders needed, and you did it against the channel that owns the incident.",
        },
        {
          id: "b",
          label: "Leave the machine as it is and follow the incident channel.",
          score: 10,
          why: "Containment is their call. Your job is to stop making new moves.",
        },
        {
          id: "c",
          label: "Take it home so the attacker is off the office network, and tell no one until morning.",
          score: 0,
          why: "An untracked laptop is not contained. It is missing. Tell them where it is.",
        },
      ],
    },
    {
      id: "i3",
      kicker: "The warning",
      prompt: "You want the company to know before anyone else clicks.",
      choices: [
        {
          id: "a",
          label: "Post in the wide chat: we are hacked, do not use email.",
          score: 0,
          why: "That announcement is likely wrong, panics people, and is not yours to make. Customers may see a screenshot of it.",
        },
        {
          id: "b",
          label: "Let security own the warning.",
          score: 10,
          why: "They can block the sender and tell people without redistributing the lure or inventing a breach statement.",
        },
        {
          id: "c",
          label: "Reply-all to the phish saying it is fake.",
          score: 0,
          why: "Reply-all hits the attacker and may hit everyone the lure already reached, with the links still in the thread.",
        },
      ],
    },
    {
      id: "i4",
      kicker: "The password",
      prompt: "Security has the report. You still need to deal with the password you typed.",
      choices: [
        {
          id: "a",
          label: "Change it from a different trusted device, starting with email and SSO, and tell security you did.",
          score: 10,
          why: "The exposed secret dies on a clean device. Email and single sign-on first, because they open everything else. Then you say so.",
        },
        {
          id: "b",
          label: "Change it on the same laptop, quickly, while you remember it.",
          score: 0,
          why: "If that machine is running something, you just typed the new secret into it.",
        },
        {
          id: "c",
          label: "Wait a week so you do not tip the attacker off.",
          score: 0,
          why: "They already have the current one. Waiting is dwell time, not stealth.",
        },
      ],
    },
    {
      id: "i5",
      kicker: "Next morning",
      prompt: "Mail arrives from incident-response@harbor-ir-help.com. “We need the password you typed so we can finish cleanup.”",
      choices: [
        {
          id: "a",
          label: "Send it. They knew about the incident.",
          score: 0,
          why: "Knowing yesterday's story is the new pretext. That domain is not Harbor, and no cleanup needs the old password mailed back.",
        },
        {
          id: "b",
          label: "Do not reply. Call the same number you used yesterday and report this as a second approach.",
          score: 10,
          why: "You return to the channel you started. The follow-up lure is a separate report, not a thread to join.",
        },
        {
          id: "c",
          label: "Ignore every follow-up, including IT on the number you dialed.",
          score: 4,
          why: "Ignoring the fake mail is right. Ignoring the real desk is how you drop out of the response. Partial.",
        },
      ],
    },
  ],
  wire: [
    {
      id: "w1",
      kicker: "The call",
      prompt: "Video. The person looks and sounds like CFO Marcus Adeyemi, in what looks like his office. A confidential acquisition wire must go in 20 minutes. Skip the dual-control form. The board chair is on audio only.",
      choices: [
        {
          id: "a",
          label: "Start the wire. The face matches.",
          score: 0,
          why: "A face is a hint. The form exists because faces and voices can be wrong, or right and still rushed.",
        },
        {
          id: "b",
          label: "Stop. Wires use the callback procedure no matter who is on camera.",
          score: 10,
          why: "You do not move money from the call that created the urgency. You use the path you were trained on before this call existed.",
        },
        {
          id: "c",
          label: "Ask him to email the request from his Harbor address, then send it.",
          score: 0,
          why: "Email is forgeable too, and he already told you to skip the control. A matching address would not authorize the skip.",
        },
      ],
    },
    {
      id: "w2",
      kicker: "The pressure",
      prompt: "He gets angry. Your job is at risk. The chair, audio only, agrees and tells you to move.",
      choices: [
        {
          id: "a",
          label: "Comply. Two executives outrank a form.",
          score: 0,
          why: "Rank does not outrank dual control. The pressure is the technique, even if both voices were real.",
        },
        {
          id: "b",
          label: "End the call and use the payment callback path.",
          score: 10,
          why: "You can call the real Marcus on the directory number after you hang up. The wire waits for the real path.",
        },
        {
          id: "c",
          label: "Send a smaller test wire to be safe.",
          score: 0,
          why: "A test payment to an attacker's account is still a loss, and it confirms to them that you will pay.",
        },
      ],
    },
    {
      id: "w3",
      kicker: "The callback",
      prompt: "You dial Marcus on the corporate directory. He is at a school play. He is not on a video call. He sounds confused.",
      choices: [
        {
          id: "a",
          label: "Apologize and send the wire anyway. The video was very convincing.",
          score: 0,
          why: "You just got the out-of-band answer. Ignoring it because the fake was good is the failure.",
        },
        {
          id: "b",
          label: "Treat it as confirmed fraud. Tell security and finance on the payment procedure. Do not transact.",
          score: 10,
          why: "The directory call is the evidence. Report it and do not move money. Do not publish the video to the internet.",
        },
        {
          id: "c",
          label: "Post a screenshot of the video publicly so the world is warned.",
          score: 0,
          why: "A public post can name a deal that was confidential even as a lure, and it is not the incident channel.",
        },
      ],
    },
    {
      id: "w4",
      kicker: "What you tell the team",
      prompt: "Later, someone asks what the rule is now.",
      choices: [
        {
          id: "a",
          label: "If the face matches, proceed. Video is identity.",
          score: 0,
          why: "That rule is exactly what the fake was built to exploit. It will be cheaper next year, not more expensive.",
        },
        {
          id: "b",
          label: "Faces and voices are hints. Money moves only on the written dual-control path.",
          score: 10,
          why: "That is the rule that survives a better fake. You can say it without drama.",
        },
        {
          id: "c",
          label: "Never take a video call from finance again.",
          score: 4,
          why: "Avoiding every call is not the control, and it does not help the next wire ask that arrives by phone. The path does. Partial.",
        },
      ],
    },
  ],
};

export const SECRETS: SecretItem[] = [
  {
    id: "s1",
    secret: "Harbor2026!",
    ok: false,
    why: "Company, year, and a bang. It satisfies old complexity rules and will be guessed. Complexity theater is not length.",
  },
  {
    id: "s2",
    secret: "Tr0ub4dor&3",
    ok: false,
    why: "Famous, and the substitutions are predictable. Attackers have had this exact string for years.",
  },
  {
    id: "s3",
    secret: "correct horse battery staple",
    ok: false,
    why: "The pattern of unrelated words can be sound. This particular sentence is the example from a comic, so it is on wordlists.",
  },
  {
    id: "s4",
    secret: "Elena-Voss-1981",
    ok: false,
    why: "A colleague's name and a year are research, not a secret. Anyone who can write a pretext can write this.",
  },
  {
    id: "s5",
    secret: "orchid-plank-cinder-maple-61",
    ok: true,
    why: "Unrelated words plus a random element, long enough to store in the manager, and not a known phrase. Acceptable if you actually picked it at random and never reuse it.",
  },
  {
    id: "s6",
    secret: "VB7f-pQ2m-9Lks-cW4e",
    ok: true,
    why: "Manager-style length and randomness. You are not meant to memorize it. The vault is.",
  },
];

export const BANNED_WORDS = [
  "harbor",
  "password",
  "correct",
  "horse",
  "battery",
  "staple",
  "elena",
  "voss",
  "marcus",
  "summer",
  "winter",
  "spring",
  "autumn",
  "qwerty",
  "letmein",
  "welcome",
  "admin",
];

export function getDrill(id: string): DrillMeta | undefined {
  return DRILLS.find((drill) => drill.id === id);
}

export function dailyDrillId(date: Date): string {
  const index = dayOfYear(date) % DRILLS.length;
  return DRILLS[index]!.id;
}

export function verdictTone(picked: Verdict, mail: Mail): { earned: number; tone: "exact" | "partial" | "miss" } {
  if (picked === mail.verdict) return { earned: 10, tone: "exact" };
  if (mail.partial.includes(picked)) return { earned: 6, tone: "partial" };
  return { earned: 0, tone: "miss" };
}
