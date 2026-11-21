import tailgate from "@/content/scenarios/mon-01-tailgate.json";
import phishing from "@/content/scenarios/mon-02-phishing.json";
import vishing from "@/content/scenarios/mon-03-vishing.json";
import usb from "@/content/scenarios/mon-04-usb.json";
import wire from "@/content/scenarios/mon-05-wire.json";
import updates from "@/content/scenarios/mon-06-updates.json";
import signin from "@/content/scenarios/mon-07-signin.json";
import misdirect from "@/content/scenarios/mon-08-misdirect.json";
import cleandesk from "@/content/scenarios/mon-09-cleandesk.json";
import pool from "@/content/scenarios/kc-monday.json";
import extra from "@/content/scenarios/kc-monday-extra.json";
import beats from "@/content/scenarios/kc-monday-beats.json";
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
  stage?: number;
  then?: string[];
  voice?: string;
  debrief_voice?: string;
  show_after?: string[];
  hide_after?: string[];
};

export type ScenarioVariant = {
  caller: string;
  pressure: string;
  tell: string;
  days?: number;
  city?: string;
  wrong_recipient?: string;
  screen_node?: string;
  compose_node?: string;
  sent_node?: string;
  printout_node?: string;
  printout?: string;
  sticky_node?: string;
  lock_node?: string;
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
  variants: ScenarioVariant[];
  prompt: { who: string; role: string; text: string };
  prompt_after_send?: { who: string; role: string; text: string };
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

export const mondayScenarios = [tailgate, phishing, vishing, usb, wire, updates, signin, misdirect, cleandesk] as Scenario[];

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

export const knowledgePool: CheckItem[] = [
  ...(pool as CheckItem[]),
  ...extra.questions.map(fromExtra),
  ...(beats as CheckItem[]),
];

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

const picks: Record<string, number> = {};

const TENANT: Record<string, string> = {
  COMPANY: "Harbor",
  HELPDESK_PHONE: "ext 4100",
  SECURITY_PHONE: "ext 4400",
  REPORT_CHANNEL: "security@harborandco.com",
};

const LAST_KEY = "drc-variants-last";

/** New variants for a run, never repeating the previous run's pick where a scenario has more than one. */
export function pickVariants(remember = true) {
  let last: Record<string, number> = {};
  try {
    last = JSON.parse(localStorage.getItem(LAST_KEY) ?? "{}");
  } catch {
    last = {};
  }
  for (const scenario of mondayScenarios) {
    const n = Math.max(1, scenario.variants.length);
    let pick = Math.floor(Math.random() * n);
    if (n > 1 && pick === last[scenario.id]) pick = (pick + 1 + Math.floor(Math.random() * (n - 1))) % n;
    picks[scenario.id] = pick;
  }
  try {
    if (remember) localStorage.setItem(LAST_KEY, JSON.stringify(picks));
  } catch {
    /* private mode: fine, just random */
  }
  return { ...picks };
}

pickVariants(false);

/** Put back saved variant picks, so a resumed Monday shows the same emails and callers. */
export function setVariants(saved: Record<string, number>) {
  for (const [k, v] of Object.entries(saved)) if (Number.isInteger(v)) picks[k] = v;
}

export function currentVariants() {
  return { ...picks };
}

export function variantOf(id: string): ScenarioVariant | null {
  const scenario = mondayScenarios.find((item) => item.id === id);
  if (!scenario) return null;
  return scenario.variants[picks[id] ?? 0] ?? null;
}

function tokenMap(scenario: Scenario) {
  const variant = (scenario.variants[picks[scenario.id] ?? 0] ?? {}) as Record<string, unknown>;
  const map: Record<string, string> = { ...TENANT };
  const fields: Record<string, string> = {
    DAYS: "days",
    CITY: "city",
    WRONG_RECIPIENT: "wrong_recipient",
    PRINTOUT: "printout",
    SCREEN_NODE: "screen_node",
    COMPOSE_NODE: "compose_node",
    SENT_NODE: "sent_node",
    PRINTOUT_NODE: "printout_node",
    STICKY_NODE: "sticky_node",
    LOCK_NODE: "lock_node",
  };
  for (const [token, key] of Object.entries(fields)) {
    if (variant[key] != null) map[token] = String(variant[key]);
  }
  for (const key of Object.keys(map)) {
    map[key] = map[key].replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, token: string) => map[token] ?? "");
  }
  return map;
}

export function fillText(text: string, scenario: Scenario) {
  const map = tokenMap(scenario);
  return text.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, token: string) => map[token] ?? "");
}

export function talkFromScenario(beat: string, stage = 1): Talk | null {
  const scenario = scenarioForBeat(beat);
  if (!scenario) return null;
  const prompt = stage === 2 && scenario.prompt_after_send ? scenario.prompt_after_send : scenario.prompt;
  const choices = scenario.choices.filter((choice) => choice.stage == null || choice.stage === stage);
  return {
    who: fillText(prompt.who, scenario),
    role: fillText(prompt.role, scenario),
    text: fillText(prompt.text, scenario),
    choices: choices.map((choice) => ({ id: choice.id, label: fillText(choice.label, scenario) })),
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
    return { ok: choice?.ok ?? false, text: choice ? fillText(choice.report, scenario) : "" };
  });
}
