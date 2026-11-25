// The week remembers (docs/WEEK_REMEMBERS.md). A Monday mistake that hands over a password or a code, or
// plugs in a found drive, plants a foothold the player can't see. Tuesday to Thursday show its signs;
// Friday is when it goes off. Calling it in at any point contains it. Pure: the browser and the Worker
// both run this, and on the server only choice ids from the scenario content can plant anything.

export type Seed = "creds" | "usb";

export type WorldState = {
  v: 1;
  /** The Monday run that planted the seeds. A new Monday run starts a new week. */
  run: string | null;
  seeds: Partial<Record<Seed, { choice: string; at: number }>>;
  /** First time the player called it in, while something was planted. */
  reported: { at: number; day: string; via: Via } | null;
  /** Every call to IT, planted or not: the recovery ledger. */
  calls: { at: number; day: string; via: Via; planted: boolean }[];
};

export type Via = "hotline" | "card";

/** What the player's shift looks like given the week so far. */
export type Stage = "clean" | "planted" | "contained" | "breach";

export const EMPTY_WORLD: WorldState = { v: 1, run: null, seeds: {}, reported: null, calls: [] };

/** Monday choices that leave a way in behind them. Only these plant anything. */
export const SEED_FROM_CHOICE: Record<string, Seed> = {
  "mail-codes": "creds",
  "phone-code": "creds",
  "signin-yes": "creds",
  "usb-plug": "usb",
};

/** Monday choice ids start a new week when they arrive from a run the world hasn't seen. */
const MONDAY = new Set([
  "door-hold",
  "door-shut",
  "mail-codes",
  "mail-report",
  "mail-ignore",
  "phone-code",
  "phone-hangup",
  "usb-plug",
  "usb-it",
  "usb-leave",
  "wire-send",
  "wire-call",
  "wire-refuse",
  "updates-ignore",
  "updates-restart",
  "updates-report",
  "signin-yes",
  "signin-ignore",
  "signin-report",
  "misdirect-send",
  "misdirect-check",
  "misdirect-hide",
  "misdirect-report",
  "cleandesk-leave",
  "cleandesk-home",
  "cleandesk-lock",
  "cleandesk-shred",
]);

export const WEEK_DAYS = ["tuesday", "wednesday", "thursday", "friday"] as const;

export function parseWorld(raw: unknown): WorldState {
  if (!raw || typeof raw !== "object") return { ...EMPTY_WORLD, seeds: {}, calls: [] };
  const w = raw as Partial<WorldState>;
  return {
    v: 1,
    run: typeof w.run === "string" ? w.run : null,
    seeds: w.seeds && typeof w.seeds === "object" ? w.seeds : {},
    reported: w.reported && typeof w.reported === "object" ? w.reported : null,
    calls: Array.isArray(w.calls) ? w.calls.slice(-50) : [],
  };
}

export const planted = (w: WorldState) => Object.keys(w.seeds).length > 0;

/** A Monday decision. A choice from a new Monday run wipes the week and starts over. */
export function applyChoice(w: WorldState, choiceId: string, runId: string, at: number): WorldState {
  if (!MONDAY.has(choiceId)) return w;
  const fresh = w.run !== runId ? { ...EMPTY_WORLD, run: runId, seeds: {}, calls: [] } : { ...w, seeds: { ...w.seeds } };
  const seed = SEED_FROM_CHOICE[choiceId];
  if (seed && !fresh.seeds[seed]) fresh.seeds[seed] = { choice: choiceId, at };
  return fresh;
}

/** The player calls IT. It contains a planted foothold; with nothing planted it's simply a check-in. */
export function applyReport(w: WorldState, day: string, via: Via, at: number): WorldState {
  const isPlanted = planted(w);
  return {
    ...w,
    reported: w.reported ?? (isPlanted ? { at, day, via } : null),
    calls: [...w.calls, { at, day, via, planted: isPlanted }].slice(-50),
  };
}

/** How the given shift opens. Only the Tuesday to Friday day shifts change. */
export function stageFor(w: WorldState, day: string): Stage {
  if (!(WEEK_DAYS as readonly string[]).includes(day) || !planted(w)) return "clean";
  // Called in before Friday: contained. Called in on Friday itself: Friday already went off.
  if (w.reported && w.reported.day !== "friday") return "contained";
  return day === "friday" ? "breach" : "planted";
}

/** What the Monday mistake was, in plain words. */
export function seedStory(w: WorldState): string {
  const c = w.seeds.creds?.choice;
  const parts: string[] = [];
  if (c === "mail-codes") parts.push("typed your password into a fake sign-in page");
  if (c === "phone-code") parts.push("read a sign-in code to a caller");
  if (c === "signin-yes") parts.push("approved a sign-in you didn't start");
  if (w.seeds.usb) parts.push("plugged in a drive you found");
  return parts.length ? `On Monday night you ${parts.join(" and ")}.` : "";
}

/** The "what changed since yesterday" card for a shift, or null when nothing did. */
export function changedSince(w: WorldState, day: string): { title: string; lines: string[]; canCall: boolean } | null {
  const stage = stageFor(w, day);
  if (stage === "clean") return null;
  if (stage === "contained") {
    const when = w.reported ? `on ${cap(w.reported.day)}` : "";
    return {
      title: "Since you called it in",
      lines:
        day === "friday"
          ? [
              `IT reset your password and reimaged one laptop after your call ${when}.`,
              "Accounting's file share got hit through a different door tonight. Yours didn't, and neither did the rest of the floor.",
            ]
          : [`IT reset your password and checked your laptop after your call ${when}. Nothing else was touched.`],
      canCall: false,
    };
  }
  if (stage === "breach")
    return {
      title: "06:10, Friday",
      lines: [
        "Every screen on floor 14 shows the same grey message. The badge readers have failed closed and the lights are on emergency circuits.",
        "The MSP's truck was in the lot before sunrise, with two cars nobody recognizes.",
        "Nobody ever reported what happened on Monday night.",
      ],
      canCall: true,
    };
  const SIGNS: Record<string, string[]> = {
    tuesday: [
      "Your laptop asked you to sign in twice this morning.",
      "A calendar invite went out from your account at 3 AM. You didn't send it.",
      'Next desk: "Did you get locked out too?"',
    ],
    wednesday: [
      "IT's overnight note: a new admin account, svc_backup2, showed up. Nobody has claimed it.",
      "The file share is slow, and one lobby camera went offline at 2 AM.",
    ],
    thursday: ['The office VPN chat: "upload saturating, anyone streaming?"', "Last night's backup jobs say succeeded. Every one of them is nearly empty."],
  };
  return { title: "Since yesterday", lines: SIGNS[day] ?? [], canCall: true };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
