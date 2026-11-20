-- Waitlist, demo requests and partner applications. The app also creates this on first use (src/server/leads.ts).
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  name TEXT,
  email TEXT NOT NULL,
  company TEXT,
  role TEXT,
  seats INTEGER,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  ip_hash TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS leads_created ON leads(created_at);
