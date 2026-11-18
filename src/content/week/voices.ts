import type { CastSlot, ShiftDef, WeekBeat } from "@/content/week/types";
import type { VoiceKind } from "@/game/story";

/** Things that "speak" through a screen. Their lines are captions only, never voiced. */
const OBJECTS = new Set([
  "Screen", "Phone", "Mail", "Laptop", "Slide", "Tool", "Console", "Gate", "Rack", "Queue", "Router app",
  "Payroll", "Text", "Aisle", "Lobby", "Hallway", "Bank", "Browser tab", "Share window", "Spreadsheet",
]);

const SLOT_KIND: Partial<Record<CastSlot, VoiceKind>> = {
  "desk-coworker": "woman",
  contractor: "man",
  "last-day": "man",
  "at-home": "woman",
  "night-desk": "woman",
  "admin-peer": "man",
  caller: "man",
};

export type WeekLine = { id: string; text: string; kind: VoiceKind; who: string };

/** The line spoken when a beat opens: the character if there is one, the narrator otherwise. */
export function promptLine(beat: WeekBeat): WeekLine {
  const p = beat.scenario.prompt;
  return {
    id: `wk-${beat.scenario.id}`,
    text: p.text,
    kind: beat.cast ? (SLOT_KIND[beat.cast] ?? "narrator") : "narrator",
    who: p.who,
  };
}

/** A fallout step is voiced only when a person says it. */
export function falloutLine(choiceId: string, index: number, who: string, text: string, beat: WeekBeat): WeekLine | null {
  if (OBJECTS.has(who)) return null;
  const sameSpeaker = who === beat.scenario.prompt.who && beat.cast;
  return { id: `wk-${choiceId}-${index}`, text, kind: sameSpeaker ? (SLOT_KIND[beat.cast!] ?? "narrator") : "narrator", who };
}

/** Every voiced line in the week, for the recording script. */
export function allLines(shifts: ShiftDef[]): (WeekLine & { shift: string; cast: string })[] {
  const out: (WeekLine & { shift: string; cast: string })[] = [];
  for (const s of shifts)
    for (const b of s.beats) {
      out.push({ ...promptLine(b), shift: s.id, cast: b.cast ?? "narrator" });
      for (const [choice, steps] of Object.entries(b.timeline ?? {}))
        steps.forEach((st, i) => {
          const l = falloutLine(choice, i, st.who, st.text, b);
          if (l) out.push({ ...l, shift: s.id, cast: st.who === b.scenario.prompt.who ? (b.cast ?? "narrator") : st.who });
        });
    }
  return out;
}
