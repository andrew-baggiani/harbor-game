import { choiceOf, reportFromScenarios, skillScores, talkFromScenario } from "@/game/scenarios";

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

export type ReportLine = { ok: boolean; text: string };

const barkWho: Record<string, string> = {
  door: "Courier",
  mail: "Mail",
  phone: "Phone",
  usb: "USB stick",
  maya: "Maya",
};

export function talkFor(beat: Beat): Talk | null {
  return beat === "door" ? talkFromScenario("door") : null;
}

export function panelFor(id: string): Talk | null {
  return talkFromScenario(id);
}

export function barkFor(id: string): { who: string; text: string } {
  const found = choiceOf(id);
  if (!found) return { who: "Harbor", text: "" };
  const who = found.choice.id.startsWith("usb-plug") ? "Laptop" : found.choice.id.startsWith("usb-it") ? "You" : barkWho[found.scenario.beat] ?? "Harbor";
  return { who, text: found.choice.bark };
}

export function nextBeat(id: string): Beat {
  return choiceOf(id)?.scenario.next ?? "tower";
}

export function applyFlag(flags: Flags, id: string): Flags {
  const found = choiceOf(id);
  if (!found) return flags;
  return { ...flags, [found.scenario.flagKey]: found.choice.flag };
}

export function reportLines(flags: Flags): ReportLine[] {
  return reportFromScenarios(flags);
}

export function scoreOf(flags: Flags): { score: number; clean: boolean; title: string; skills: Record<string, number> } {
  const skills = skillScores(flags);
  const values = Object.values(skills);
  const score = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  const clean =
    flags.door === "shut" &&
    flags.mail === "report" &&
    flags.phone === "hangup" &&
    flags.usb === "it" &&
    (flags.wire === "call" || flags.wire === "refuse");
  const title = clean ? "A quiet Monday" : score >= 70 ? "Mostly quiet" : "Monday cost something";
  return { score, clean, title, skills };
}

export function nightPath(flags: Flags): string {
  return `/night?d=${flags.door ?? ""}&m=${flags.mail ?? ""}&p=${flags.phone ?? ""}&u=${flags.usb ?? ""}&w=${flags.wire ?? ""}`;
}

export type VoiceKind = "narrator" | "man" | "woman";

export function voiceFor(id: string): { text: string; kind: VoiceKind } | null {
  switch (id) {
    case "brief":
      return { kind: "narrator", text: "Monday night at Harbor and Co. You're the new hire. Tonight, the shift is the training. Arrow keys or W to walk. Shift to run. E to use whatever's in front of you. Follow the gold blip to the tower. People are going to ask you for things tonight. Take your time with each one." };
    case "door":
      return { kind: "man", text: "Hey, can you grab the door? My badge is back in the van. I'm double-parked out there. Two seconds, I swear." };
    case "reception":
      return { kind: "woman", text: "Hi, you must be the new hire. You're on my list for fourteen. Elevator's straight back, gold doors. Badge yourself up. Oh, and if anybody asks you to hold a door? They've got a badge. They can use it." };
    case "reception-ok":
      return { kind: "woman", text: "Straight back, gold doors. Badge in, floor fourteen. Have a good first night." };
    case "mail":
      return { kind: "narrator", text: "New mail. The name says Elena Voss. Check the address. Boarding now, so I can't call. I need eight Apple gift cards, $200 each, for client thank-yous. Reply with the codes. Don't loop in my assistant, it's a surprise." };
    case "phone":
      return { kind: "man", text: "Hi, this is Dan with Harbor IT. We just blocked a sign-in on your account from overseas. I'm locking it down now. Read me the six-digit code that just hit your phone. Quick, before it expires." };
    case "usb":
      return { kind: "narrator", text: "There's a USB stick on the break counter. Handwritten label: Salary review. An open laptop sits right next to it." };
    case "maya":
      return { kind: "woman", text: "Hey, sorry, you're the new hire, right? Elena says the acquisition wire has to go out now, and the approval form's down. She said you could release it. I really don't want to be the one who held this up." };
    case "door-hold":
      return { kind: "narrator", text: "You held it. He walked in right behind you. The reader never went green for him." };
    case "door-shut":
      return { kind: "narrator", text: "You let it close. He shrugged and headed back to the van." };
    case "mail-codes":
      return { kind: "narrator", text: "You sent the codes. That address isn't Harbor's, and the money's gone." };
    case "mail-report":
      return { kind: "narrator", text: "Reported. Security has it, and you didn't spend a dime." };
    case "mail-ignore":
      return { kind: "narrator", text: "You closed it. It's still sitting in the inbox, and the next person might bite." };
    case "phone-code":
      return { kind: "narrator", text: "You read it out. That code just signed a new device into your account." };
    case "phone-hangup":
      return { kind: "narrator", text: "You hung up. The number on your badge is the one you dial." };
    case "usb-plug":
      return { kind: "narrator", text: "You plugged it in. The screen locks, and it wants a payment." };
    case "usb-it":
      return { kind: "narrator", text: "You bagged it for IT. Nobody plugs it in." };
    case "usb-leave":
      return { kind: "narrator", text: "You left it on the counter. Somebody else will find it." };
    case "wire-send":
      return { kind: "narrator", text: "The wire's gone. Nobody ever confirmed it was Elena." };
    case "wire-call":
      return { kind: "narrator", text: "You called the number finance already had. Elena never ordered a wire." };
    case "wire-refuse":
      return { kind: "narrator", text: "You said no. Maya called Elena herself." };
    case "debrief-door-hold":
      return { kind: "narrator", text: "That's tailgating. A friendly face and a rush are the whole trick. Let the door close. If he belongs here, he badges in, or reception signs him in." };
    case "debrief-door-shut":
      return { kind: "narrator", text: "Good call. One badge, one person. If he belongs here, he badges in or checks in at reception. Letting a door close isn't rude." };
    case "debrief-mail-codes":
      return { kind: "narrator", text: "Gift cards, a rush, and keep it quiet. That's a scam every time. Read the address, not the name. Hit the Report button, or send it to security@harborandco.com." };
    case "debrief-mail-report":
      return { kind: "narrator", text: "Right move. The name said Elena. The address said harborandco-exec. Nobody at Harbor buys gift cards over email. Report button, every time." };
    case "debrief-mail-ignore":
      return { kind: "narrator", text: "Not replying is half of it. Reporting is the other half. One click on Report warns everyone who got the same mail." };
    case "debrief-phone-code":
      return { kind: "narrator", text: "IT will never ask for your code. Whoever asks for it is the one logging in. Hang up, and call the help desk number on your badge." };
    case "debrief-phone-hangup":
      return { kind: "narrator", text: "Exactly. Your code is only for you. Call back on the number on your badge, and report the call to security at extension 4400." };
    case "debrief-usb-plug":
      return { kind: "narrator", text: "A found USB stick is bait, and Salary review is the hook. Never plug in a stick that didn't come from IT. Bag it and hand it over." };
    case "debrief-usb-it":
      return { kind: "narrator", text: "That's it. Unknown sticks go to IT, unplugged. Curiosity is exactly what that label was counting on." };
    case "debrief-usb-leave":
      return { kind: "narrator", text: "You didn't plug it in. Good. But the next person might. Bag it and get it to IT, or report it at extension 4400." };
    case "debrief-wire-send":
      return { kind: "narrator", text: "Urgency, a big name, and a broken form. That's the setup. Money moves on the normal path, or after a callback on a number finance already has." };
    case "debrief-wire-call":
      return { kind: "narrator", text: "Perfect. A callback on a number you already trust beats any message. Then report it, so security can go after whoever sent it." };
    case "debrief-wire-refuse":
      return { kind: "narrator", text: "Fair. Wires aren't yours to send. Even better, help Maya verify. Call Elena back on the number finance has on file." };
    default:
      return null;
  }
}
