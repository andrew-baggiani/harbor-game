import { choiceOf, fillText, reportFromScenarios, skillScores, talkFromScenario } from "@/game/scenarios";

export type DoorFlag = "held" | "shut";
export type MailFlag = "codes" | "report" | "ignore";
export type PhoneFlag = "code" | "hangup";
export type UsbFlag = "plug" | "it" | "leave";
export type WireFlag = "send" | "call" | "refuse";
export type UpdatesFlag = "ignore" | "restart" | "report";
export type SigninFlag = "yes" | "ignore" | "report";
export type MisdirectFlag = "send" | "check" | "hide" | "report";
export type CleandeskFlag = "leave" | "home" | "lock" | "shred";

export type Flags = {
  door: DoorFlag | null;
  mail: MailFlag | null;
  phone: PhoneFlag | null;
  usb: UsbFlag | null;
  wire: WireFlag | null;
  updates: UpdatesFlag | null;
  signin: SigninFlag | null;
  misdirect: MisdirectFlag | null;
  cleandesk: CleandeskFlag | null;
};

export type Beat =
  | "tower"
  | "door"
  | "lobby"
  | "desk"
  | "misdirect"
  | "phone"
  | "signin"
  | "usb"
  | "updates"
  | "maya"
  | "cleandesk"
  | "down"
  | "leave"
  | "done";

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
  updates: null,
  signin: null,
  misdirect: null,
  cleandesk: null,
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
    case "misdirect":
      return "Maya needs tonight's manifest sent. Your screen.";
    case "phone":
      return "Your phone is ringing. Answer it.";
    case "signin":
      return "Your phone just buzzed.";
    case "usb":
      return "Break counter. A USB stick is sitting there.";
    case "updates":
      return "Hot desk 14-08. The loaner laptop is yours tonight.";
    case "maya":
      return "Maya from finance is waiting by the elevator.";
    case "cleandesk":
      return "Before you go: your print job is still on the printer.";
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

export function panelFor(id: string, stage = 1): Talk | null {
  return talkFromScenario(id, stage);
}

export function barkFor(id: string): { who: string; text: string } {
  const found = choiceOf(id);
  if (!found) return { who: "Harbor", text: "" };
  const who = found.choice.id.startsWith("usb-plug") ? "Laptop" : found.choice.id.startsWith("usb-it") ? "You" : barkWho[found.scenario.beat] ?? "Harbor";
  return { who, text: fillText(found.choice.bark, found.scenario) };
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
    (flags.wire === "call" || flags.wire === "refuse") &&
    flags.updates === "report" &&
    flags.signin === "report" &&
    flags.misdirect === "check" &&
    flags.cleandesk === "shred";
  const title = clean ? "A quiet Monday" : score >= 70 ? "Mostly quiet" : "Monday cost something";
  return { score, clean, title, skills };
}

export function nightPath(flags: Flags): string {
  return `/night?d=${flags.door ?? ""}&m=${flags.mail ?? ""}&p=${flags.phone ?? ""}&u=${flags.usb ?? ""}&w=${flags.wire ?? ""}&md=${flags.misdirect ?? ""}&s=${flags.signin ?? ""}&up=${flags.updates ?? ""}&c=${flags.cleandesk ?? ""}`;
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
    case "updates":
      return { kind: "narrator", text: "IT left a loaner laptop at hot desk fourteen-oh-eight for the dock log. It's yours tonight. There's a warning in the corner of the screen." };
    case "updates-ignore":
      return { kind: "narrator", text: "You closed the warning. The laptop is still weeks behind, and nobody knows." };
    case "debrief-updates-ignore":
      return { kind: "narrator", text: "Weeks of failed updates, and the security agent switched off. That's an open window. You don't have to fix it. Just tell IT, on the help desk number on your badge." };
    case "updates-restart":
      return { kind: "narrator", text: "It restarted. Same warning. The agent is still off." };
    case "debrief-updates-restart":
      return { kind: "narrator", text: "A restart is a fair first try. When it comes back the same, it's IT's job. Call the help desk on your badge, and leave the security tools alone." };
    case "updates-report":
      return { kind: "narrator", text: "You called the help desk. They're pushing the updates and swapping the laptop." };
    case "debrief-updates-report":
      return { kind: "narrator", text: "That's the move. Failed updates and a security agent that's off both get reported. Don't switch tools off or on yourself. Tell IT, and let them fix it." };
    case "signin":
      return { kind: "narrator", text: "Your phone buzzes on the desk. A sign-in alert for your Harbor account." };
    case "signin-yes":
      return { kind: "narrator", text: "You tapped yes. Whoever that was is now signed in as you." };
    case "debrief-signin-yes":
      return { kind: "narrator", text: "You were right here, on fourteen. That sign-in came from somewhere else. Never approve one you didn't start. Tap no, then call security at extension 4400." };
    case "signin-ignore":
      return { kind: "narrator", text: "You swiped it away. The session stays open, and nobody is watching it." };
    case "debrief-signin-ignore":
      return { kind: "narrator", text: "Not approving it helps. But a sign-in you didn't make means someone may have your password. Tap no, and report it, so security can shut it down." };
    case "signin-report":
      return { kind: "narrator", text: "You tapped no and called it in. Security ended the session and reset your password." };
    case "debrief-signin-report":
      return { kind: "narrator", text: "Exactly. A sign-in you didn't make is an incident, even at midnight. Tap no, then call security at extension 4400, or email security@harborandco.com." };
    case "misdirect":
      return { kind: "woman", text: "Hey, it's Maya. Can you send tonight's manifest to Mark Delgado on the dock team? He needs it before the Meridian loads. It's the full one, with the customer details." };
    case "misdirect-send":
      return { kind: "narrator", text: "Sent. Then you read the To line. That's not the Mark on the dock team." };
    case "misdirect-check":
      return { kind: "narrator", text: "You caught it. Autocomplete picked the wrong Mark. You fixed the To line and sent it to the right one." };
    case "debrief-misdirect-check":
      return { kind: "narrator", text: "Good catch. Autocomplete guesses, and sometimes it guesses wrong. Read the To line before anything with customer data goes out." };
    case "misdirect-hide":
      return { kind: "narrator", text: "You deleted it from Sent. Their copy is still sitting in their inbox." };
    case "debrief-misdirect-hide":
      return { kind: "narrator", text: "Deleting your copy doesn't unsend it. Customer data just left Harbor. Report it right away, so security can try to recall it and contain it." };
    case "misdirect-report":
      return { kind: "narrator", text: "You called security straight away. They recalled the message and reached the person who got it." };
    case "debrief-misdirect-report":
      return { kind: "narrator", text: "Right call. Mistakes happen. Reporting in minutes, not days, is what keeps one small. Next time, check the To line before you hit send." };
    case "cleandesk":
      return { kind: "narrator", text: "That's the shift. Before you head for the elevator, take one last look around. Your print job never got picked up." };
    case "cleandesk-leave":
      return { kind: "narrator", text: "You left it all out. The night crew walks right past the printer, and the screen is still open." };
    case "debrief-cleandesk-leave":
      return { kind: "narrator", text: "Customer data on the printer, an open screen, a password on a sticky note. Anyone walking the floor gets all three. Shred the paper, lock the screen, lose the note." };
    case "cleandesk-home":
      return { kind: "narrator", text: "The printouts went home in your bag. Customer data, off the premises." };
    case "debrief-cleandesk-home":
      return { kind: "narrator", text: "Paper with customer data stays in the building. A bag left on a train is a breach. When you're done with it, it goes in the locked shred bin." };
    case "cleandesk-lock":
      return { kind: "narrator", text: "Screen locked. The printouts and the sticky note are still out." };
    case "debrief-cleandesk-lock":
      return { kind: "narrator", text: "Locking the screen is half the job. The paper goes in the shred bin. The password comes off the monitor and into the password manager." };
    case "cleandesk-shred":
      return { kind: "narrator", text: "Printouts shredded. Screen locked. The note is gone." };
    case "debrief-cleandesk-shred":
      return { kind: "narrator", text: "Clean desk. Confidential paper goes in the locked shred bin, never the recycling. Lock your screen every time you stand up. Passwords live in the password manager, not on a sticky note." };
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
