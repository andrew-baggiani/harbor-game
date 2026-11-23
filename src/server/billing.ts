// Plans and seats. Stripe fills in paid plans later; until then trials and NFR seats live here.
import type { D1Database, Env } from "@/server/env";
import { newId } from "@/server/crypto";
import type { Access } from "@/server/db";

export const PLAN = {
  trialDays: 14,
  trialSeats: 10,
  nfrSeats: 25,
  /** Public list prices (USD), shown on the pricing page. */
  businessPerLearnerMonth: 1.99,
  foundingPerLearnerMonth: 1.49,
  partnerPerLearnerMonth: 1.25,
  minimumLearners: 5,
} as const;

const DAY = 86400;
const now = () => Math.floor(Date.now() / 1000);

export function ownerEmails(env: Env): string[] {
  return (env.OWNER_EMAILS ?? "dryruncyber@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isOwner(env: Env, a: Access | null): boolean {
  return !!a && ownerEmails(env).includes(a.user.email.toLowerCase());
}

type Sub = { plan: string | null; seats: number | null; status: string; trial_ends_at: number | null };

async function latestSub(db: D1Database, orgId: string): Promise<Sub | null> {
  return db.prepare("SELECT plan, seats, status, trial_ends_at FROM subscriptions WHERE org_id = ? ORDER BY created_at DESC LIMIT 1").bind(orgId).first<Sub>();
}

/** What an org may do: null limit means no plan on file (pilot orgs made before billing): unlimited. */
export async function orgPlan(
  db: D1Database,
  orgId: string,
): Promise<{ limit: number | null; active: boolean; plan: string | null; trialEndsAt: number | null }> {
  const sub = await latestSub(db, orgId);
  if (!sub) return { limit: null, active: true, plan: null, trialEndsAt: null };
  const expired = sub.status === "trialing" && !!sub.trial_ends_at && sub.trial_ends_at < now();
  // past_due keeps access while Stripe retries the card.
  const active = !expired && (sub.status === "active" || sub.status === "trialing" || sub.status === "past_due");
  return { limit: active ? (sub.seats ?? null) : 0, active, plan: sub.plan, trialEndsAt: sub.trial_ends_at };
}

export async function startTrial(db: D1Database, orgId: string) {
  await db
    .prepare("INSERT INTO subscriptions (id, org_id, plan, seats, status, trial_ends_at, created_at) VALUES (?, ?, 'trial', ?, 'trialing', ?, ?)")
    .bind(newId("s_"), orgId, PLAN.trialSeats, now() + PLAN.trialDays * DAY, now())
    .run();
}

export async function grantNfr(db: D1Database, orgId: string) {
  await db
    .prepare("INSERT INTO subscriptions (id, org_id, plan, seats, status, created_at) VALUES (?, ?, 'nfr', ?, 'active', ?)")
    .bind(newId("s_"), orgId, PLAN.nfrSeats, now())
    .run();
}

/** A readable message if adding `adding` learners would go past the org's plan, else null. */
export async function seatProblem(db: D1Database, orgId: string, adding: number): Promise<string | null> {
  const plan = await orgPlan(db, orgId);
  if (plan.limit === null || adding <= 0) return null;
  if (!plan.active) return "This workspace's trial has ended. Choose a plan to keep training.";
  const row = await db.prepare("SELECT COUNT(*) AS n FROM memberships WHERE org_id = ? AND role = 'learner'").bind(orgId).first<{ n: number }>();
  const used = row?.n ?? 0;
  if (used + adding > plan.limit) {
    const left = Math.max(0, plan.limit - used);
    return `Your ${plan.plan === "nfr" ? "NFR" : plan.plan === "trial" ? "trial" : "plan"} covers ${plan.limit} learners and ${used} are already invited${left ? `, so ${left} more fit` : ""}.`;
  }
  return null;
}

/** May this person play the full game? Anyone with a workspace that's paid, trialing, NFR or a pre-billing pilot. */
export async function canPlay(db: D1Database, env: Env, a: Access | null): Promise<boolean> {
  if (!a) return false;
  if (isOwner(env, a)) return true;
  if (a.memberships.some((m) => m.role === "partner_admin")) return true;
  for (const m of a.memberships) {
    if (!m.org_id) continue;
    if ((await orgPlan(db, m.org_id)).active) return true;
  }
  return false;
}
