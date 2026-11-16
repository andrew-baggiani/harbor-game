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

export function resetFallout() {
  active.clear();
}

/** v1 choice ids that leave something behind. */
export const FALLOUT_FROM_CHOICE: Record<string, Fallout> = {
  "phone-code": "code_given",
  "usb-plug": "usb_plugged",
  "door-hold": "courier_in",
  "misdirect-send": "misdirect_sent",
};
