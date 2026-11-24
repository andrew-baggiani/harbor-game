import type { D1Database } from "@/server/env";
import { assertOrgAdmin, type Access } from "@/server/db";
import { brandForPartner, type Brand } from "@/server/brand";
import { SHIFTS } from "@/content/week";
import { SCENARIOS } from "@/content/scenarioNames";

/** A client's training evidence on one page: who trained, what they decided, and which controls that covers.
 *  Built from the decision log, so it says only what people actually did. */
export type EvidencePack = {
  org: { id: string; name: string };
  partner: { name: string | null; brand: Brand | null };
  generatedAt: number;
  period: { from: number | null; to: number | null };
  totals: { people: number; trained: number; decisions: number; correct: number; shiftsCompleted: number };
  people: { email: string; name: string | null; shifts: string[]; decisions: number; correct: number; lastActive: number | null }[];
  scenarios: { id: string; label: string; decisions: number; correct: number }[];
  controls: { framework: string; control: string; decisions: number; people: number }[];
};

const LABELS = new Map<string, string>();
for (const s of SCENARIOS) LABELS.set(s.id, `Monday: ${s.name}`);
for (const sh of SHIFTS) for (const b of sh.beats) LABELS.set(b.scenario.id, `${sh.kind === "track" ? `${sh.day} track` : sh.day}: ${b.scenario.prompt.who}`);
const SHIFT_NAMES = new Map<string, string>([["monday", "Monday"], ["sunday", "Sunday"], ...SHIFTS.map((s) => [s.id, s.day] as [string, string])]);

export async function evidencePack(db: D1Database, a: Access, orgId: string): Promise<EvidencePack> {
  const org = await assertOrgAdmin(db, a, orgId);
  const partner = org.partner_id
    ? await db.prepare("SELECT name FROM partners WHERE id = ?").bind(org.partner_id).first<{ name: string }>()
    : null;
  const brand = await brandForPartner(db, org.partner_id);

  const { results: team } = await db
    .prepare("SELECT u.id, u.email, m.display_name FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.org_id = ? AND m.role = 'learner' ORDER BY u.email")
    .bind(orgId)
    .all<{ id: string; email: string; display_name: string | null }>();
  const { results: events } = await db
    .prepare("SELECT user_id, ts, shift, kind, scenario_id, good, controls FROM events WHERE org_id = ? ORDER BY ts")
    .bind(orgId)
    .all<{ user_id: string; ts: number; shift: string; kind: string; scenario_id: string | null; good: number | null; controls: string | null }>();

  const people = new Map(team.map((t) => [t.id, { email: t.email, name: t.display_name, shifts: new Set<string>(), decisions: 0, correct: 0, lastActive: null as number | null }]));
  const scen = new Map<string, { decisions: number; correct: number }>();
  const ctrl = new Map<string, { framework: string; control: string; decisions: number; people: Set<string> }>();
  let from: number | null = null;
  let to: number | null = null;
  for (const e of events) {
    from = from === null ? e.ts : Math.min(from, e.ts);
    to = to === null ? e.ts : Math.max(to, e.ts);
    const p = people.get(e.user_id);
    if (p) p.lastActive = Math.max(p.lastActive ?? 0, e.ts);
    if (e.kind === "shift_complete") {
      p?.shifts.add(SHIFT_NAMES.get(e.shift) ?? e.shift);
      continue;
    }
    if (!e.scenario_id) continue;
    const s = scen.get(e.scenario_id) ?? { decisions: 0, correct: 0 };
    s.decisions++;
    if (e.good) s.correct++;
    scen.set(e.scenario_id, s);
    if (p) {
      p.decisions++;
      if (e.good) p.correct++;
    }
    let mapped: Record<string, string[]> = {};
    try {
      const parsed = e.controls ? JSON.parse(e.controls) : {};
      mapped = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      mapped = {};
    }
    for (const [fw, ids] of Object.entries(mapped)) {
      for (const id of Array.isArray(ids) ? ids : []) {
        const k = `${fw}|${id}`;
        const c = ctrl.get(k) ?? { framework: fw, control: id, decisions: 0, people: new Set<string>() };
        c.decisions++;
        c.people.add(e.user_id);
        ctrl.set(k, c);
      }
    }
  }

  const list = [...people.values()].map((p) => ({ ...p, shifts: [...p.shifts] }));
  return {
    org: { id: org.id, name: org.name },
    partner: { name: partner?.name ?? null, brand },
    generatedAt: Date.now(),
    period: { from, to },
    totals: {
      people: list.length,
      trained: list.filter((p) => p.shifts.length > 0).length,
      decisions: list.reduce((n, p) => n + p.decisions, 0),
      correct: list.reduce((n, p) => n + p.correct, 0),
      shiftsCompleted: list.reduce((n, p) => n + p.shifts.length, 0),
    },
    people: list,
    scenarios: [...scen.entries()].map(([id, v]) => ({ id, label: LABELS.get(id) ?? id, ...v })).sort((x, y) => x.label.localeCompare(y.label)),
    controls: [...ctrl.values()]
      .map((c) => ({ framework: c.framework, control: c.control, decisions: c.decisions, people: c.people.size }))
      .sort((x, y) => x.framework.localeCompare(y.framework) || x.control.localeCompare(y.control, undefined, { numeric: true })),
  };
}
