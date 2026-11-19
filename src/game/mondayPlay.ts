import { create } from "zustand";
import { MONDAY_FINDS, MONDAY_TOYS, findLineId, toyLineId, toySfx } from "@/content/week/play";
import { blip, sayLine } from "@/game/audio";
import { playSfx } from "@/game/sound";

/**
 * Monday's share of the optional play: the same toys and finds as the week shifts, on floor 14 and in the
 * lobby, minus the finds Monday already teaches as beats. The sim offers them only when no beat is in reach.
 */

type MondayPlay = { found: Record<string, true>; reset: () => void };
export const useMondayPlay = create<MondayPlay>((set) => ({ found: {}, reset: () => set({ found: {} }) }));

const presses: Record<string, number> = {};

export function mondayUse(action: string) {
  if (action.startsWith("toy:")) {
    const toy = MONDAY_TOYS.find((t) => `toy:${t.id}` === action);
    if (!toy) return;
    const n = presses[toy.id] ?? 0;
    presses[toy.id] = n + 1;
    const k = Math.min(n, toy.lines.length - 1);
    sayLine(toyLineId(toy, k), toy.lines[k], toy.who === "Next desk" ? "man" : "narrator", toy.who ?? toy.label);
    playSfx(toySfx(toy, k), 0.7, () => blip(440 + (n % 3) * 90));
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
    sayLine(findLineId(find), find.line, "narrator", found[find.id] ? find.label : `Found · ${find.label}`);
  }
}

/** The nearest toy or find within reach of (x, z) on this level, as a sim action and its prompt. */
export function mondayNearby(x: number, z: number, level: "f14" | "lobby"): { use: string; prompt: string } | null {
  const { found } = useMondayPlay.getState();
  let best: { use: string; prompt: string; d: number } | null = null;
  for (const t of MONDAY_TOYS) {
    if (t.place !== level) continue;
    const d = Math.hypot(x - t.x, z - t.z);
    if (d < (t.r ?? 1.3) && (!best || d < best.d)) best = { use: `toy:${t.id}`, prompt: `E  ·  ${t.label}`, d };
  }
  for (const f of MONDAY_FINDS) {
    if (f.place !== level || found[f.id]) continue;
    const d = Math.hypot(x - f.x, z - f.z);
    if (d < (f.r ?? 1.3) && (!best || d < best.d)) best = { use: `find:${f.id}`, prompt: `E  ·  Check the ${f.label.toLowerCase()}`, d };
  }
  return best ? { use: best.use, prompt: best.prompt } : null;
}
