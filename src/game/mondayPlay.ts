import { create } from "zustand";
import { CAB_TOY, MONDAY_FINDS, MONDAY_TOYS, findLineId, toyPress, toySfx } from "@/content/week/play";
import { blip, caption, sayLine } from "@/game/audio";
import { useHarbor, world } from "@/game/state";
import { playSfx } from "@/game/sound";

/**
 * Monday's share of the optional play: the same toys and finds as the week shifts, on floor 14 and in the
 * lobby, minus the finds Monday already teaches as beats. The sim offers them only when no beat is in reach.
 */

type Burst = {
  key: number;
  kind: "papers" | "puff";
  x: number;
  y: number;
  z: number;
  floor: number;
};
type MondayPlay = { found: Record<string, true>; bursts: Burst[]; reset: () => void };
export const useMondayPlay = create<MondayPlay>((set) => ({
  found: {},
  bursts: [],
  reset: () => {
    for (const k of Object.keys(presses)) delete presses[k];
    set({ found: {}, bursts: [] });
  },
}));

/**
 * Toy lines are chatter, and chatter stays quiet while the story is talking. The line still goes up on
 * screen, so a press never does nothing.
 */
function showIfSilent(who: string, text: string) {
  if (caption.text === text) return;
  useHarbor.getState().setBark({ who, text });
  world.barkT = Math.min(9, 3.5 + text.length / 20);
}

/** Papers thrown out of a toy (the printer, mostly); they lie on the floor for half a minute. */
function burst(b: Omit<Burst, "key">) {
  const key = Date.now() + Math.random();
  useMondayPlay.setState((st) => ({ bursts: [...st.bursts.slice(-3), { ...b, key }] }));
  window.setTimeout(() => useMondayPlay.setState((st) => ({ bursts: st.bursts.filter((x) => x.key !== key) })), b.kind === "papers" ? 30_000 : 4_000);
}

/** Times each toy has been poked this run; the gold dot over a toy goes once it's been poked. */
export const presses: Record<string, number> = {};

/** When the player last poked a toy or spotted a find; the few seconds after count as exploring. */
export const pokeClock = { last: -1e9 };

export function mondayFindCount() {
  const { found } = useMondayPlay.getState();
  return { found: MONDAY_FINDS.filter((f) => found[f.id]).length, total: MONDAY_FINDS.length };
}

export function mondayUse(action: string) {
  pokeClock.last = performance.now();
  if (action.startsWith("toy:")) {
    const toy = [...MONDAY_TOYS, CAB_TOY].find((t) => `toy:${t.id}` === action);
    if (!toy) return;
    const n = presses[toy.id] ?? 0;
    presses[toy.id] = n + 1;
    const press = toyPress(toy, n);
    if (press.line) {
      sayLine(press.line.id, press.line.text, toy.who === "Next desk" ? "man" : "narrator", toy.who ?? toy.label, "chatter");
      showIfSilent(toy.who ?? toy.label, press.line.text);
    }
    playSfx(toySfx(toy, press.sfx), 0.7, () => blip(440 + (n % 3) * 90));
    const floor = toy.y > 40 ? 50.6 : 0;
    if (press.papers) burst({ kind: "papers", x: toy.x, y: toy.y + 0.3, z: toy.z + 0.35, floor });
    if (press.puff) burst({ kind: "puff", x: toy.x, y: toy.y + 0.4, z: toy.z + 0.25, floor });
    return;
  }
  if (action.startsWith("find:")) {
    const find = MONDAY_FINDS.find((f) => `find:${f.id}` === action);
    if (!find) return;
    const { found } = useMondayPlay.getState();
    if (!found[find.id]) {
      useMondayPlay.setState({ found: { ...found, [find.id]: true } });
      playSfx("sfx-find", 0.6, () => blip(780));
    }
    const who = found[find.id] ? find.label : `Found · ${find.label}`;
    sayLine(findLineId(find), find.line, "narrator", who, "chatter");
    showIfSilent(who, find.line);
  }
}

/**
 * The toy or find within reach of (x, z) on this level that the player is facing, as a sim action and its
 * prompt. Things stand close together, so facing counts for more than a few centimetres of distance.
 * face: the way the player faces, radians (cos → x, sin → z).
 */
export function mondayNearby(x: number, z: number, level: "f14" | "lobby", face?: number): { use: string; prompt: string } | null {
  const { found } = useMondayPlay.getState();
  const fx = face === undefined ? 0 : Math.cos(face);
  const fz = face === undefined ? 0 : Math.sin(face);
  const score = (tx: number, tz: number, r: number) => {
    const dx = tx - x, dz = tz - z;
    const d = Math.hypot(dx, dz);
    if (d >= r) return Infinity;
    const facing = face === undefined || d < 0.05 ? 1 : (dx * fx + dz * fz) / d;
    return d + 1.6 * (1 - facing);
  };
  let best: { use: string; prompt: string; s: number } | null = null;
  for (const t of MONDAY_TOYS) {
    if (t.place !== level) continue;
    const s = score(t.x, t.z, t.r ?? 1.3);
    if (s < (best?.s ?? Infinity)) best = { use: `toy:${t.id}`, prompt: `E  ·  ${t.label}`, s };
  }
  for (const f of MONDAY_FINDS) {
    if (f.place !== level || found[f.id]) continue;
    const s = score(f.x, f.z, f.r ?? 1.3);
    if (s < (best?.s ?? Infinity)) best = { use: `find:${f.id}`, prompt: `E  ·  Check the ${f.label.toLowerCase()}`, s };
  }
  return best ? { use: best.use, prompt: best.prompt } : null;
}
