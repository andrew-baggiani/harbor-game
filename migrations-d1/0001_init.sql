-- Dry Run Cyber portal: tenancy, auth, decision log, billing placeholders.
-- Tenants: a partner (MSP) owns client orgs; an org with partner_id NULL is a direct customer.

CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orgs (
  id TEXT PRIMARY KEY,
  partner_id TEXT REFERENCES partners(id),
  name TEXT NOT NULL,
  domain TEXT,
  leaderboard_enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS orgs_partner ON orgs(partner_id);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at INTEGER NOT NULL
);

-- role: partner_admin (partner_id set), org_admin or learner (org_id set).
CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  partner_id TEXT REFERENCES partners(id),
  org_id TEXT REFERENCES orgs(id),
  role TEXT NOT NULL CHECK (role IN ('partner_admin', 'org_admin', 'learner')),
  display_name TEXT,
  created_at INTEGER NOT NULL,
  CHECK ((role = 'partner_admin' AND partner_id IS NOT NULL) OR (role <> 'partner_admin' AND org_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS memberships_unique ON memberships(user_id, COALESCE(org_id, ''), COALESCE(partner_id, ''), role);
CREATE INDEX IF NOT EXISTS memberships_org ON memberships(org_id);
CREATE INDEX IF NOT EXISTS memberships_partner ON memberships(partner_id);

-- Tokens are stored as SHA-256 hashes; the raw token only ever lives in the link or cookie.
CREATE TABLE IF NOT EXISTS magic_links (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  next_path TEXT,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  name TEXT NOT NULL,
  shifts TEXT NOT NULL, -- JSON array of shift ids, e.g. ["monday"]
  due_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS campaigns_org ON campaigns(org_id);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  invited_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS assignments_unique ON assignments(campaign_id, user_id);
CREATE INDEX IF NOT EXISTS assignments_org ON assignments(org_id);

-- The decision log. One row per decision (or a shift_complete marker), scored on the server.
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  run_id TEXT NOT NULL,
  shift TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('decision', 'shift_complete')),
  scenario_id TEXT,
  choice_id TEXT,
  good INTEGER,
  points INTEGER NOT NULL DEFAULT 0,
  controls TEXT, -- JSON, copied from the scenario at the time of the decision
  xapi TEXT NOT NULL, -- xAPI-shaped statement
  ts INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS events_once ON events(user_id, run_id, COALESCE(scenario_id, kind));
CREATE INDEX IF NOT EXISTS events_org_ts ON events(org_id, ts);
CREATE INDEX IF NOT EXISTS events_user ON events(user_id);

-- Billing placeholders (filled in by the billing work).
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES orgs(id),
  partner_id TEXT REFERENCES partners(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT,
  seats INTEGER,
  status TEXT NOT NULL DEFAULT 'trialing',
  trial_ends_at INTEGER,
  created_at INTEGER NOT NULL,
  CHECK (org_id IS NOT NULL OR partner_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS subscriptions_org ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS subscriptions_partner ON subscriptions(partner_id);
