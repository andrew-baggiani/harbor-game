// "Sign in with Microsoft" and "Sign in with Google": OpenID Connect authorization-code flow with PKCE.
// Both sign people in by work email, the same identity the magic link uses.
import type { Env } from "@/server/env";
import { isLocal } from "@/server/http";

export type Provider = "microsoft" | "google";
export const PROVIDERS: Provider[] = ["microsoft", "google"];

const STATE_COOKIE = "drc_oauth";
const STATE_PATH = "/api/auth/oauth";

type Cfg = { id: string; secret: string; authorize: string; token: string; scope: string };

function config(env: Env, p: Provider): Cfg | null {
  if (p === "microsoft") {
    if (!env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET) return null;
    // "organizations": work and school accounts only. Personal Microsoft accounts can't sign in.
    return {
      id: env.MS_CLIENT_ID,
      secret: env.MS_CLIENT_SECRET,
      authorize: "https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize",
      token: "https://login.microsoftonline.com/organizations/oauth2/v2.0/token",
      scope: "openid profile email User.Read",
    };
  }
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return null;
  return {
    id: env.GOOGLE_CLIENT_ID,
    secret: env.GOOGLE_CLIENT_SECRET,
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
  };
}

export function enabledProviders(env: Env): Record<Provider, boolean> {
  return { microsoft: !!config(env, "microsoft"), google: !!config(env, "google") };
}

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const random = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));
async function challenge(verifier: string) {
  return b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
}
function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const part = jwt.split(".")[1] ?? "";
  const json = atob(part.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((part.length + 3) % 4));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(json, (c) => c.charCodeAt(0))));
}

function callbackUrl(request: Request) {
  return `${new URL(request.url).origin}${STATE_PATH}/callback`;
}
function cookie(request: Request, value: string, maxAge: number) {
  const secure = isLocal(request) && new URL(request.url).protocol === "http:" ? "" : "; Secure";
  return `${STATE_COOKIE}=${value}; Path=${STATE_PATH}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

type Pending = { p: Provider; s: string; v: string; n: string; next: string };

/** Build the provider's sign-in URL and the short-lived cookie that ties the callback to this browser. */
export async function startSignIn(env: Env, request: Request, p: Provider, next: string): Promise<{ location: string; setCookie: string } | null> {
  const c = config(env, p);
  if (!c) return null;
  const pending: Pending = { p, s: random(), v: random(48), n: random(), next };
  const q = new URLSearchParams({
    client_id: c.id,
    response_type: "code",
    redirect_uri: callbackUrl(request),
    scope: c.scope,
    state: pending.s,
    nonce: pending.n,
    code_challenge: await challenge(pending.v),
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return { location: `${c.authorize}?${q}`, setCookie: cookie(request, b64url(new TextEncoder().encode(JSON.stringify(pending))), 600) };
}

export const clearPending = (request: Request) => cookie(request, "", 0);

function readPending(request: Request): Pending | null {
  const raw = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${STATE_COOKIE}=`))
    ?.slice(STATE_COOKIE.length + 1);
  if (!raw) return null;
  try {
    const json = atob(raw.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((raw.length + 3) % 4));
    const v = JSON.parse(json) as Pending;
    return PROVIDERS.includes(v.p) && v.s && v.v && v.n ? v : null;
  } catch {
    return null;
  }
}

export class SignInError extends Error {
  constructor(public code: "state" | "denied" | "email" | "config" | "failed") {
    super(code);
  }
}

const domainOf = (email: string) => email.slice(email.lastIndexOf("@") + 1);

/** Finish the sign-in: check state, swap the code for tokens, and return a verified work email. */
export async function finishSignIn(env: Env, request: Request): Promise<{ email: string; name: string | null; next: string }> {
  const url = new URL(request.url);
  const pending = readPending(request);
  if (!pending || url.searchParams.get("state") !== pending.s) throw new SignInError("state");
  if (url.searchParams.get("error")) throw new SignInError("denied");
  const code = url.searchParams.get("code");
  if (!code) throw new SignInError("failed");
  const c = config(env, pending.p);
  if (!c) throw new SignInError("config");

  const res = await fetch(c.token, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl(request),
      client_id: c.id,
      client_secret: c.secret,
      code_verifier: pending.v,
    }),
  });
  if (!res.ok) throw new SignInError("failed");
  const tokens = (await res.json()) as { access_token?: string; id_token?: string };

  if (pending.p === "google") {
    // The ID token came straight from Google's token endpoint over TLS, so its claims are trusted per OIDC; we still check them.
    if (!tokens.id_token) throw new SignInError("failed");
    const t = decodeJwtPayload(tokens.id_token);
    const okIss = t.iss === "https://accounts.google.com" || t.iss === "accounts.google.com";
    if (!okIss || t.aud !== c.id || t.nonce !== pending.n || Number(t.exp) * 1000 < Date.now()) throw new SignInError("failed");
    if (t.email_verified !== true || typeof t.email !== "string") throw new SignInError("email");
    return { email: t.email.toLowerCase(), name: typeof t.name === "string" ? t.name : null, next: pending.next };
  }

  // Microsoft: the token's "email" claim can be set to anything by another tenant's admin, so it is never trusted on its own.
  // The user principal name must sit in a domain the tenant has verified; we use it, or the mailbox address when it's in that same domain.
  if (!tokens.access_token) throw new SignInError("failed");
  const me = await fetch("https://graph.microsoft.com/v1.0/me?$select=userPrincipalName,mail,displayName", {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });
  if (!me.ok) throw new SignInError("failed");
  const u = (await me.json()) as { userPrincipalName?: string; mail?: string | null; displayName?: string | null };
  const upn = (u.userPrincipalName ?? "").toLowerCase();
  // Guest accounts (#EXT#) belong to another tenant, so their name proves nothing here.
  if (!upn.includes("@") || upn.includes("#ext#")) throw new SignInError("email");
  const mail = (u.mail ?? "").toLowerCase();
  const email = mail && domainOf(mail) === domainOf(upn) ? mail : upn;
  return { email, name: u.displayName ?? null, next: pending.next };
}
