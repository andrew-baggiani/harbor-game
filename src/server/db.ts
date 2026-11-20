// All portal data access goes through here. Every tenant-owned read or write takes the caller's
// access context and checks it against the org or partner before touching the row.
import type { D1Database } from "@/server/env";
import { newId, newToken, sha256 } from "@/server/crypto";
import { seatProblem, startTrial } from "@/server/billing";
import { choiceOf } from "@/game/scenarios";
import { SHIFT_IDS, weekChoiceOf } from "@/content/week";

const now = () => Date.now();
const MAGIC_TTL = 15 * 60 * 1000;
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;

export const POINTS = { good: 100, missed: 0, complete: 50 } as const;
export const SHIFTS = ["monday"] as const;
export const TRACKS = ["track-admin", "track-finance", "track-helpdesk"] as const;
export type TrackId = (typeof TRACKS)[number];
const NOT_TRACK = "shifts NOT LIKE '%track-%'";

export type User = { id: string; email: string; name: string | null };
export type Role = "partner_admin" | "org_admin" | "learner";
export type Membership = {
  id: string;
  role: Role;
  org_id: string | null;
  partner_id: string | null;
  display_name: string | null;
  org_name: string | null;
  partner_name: string | null;
  org_partner_id: string | null;
};
export type Access = { user: User; memberships: Membership[] };

export class Forbidden extends Error {}

/* ------------------------------------------------------------------ users and auth */

export function normEmail(email: string): string | null {
  const e = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254 ? e : null;
}

export async function findOrCreateUser(db: D1Database, email: string): Promise<User> {
  const existing = await db.prepare("SELECT id, email, name FROM users WHERE email = ?").bind(email).first<User>();
  if (existing) return existing;
  const user = { id: newId("u_"), email, name: null };
  await db.prepare("INSERT INTO users (id, email, name, created_at) VALUES (?, ?, NULL, ?)").bind(user.id, email, now()).run();
  return user;
}

export async function createMagicLink(db: D1Database, userId: string, next: string): Promise<string> {
  const token = newToken();
  await db
    .prepare("INSERT INTO magic_links (token_hash, user_id, next_path, expires_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256(token), userId, next, now() + MAGIC_TTL)
    .run();
  return token;
}

export async function consumeMagicLink(db: D1Database, token: string): Promise<{ userId: string; next: string } | null> {
  const hash = await sha256(token);
  const row = await db
    .prepare("SELECT user_id, next_path, expires_at, used_at FROM magic_links WHERE token_hash = ?")
    .bind(hash)
    .first<{ user_id: string; next_path: string | null; expires_at: number; used_at: number | null }>();
  if (!row || row.used_at || row.expires_at < now()) return null;
  const res = await db.prepare("UPDATE magic_links SET used_at = ? WHERE token_hash = ? AND used_at IS NULL").bind(now(), hash).run();
  if (!res.meta?.changes) return null;
  return { userId: row.user_id, next: row.next_path ?? "/portal" };
}

export async function createSession(db: D1Database, userId: string): Promise<{ token: string; maxAge: number }> {
  const token = newToken();
  await db
    .prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256(token), userId, now(), now() + SESSION_TTL)
    .run();
  return { token, maxAge: Math.floor(SESSION_TTL / 1000) };
}

export async function sessionUser(db: D1Database, token: string): Promise<User | null> {
  return db
    .prepare("SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?")
    .bind(await sha256(token), now())
    .first<User>();
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
}

export async function loadAccess(db: D1Database, user: User): Promise<Access> {
  const { results } = await db
    .prepare(
      `SELECT m.id, m.role, m.org_id, m.partner_id, m.display_name,
              o.name AS org_name, o.partner_id AS org_partner_id, p.name AS partner_name
         FROM memberships m
         LEFT JOIN orgs o ON o.id = m.org_id
         LEFT JOIN partners p ON p.id = m.partner_id
        WHERE m.user_id = ?
        ORDER BY m.created_at`,
    )
    .bind(user.id)
    .all<Membership>();
  return { user, memberships: results };
}

/* ------------------------------------------------------------------ permission checks */

function partnerIds(a: Access, role: Role = "partner_admin") {
  return a.memberships.filter((m) => m.role === role && m.partner_id).map((m) => m.partner_id as string);
}

async function orgRow(db: D1Database, orgId: string) {
  return db
    .prepare("SELECT id, partner_id, name, domain, leaderboard_enabled FROM orgs WHERE id = ?")
    .bind(orgId)
    .first<{ id: string; partner_id: string | null; name: string; domain: string | null; leaderboard_enabled: number }>();
}

/** Admin of the org directly, or a partner admin of the partner that owns it. */
export async function assertOrgAdmin(db: D1Database, a: Access, orgId: string) {
  const org = await orgRow(db, orgId);
  if (!org) throw new Forbidden("Org not found");
  const direct = a.memberships.some((m) => m.role === "org_admin" && m.org_id === orgId);
  const viaPartner = org.partner_id !== null && partnerIds(a).includes(org.partner_id);
  if (!direct && !viaPartner) throw new Forbidden("Not an admin of this org");
  return org;
}

export async function assertOrgMember(db: D1Database, a: Access, orgId: string) {
  const org = await orgRow(db, orgId);
  if (!org) throw new Forbidden("Org not found");
  const member = a.memberships.some((m) => m.org_id === orgId);
  const viaPartner = org.partner_id !== null && partnerIds(a).includes(org.partner_id);
  if (!member && !viaPartner) throw new Forbidden("Not a member of this org");
  return { org, isAdmin: viaPartner || a.memberships.some((m) => m.role === "org_admin" && m.org_id === orgId) };
}

export function assertPartnerAdmin(a: Access, partnerId: string) {
  if (!partnerIds(a).includes(partnerId)) throw new Forbidden("Not an admin of this partner");
}

/** The org a learner's decisions are filed under: their first org membership. */
export function homeOrg(a: Access): string | null {
  return a.memberships.find((m) => m.org_id && m.role === "learner")?.org_id ?? a.memberships.find((m) => m.org_id)?.org_id ?? null;
}

/* ------------------------------------------------------------------ tenants */

export async function createPartner(db: D1Database, a: Access, name: string) {
  const id = newId("p_");
  await db.batch([
    db.prepare("INSERT INTO partners (id, name, created_at) VALUES (?, ?, ?)").bind(id, name, now()),
    db
      .prepare("INSERT INTO memberships (id, user_id, partner_id, role, created_at) VALUES (?, ?, ?, 'partner_admin', ?)")
      .bind(newId("m_"), a.user.id, id, now()),
  ]);
  return { id, name };
}

/** A direct customer (creator becomes its admin), or a client org under a partner the caller administers. */
export async function createOrg(db: D1Database, a: Access, input: { name: string; domain?: string | null; partnerId?: string | null }) {
  if (input.partnerId) assertPartnerAdmin(a, input.partnerId);
  const id = newId("o_");
  const stmts = [
    db
      .prepare("INSERT INTO orgs (id, partner_id, name, domain, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(id, input.partnerId ?? null, input.name, input.domain ?? null, now()),
  ];
  if (!input.partnerId) {
    stmts.push(
      db
        .prepare("INSERT INTO memberships (id, user_id, org_id, role, created_at) VALUES (?, ?, ?, 'org_admin', ?)")
        .bind(newId("m_"), a.user.id, id, now()),
    );
  }
  await db.batch(stmts);
  // A company signing itself up starts on a trial; MSP client orgs are billed through the partner.
  if (!input.partnerId) await startTrial(db, id);
  return { id, name: input.name };
}

export async function partnerOverview(db: D1Database, a: Access, partnerId: string) {
  assertPartnerAdmin(a, partnerId);
  const { results: orgs } = await db
    .prepare("SELECT id, name, domain, created_at FROM orgs WHERE partner_id = ? ORDER BY name")
    .bind(partnerId)
    .all<{ id: string; name: string; domain: string | null; created_at: number }>();
  const { results: people } = await db
    .prepare(
      `SELECT m.org_id, m.user_id FROM memberships m JOIN orgs o ON o.id = m.org_id
        WHERE o.partner_id = ? AND m.role = 'learner'`,
    )
    .bind(partnerId)
    .all<{ org_id: string; user_id: string }>();
  const { results: events } = await db
    .prepare(
      `SELECT e.org_id, e.user_id, e.run_id, e.kind, e.points, e.ts FROM events e JOIN orgs o ON o.id = e.org_id
        WHERE o.partner_id = ? AND e.shift = 'monday'`,
    )
    .bind(partnerId)
    .all<EventLite & { org_id: string }>();
  const { results: due } = await db
    .prepare(
      `SELECT c.org_id, MAX(c.due_at) AS due_at FROM campaigns c JOIN orgs o ON o.id = c.org_id
        WHERE o.partner_id = ? GROUP BY c.org_id`,
    )
    .bind(partnerId)
    .all<{ org_id: string; due_at: number | null }>();
  const dueBy = new Map(due.map((d) => [d.org_id, d.due_at]));
  return orgs.map((o) => {
    const learnerIds = people.filter((p) => p.org_id === o.id).map((p) => p.user_id);
    const best = scoreRuns(events.filter((e) => e.org_id === o.id));
    let completed = 0;
    let inProgress = 0;
    let scoreSum = 0;
    let scored = 0;
    let lastActive = 0;
    for (const id of learnerIds) {
      const b = best.get(id);
      if (!b) continue;
      if (b.status === "Complete") completed++;
      else inProgress++;
      scoreSum += b.score;
      scored++;
      lastActive = Math.max(lastActive, b.last);
    }
    const learners = learnerIds.length;
    return {
      ...o,
      learners,
      completed,
      inProgress,
      notStarted: learners - completed - inProgress,
      completion: learners ? Math.round((completed / learners) * 100) : 0,
      avgScore: scored ? Math.round(scoreSum / scored) : null,
      lastActive: lastActive || null,
      dueAt: dueBy.get(o.id) ?? null,
    };
  });
}

/** Recent decisions and finished shifts, newest first, for a partner (all clients) or one org. */
export async function activity(db: D1Database, a: Access, scope: { partnerId?: string | null; orgId?: string | null }) {
  let where: string;
  let bind: string;
  if (scope.partnerId) {
    assertPartnerAdmin(a, scope.partnerId);
    where = "o.partner_id = ?";
    bind = scope.partnerId;
  } else if (scope.orgId) {
    await assertOrgAdmin(db, a, scope.orgId);
    where = "e.org_id = ?";
    bind = scope.orgId;
  } else throw new Forbidden("Scope required");
  const { results } = await db
    .prepare(
      `SELECT e.id, e.kind, e.scenario_id, e.good, e.ts, o.id AS org_id, o.name AS org_name, u.email, m.display_name
         FROM events e
         JOIN orgs o ON o.id = e.org_id
         JOIN users u ON u.id = e.user_id
         LEFT JOIN memberships m ON m.user_id = e.user_id AND m.org_id = e.org_id AND m.role = 'learner'
        WHERE ${where}
        ORDER BY e.ts DESC LIMIT 14`,
    )
    .bind(bind)
    .all<{ id: string; kind: string; scenario_id: string | null; good: number | null; ts: number; org_id: string; org_name: string; email: string; display_name: string | null }>();
  return results.map((r) => ({
    id: r.id,
    kind: r.kind,
    scenarioId: r.scenario_id,
    good: r.good === null ? null : !!r.good,
    ts: r.ts,
    orgId: r.org_id,
    orgName: r.org_name,
    who: r.display_name?.trim() || r.email,
  }));
}

/* ------------------------------------------------------------------ learners, campaigns, settings */

type EventLite = { user_id: string; run_id: string; kind: string; points: number; ts: number };

function scoreRuns(events: EventLite[]) {
  const runs = new Map<string, { user: string; points: number; complete: boolean; last: number }>();
  for (const e of events) {
    const key = `${e.user_id}|${e.run_id}`;
    const r = runs.get(key) ?? { user: e.user_id, points: 0, complete: false, last: 0 };
    r.points += e.points;
    if (e.kind === "shift_complete") r.complete = true;
    r.last = Math.max(r.last, e.ts);
    runs.set(key, r);
  }
  const best = new Map<string, { score: number; status: "In progress" | "Complete"; last: number }>();
  for (const r of runs.values()) {
    const prev = best.get(r.user);
    const status = r.complete || prev?.status === "Complete" ? "Complete" : "In progress";
    best.set(r.user, { score: Math.max(prev?.score ?? 0, r.points), status, last: Math.max(prev?.last ?? 0, r.last) });
  }
  return best;
}

export async function orgDetail(db: D1Database, a: Access, orgId: string) {
  const org = await assertOrgAdmin(db, a, orgId);
  const { results: people } = await db
    .prepare(
      `SELECT u.id AS user_id, u.email, m.display_name, m.role, m.created_at
         FROM memberships m JOIN users u ON u.id = m.user_id
        WHERE m.org_id = ? ORDER BY m.created_at`,
    )
    .bind(orgId)
    .all<{ user_id: string; email: string; display_name: string | null; role: Role; created_at: number }>();
  const { results: allEvents } = await db
    .prepare("SELECT user_id, run_id, kind, points, ts, shift FROM events WHERE org_id = ?")
    .bind(orgId)
    .all<EventLite & { shift: string }>();
  const best = scoreRuns(allEvents.filter((e) => e.shift === "monday"));
  const week = new Map<string, Record<string, "Complete" | "In progress">>();
  for (const e of allEvents) {
    if (e.shift === "monday" || e.shift === "reminder") continue;
    const rec = week.get(e.user_id) ?? {};
    if (e.kind === "shift_complete") rec[e.shift] = "Complete";
    else rec[e.shift] ??= "In progress";
    week.set(e.user_id, rec);
  }
  // Time on the decisions vs. exploring, from each learner's latest completion of every shift.
  const { results: doneRows } = await db
    .prepare("SELECT user_id, shift, xapi, ts FROM events WHERE org_id = ? AND kind = 'shift_complete' ORDER BY ts")
    .bind(orgId)
    .all<{ user_id: string; shift: string; xapi: string; ts: number }>();
  const latest = new Map<string, { onTask: number; exploring: number }>();
  for (const r of doneRows) {
    try {
      const ext = (JSON.parse(r.xapi) as { result?: { extensions?: Record<string, number> } }).result?.extensions;
      if (!ext) continue;
      latest.set(`${r.user_id}|${r.shift}`, {
        onTask: Number(ext["https://dryruncyber.com/xapi/on-task-seconds"]) || 0,
        exploring: Number(ext["https://dryruncyber.com/xapi/exploring-seconds"]) || 0,
      });
    } catch {
      /* older statements carry no timing */
    }
  }
  const timeBy = new Map<string, { onTask: number; exploring: number }>();
  for (const [key, t] of latest) {
    const user = key.split("|")[0];
    const sum = timeBy.get(user) ?? { onTask: 0, exploring: 0 };
    sum.onTask += t.onTask;
    sum.exploring += t.exploring;
    timeBy.set(user, sum);
  }
  const lastReminder = new Map<string, number>();
  for (const e of allEvents) if (e.shift === "reminder") lastReminder.set(e.user_id, Math.max(lastReminder.get(e.user_id) ?? 0, e.ts));
  const { results: trackRows } = await db
    .prepare(
      `SELECT a.user_id, c.shifts FROM assignments a JOIN campaigns c ON c.id = a.campaign_id
        WHERE a.org_id = ? AND c.shifts LIKE '%track-%'`,
    )
    .bind(orgId)
    .all<{ user_id: string; shifts: string }>();
  const tracksBy = new Map<string, string[]>();
  for (const r of trackRows) tracksBy.set(r.user_id, [...(tracksBy.get(r.user_id) ?? []), ...(JSON.parse(r.shifts) as string[])]);
  const { results: perScenario } = await db
    .prepare(
      `SELECT scenario_id, SUM(good) AS good, COUNT(*) AS total FROM events
        WHERE org_id = ? AND kind = 'decision' AND scenario_id IS NOT NULL GROUP BY scenario_id`,
    )
    .bind(orgId)
    .all<{ scenario_id: string; good: number; total: number }>();
  const campaign = await db
    .prepare(`SELECT id, name, shifts, due_at FROM campaigns WHERE org_id = ? AND ${NOT_TRACK} ORDER BY created_at DESC LIMIT 1`)
    .bind(orgId)
    .first<{ id: string; name: string; shifts: string; due_at: number | null }>();
  const learners = people.map((p) => {
    const b = best.get(p.user_id);
    return {
      userId: p.user_id,
      email: p.email,
      displayName: p.display_name,
      role: p.role,
      monday: b?.status ?? "Not started",
      score: b?.score ?? 0,
      lastActive: b?.last ?? null,
      week: week.get(p.user_id) ?? {},
      tracks: tracksBy.get(p.user_id) ?? [],
      lastReminder: lastReminder.get(p.user_id) ?? null,
      time: timeBy.get(p.user_id) ?? null,
    };
  });
  return {
    org: { id: org.id, name: org.name, domain: org.domain, partnerId: org.partner_id, leaderboardEnabled: !!org.leaderboard_enabled },
    learners,
    campaign: campaign ? { id: campaign.id, name: campaign.name, shifts: JSON.parse(campaign.shifts) as string[], dueAt: campaign.due_at } : null,
    scenarios: perScenario.map((r) => ({ id: r.scenario_id, good: r.good, total: r.total })),
  };
}

/** Adds learners (creating user records as needed). Returns the users that are new to this org. */
export async function addLearners(db: D1Database, a: Access, orgId: string, emails: string[]) {
  await assertOrgAdmin(db, a, orgId);
  let fresh = 0;
  for (const email of emails) {
    const hit = await db
      .prepare("SELECT 1 FROM memberships m JOIN users u ON u.id = m.user_id WHERE u.email = ? AND m.org_id = ? AND m.role = 'learner'")
      .bind(email, orgId)
      .first();
    if (!hit) fresh += 1;
  }
  const problem = await seatProblem(db, orgId, fresh);
  if (problem) throw new Forbidden(problem);
  const added: User[] = [];
  const already: string[] = [];
  for (const email of emails) {
    const user = await findOrCreateUser(db, email);
    const exists = await db.prepare("SELECT id FROM memberships WHERE user_id = ? AND org_id = ? AND role = 'learner'").bind(user.id, orgId).first();
    if (exists) {
      already.push(email);
      continue;
    }
    await db
      .prepare("INSERT INTO memberships (id, user_id, org_id, role, created_at) VALUES (?, ?, ?, 'learner', ?)")
      .bind(newId("m_"), user.id, orgId, now())
      .run();
    added.push(user);
  }
  const campaign = await db.prepare(`SELECT id FROM campaigns WHERE org_id = ? AND ${NOT_TRACK} ORDER BY created_at DESC LIMIT 1`).bind(orgId).first<{ id: string }>();
  if (campaign) {
    for (const u of added) {
      await db
        .prepare("INSERT OR IGNORE INTO assignments (id, org_id, campaign_id, user_id, invited_at, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(newId("as_"), orgId, campaign.id, u.id, now(), now())
        .run();
    }
  }
  return { added, already };
}

/** One campaign per org for now: Monday, with an optional due date. Assigns every current learner. */
export async function setCampaign(db: D1Database, a: Access, orgId: string, dueAt: number | null) {
  await assertOrgAdmin(db, a, orgId);
  let campaign = await db.prepare(`SELECT id FROM campaigns WHERE org_id = ? AND ${NOT_TRACK} ORDER BY created_at DESC LIMIT 1`).bind(orgId).first<{ id: string }>();
  if (campaign) {
    await db.prepare("UPDATE campaigns SET due_at = ? WHERE id = ? AND org_id = ?").bind(dueAt, campaign.id, orgId).run();
  } else {
    campaign = { id: newId("c_") };
    await db
      .prepare("INSERT INTO campaigns (id, org_id, name, shifts, due_at, created_at) VALUES (?, ?, 'Monday: First night', ?, ?, ?)")
      .bind(campaign.id, orgId, JSON.stringify(SHIFTS), dueAt, now())
      .run();
  }
  const { results } = await db.prepare("SELECT user_id FROM memberships WHERE org_id = ? AND role = 'learner'").bind(orgId).all<{ user_id: string }>();
  for (const r of results) {
    await db
      .prepare("INSERT OR IGNORE INTO assignments (id, org_id, campaign_id, user_id, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(newId("as_"), orgId, campaign.id, r.user_id, now())
      .run();
  }
  return campaign;
}

const TRACK_NAME: Record<TrackId, string> = {
  "track-admin": "Track: Admins",
  "track-finance": "Track: Finance",
  "track-helpdesk": "Track: Help desk",
};

/** Assign or remove a role track for one learner. Each track is its own campaign, so records stay separate. */
export async function setTrack(db: D1Database, a: Access, orgId: string, userId: string, track: TrackId, on: boolean) {
  await assertOrgAdmin(db, a, orgId);
  if (!TRACKS.includes(track)) throw new Forbidden("Unknown track");
  const member = await db.prepare("SELECT id FROM memberships WHERE org_id = ? AND user_id = ? AND role = 'learner'").bind(orgId, userId).first();
  if (!member) throw new Forbidden("Not a learner in this org");
  let campaign = await db
    .prepare("SELECT id FROM campaigns WHERE org_id = ? AND shifts = ? LIMIT 1")
    .bind(orgId, JSON.stringify([track]))
    .first<{ id: string }>();
  if (!campaign) {
    if (!on) return { ok: true };
    campaign = { id: newId("c_") };
    await db
      .prepare("INSERT INTO campaigns (id, org_id, name, shifts, due_at, created_at) VALUES (?, ?, ?, ?, NULL, ?)")
      .bind(campaign.id, orgId, TRACK_NAME[track], JSON.stringify([track]), now())
      .run();
  }
  if (on) {
    await db
      .prepare("INSERT OR IGNORE INTO assignments (id, org_id, campaign_id, user_id, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(newId("as_"), orgId, campaign.id, userId, now())
      .run();
  } else {
    await db.prepare("DELETE FROM assignments WHERE campaign_id = ? AND user_id = ? AND org_id = ?").bind(campaign.id, userId, orgId).run();
  }
  return { ok: true };
}

export async function setLeaderboardEnabled(db: D1Database, a: Access, orgId: string, enabled: boolean) {
  await assertOrgAdmin(db, a, orgId);
  await db.prepare("UPDATE orgs SET leaderboard_enabled = ? WHERE id = ?").bind(enabled ? 1 : 0, orgId).run();
}

export async function setDisplayName(db: D1Database, a: Access, orgId: string, name: string | null) {
  await assertOrgMember(db, a, orgId);
  await db.prepare("UPDATE memberships SET display_name = ? WHERE user_id = ? AND org_id = ?").bind(name, a.user.id, orgId).run();
}

export async function leaderboard(db: D1Database, a: Access, orgId: string) {
  const { org, isAdmin } = await assertOrgMember(db, a, orgId);
  if (!org.leaderboard_enabled) return { enabled: false, isAdmin, rows: [] as LeaderRow[] };
  const { results: people } = await db
    .prepare("SELECT user_id, display_name FROM memberships WHERE org_id = ? AND role = 'learner' ORDER BY created_at")
    .bind(orgId)
    .all<{ user_id: string; display_name: string | null }>();
  const { results: events } = await db
    .prepare("SELECT user_id, run_id, kind, points, ts FROM events WHERE org_id = ?")
    .bind(orgId)
    .all<EventLite>();
  const best = scoreRuns(events);
  const rows: LeaderRow[] = people
    .map((p, i) => ({
      name: p.display_name?.trim() || `Teammate ${i + 1}`,
      score: best.get(p.user_id)?.score ?? 0,
      complete: best.get(p.user_id)?.status === "Complete",
      you: p.user_id === a.user.id,
    }))
    .filter((r) => r.score > 0 || r.you)
    .sort((x, y) => y.score - x.score)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return { enabled: true, isAdmin, rows };
}
export type LeaderRow = { rank?: number; name: string; score: number; complete: boolean; you: boolean };

export async function exportEvents(db: D1Database, a: Access, orgId: string) {
  await assertOrgAdmin(db, a, orgId);
  const { results } = await db
    .prepare(
      `SELECT e.ts, u.email, e.shift, e.kind, e.scenario_id, e.choice_id, e.good, e.points, e.controls, e.run_id
         FROM events e JOIN users u ON u.id = e.user_id
        WHERE e.org_id = ? ORDER BY e.ts`,
    )
    .bind(orgId)
    .all<{ ts: number; email: string; shift: string; kind: string; scenario_id: string | null; choice_id: string | null; good: number | null; points: number; controls: string | null; run_id: string }>();
  return results;
}

/* ------------------------------------------------------------------ the decision log */

export type EventInput = { runId: string; choiceId?: string; complete?: boolean; shift?: string; timing?: unknown };

/** Client-reported time split for a finished shift. Clamped: it's informational, never scored. */
function cleanTiming(t: unknown): { onTask: number; exploring: number; finds: number; findsTotal: number } | null {
  if (!t || typeof t !== "object") return null;
  const o = t as Record<string, unknown>;
  const n = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : 0);
  return { onTask: n(o.onTask, 4 * 3600), exploring: n(o.exploring, 4 * 3600), finds: n(o.finds, 50), findsTotal: n(o.findsTotal, 50) };
}

/** Scored on the server from the scenario content: the client only says which choice it made. */
export async function recordEvent(db: D1Database, a: Access, input: EventInput) {
  const orgId = homeOrg(a);
  if (!orgId) throw new Forbidden("Not a learner in any org");
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(input.runId)) throw new Forbidden("Bad run id");
  const ts = now();
  const actor = { objectType: "Agent", account: { homePage: "https://dryruncyber.com", name: a.user.id } };

  if (input.complete) {
    const shift = input.shift ?? "monday";
    const timing = cleanTiming(input.timing);
    if (!(SHIFT_IDS as readonly string[]).includes(shift) || shift === "reminder") throw new Forbidden("Unknown shift");
    const statement = {
      actor,
      verb: { id: "http://adlnet.gov/expapi/verbs/completed", display: { "en-US": "completed" } },
      object: { id: `https://dryruncyber.com/xapi/shift/${shift}`, definition: { name: { "en-US": shift } } },
      result: {
        completion: true,
        score: { raw: POINTS.complete },
        ...(timing
          ? {
              duration: `PT${timing.onTask + timing.exploring}S`,
              extensions: {
                "https://dryruncyber.com/xapi/on-task-seconds": timing.onTask,
                "https://dryruncyber.com/xapi/exploring-seconds": timing.exploring,
                "https://dryruncyber.com/xapi/finds": `${timing.finds}/${timing.findsTotal}`,
              },
            }
          : {}),
      },
      timestamp: new Date(ts).toISOString(),
    };
    const res = await db
      .prepare(
        `INSERT OR IGNORE INTO events (id, org_id, user_id, run_id, shift, kind, points, xapi, ts)
         VALUES (?, ?, ?, ?, ?, 'shift_complete', ?, ?, ?)`,
      )
      .bind(newId("e_"), orgId, a.user.id, input.runId, shift, POINTS.complete, JSON.stringify(statement), ts)
      .run();
    return { orgId, points: POINTS.complete, recorded: !!res.meta?.changes };
  }

  const found = input.choiceId ? (choiceOf(input.choiceId) ?? weekChoiceOf(input.choiceId)) : null;
  if (!found) throw new Forbidden("Unknown choice");
  const { scenario, choice } = found;
  const shift = String((scenario as { day?: string }).day ?? "monday");
  const good = !!choice.ok;
  const points = good ? POINTS.good : POINTS.missed;
  const controls = (scenario as unknown as { controls?: Record<string, string[]> }).controls ?? {};
  const statement = {
    actor,
    verb: { id: "http://adlnet.gov/expapi/verbs/answered", display: { "en-US": "answered" } },
    object: { id: `https://dryruncyber.com/xapi/scenario/${scenario.id}`, definition: { name: { "en-US": scenario.id } } },
    result: { success: good, response: choice.id, score: { raw: points } },
    context: { extensions: { "https://dryruncyber.com/xapi/controls": controls } },
    timestamp: new Date(ts).toISOString(),
  };
  const res = await db
    .prepare(
      `INSERT OR IGNORE INTO events (id, org_id, user_id, run_id, shift, kind, scenario_id, choice_id, good, points, controls, xapi, ts)
       VALUES (?, ?, ?, ?, ?, 'decision', ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(newId("e_"), orgId, a.user.id, input.runId, shift, scenario.id, choice.id, good ? 1 : 0, points, JSON.stringify(controls), JSON.stringify(statement), ts)
    .run();
  return { orgId, points, recorded: !!res.meta?.changes };
}
