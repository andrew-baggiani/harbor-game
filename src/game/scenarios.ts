import tailgate from "@/content/scenarios/mon-01-tailgate.json";
import phishing from "@/content/scenarios/mon-02-phishing.json";
import vishing from "@/content/scenarios/mon-03-vishing.json";
import usb from "@/content/scenarios/mon-04-usb.json";
import wire from "@/content/scenarios/mon-05-wire.json";
import pool from "@/content/scenarios/kc-monday.json";
import extra from "@/content/scenarios/kc-monday-extra.json";
import type { Beat, Flags, ReportLine, Talk } from "@/game/story";

export type ScenarioChoice = {
  id: string;
  label: string;
  outcome: string;
  score: number;
  verb: "decided" | "reported" | "passed";
  flag: string;
  ok: boolean;
  debrief: string;
  bark: string;
  report: string;
};

export type Scenario = {
  id: string;
  version: string;
  day: string;
  location: string;
  trigger: string;
  roles: string[];
  skill: string;
  controls: Record<string, string[]>;
  variants: { caller: string; pressure: string; tell: string }[];
  prompt: { who: string; role: string; text: string };
  choices: ScenarioChoice[];
  beat: string;
  next: Beat;
  flagKey: keyof Flags;
  tenant_tokens: string[];
  knowledge_check_pool: string;
};

export type CheckItem = {
  id: string;
  skill: string;
  prompt: string;
  choices: { id: string; label: string; correct: boolean }[];
};

export const mondayScenarios = [tailgate, phishing, vishing, usb, wire] as Scenario[];

const SKILL_FOR_BEAT: Record<string, string> = {
  "MON-01-tailgate": "physical-social-engineering",
  "MON-02-phishing": "phishing",
  "MON-03-vishing": "authentication",
  "MON-04-usb": "removable-media",
  "MON-05-wire": "payment-fraud",
};

type ExtraQuestion = {
  id: string;
  beat: string;
  prompt: string;
  choices: string[];
  answer: number;
};

function fromExtra(item: ExtraQuestion): CheckItem {
  return {
    id: item.id,
    skill: SKILL_FOR_BEAT[item.beat] ?? item.beat,
    prompt: item.prompt,
    choices: item.choices.map((label, index) => ({
      id: String.fromCharCode(97 + index),
      label,
      correct: index === item.answer,
    })),
  };
}

export const knowledgePool: CheckItem[] = [...(pool as CheckItem[]), ...extra.questions.map(fromExtra)];

const byChoice = new Map<string, { scenario: Scenario; choice: ScenarioChoice }>();
for (const scenario of mondayScenarios) {
  for (const choice of scenario.choices) byChoice.set(choice.id, { scenario, choice });
}

export function choiceOf(id: string) {
  return byChoice.get(id) ?? null;
}

export function scenarioForBeat(beat: string) {
  return mondayScenarios.find((scenario) => scenario.beat === beat) ?? null;
}

export function contentHash() {
  const raw = mondayScenarios.map((scenario) => `${scenario.id}@${scenario.version}`).join("|");
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function moduleVersion() {
  return mondayScenarios.map((scenario) => scenario.version).sort().at(-1) ?? "1.0.0";
}

export function talkFromScenario(beat: string): Talk | null {
  const scenario = scenarioForBeat(beat);
  if (!scenario) return null;
  return {
    who: scenario.prompt.who,
    role: scenario.prompt.role,
    text: scenario.prompt.text,
    choices: scenario.choices.map((choice) => ({ id: choice.id, label: choice.label })),
  };
}

export function drawKnowledgeCheck(count = 8) {
  const bag = [...knowledgePool];
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = bag[i];
    bag[i] = bag[j];
    bag[j] = swap;
  }
  return bag.slice(0, Math.min(count, bag.length));
}

export const PASS_MARK = 0.8;

export function skillScores(flags: Flags): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const scenario of mondayScenarios) {
    const flag = flags[scenario.flagKey];
    const choice = scenario.choices.find((item) => item.flag === flag);
    scores[scenario.skill] = choice?.score ?? 0;
  }
  return scores;
}

export function reportFromScenarios(flags: Flags): ReportLine[] {
  return mondayScenarios.map((scenario) => {
    const flag = flags[scenario.flagKey];
    const choice = scenario.choices.find((item) => item.flag === flag) ?? scenario.choices.find((item) => item.score === 0);
    return { ok: choice?.ok ?? false, text: choice?.report ?? "" };
  });
}
