// Per-learner world state for the week (src/content/week/world.ts). Written only from choice ids the
// server scores and from the learner's own calls to IT, so a clean week can't be faked from the browser.
import type { D1Database } from "@/server/env";
import { applyChoice, applyReport, parseWorld, type Via, type WorldState } from "@/content/week/world";

let ready = false;

/** Created on first use (same DDL in migrations-d1/0003_world_state.sql). */
async function ensure(db: D1Database) {
  if (ready) return;
  await db.prepare("CREATE TABLE IF NOT EXISTS world_state (user_id TEXT PRIMARY KEY, state TEXT NOT NULL, updated_at INTEGER NOT NULL)").run();
  ready = true;
}

export async function getWorld(db: D1Database, userId: string): Promise<WorldState> {
  await ensure(db);
  const row = await db.prepare("SELECT state FROM world_state WHERE user_id = ?").bind(userId).first<{ state: string }>();
  if (!row) return parseWorld(null);
  try {
    return parseWorld(JSON.parse(row.state));
  } catch {
    return parseWorld(null);
  }
}

async function save(db: D1Database, userId: string, w: WorldState) {
  await db
    .prepare(
      "INSERT INTO world_state (user_id, state, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at",
    )
    .bind(userId, JSON.stringify(w), Math.floor(Date.now() / 1000))
    .run();
}

/** A scored decision arrived; Monday choices may plant (or reset) the week. */
export async function worldChoice(db: D1Database, userId: string, choiceId: string, runId: string) {
  const before = await getWorld(db, userId);
  const after = applyChoice(before, choiceId, runId, Date.now());
  if (after !== before) await save(db, userId, after);
}

export async function worldReport(db: D1Database, userId: string, day: string, via: Via): Promise<WorldState> {
  const w = applyReport(await getWorld(db, userId), day, via, Date.now());
  await save(db, userId, w);
  return w;
}
