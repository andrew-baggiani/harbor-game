import { AGENTS_SHIFT } from "@/content/week/agents";
import { AI_SHIFT } from "@/content/week/ai";
import { FRIDAY, THURSDAY, TUESDAY, WEDNESDAY } from "@/content/week/days";
import { reminderScenarios } from "@/content/week/reminders";
import { TRACKS } from "@/content/week/tracks";
import type { ShiftDef, WeekChoice, WeekScenario } from "@/content/week/types";
import { SATURDAY } from "@/content/week/weekend";

/** Every playable shift after Monday, in the order the week runs. Sunday is a 2D sort, not a ShiftDef. */
export const SHIFTS: ShiftDef[] = [TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, AI_SHIFT, AGENTS_SHIFT, ...TRACKS];

/** Shift ids the server accepts on a completion event. */
export const SHIFT_IDS = ["monday", ...SHIFTS.map((s) => s.id), "sunday", "reminder"] as const;

export function shiftById(id: string): ShiftDef | null {
  return SHIFTS.find((s) => s.id === id) ?? null;
}

export const weekScenarios: WeekScenario[] = [...SHIFTS.flatMap((s) => s.beats.map((b) => b.scenario)), ...reminderScenarios];

const byChoice = new Map<string, { scenario: WeekScenario; choice: WeekChoice }>();
for (const scenario of weekScenarios) for (const choice of scenario.choices) byChoice.set(choice.id, { scenario, choice });

export function weekChoiceOf(id: string) {
  return byChoice.get(id) ?? null;
}

/** scenario id → framework control ids, for the coverage page. */
export function weekControls(): Record<string, Record<string, string[]>> {
  return Object.fromEntries(weekScenarios.map((s) => [s.id, s.controls]));
}

export function shiftLabel(id: string): string {
  if (id === "monday") return "Monday";
  if (id === "sunday") return "Sunday sort";
  if (id === "reminder") return "Monthly reminder";
  const s = shiftById(id);
  return s ? (s.kind === "track" ? `${s.day} track` : s.day) : id;
}

/** Plain name for a decision in the activity feed, e.g. "Tuesday: accounts payable". */
export function weekScenarioName(id: string | null): string | null {
  if (!id) return null;
  if (id.startsWith("REM-")) return "Monthly reminder";
  const sc = weekScenarios.find((s) => s.id === id);
  if (!sc) return null;
  const shift = shiftById(sc.day);
  return `${shift ? (shift.kind === "track" ? `${shift.day} track` : shift.day) : sc.day}: ${sc.prompt.who.toLowerCase()}`;
}
