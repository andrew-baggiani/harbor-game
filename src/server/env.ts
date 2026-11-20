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
