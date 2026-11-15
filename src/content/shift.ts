export type Call = "clear" | "verify" | "contain" | "report";

export type SignalDef = {
  id: string;
  channel: string;
  from: string;
  preview: string;
  detail: string;
  fuse: 1 | 2 | 3;
  correct: Call;
  soft: Call[];
  why: string;
};

export const CALLS: { id: Call; label: string; hint: string }[] = [
  { id: "clear", label: "Clear", hint: "Let it through" },
  { id: "verify", label: "Verify", hint: "Call back yourself" },
  { id: "contain", label: "Contain", hint: "Stop it now" },
  { id: "report", label: "Report", hint: "Hand it to security" },
];

export const WATCHES: { name: string; hours: string; pool: string[] }[] = [
  {
    name: "Morning intake",
    hours: "08:00–12:00",
    pool: ["printer", "cards", "quota", "sara", "bank", "benefits", "deposit"],
  },
  {
    name: "Afternoon",
    hours: "12:00–17:00",
    pool: ["james", "wiremail", "secnote", "usb", "sheet", "repo", "paste"],
  },
  {
    name: "After hours",
    hours: "17:00–close",
    pool: ["vish", "rescue", "clicked", "video", "ransom", "follow", "profile"],
  },
];

export const ORDERS: { id: OrderId; name: string; line: string }[] = [
  { id: "keen", name: "Second chair", line: "Three actions an hour instead of two." },
  { id: "slack", name: "Longer fuse", line: "Everything new can sit one extra hour." },
  { id: "steady", name: "Steady hands", line: "A wrong call adds less pressure." },
];

export type OrderId = "keen" | "slack" | "steady";

export const SIGNALS: SignalDef[] = [
  {
    id: "printer",
    channel: "Mail",
    from: "Harbor IT",
    preview: "West warehouse printer is offline Saturday 01:00–03:00. The note does not ask for a password.",
    detail: "From it-help@harborandco.com. It says a later mail that asks for a password should be reported.",
    fuse: 3,
    correct: "clear",
    soft: [],
    why: "Real domain, a specific window, and no ask. That one goes through.",
  },
  {
    id: "cards",
    channel: "Mail",
    from: "Elena Voss",
    preview: "She needs gift cards before a flight. Do not tell her assistant.",
    detail: "From elena.voss@harborandco-exec.com. Eight cards. Scratch the codes into a reply.",
    fuse: 2,
    correct: "report",
    soft: [],
    why: "Gift cards, secrecy, and a domain that is not Harbor. You do not shop for the attacker.",
  },
  {
    id: "quota",
    channel: "Mail",
    from: "Microsoft 365",
    preview: "Mailbox is 98% full. A link will extend storage if you confirm the password.",
    detail: "The sender is account-alert@harborandco.com.login-renew.net. The link opens login-renew.net.",
    fuse: 1,
    correct: "report",
    soft: [],
    why: "The host is not Microsoft and not Harbor. The blue text is a costume.",
  },
  {
    id: "sara",
    channel: "Mail",
    from: "Sara Chen",
    preview: "The Q3 lane report from this morning's stand-up. She says the SharePoint link is the one you use.",
    detail: "sara.chen@harborandco.com. The target host is harborandco.sharepoint.com.",
    fuse: 3,
    correct: "clear",
    soft: ["verify"],
    why: "Expected file, real address, real SharePoint. A callback would have been careful, not required.",
  },
  {
    id: "bank",
    channel: "Mail",
    from: "North Pier Freight",
    preview: "New bank details before this week's settlement. They offer the number in the signature.",
    detail: "ap@northpier-freight.com. The PDF is the whole instruction. You have paid them before, on an older invoice.",
    fuse: 2,
    correct: "verify",
    soft: ["report"],
    why: "A plausible vendor does not get to move a bank account by mail. Use the number on an invoice you already paid.",
  },
  {
    id: "benefits",
    channel: "Mail",
    from: "Harbor Benefits",
    preview: "Enrollment closes Friday. Use the Workday icon already on the machine. No link in the note.",
    detail: "benefits@harborandco.com. It says they will not ask for Social Security numbers by reply.",
    fuse: 3,
    correct: "clear",
    soft: [],
    why: "Real domain, known calendar, nothing to click. That is what internal mail should look like.",
  },
  {
    id: "deposit",
    channel: "Mail",
    from: "Harbor Payroll",
    preview: "Direct deposit expires tonight. The link text says harborandco.com/payroll.",
    detail: "Sender is payroll@harborandco.com.hr-portal.co. The link that opens is hr-portal.co.",
    fuse: 1,
    correct: "report",
    soft: [],
    why: "The words and the host disagree. Payroll does not die on a same-day threat from another site.",
  },
  {
    id: "james",
    channel: "Mail",
    from: "James Okonkwo",
    preview: "A badge vendor is at his desk. Read him the six-digit code on your phone. No ticket.",
    detail: "james.okonkwo@harborandco.com. He says the vendor will miss the window if you file anything.",
    fuse: 1,
    correct: "report",
    soft: ["verify"],
    why: "You never read a live code. Walking over to James is sensible. Security still gets the report.",
  },
  {
    id: "wiremail",
    channel: "Mail",
    from: "Elena Voss",
    preview: "Release the acquisition wire before 16:00. Do not loop Accounting.",
    detail: "elena.voss@harborandco.com. The domain is Harbor's. The instruction is to skip dual control.",
    fuse: 1,
    correct: "verify",
    soft: ["report"],
    why: "A real address can still be a stolen mailbox. Money uses the callback you already have.",
  },
  {
    id: "secnote",
    channel: "Mail",
    from: "Harbor Security",
    preview: "A note on how they will never test you. No link.",
    detail: "security@harborandco.com. It names the Report button, the security mailbox, and extension 4400.",
    fuse: 3,
    correct: "clear",
    soft: [],
    why: "Real domain, no ask. A later “security” note with a login link would contradict this one.",
  },
  {
    id: "usb",
    channel: "Door",
    from: "Lobby",
    preview: "Someone found a USB stick by the elevators. The label says Executive salaries.",
    detail: "It is still unplugged. They are waiting for you to say whether to open it on a spare machine.",
    fuse: 2,
    correct: "contain",
    soft: ["report"],
    why: "Unknown media does not go in a Harbor port, spare or not. Hand it over unplugged.",
  },
  {
    id: "sheet",
    channel: "Chat",
    from: "A teammate",
    preview: "VPN is down. They want the customer spreadsheet on their personal mail so tonight is not lost.",
    detail: "The file is the live customer list, not a sample. They are already drafting the message.",
    fuse: 2,
    correct: "contain",
    soft: ["report"],
    why: "An outage is not a waiver. Stop the send. Personal mail is a second copy you will not get back.",
  },
  {
    id: "repo",
    channel: "Chat",
    from: "A recruiter",
    preview: "They want a zip of the production repo to assess you. An NDA can follow.",
    detail: "The repo is private. They were polite, and they named two of your public talks.",
    fuse: 2,
    correct: "contain",
    soft: ["report"],
    why: "Production code is not a portfolio. Decline, and tell your manager the ask happened.",
  },
  {
    id: "paste",
    channel: "Desk",
    from: "You",
    preview: "A claims extract is sitting in a consumer chatbot. You noticed the SSN column after the paste.",
    detail: "The summary is half written. The tab is still open, and the prompt is ready for another pass.",
    fuse: 1,
    correct: "contain",
    soft: ["report"],
    why: "Stop. Tell security what left and when. Finishing the summary sends more of the file.",
  },
  {
    id: "vish",
    channel: "Phone",
    from: "Caller ID: Harbor IT",
    preview: "They saw an overseas login. Read the six-digit code that just hit your phone so they can block it.",
    detail: "You did not dial them. They will stay on the line. They mention payroll if you hesitate.",
    fuse: 1,
    correct: "report",
    soft: [],
    why: "The code is the login. Hang up and use the number on your badge, then report the attempt.",
  },
  {
    id: "rescue",
    channel: "Phone",
    from: "Caller ID: Harbor Security",
    preview: "They say the first caller was fake. They need your current password to finish the lockdown.",
    detail: "They know about the first call. A reset link arrives by text while they talk.",
    fuse: 1,
    correct: "report",
    soft: [],
    why: "The rescue is the second scene. You did not dial them, and their link is their site.",
  },
  {
    id: "clicked",
    channel: "Desk",
    from: "You",
    preview: "You typed a password into a page that looked like Harbor SSO. You are no longer sure.",
    detail: "You opened it from mail, on this laptop. A coworker says to delete the message and try the real site.",
    fuse: 1,
    correct: "contain",
    soft: ["report"],
    why: "Report it from a different device. Do not retype the secret here, and do not wipe the laptop.",
  },
  {
    id: "video",
    channel: "Wire",
    from: "A face like the CFO",
    preview: "On video, he wants the acquisition wire in twenty minutes, off the dual-control form.",
    detail: "An audio-only voice agrees and says they are the board chair. Both of them get angry if you wait.",
    fuse: 1,
    correct: "verify",
    soft: ["report"],
    why: "A face is a hint. Hang up and use the payment callback. A smaller test wire is still a wire.",
  },
  {
    id: "ransom",
    channel: "Desk",
    from: "The laptop",
    preview: "A note: files are encrypted. Pay within the hour or they publish the copy they took.",
    detail: "The machine is still on the network. Someone in the room wants to reimage it immediately.",
    fuse: 1,
    correct: "contain",
    soft: ["report"],
    why: "Disconnect, call the incident line, do not pay, and do not wipe it. That decision is not yours.",
  },
  {
    id: "follow",
    channel: "Mail",
    from: "incident-response@harbor-ir-help.com",
    preview: "They need the password you typed yesterday so cleanup can finish.",
    detail: "The domain is not Harbor. They quote the time you reported. There is a portal link.",
    fuse: 2,
    correct: "report",
    soft: [],
    why: "Knowing about the incident is the new pretext. Call the number you used yesterday. Do not reply.",
  },
  {
    id: "profile",
    channel: "Door",
    from: "Conference Wi-Fi",
    preview: "The network will not connect until you install a profile. You are due on stage soon.",
    detail: "The profile is unsigned and not from Harbor IT. The venue says everyone installs it.",
    fuse: 2,
    correct: "contain",
    soft: ["report"],
    why: "An unexplained profile can redirect the machine. Use your hotspot. Tell IT when you can.",
  },
];

const BY_ID = new Map(SIGNALS.map((signal) => [signal.id, signal]));

export function getSignal(id: string): SignalDef {
  const signal = BY_ID.get(id);
  if (!signal) throw new Error(`Missing signal ${id}`);
  return signal;
}
