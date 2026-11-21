import type { D1Database } from "@/server/env";
import { Forbidden, type Access } from "@/server/db";

/** An MSP's own name and logo, shown to its clients' learners and in invite emails.
 *  The table is created on first use, like leads, so no migration has to run first. */
export type Brand = { name: string; logo: string | null };

const MAX_LOGO = 200_000; // bytes of data URL
const LOGO_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

let ready = false;
async function ensure(db: D1Database) {
  if (ready) return;
  await db
    .prepare("CREATE TABLE IF NOT EXISTS partner_brand (partner_id TEXT PRIMARY KEY, name TEXT NOT NULL, logo TEXT, updated_at INTEGER NOT NULL)")
    .run();
  ready = true;
}

export async function brandForPartner(db: D1Database, partnerId: string | null): Promise<Brand | null> {
  if (!partnerId) return null;
  await ensure(db);
  const row = await db.prepare("SELECT name, logo FROM partner_brand WHERE partner_id = ?").bind(partnerId).first<{ name: string; logo: string | null }>();
  return row ? { name: row.name, logo: row.logo } : null;
}

export async function brandForOrg(db: D1Database, orgId: string | null): Promise<Brand | null> {
  if (!orgId) return null;
  const org = await db.prepare("SELECT partner_id FROM orgs WHERE id = ?").bind(orgId).first<{ partner_id: string | null }>();
  return brandForPartner(db, org?.partner_id ?? null);
}

/** Partner admins set their own brand. An empty name clears it. */
export async function setBrand(db: D1Database, a: Access, partnerId: string, input: { name?: string; logo?: string | null }) {
  if (!a.memberships.some((m) => m.role === "partner_admin" && m.partner_id === partnerId)) throw new Forbidden("Not an admin of this partner");
  await ensure(db);
  const name = (input.name ?? "").replace(/[<>"\r\n]/g, "").trim().slice(0, 60);
  if (!name) {
    await db.prepare("DELETE FROM partner_brand WHERE partner_id = ?").bind(partnerId).run();
    return null;
  }
  let logo: string | null = input.logo ?? null;
  if (logo !== null && (!LOGO_RE.test(logo) || logo.length > MAX_LOGO)) throw new Forbidden("Logo must be a PNG, JPEG or WebP under 150 KB.");
  if (input.logo === undefined) logo = (await brandForPartner(db, partnerId))?.logo ?? null;
  await db
    .prepare(
      "INSERT INTO partner_brand (partner_id, name, logo, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(partner_id) DO UPDATE SET name = excluded.name, logo = excluded.logo, updated_at = excluded.updated_at",
    )
    .bind(partnerId, name, logo, Date.now())
    .run();
  return { name, logo } satisfies Brand;
}
