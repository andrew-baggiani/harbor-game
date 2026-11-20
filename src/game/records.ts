import { choiceOf, contentHash, moduleVersion, mondayScenarios, PASS_MARK, type CheckItem } from "@/game/scenarios";
import type { Flags } from "@/game/story";
import { scoreOf } from "@/game/story";

export type XapiStatement = {
  actor: { account: { homePage: string; name: string } };
  verb: { id: string; display: { "en-US": "decided" | "reported" | "passed" } };
  object: { id: string; definition: { name: { "en-US": string } } };
  result: {
    score: { scaled: number; raw: number; min: number; max: number };
    success: boolean;
    response: string;
  };
  context: {
    extensions: {
      "https://harbor.example/controls": Record<string, string[]>;
      "https://harbor.example/outcome": string;
      "https://harbor.example/skill": string;
    };
  };
  timestamp: string;
};

export type LearnerRecord = {
  tenant_id: string;
  user_id: string;
  email: string;
  roles: string[];
  module_id: string;
  module_version: string;
  content_hash: string;
  assigned_at: string;
  reason: "hire" | "annual" | "policy_change" | "remediation";
  started_at: string;
  completed_at: string | null;
  decisions: XapiStatement[];
  score: number;
  skills: Record<string, number>;
  passed: boolean;
  attempts: number;
  attestation_accepted_at: string | null;
  certificate_id: string | null;
  knowledge_check: { attempt: number; correct: number; asked: number; passed: boolean; answers: { id: string; choice: string; correct: boolean }[] }[];
  variants: Record<string, number>;
};

const HOME = "https://harbor.example/tenant/harbor-demo";

let record: LearnerRecord | null = null;

function blank(now: string): LearnerRecord {
  return {
    tenant_id: "harbor-demo",
    user_id: "new-hire",
    email: "",
    roles: ["all"],
    module_id: "monday-core",
    module_version: moduleVersion(),
    content_hash: contentHash(),
    assigned_at: now,
    reason: "hire",
    started_at: now,
    completed_at: null,
    decisions: [],
    score: 0,
    skills: {},
    passed: false,
    attempts: 0,
    attestation_accepted_at: null,
    certificate_id: null,
    knowledge_check: [],
    variants: {},
  };
}

/** Put back a saved record (auto-save resume). */
export function restoreRecord(saved: LearnerRecord) {
  record = saved;
}

export function resetRecord() {
  record = blank(new Date().toISOString());
  return record;
}

export function learnerRecord() {
  if (!record) resetRecord();
  return record as LearnerRecord;
}

export function noteVariants(pick: Record<string, number>) {
  learnerRecord().variants = pick;
}

export function recordDecision(id: string) {
  const found = choiceOf(id);
  if (!found) return;
  const current = learnerRecord();
  const { scenario, choice } = found;
  const statement: XapiStatement = {
    actor: { account: { homePage: HOME, name: current.user_id } },
    verb: {
      id: `https://harbor.example/verbs/${choice.verb}`,
      display: { "en-US": choice.verb },
    },
    object: {
      id: `https://harbor.example/beats/${scenario.id}`,
      definition: { name: { "en-US": scenario.id } },
    },
    result: {
      score: { scaled: choice.score / 100, raw: choice.score, min: 0, max: 100 },
      success: choice.score >= 100,
      response: choice.id,
    },
    context: {
      extensions: {
        "https://harbor.example/controls": scenario.controls,
        "https://harbor.example/outcome": choice.outcome,
        "https://harbor.example/skill": scenario.skill,
      },
    },
    timestamp: new Date().toISOString(),
  };
  current.decisions.push(statement);
}

export function sealShift(flags: Flags) {
  const current = learnerRecord();
  const scored = scoreOf(flags);
  current.completed_at = current.completed_at ?? new Date().toISOString();
  current.score = scored.score;
  current.skills = scored.skills;
  return current;
}

export function gradeKnowledge(items: CheckItem[], answers: { id: string; choice: string }[]) {
  const current = learnerRecord();
  current.attempts += 1;
  const detail = items.map((item) => {
    const picked = answers.find((answer) => answer.id === item.id)?.choice ?? "";
    const right = item.choices.find((choice) => choice.id === picked)?.correct ?? false;
    return { id: item.id, choice: picked, correct: right };
  });
  const correct = detail.filter((row) => row.correct).length;
  const passed = items.length > 0 && correct / items.length >= PASS_MARK;
  current.knowledge_check.push({ attempt: current.attempts, correct, asked: items.length, passed, answers: detail });
  if (passed) {
    current.passed = true;
    current.attestation_accepted_at = new Date().toISOString();
    current.certificate_id = `HARBOR-MON-${current.attestation_accepted_at.slice(0, 10)}-${current.attempts}`;
    current.decisions.push({
      actor: { account: { homePage: HOME, name: current.user_id } },
      verb: { id: "https://harbor.example/verbs/passed", display: { "en-US": "passed" } },
      object: { id: "https://harbor.example/beats/MON-KC", definition: { name: { "en-US": "monday-knowledge-check" } } },
      result: {
        score: { scaled: correct / items.length, raw: correct, min: 0, max: items.length },
        success: true,
        response: `${correct}/${items.length}`,
      },
      context: {
        extensions: {
          "https://harbor.example/controls": { NIST_800_53r5: ["AT-4"] },
          "https://harbor.example/outcome": "knowledge_check",
          "https://harbor.example/skill": mondayScenarios.map((scenario) => scenario.skill).join(","),
        },
      },
      timestamp: current.attestation_accepted_at,
    });
  }
  return { correct, asked: items.length, passed };
}

export function exportRecord(callsign: string, flags: Flags) {
  const current = sealShift(flags);
  current.user_id = callsign || current.user_id;
  const body = JSON.stringify(current, null, 2);
  const file = new Blob([body], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "harbor-monday-record.json";
  link.click();
  URL.revokeObjectURL(url);
}
