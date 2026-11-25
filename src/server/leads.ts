// Waitlist sign-ups, demo requests and partner applications, until checkout is live (and after).
import type { D1Database, Env } from "@/server/env";
import { newId, sha256 } from "@/server/crypto";
import { createMagicLink, findOrCreateUser } from "@/server/db";
import { grantNfr, ownerEmails, startTrial } from "@/server/billing";
import { sendMagicLink, sendMail } from "@/server/email";

export type LeadKind = "waitlist" | "demo" | "partner" | "trial";
export type Lead = {
  id: string;
  kind: LeadKind;
  name: string | null;
  email: string;
  company: string | null;
  role: string | null;
  seats: number | null;
  message: string | null;
  status: string;
  created_at: number;
};

const now = () => Math.floor(Date.now() / 1000);
let ready = false;

/** Created on first use, so no manual migration is needed (same DDL in migrations-d1/0002_leads.sql). */
export async function ensureLeads(db: D1Database) {
  if (ready) return;
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY, kind TEXT NOT NULL, name TEXT, email TEXT NOT NULL, company TEXT, role TEXT,
        seats INTEGER, message TEXT, status TEXT NOT NULL DEFAULT 'new', ip_hash TEXT, created_at INTEGER NOT NULL)`,
    )
    .run();
  await db.prepare("CREATE INDEX IF NOT EXISTS leads_created ON leads(created_at)").run();
  ready = true;
}

const clip = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);

export async function addLead(
  db: D1Database,
  env: Env,
  request: Request,
  input: { kind: LeadKind; email: string; name?: unknown; company?: unknown; role?: unknown; seats?: unknown; message?: unknown },
): Promise<{ ok: true; leadId?: string } | { error: string; status: number }> {
  await ensureLeads(db);
  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  const ipHash = (await sha256(`lead:${ip}`)).slice(0, 24);
  const recent = await db
    .prepare("SELECT COUNT(*) AS n FROM leads WHERE ip_hash = ? AND created_at > ?")
    .bind(ipHash, now() - 3600)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= 6) return { error: "That's a lot of sign-ups from here in an hour. Try again later, or email hello@dryruncyber.com.", status: 429 };
  const dupe = await db
    .prepare("SELECT id FROM leads WHERE email = ? AND kind = ? AND created_at > ?")
    .bind(input.email, input.kind, now() - 86400)
    .first();
  if (dupe) return { ok: true, leadId: (dupe as { id: string }).id };
  const seats = Number(input.seats);
  const lead = {
    id: newId("l_"),
    kind: input.kind,
    name: clip(input.name, 120),
    company: clip(input.company, 160),
    role: clip(input.role, 60),
    seats: Number.isFinite(seats) && seats > 0 ? Math.min(100000, Math.round(seats)) : null,
    message: clip(input.message, 2000),
  };
  await db
    .prepare("INSERT INTO leads (id, kind, name, email, company, role, seats, message, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(lead.id, lead.kind, lead.name, input.email, lead.company, lead.role, lead.seats, lead.message, ipHash, now())
    .run();
  const label = { waitlist: "Waitlist sign-up", demo: "Demo request", partner: "Partner application", trial: "Free trial started" }[input.kind];
  const summary = [
    `${label}`,
    `Name: ${lead.name ?? "-"}`,
    `Email: ${input.email}`,
    `Company: ${lead.company ?? "-"}`,
    `Role: ${lead.role ?? "-"}`,
    `Learners: ${lead.seats ?? "-"}`,
    lead.message ? `\n${lead.message}` : "",
    `\nReview it: ${new URL(request.url).origin}/leads`,
  ].join("\n");
  for (const to of ownerEmails(env)) await sendMail(env, to, `${label}: ${lead.company ?? input.email}`, summary, input.email);
  // A trial's confirmation is its sign-in link, sent by startSelfTrial.
  if (input.kind === "trial") return { ok: true, leadId: lead.id };
  const confirm =
    input.kind === "partner"
      ? "Thanks for applying to the Dry Run Cyber partner program. We review every MSP by hand and will reply within two business days. Approved partners get 25 free internal seats and the partner portal."
      : input.kind === "demo"
        ? "Thanks for asking for a demo of Dry Run Cyber. We'll reply within one business day with a time that works."
        : "You're on the Dry Run Cyber waitlist. You've locked in founding pricing, and we'll email you the moment it opens. Want your team on a free 14-day trial before then? Reply to this email.";
  await sendMail(
    env,
    input.email,
    input.kind === "partner" ? "Your partner application" : input.kind === "demo" ? "Your demo request" : "You're on the list",
    confirm,
  );
  return { ok: true };
}

export async function listLeads(db: D1Database): Promise<Lead[]> {
  await ensureLeads(db);
  const { results } = await db
    .prepare("SELECT id, kind, name, email, company, role, seats, message, status, created_at FROM leads ORDER BY created_at DESC LIMIT 500")
    .all<Lead>();
  return results ?? [];
}

async function getLead(db: D1Database, id: string) {
  await ensureLeads(db);
  return db.prepare("SELECT id, kind, name, email, company, role, seats, message, status, created_at FROM leads WHERE id = ?").bind(id).first<Lead>();
}

export async function setLeadStatus(db: D1Database, id: string, status: string) {
  await ensureLeads(db);
  await db.prepare("UPDATE leads SET status = ? WHERE id = ?").bind(status.slice(0, 20), id).run();
}

/**
 * Approve an MSP: their partner workspace, an NFR workspace for their own staff (25 seats, free while
 * they're a partner), the applicant as admin of both, and a sign-in link by email.
 */
export async function approvePartner(db: D1Database, env: Env, origin: string, leadId: string) {
  const lead = await getLead(db, leadId);
  if (!lead) return { error: "No such application." };
  const user = await findOrCreateUser(db, lead.email);
  const company = lead.company ?? lead.email.split("@")[1];
  const partnerId = newId("p_");
  const nfrOrg = newId("o_");
  const t = now();
  await db.batch([
    db.prepare("INSERT INTO partners (id, name, created_at) VALUES (?, ?, ?)").bind(partnerId, company, t),
    db
      .prepare("INSERT INTO memberships (id, user_id, partner_id, role, created_at) VALUES (?, ?, ?, 'partner_admin', ?)")
      .bind(newId("m_"), user.id, partnerId, t),
    db.prepare("INSERT INTO orgs (id, partner_id, name, created_at) VALUES (?, ?, ?, ?)").bind(nfrOrg, partnerId, `${company} (internal)`, t),
  ]);
  await grantNfr(db, nfrOrg);
  await setLeadStatus(db, leadId, "approved");
  const token = await createMagicLink(db, user.id, `/portal?p=${partnerId}`);
  const sent = await sendMagicLink(env, lead.email, `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`, "invite", "Dry Run Cyber partner program");
  return { partnerId, emailed: sent.sent };
}

/** A free 14-day trial for a business on the waitlist: their workspace, the requester as admin, a sign-in link. */
export async function startLeadTrial(db: D1Database, env: Env, origin: string, leadId: string) {
  const lead = await getLead(db, leadId);
  if (!lead) return { error: "No such sign-up." };
  const user = await findOrCreateUser(db, lead.email);
  const orgId = newId("o_");
  const t = now();
  await db.batch([
    db
      .prepare("INSERT INTO orgs (id, name, domain, created_at) VALUES (?, ?, ?, ?)")
      .bind(orgId, lead.company ?? lead.email, lead.email.split("@")[1] ?? null, t),
    db.prepare("INSERT INTO memberships (id, user_id, org_id, role, created_at) VALUES (?, ?, ?, 'org_admin', ?)").bind(newId("m_"), user.id, orgId, t),
  ]);
  await startTrial(db, orgId);
  await setLeadStatus(db, leadId, "trial");
  const token = await createMagicLink(db, user.id, `/portal?o=${orgId}`);
  const sent = await sendMagicLink(env, lead.email, `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`, "invite", "Dry Run Cyber (14-day trial)");
  return { orgId, emailed: sent.sent };
}

/**
 * Self-serve trial from the website: the sign-up becomes an org with a 14-day trial and its admin gets a
 * sign-in link. Someone who already runs an org just gets a fresh link to it, never a second trial.
 */
export async function startSelfTrial(db: D1Database, env: Env, origin: string, leadId: string, email: string) {
  const user = await findOrCreateUser(db, email);
  const existing = await db
    .prepare("SELECT org_id FROM memberships WHERE user_id = ? AND role = 'org_admin' AND org_id IS NOT NULL LIMIT 1")
    .bind(user.id)
    .first<{ org_id: string }>();
  if (existing) {
    const token = await createMagicLink(db, user.id, `/portal?o=${existing.org_id}`);
    const sent = await sendMagicLink(env, email, `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`, "signin");
    return { orgId: existing.org_id, emailed: sent.sent, existing: true };
  }
  return { ...(await startLeadTrial(db, env, origin, leadId)), existing: false };
}
