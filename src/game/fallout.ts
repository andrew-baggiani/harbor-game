// Delayed consequences: a mistake early in the shift changes a later beat.
// Beats add a key when the player slips; later beats read it. Cleared on reset.
// See docs/MONDAY_V2.md section 5.

export type Fallout = "code_given" | "creds_phished" | "usb_plugged" | "courier_in" | "misdirect_sent";

const active = new Set<Fallout>();

export function addFallout(key: Fallout) {
  active.add(key);
}

export function hasFallout(key: Fallout) {
  return active.has(key);
}

export function falloutList(): Fallout[] {
  return [...active];
}

/** Warning signs the player didn't catch, for the end-of-night report. */
export const missedSigns: { beat: string; why: string }[] = [];

export function resetFallout() {
  active.clear();
  missedSigns.length = 0;
  timers = [];
  clock = 0;
}

/** v1 choice ids that leave something behind. */
export const FALLOUT_FROM_CHOICE: Record<string, Fallout> = {
  "phone-code": "code_given",
  "usb-plug": "usb_plugged",
  "door-hold": "courier_in",
  "misdirect-send": "misdirect_sent",
};

// Timed follow-ups, in game seconds. Ticked by sim.step while the player is in the world
// (not paused, not inside an app), so a consequence never lands mid-conversation.
type Timed = { at: number; fire: () => void };
let clock = 0;
let timers: Timed[] = [];

export function after(seconds: number, fire: () => void) {
  timers.push({ at: clock + seconds, fire });
}

export function tickFallout(dt: number) {
  clock += dt;
  if (timers.length === 0) return;
  const due = timers.filter((t) => clock >= t.at);
  if (due.length === 0) return;
  timers = timers.filter((t) => clock < t.at);
  for (const t of due) t.fire();
}
