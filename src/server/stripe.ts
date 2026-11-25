// Stripe billing: checkout, the customer portal, webhooks and the MSP seat count.
// Prices are found by lookup key, so the same code runs against the sandbox and live mode.
import Stripe from "stripe";
import type { D1Database, Env } from "@/server/env";
import { newId } from "@/server/crypto";
import { Forbidden, assertOrgAdmin, type Access } from "@/server/db";
import { PLAN } from "@/server/billing";

export const PRICE_KEYS = { teams: "teams_yearly", founders: "teams_founders_yearly", msp: "msp_monthly" } as const;
export type PlanKey = keyof typeof PRICE_KEYS;

export function stripeClient(env: Env): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new Forbidden("Billing isn't set up yet.");
  return new Stripe(env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient(), maxNetworkRetries: 2 });
}

async function priceId(stripe: Stripe, plan: PlanKey): Promise<string> {
  const { data } = await stripe.prices.list({ lookup_keys: [PRICE_KEYS[plan]], active: true, limit: 1 });
  if (!data[0]) throw new Error(`Stripe price ${PRICE_KEYS[plan]} not found`);
  return data[0].id;
}

const now = () => Math.floor(Date.now() / 1000);
const tag = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => String.fromCharCode(97 + (b % 26))).join("");

type Owner = { orgId: string | null; partnerId: string | null };

async function customerFor(db: D1Database, stripe: Stripe, owner: Owner, email: string, name: string): Promise<string> {
  const row = await db
    .prepare("SELECT stripe_customer_id FROM subscriptions WHERE stripe_customer_id IS NOT NULL AND (org_id = ? OR partner_id = ?) ORDER BY created_at DESC LIMIT 1")
    .bind(owner.orgId, owner.partnerId)
    .first<{ stripe_customer_id: string }>();
  if (row) return row.stripe_customer_id;
  // A customer made on an earlier, unfinished checkout: reuse it rather than making another.
  const key = owner.orgId ? "org_id" : "partner_id";
  const id = (owner.orgId ?? owner.partnerId ?? "").replace(/[^A-Za-z0-9_]/g, "");
  const found = await stripe.customers.search({ query: `metadata['${key}']:'${id}'`, limit: 1 }).catch(() => null);
  if (found?.data[0]) return found.data[0].id;
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { org_id: owner.orgId ?? "", partner_id: owner.partnerId ?? "" },
  });
  return customer.id;
}

/** Stripe Tax only calculates once the account has a head office address; until then, check out without tax. */
let taxReady: { ok: boolean; at: number } | null = null;
async function taxActive(stripe: Stripe): Promise<boolean> {
  if (taxReady && Date.now() - taxReady.at < 5 * 60_000) return taxReady.ok;
  const ok = await stripe.tax.settings
    .retrieve()
    .then((t) => t.status === "active")
    .catch(() => false);
  taxReady = { ok, at: Date.now() };
  if (!ok) console.warn("[stripe] Tax settings not active; checkout runs without automatic tax");
  return ok;
}

/** Did this email join the waitlist or start a trial during launch? They get the locked founders price. */
async function isFounder(db: D1Database, email: string): Promise<boolean> {
  try {
    const row = await db.prepare("SELECT 1 AS ok FROM leads WHERE kind IN ('waitlist', 'trial') AND lower(email) = lower(?) LIMIT 1").bind(email).first();
    return !!row;
  } catch {
    return false;
  }
}

/** Learners across every client of an MSP: what the MSP plan bills for. */
export async function partnerLearners(db: D1Database, partnerId: string): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM memberships m JOIN orgs o ON o.id = m.org_id WHERE o.partner_id = ? AND m.role = 'learner'")
    .bind(partnerId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function startCheckout(
  db: D1Database,
  env: Env,
  a: Access,
  origin: string,
  input: { orgId?: string; partnerId?: string; seats?: number },
): Promise<{ url: string }> {
  const stripe = stripeClient(env);
  let owner: Owner;
  let plan: PlanKey;
  let quantity: number;
  let name: string;
  let back: string;

  if (input.partnerId) {
    if (!a.memberships.some((m) => m.role === "partner_admin" && m.partner_id === input.partnerId)) throw new Forbidden("Not your partner workspace");
    const p = await db.prepare("SELECT name FROM partners WHERE id = ?").bind(input.partnerId).first<{ name: string }>();
    if (!p) throw new Forbidden("Partner not found");
    owner = { orgId: null, partnerId: input.partnerId };
    plan = "msp";
    quantity = Math.max(1, await partnerLearners(db, input.partnerId));
    name = p.name;
    back = "/portal";
  } else if (input.orgId) {
    const org = await assertOrgAdmin(db, a, input.orgId);
    if (org.partner_id) throw new Forbidden("This workspace is billed through its MSP.");
    owner = { orgId: input.orgId, partnerId: null };
    plan = (await isFounder(db, a.user.email)) ? "founders" : "teams";
    quantity = Math.max(PLAN.minimumLearners, Math.min(10000, Math.floor(Number(input.seats) || 0)));
    name = org.name;
    back = "/portal";
  } else throw new Forbidden("orgId or partnerId required");

  const customer = await customerFor(db, stripe, owner, a.user.email, name);
  const tax = await taxActive(stripe);
  const meta = { org_id: owner.orgId ?? "", partner_id: owner.partnerId ?? "", plan };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    customer_update: { address: "auto", name: "auto" },
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    automatic_tax: { enabled: tax },
    line_items: [{ price: await priceId(stripe, plan), quantity, ...(plan === "msp" ? {} : { adjustable_quantity: { enabled: true, minimum: PLAN.minimumLearners, maximum: 10000 } }) }],
    client_reference_id: owner.orgId ?? owner.partnerId ?? undefined,
    metadata: meta,
    subscription_data: { metadata: meta },
    allow_promotion_codes: true,
    success_url: `${origin}${back}?billing=done`,
    cancel_url: `${origin}${back}?billing=canceled`,
    // Labels this flow in the Stripe Dashboard.
    ...({ integration_identifier: `drc-portal-${tag()}` } as object),
  });
  if (!session.url) throw new Error("Stripe returned no checkout URL");
  return { url: session.url };
}

export async function openPortal(db: D1Database, env: Env, a: Access, origin: string, input: { orgId?: string; partnerId?: string }): Promise<{ url: string }> {
  if (input.partnerId) {
    if (!a.memberships.some((m) => m.role === "partner_admin" && m.partner_id === input.partnerId)) throw new Forbidden("Not your partner workspace");
  } else if (input.orgId) await assertOrgAdmin(db, a, input.orgId);
  else throw new Forbidden("orgId or partnerId required");
  const row = await db
    .prepare("SELECT stripe_customer_id FROM subscriptions WHERE stripe_customer_id IS NOT NULL AND (org_id = ? OR partner_id = ?) ORDER BY created_at DESC LIMIT 1")
    .bind(input.orgId ?? null, input.partnerId ?? null)
    .first<{ stripe_customer_id: string }>();
  if (!row) throw new Forbidden("No billing account yet. Choose a plan first.");
  const session = await stripeClient(env).billingPortal.sessions.create({ customer: row.stripe_customer_id, return_url: `${origin}/portal` });
  return { url: session.url };
}

/** Billing state for the portal: the plan on file and whether Stripe billing is set up. */
export async function billingSummary(db: D1Database, owner: Owner) {
  const row = await db
    .prepare(
      "SELECT plan, seats, status, trial_ends_at, stripe_subscription_id FROM subscriptions WHERE (org_id = ? OR partner_id = ?) ORDER BY created_at DESC LIMIT 1",
    )
    .bind(owner.orgId, owner.partnerId)
    .first<{ plan: string | null; seats: number | null; status: string; trial_ends_at: number | null; stripe_subscription_id: string | null }>();
  return {
    plan: row?.plan ?? null,
    seats: row?.seats ?? null,
    status: row?.status ?? null,
    trialEndsAt: row?.trial_ends_at ?? null,
    paid: !!row?.stripe_subscription_id,
    learners: owner.partnerId ? await partnerLearners(db, owner.partnerId) : null,
  };
}

// ---------- Webhooks ----------

let eventsReady = false;
async function ensureEvents(db: D1Database) {
  if (eventsReady) return;
  await db.prepare("CREATE TABLE IF NOT EXISTS stripe_events (id TEXT PRIMARY KEY, type TEXT NOT NULL, created_at INTEGER NOT NULL)").run();
  eventsReady = true;
}

/** Copy a Stripe subscription onto our subscriptions row (one row per Stripe subscription). */
async function syncSubscription(db: D1Database, sub: Stripe.Subscription) {
  const orgId = sub.metadata.org_id || null;
  const partnerId = sub.metadata.partner_id || null;
  if (!orgId && !partnerId) return;
  const item = sub.items.data[0];
  const plan = sub.metadata.plan || "teams";
  const seats = plan === "msp" ? null : (item?.quantity ?? null);
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const existing = await db.prepare("SELECT id FROM subscriptions WHERE stripe_subscription_id = ?").bind(sub.id).first<{ id: string }>();
  if (existing) {
    await db.prepare("UPDATE subscriptions SET plan = ?, seats = ?, status = ?, stripe_customer_id = ? WHERE id = ?").bind(plan, seats, sub.status, customer, existing.id).run();
  } else {
    await db
      .prepare(
        "INSERT INTO subscriptions (id, org_id, partner_id, stripe_customer_id, stripe_subscription_id, plan, seats, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(newId("s_"), orgId, partnerId, customer, sub.id, plan, seats, sub.status, now())
      .run();
  }
}

/** Set an MSP subscription's quantity to its current learner count, ahead of the next invoice. */
async function syncMspSeats(db: D1Database, stripe: Stripe, subscriptionId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  if (sub.metadata.plan !== "msp" || !sub.metadata.partner_id) return;
  const item = sub.items.data[0];
  const count = Math.max(1, await partnerLearners(db, sub.metadata.partner_id));
  if (item && item.quantity !== count) {
    await stripe.subscriptions.update(sub.id, { items: [{ id: item.id, quantity: count }], proration_behavior: "none" });
  }
}

function subscriptionIdOf(invoice: Stripe.Invoice): string | null {
  const parent = (invoice as unknown as { parent?: { subscription_details?: { subscription?: string | { id: string } } } }).parent;
  const s = parent?.subscription_details?.subscription;
  return typeof s === "string" ? s : (s?.id ?? null);
}

export async function handleWebhook(db: D1Database, env: Env, request: Request): Promise<Response> {
  if (!env.STRIPE_WEBHOOK_SECRET) return new Response("Webhook secret not set", { status: 503 });
  const stripe = stripeClient(env);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, env.STRIPE_WEBHOOK_SECRET, undefined, Stripe.createSubtleCryptoProvider());
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  await ensureEvents(db);
  const seen = await db.prepare("SELECT 1 AS ok FROM stripe_events WHERE id = ?").bind(event.id).first();
  if (seen) return new Response("ok");

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.mode === "subscription" && session.subscription) {
        const id = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        await syncSubscription(db, await stripe.subscriptions.retrieve(id));
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      await syncSubscription(db, event.data.object);
      break;
    case "invoice.upcoming": {
      const id = subscriptionIdOf(event.data.object);
      if (id) await syncMspSeats(db, stripe, id);
      break;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const id = subscriptionIdOf(event.data.object);
      if (id) await syncSubscription(db, await stripe.subscriptions.retrieve(id));
      break;
    }
    case "charge.dispute.created":
    case "charge.refunded":
    case "radar.early_fraud_warning.created":
      // Money at risk: surface it in the Worker logs; the Stripe Dashboard emails the owner too.
      console.warn("[stripe]", event.type, (event.data.object as { id: string }).id);
      break;
  }

  await db.prepare("INSERT OR IGNORE INTO stripe_events (id, type, created_at) VALUES (?, ?, ?)").bind(event.id, event.type, now()).run();
  return new Response("ok");
}
