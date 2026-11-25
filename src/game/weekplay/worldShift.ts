// How the week's world state shows up in a shift: signs on the walls, what the desk monitor says, and
// how Friday's locked file share is framed. Read once when a shift loads, never per frame.
import type { SetKind, ShiftDef } from "@/content/week/types";
import type { Stage } from "@/content/week/world";
import type { RoomSet } from "@/game/weekplay/sets";

type Decor = NonNullable<RoomSet["decor"]>[number];

// Floor 14's north wall by the printer faces +z at z = -16.44.
const north = (x: number, w: number, h: number, body: string, bg: string, fg: string, y = 52.2): Decor => ({
  text: { body, bg, fg, lines: 4 },
  x,
  y,
  z: -16.44,
  w,
  h,
  face: 0,
});

// A sign hung from the ceiling over the walk to your desk, facing you as you come in from the elevators.
const banner = (x: number, z: number, w: number, body: string, bg: string, fg: string): Decor => ({
  text: { body, bg, fg, lines: 3.4 },
  x,
  y: 52.85,
  z,
  w,
  h: 0.42,
  face: Math.PI,
});
// A note propped on your desk, facing your chair.
const deskNote = (body: string): Decor => ({
  text: { body, bg: "#f4f1ea", fg: "#1b1f27", lines: 6 },
  x: -5.25,
  y: 51.66,
  z: -1.9,
  w: 0.26,
  h: 0.18,
  face: Math.PI,
});

const YELLOW = ["#f2d23c", "#141414"] as const;
const PAPER = ["#f4f1ea", "#1b1f27"] as const;

/** The room as it stands in this world. Only floor 14 changes; other rooms are untouched. */
export function worldSet(set: RoomSet, kind: SetKind, day: string, stage: Stage): RoomSet {
  if (kind !== "floor" || stage === "clean") return set;
  const decor = [...(set.decor ?? [])];
  let idleText = set.idleText;
  if (stage === "breach") {
    decor.push(
      banner(-4.4, -4.6, 1.5, "SYSTEMS DOWN. DO NOT POWER ON. IT WILL COME TO YOU.", ...YELLOW),
      banner(-1.6, -9.5, 1.1, "DAY 1 OF PAPER. |", ...PAPER),
      north(7.86, 0.7, 0.45, "PRINTER LOCKED. DO NOT USE.", ...YELLOW),
      north(5.2, 0.6, 0.4, "COFFEE: CASH ONLY. WE HAVE NO CASH.", ...PAPER),
    );
    idleText = "Your files are unavailable. Contact your IT department.";
  } else if (stage === "contained") {
    decor.push(banner(-4.4, -4.6, 1.3, "Restored overnight. Thanks for reporting it.", "#d9efe1", "#12301f"));
    if (day === "friday") decor.push(banner(-1.6, -9.5, 1.2, "Accounting share offline. IT is on it.", ...YELLOW));
  } else if (day === "tuesday") {
    idleText = "Your session expired. Sign in again to continue.";
  } else if (day === "wednesday") {
    decor.push(deskNote("IT: new admin account svc_backup2 appeared overnight. Yours? Call ext 4100."));
  }
  return { ...set, decor, idleText };
}

/** Friday's locked file share, framed by the week. Breach: it's your screen too, and it comes first. */
export function worldShift(shift: ShiftDef, stage: Stage): ShiftDef {
  if (shift.id !== "friday" || stage === "clean" || stage === "planted") return shift;
  const isHour = (b: ShiftDef["beats"][number]) => b.scenario.id.startsWith("FRI-03") || b.scenario.id.toLowerCase().includes("hour");
  if (stage === "breach") {
    const hour = shift.beats.find(isHour);
    const rest = shift.beats.filter((b) => !isHour(b));
    return {
      ...shift,
      intro: "Last night of the week, and nothing on the floor is working.",
      beats: hour ? [{ ...hour, objective: "Your desk. Your screen has the grey message too." }, ...rest] : shift.beats,
    };
  }
  return {
    ...shift,
    intro: "Last night of the week. Your call earlier this week kept your account out of it, but accounting got hit through a different door.",
    beats: shift.beats.map((b) => (isHour(b) ? { ...b, objective: "Your desk. Accounting's file share is acting up." } : b)),
  };
}
