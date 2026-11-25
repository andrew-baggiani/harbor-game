-- The week remembers: one row per learner (src/server/world.ts creates it on first use too).
CREATE TABLE IF NOT EXISTS world_state (user_id TEXT PRIMARY KEY, state TEXT NOT NULL, updated_at INTEGER NOT NULL);
