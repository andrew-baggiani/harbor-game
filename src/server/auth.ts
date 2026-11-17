// Session cookie helpers and the "who is calling" lookup every portal route starts with.
import { getDb, getEnv, type D1Database, type Env } from "@/server/env";
import { bad, isLocal } from "@/server/http";
import { Forbidden, loadAccess, sessionUser, type Access } from "@/server/db";

export const COOKIE = "drc_session";

export function readCookie(request: Request, name = COOKIE): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export function sessionCookie(request: Request, token: string, maxAge: number): string {
  const secure = isLocal(request) && new URL(request.url).protocol === "http:" ? "" : "; Secure";
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearCookie(request: Request): string {
  return sessionCookie(request, "", 0);
}

export type Ctx = { db: D1Database; env: Env; access: Access | null; token: string | null };

/** Database + the signed-in user (if any). Returns a Response when the database isn't bound. */
export async function context(request: Request): Promise<Ctx | Response> {
  const env = await getEnv();
  const db = await getDb();
  if (!db) return bad("The portal database isn't connected here.", 503);
  const token = readCookie(request);
  if (!token) return { db, env, access: null, token: null };
  const user = await sessionUser(db, token);
  return { db, env, access: user ? await loadAccess(db, user) : null, token };
}

export async function requireAccess(request: Request): Promise<(Ctx & { access: Access }) | Response> {
  const ctx = await context(request);
  if (ctx instanceof Response) return ctx;
  if (!ctx.access) return bad("Sign in first.", 401);
  return ctx as Ctx & { access: Access };
}

/** Turns permission errors into 403s; everything else into a logged 500. */
export async function guard(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Forbidden) return bad(err.message, 403);
    console.error("[portal]", err);
    return bad("Something went wrong.", 500);
  }
}
