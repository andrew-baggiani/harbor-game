// Runtime bindings on Cloudflare Workers. Reached through `cloudflare:workers` (externalized by the
// Cloudflare build); absent in plain Vite dev, where every caller degrades gracefully.

export type D1Result<T> = { results: T[]; success: boolean; meta?: { changes?: number } };
export type D1Prepared = {
  bind: (...values: unknown[]) => D1Prepared;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<D1Result<T>>;
  run: () => Promise<D1Result<unknown>>;
};
export type D1Database = {
  prepare: (sql: string) => D1Prepared;
  batch: (stmts: D1Prepared[]) => Promise<D1Result<unknown>[]>;
};

export type Env = {
  DB?: D1Database;
  RESEND_API_KEY?: string;
  /** Comma-separated emails that can see leads and approve partners. Defaults to the company inbox. */
  OWNER_EMAILS?: string;
  /** Stripe restricted key (rk_…) and webhook signing secret (whsec_…). Set as Worker secrets. */
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  /** Sign in with Microsoft (Entra app registration) and Google (OAuth client). Worker secrets. */
  MS_CLIENT_ID?: string;
  MS_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  /** ElevenLabs key (Text to Speech), so the owner can record missing voice lines from /admin/voices. Worker secret. */
  ELEVENLABS_API_KEY?: string;
};

export async function getEnv(): Promise<Env> {
  try {
    const mod = (await import(/* @vite-ignore */ "cloudflare:workers")) as { env?: Env };
    return mod.env ?? {};
  } catch {
    return {};
  }
}

export async function getDb(): Promise<D1Database | null> {
  return (await getEnv()).DB ?? null;
}
