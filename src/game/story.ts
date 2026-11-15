export type DoorFlag = "held" | "shut";
export type MailFlag = "codes" | "report" | "ignore";
export type PhoneFlag = "code" | "hangup";
export type UsbFlag = "plug" | "it" | "leave";
export type WireFlag = "send" | "call" | "refuse";

export type Flags = {
  door: DoorFlag | null;
  mail: MailFlag | null;
  phone: PhoneFlag | null;
  usb: UsbFlag | null;
  wire: WireFlag | null;
};

export type Beat = "tower" | "door" | "lobby" | "desk" | "phone" | "usb" | "maya" | "down" | "leave" | "done";

export type Talk = {
  who: string;
  role: string;
  text: string;
  choices: { id: string; label: string }[];
};

export const emptyFlags = (): Flags => ({
  door: null,
  mail: null,
  phone: null,
  usb: null,
  wire: null,
});

export function objectiveFor(beat: Beat): string {
  switch (beat) {
    case "tower":
    case "door":
      return "Gold blip. That's the tower door.";
    case "lobby":
      return "Inside. Elevator, fourteenth floor.";
    case "desk":
      return "Your desk is by the glass. Read the mail.";
    case "phone":
      return "Your phone is ringing. Answer it.";
    case "usb":
      return "Break counter. A USB stick is sitting there.";
    case "maya":
      return "Maya from finance is waiting by the elevator.";
    case "down":
      return "Elevator down. Then out.";
    case "leave":
      return "Walk out the front door. The night files itself.";
    case "done":
      return "Monday's over.";
  }
}

export function talkFor(beat: Beat): Talk | null {
  if (beat === "door") {
    return {
      who: "Courier",
      role: "No badge",
      text: "Hold the door? Badge is in the van. I'll be two seconds.",
      choices: [
        { id: "door-hold", label: "Hold it open" },
        { id: "door-shut", label: "The door closes" },
      ],
    };
  }
  return null;
}

export function panelFor(id: string): Talk | null {
  if (id === "mail") {
    return {
      who: "Elena Voss",
      role: "elena.voss@harborandco-exec.com",
      text: "I'm boarding. Buy eight Apple gift cards, two hundred each, and reply with the codes. Don't loop my assistant.",
      choices: [
        { id: "mail-codes", label: "Send the codes" },
        { id: "mail-report", label: "Report the mail" },
        { id: "mail-ignore", label: "Close it" },
      ],
    };
  }
  if (id === "phone") {
    return {
      who: "Caller",
      role: "Says he's Harbor IT",
      text: "We blocked a login from overseas. Read me the six-digit code that just hit your phone.",
      choices: [
        { id: "phone-code", label: "Read the code" },
        { id: "phone-hangup", label: "Hang up" },
      ],
    };
  }
  if (id === "usb") {
    return {
      who: "USB stick",
      role: "Labeled Salary review",
      text: "It's on the break counter, next to an open laptop.",
      choices: [
        { id: "usb-plug", label: "Plug it in" },
        { id: "usb-it", label: "Bag it for IT" },
        { id: "usb-leave", label: "Leave it" },
      ],
    };
  }
  if (id === "maya") {
    return {
      who: "Maya Ruiz",
      role: "Finance",
      text: "Elena says the acquisition wire has to leave now. The form is down. She told me you'd release it.",
      choices: [
        { id: "wire-send", label: "Send the wire" },
        { id: "wire-call", label: "Call Elena on the number we have" },
        { id: "wire-refuse", label: "I don't send wires" },
      ],
    };
  }
  return null;
}

export function barkFor(id: string): { who: string; text: string } {
  switch (id) {
    case "door-hold":
      return { who: "Courier", text: "The doors swing open. He walks in holding a blank card. The reader stays red." };
    case "door-shut":
      return { who: "Courier", text: "The doors stay shut. He puts the card away. Badge yourself on the reader." };
    case "mail-codes":
      return { who: "Mail", text: "Sent. That address is not Harbor." };
    case "mail-report":
      return { who: "Mail", text: "Reported. You didn't buy a thing." };
    case "mail-ignore":
      return { who: "Mail", text: "You left it sitting in the inbox." };
    case "phone-code":
      return { who: "Phone", text: "That code just signed in a new device." };
    case "phone-hangup":
      return { who: "Phone", text: "You hang up. The number on your badge is the one you dial." };
    case "usb-plug":
      return { who: "Laptop", text: "The screen locks. It wants a payment." };
    case "usb-it":
      return { who: "You", text: "You bag it and call IT. Nobody plugs it in." };
    case "usb-leave":
      return { who: "USB stick", text: "It's still on the counter." };
    case "wire-send":
      return { who: "Maya", text: "The payment leaves. Nobody confirmed it was Elena." };
    case "wire-call":
      return { who: "Maya", text: "You call the number finance already had. She didn't order a wire." };
    case "wire-refuse":
      return { who: "Maya", text: "You don't send it. Maya calls Elena herself." };
    default:
      return { who: "Harbor", text: "" };
  }
}

export function nextBeat(id: string): Beat {
  if (id.startsWith("door")) return "lobby";
  if (id.startsWith("mail")) return "phone";
  if (id.startsWith("phone")) return "usb";
  if (id.startsWith("usb")) return "maya";
  if (id.startsWith("wire")) return "down";
  return "tower";
}

export function applyFlag(flags: Flags, id: string): Flags {
  const next = { ...flags };
  if (id === "door-hold") next.door = "held";
  if (id === "door-shut") next.door = "shut";
  if (id === "mail-codes") next.mail = "codes";
  if (id === "mail-report") next.mail = "report";
  if (id === "mail-ignore") next.mail = "ignore";
  if (id === "phone-code") next.phone = "code";
  if (id === "phone-hangup") next.phone = "hangup";
  if (id === "usb-plug") next.usb = "plug";
  if (id === "usb-it") next.usb = "it";
  if (id === "usb-leave") next.usb = "leave";
  if (id === "wire-send") next.wire = "send";
  if (id === "wire-call") next.wire = "call";
  if (id === "wire-refuse") next.wire = "refuse";
  return next;
}

export type ReportLine = { ok: boolean; text: string };

export function reportLines(flags: Flags): ReportLine[] {
  return [
    flags.door === "shut"
      ? { ok: true, text: "You let the door close. He went back to the van." }
      : { ok: false, text: "You held the door. He walked in with no badge." },
    flags.mail === "report"
      ? { ok: true, text: "The gift-card mail went to security, not a checkout page." }
      : flags.mail === "ignore"
        ? { ok: false, text: "You left the gift-card mail in the inbox." }
        : { ok: false, text: "You sent gift-card codes to a lookalike address." },
    flags.phone === "hangup"
      ? { ok: true, text: "You didn't read the code. You used the number on your badge." }
      : { ok: false, text: "You read a live login code to someone who called you." },
    flags.usb === "it"
      ? { ok: true, text: "The USB stick went to IT, still unplugged." }
      : flags.usb === "leave"
        ? { ok: false, text: "The USB stick is still on the break counter." }
        : { ok: false, text: "You plugged in a stick labeled Salary review. The laptop locked." },
    flags.wire === "call"
      ? { ok: true, text: "The wire waited until Elena was on a number finance already had." }
      : flags.wire === "refuse"
        ? { ok: true, text: "You refused the wire. Maya called Elena herself." }
        : { ok: false, text: "You released a payment because a message said to." },
  ];
}

export function scoreOf(flags: Flags): { score: number; clean: boolean; title: string } {
  let score = 0;
  if (flags.door === "shut") score += 20;
  if (flags.mail === "report") score += 20;
  else if (flags.mail === "ignore") score += 6;
  if (flags.phone === "hangup") score += 20;
  if (flags.usb === "it") score += 20;
  else if (flags.usb === "leave") score += 6;
  if (flags.wire === "call") score += 20;
  else if (flags.wire === "refuse") score += 14;
  const clean =
    flags.door === "shut" &&
    flags.mail === "report" &&
    flags.phone === "hangup" &&
    flags.usb === "it" &&
    (flags.wire === "call" || flags.wire === "refuse");
  const title = clean ? "A quiet Monday" : score >= 70 ? "Mostly quiet" : "Monday cost something";
  return { score, clean, title };
}

export function nightPath(flags: Flags): string {
  return `/night?d=${flags.door ?? ""}&m=${flags.mail ?? ""}&p=${flags.phone ?? ""}&u=${flags.usb ?? ""}&w=${flags.wire ?? ""}`;
}

export type VoiceKind = "narrator" | "man" | "woman";

export function voiceFor(id: string): { text: string; kind: VoiceKind } | null {
  switch (id) {
    case "brief":
      return {
        kind: "narrator",
        text: "This is Monday night at Harbor and Company, a shipping firm on the quay. You are the new hire. The training is the shift. Walk the dock. Press E to get in a car, W to drive, Shift to run. Follow the gold blip to the tower door. People will ask you to hold a door, send gift card codes, read a login code, plug in a USB stick, and release a wire. The voice tells you who is asking.",
      };
    case "door":
      return { kind: "man", text: "Courier, no badge. He says: hold the door. My badge is in the van. I'll be two seconds." };
    case "reception":
      return { kind: "woman", text: "June Park, reception, Harbor Tower. You are on the list for floor fourteen. The elevator is straight back. Badge yourself. If someone asks you to hold the door, they badge in on their own." };
    case "mail":
      return { kind: "woman", text: "Email. The name says Elena Voss, but the address is not Harbor. She writes: I'm boarding. Buy eight Apple gift cards and reply with the codes. Don't loop my assistant." };
    case "phone":
      return { kind: "man", text: "Phone. A man says he is Harbor IT. He says: we blocked a login from overseas. Read me the six digit code that just hit your phone." };
    case "usb":
      return { kind: "narrator", text: "On the break counter: a USB stick labeled Salary review, next to an open laptop. Nobody has asked you to plug it in." };
    case "maya":
      return { kind: "woman", text: "Maya Ruiz, finance. She says: Elena says the acquisition wire has to leave now. The form is down. She told me you would release it." };
    case "door-hold":
      return { kind: "narrator", text: "You held the door. The courier walks in behind you. He never badged in." };
    case "door-shut":
      return { kind: "narrator", text: "You let the door close. The courier goes back to the van." };
    case "mail-codes":
      return { kind: "narrator", text: "You sent the codes. That address is not Harbor." };
    case "mail-report":
      return { kind: "narrator", text: "You reported the gift card mail. You did not buy a thing." };
    case "mail-ignore":
      return { kind: "narrator", text: "You left the gift card mail sitting in the inbox." };
    case "phone-code":
      return { kind: "narrator", text: "You read the code out loud. That just signed in a new device." };
    case "phone-hangup":
      return { kind: "narrator", text: "You hung up. The number on your badge is the one you would dial." };
    case "usb-plug":
      return { kind: "narrator", text: "You plugged it in. The laptop locks and asks for a payment." };
    case "usb-it":
      return { kind: "narrator", text: "You bagged the USB stick for IT. Nobody plugs it in." };
    case "usb-leave":
      return { kind: "narrator", text: "You left the USB stick on the counter." };
    case "wire-send":
      return { kind: "narrator", text: "You sent the wire. Nobody confirmed it was Elena." };
    case "wire-call":
      return { kind: "narrator", text: "You called the number finance already had. Elena did not order a wire." };
    case "wire-refuse":
      return { kind: "narrator", text: "You refused the wire. Maya calls Elena herself." };
    case "reception-ok":
      return { kind: "woman", text: "June Park. Elevator at the back. Badge yourself. Floor fourteen." };
    default:
      return null;
  }
}
