import type { CheckItem } from "@/game/scenarios";
import type { CastSlot, FalloutStep, Prop, SetKind, WeekBeat, WeekScenario } from "@/content/week/types";

/** Framework ids in the shape the scenario JSON uses. */
export type Controls = Record<string, string[]>;

type ChoiceInput = {
  id: string;
  label: string;
  /** 100 right, 40 cautious but wrong, 0 harmful. */
  score: 0 | 40 | 100;
  debrief: string;
  report: string;
  fallout?: FalloutStep[];
};

type BeatInput = {
  id: string;
  day: string;
  skill: string;
  controls: Controls;
  who: string;
  role: string;
  text: string;
  choices: ChoiceInput[];
  set: SetKind;
  spot: string;
  cast?: CastSlot;
  voiceOnly?: boolean;
  prop?: Prop;
  objective: string;
  roles?: string[];
};

/** Builds a scenario and its beat in one go, so new content does not repeat the Monday JSON boilerplate. */
export function beat(input: BeatInput): WeekBeat {
  const scenario: WeekScenario = {
    id: input.id,
    version: "1.0.0",
    day: input.day,
    location: input.spot,
    trigger: input.spot,
    roles: input.roles ?? ["all"],
    skill: input.skill,
    controls: input.controls,
    variants: [{ caller: input.who, pressure: "", tell: "" }],
    prompt: { who: input.who, role: input.role, text: input.text },
    choices: input.choices.map((c) => {
      const flag = c.id.split("-").at(-1) ?? c.id;
      return {
        id: c.id,
        label: c.label,
        outcome: flag,
        score: c.score,
        verb: c.score === 100 ? "reported" : "decided",
        flag,
        ok: c.score === 100,
        debrief: c.debrief,
        bark: c.label,
        report: c.report,
      };
    }),
    beat: input.id,
    next: "",
    flagKey: input.id,
    tenant_tokens: [],
    knowledge_check_pool: `kc/${input.day}`,
  };
  const timeline: Record<string, FalloutStep[]> = {};
  for (const c of input.choices) if (c.fallout) timeline[c.id] = c.fallout;
  return {
    scenario,
    set: input.set,
    spot: input.spot,
    cast: input.cast,
    voiceOnly: input.voiceOnly,
    prop: input.prop,
    objective: input.objective,
    timeline,
  };
}

/** A three-option check question; the first option listed is the right one, then shuffled at draw time. */
export function q(id: string, skill: string, prompt: string, right: string, ...wrong: string[]): CheckItem {
  return {
    id,
    skill,
    prompt,
    choices: [right, ...wrong].map((label, i) => ({ id: String.fromCharCode(97 + i), label, correct: i === 0 })),
  };
}
