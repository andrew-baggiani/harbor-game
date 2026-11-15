-- =============================================================================
-- Harbor & Co. platform schema: DRAFT FOR REVIEW (v0.1, 2026-11-15)
-- =============================================================================
-- Companion to docs/PLATFORM_ARCHITECTURE.md. NOT wired into migrations/.
-- Once reviewed, it lands as migrations/0002_platform.sql (ticket P0-03),
-- applied by a release job (not by `npm run build`).
--
-- Target: PostgreSQL 15+ (managed: Neon Scale or equivalent), reached from
-- Cloudflare Workers through Hyperdrive (transaction pooling).
--
-- Conventions
--   * snake_case, uuid primary keys (gen_random_uuid(), built into PG13+).
--   * Every tenant-scoped row carries org_id (and msp_id where MSP-wide reads
--     are common). RLS policies key off transaction-local settings:
--        select set_config('app.actor_id', '<uuid>', true);
--        select set_config('app.tenant_ids', '{<uuid>,<uuid>}', true);
--     'app.tenant_ids' = every tenant the actor may read (its home tenant,
--     plus for MSP staff the orgs they're granted). It's computed in the
--     Worker's requireActor() and set inside each transaction (safe with
--     pooling because is_local = true).
--   * The application connects as role harbor_app: NOT the owner, no BYPASSRLS.
--   * Evidence tables (training_records, audit_log, assignment_events,
--     decisions) are append-only: harbor_app gets INSERT/SELECT only, and
--     triggers block UPDATE/DELETE unless the retention function sets a flag.
--   * No PHI and no CUI are stored anywhere. Learner PII is limited to name,
--     work email, optional title, groups, hire date and IdP object ids.
-- =============================================================================

create extension if not exists pgcrypto;   -- digest() for hash chains
create extension if not exists citext;     -- case-insensitive emails

-- ---------------------------------------------------------------------------
-- Roles (run once per database by an operator, shown here for review)
-- ---------------------------------------------------------------------------
-- create role harbor_owner   nologin;              -- owns all objects (migrations)
-- create role harbor_app     login password '…';   -- the Worker via Hyperdrive
-- create role harbor_jobs    login password '…';   -- cron/queue consumers (same RLS)
-- create role harbor_retention nologin;            -- only via security-definer purge fn
-- grant usage on schema public to harbor_app, harbor_jobs;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- The tenant ids the current transaction may see. An empty array (deny all)
-- when unset, so a forgotten set_config fails closed.
create or replace function app_tenant_ids() returns uuid[]
language sql stable as $$
  select coalesce(nullif(current_setting('app.tenant_ids', true), '')::uuid[], '{}'::uuid[])
$$;

create or replace function app_actor_id() returns uuid
language sql stable as $$
  select nullif(current_setting('app.actor_id', true), '')::uuid
$$;

-- Generic guard: blocks UPDATE/DELETE on append-only tables. The retention
-- purge function sets app.retention_purge = 'on' (transaction-local) before
-- deleting whole expired segments; nothing else can.
create or replace function forbid_mutation() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' and current_setting('app.retention_purge', true) = 'on' then
    return old;
  end if;
  raise exception '% on %.% is not allowed: table is append-only', tg_op, tg_table_schema, tg_table_name
    using errcode = '42501';
end $$;

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type tenant_kind        as enum ('platform', 'msp', 'org');
create type tenant_status      as enum ('active', 'suspended', 'read_only', 'archived');
create type user_status        as enum ('provisioned', 'invited', 'active', 'suspended', 'deprovisioned');
create type identity_provider  as enum ('entra', 'google', 'magic_link', 'passkey', 'kiosk', 'lms');
create type role_name          as enum ('platform_admin', 'msp_owner', 'msp_admin', 'msp_technician',
                                        'msp_billing', 'org_admin', 'org_manager', 'org_auditor', 'learner');
create type idp_kind           as enum ('entra', 'google');
create type idp_status         as enum ('pending', 'active', 'disabled', 'error');
create type assignment_reason  as enum ('hire', 'annual', 'policy_change', 'remediation', 'manual');
create type assignment_status  as enum ('open', 'completed', 'overdue', 'waived', 'cancelled', 'paused');
create type delivery_channel   as enum ('portal', 'kiosk', 'scorm12', 'scorm2004', 'cmi5');
create type render_mode        as enum ('3d', '2d');
create type record_event       as enum ('assigned', 'started', 'completed', 'passed', 'failed', 'attested',
                                        'certificate_issued', 'certificate_revoked', 'waived', 'correction');
create type identity_source    as enum ('sso', 'magic_link', 'kiosk', 'lms_asserted', 'admin_entered');
create type lms_standard       as enum ('scorm12', 'scorm2004', 'cmi5');
create type subscription_source as enum ('direct', 'marketplace');

-- =============================================================================
-- 1. TENANCY: tenants (supertype) → msps / orgs (1:1 extensions)
-- =============================================================================

create table tenants (
  id          uuid primary key default gen_random_uuid(),
  kind        tenant_kind   not null,
  parent_id   uuid references tenants(id),            -- msp → platform, org → msp
  name        text          not null check (length(name) between 1 and 120),
  slug        citext        not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,48}$'),
  status      tenant_status not null default 'active',
  data_region text          not null default 'us' check (data_region in ('us')),  -- 'eu' later
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now(),
  check ((kind = 'platform') = (parent_id is null))
);
comment on table tenants is 'Supertype for platform, MSP and client org. One id space keeps FKs and RLS uniform.';

create table msps (
  id                uuid primary key references tenants(id) on delete restrict,
  billing_email     citext not null,
  white_label       boolean not null default false,
  vanity_hostname   citext unique,                      -- v1: Cloudflare custom hostname
  email_sender_domain citext,                           -- v1: verified DKIM domain
  created_at        timestamptz not null default now()
);

create table orgs (
  id               uuid primary key references tenants(id) on delete restrict,
  msp_id           uuid not null references msps(id),
  msp_access       text not null default 'manage' check (msp_access in ('manage', 'reports_only')),
  verified_domains citext[] not null default '{}',      -- from Entra /organization or DNS check
  jit_provisioning boolean not null default false,      -- allow SSO users in learner group w/o prior sync
  retention_years  smallint not null default 6 check (retention_years between 3 and 10),
  legal_hold       boolean not null default false,
  hire_window_days smallint not null default 30 check (hire_window_days between 1 and 180),
  contract_ended_at timestamptz,                        -- starts the read-only → archived lifecycle
  created_at       timestamptz not null default now()
);
comment on column orgs.retention_years is 'Default 6 (HIPAA 164.316(b)(2) documentation retention). Lowering it needs step-up auth and is audited.';

-- Org transfer between MSPs is explicit and audited; history kept here.
create table org_msp_history (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references orgs(id),
  from_msp   uuid references msps(id),
  to_msp     uuid not null references msps(id),
  approved_by uuid not null,                            -- org_admin user id
  at         timestamptz not null default now()
);

-- =============================================================================
-- 2. IDENTITY: users, identities, credentials, sessions, role grants
-- =============================================================================

create table users (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id),   -- home tenant (msp OR org); never both
  email         citext,                                 -- nullable for kiosk/LMS-only learners
  email_verified boolean not null default false,
  display_name  text not null check (length(display_name) between 1 and 120),
  job_title     text check (length(job_title) <= 120),
  locale        text not null default 'en' check (locale in ('en', 'es')),
  hire_date     date,                                   -- from Entra employeeHireDate or CSV
  status        user_status not null default 'provisioned',
  external_ref  text,                                   -- Entra oid / Google id / LMS learner id
  source        text not null default 'manual' check (source in ('manual','csv','graph','scim','google','lms','jit')),
  deprovisioned_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, email)
);
create index users_tenant_status_idx on users (tenant_id, status);
create trigger users_touch before update on users for each row execute function touch_updated_at();
comment on table users is 'A person in exactly one tenant. Minimized (title/hire_date/external_ref cleared) at deprovisioning; name+email kept for transcripts.';

-- Federated / passwordless identities. Key on (provider, issuer_tenant, subject),
-- never on email. For Entra: issuer_tenant = tid, subject = oid.
create table identities (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  tenant_id     uuid not null references tenants(id),   -- denormalized for RLS
  provider      identity_provider not null,
  issuer_tenant text not null default '',               -- Entra tid, Google hd, LMS package id
  subject       text not null,                          -- oid / sub / lms learner id / email for magic link
  linked_at     timestamptz not null default now(),
  linked_by     text not null default 'signin' check (linked_by in ('signin','sync','admin','scim')),
  last_used_at  timestamptz,
  unique (provider, issuer_tenant, subject)
);
create index identities_user_idx on identities (user_id);

-- WebAuthn passkeys (mandatory for every admin role).
create table webauthn_credentials (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  tenant_id      uuid not null references tenants(id),
  credential_id  bytea not null unique,
  public_key     bytea not null,
  sign_count     bigint not null default 0,
  transports     text[] not null default '{}',
  aaguid         uuid,
  nickname       text check (length(nickname) <= 60),
  created_at     timestamptz not null default now(),
  last_used_at   timestamptz
);

-- TOTP fallback (flagged in admin list). Secret is envelope-encrypted.
create table totp_factors (
  user_id       uuid primary key references users(id) on delete cascade,
  tenant_id     uuid not null references tenants(id),
  secret_ref    uuid not null,                          -- → tenant_secrets.id
  created_at    timestamptz not null default now()
);

-- Server-side, revocable sessions. Only the SHA-256 of the token is stored.
-- (Better Auth's session model maps here via its model/field-name options;
--  if its adapter requires its own table, keep this shape and map columns.)
create table auth_sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id) on delete cascade,
  tenant_id          uuid not null references tenants(id),
  token_hash         bytea not null unique,
  kind               text not null check (kind in ('learner','admin','kiosk','lms')),
  admin_verified_at  timestamptz,                       -- last passkey assertion (step-up uses this)
  created_at         timestamptz not null default now(),
  last_seen_at       timestamptz not null default now(),
  idle_expires_at    timestamptz not null,
  absolute_expires_at timestamptz not null,
  ip                 inet,
  user_agent         text
);
create index auth_sessions_user_idx on auth_sessions (user_id);

-- Magic links, kiosk codes, LMS launch tokens, invite tokens: all single-use, hashed.
create table one_time_tokens (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id),
  user_id     uuid references users(id) on delete cascade,
  purpose     text not null check (purpose in ('magic_link','kiosk_code','lms_launch','invite','consent_state')),
  token_hash  bytea not null unique,
  context     jsonb not null default '{}',              -- e.g. {package_id, lms_learner_id}
  attempts    smallint not null default 0,              -- kiosk lockout after 10
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index one_time_tokens_expiry_idx on one_time_tokens (expires_at) where used_at is null;

-- Role grants (scoped, optionally time-boxed, e.g. org_auditor 30 days).
create table role_grants (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  role            role_name not null,
  scope_tenant_id uuid not null references tenants(id),  -- msp or org the role applies to
  granted_by      uuid references users(id),
  reason          text,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  revoked_at      timestamptz,
  unique (user_id, role, scope_tenant_id)
);
comment on table role_grants is 'msp_technician gets one row per granted org; msp_admin one row on the msp (implies all its orgs).';

-- =============================================================================
-- 3. IdP CONNECTIONS, DIRECTORY SYNC, SCIM, SECRETS
-- =============================================================================

create table idp_connections (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references orgs(id),
  kind             idp_kind not null,
  status           idp_status not null default 'pending',
  entra_tenant_id  uuid unique,                          -- verified via client-credentials + /organization
  google_hd        citext unique,
  learner_group_ids text[] not null default '{}',        -- IdP group object ids in scope
  graph_sync       boolean not null default false,
  delta_token_ref  uuid,                                  -- → tenant_secrets (Graph deltaLink)
  last_sync_at     timestamptz,
  last_sync_error  text,
  consented_by     uuid references users(id),
  consented_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check ((kind = 'entra') = (google_hd is null))
);
create trigger idp_connections_touch before update on idp_connections for each row execute function touch_updated_at();

-- SCIM bearer tokens: we issue them, show once, store only the hash.
create table scim_tokens (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id),
  prefix      text not null,                             -- first 8 chars, for lookup and display
  token_hash  bytea not null unique,
  created_by  uuid not null references users(id),
  created_at  timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at  timestamptz
);

-- Normalized stream from Graph sync / SCIM / CSV; drives the assignment engine.
create table directory_events (
  id          bigint generated always as identity primary key,
  org_id      uuid not null references orgs(id),
  user_id     uuid references users(id),
  source      text not null check (source in ('graph','scim','csv','google','admin')),
  event       text not null check (event in ('user_created','user_updated','user_disabled','user_enabled',
                                              'user_deleted','group_membership_changed')),
  payload     jsonb not null default '{}',               -- minimal diff; no tokens
  processed_at timestamptz,
  created_at  timestamptz not null default now()
);
create index directory_events_unprocessed_idx on directory_events (org_id, id) where processed_at is null;

-- Envelope-encrypted secrets. Plaintext NEVER stored. DEK wrapped by cloud KMS.
create table tenant_secrets (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id),
  purpose      text not null,                            -- 'graph_delta', 'psa_api_key', 'lrs_credential', 'totp'
  kms_key_id   text not null,                            -- KMS key ARN/name
  key_version  int  not null,
  wrapped_dek  bytea not null,
  nonce        bytea not null,                           -- AES-256-GCM nonce
  ciphertext   bytea not null,
  created_at   timestamptz not null default now(),
  rotated_at   timestamptz
);

-- =============================================================================
-- 4. ORG STRUCTURE: groups, tracks, policies, settings
-- =============================================================================

create table groups (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id),
  name         text not null check (length(name) between 1 and 120),
  source       text not null default 'manual' check (source in ('manual','entra','google','scim')),
  external_id  text,
  created_at   timestamptz not null default now(),
  unique (org_id, source, external_id)
);

create table group_members (
  group_id   uuid not null references groups(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  org_id     uuid not null references orgs(id),
  added_at   timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Global catalog of role tracks (finance, hr, it, executive, shop_floor_ot, cui_handler, clinical, core).
create table tracks (
  id          text primary key,
  name        text not null,
  description text
);

create table group_track_mappings (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references orgs(id),
  group_id   uuid not null references groups(id) on delete cascade,
  track_id   text not null references tracks(id),
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  unique (group_id, track_id)
);

-- Org policies referenced by attestations and the "policy changed" trigger.
create table policies (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id),
  token         text not null check (token ~ '^POLICY_[A-Z0-9_]{2,30}$'),   -- e.g. POLICY_AUP
  name          text not null check (length(name) between 1 and 80),
  version_label text not null default '1',
  effective_at  date not null default current_date,
  affected_module_ids text[] not null default '{}',
  created_by    uuid references users(id),
  created_at    timestamptz not null default now(),
  unique (org_id, token, version_label)
);

-- Versioned tenant customization. Each attempt stores the version it ran with.
-- Applies at msp level (defaults) or org level (overrides).
create table tenant_settings (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id),
  version         int  not null,
  company_name    text check (company_name ~ '^[[:alnum:] &.,''-]{1,60}$'),
  helpdesk_phone  text check (helpdesk_phone ~ '^\+[1-9][0-9]{6,14}$'),     -- E.164
  report_channel_kind text check (report_channel_kind in ('report_button','email','phone','portal_url')),
  report_channel_value text check (length(report_channel_value) <= 200),
  ir_contacts     jsonb not null default '[]',             -- [{role, phone|email}]; validated in app
  logo_object_key text,                                    -- R2 key, re-encoded raster only
  default_locale  text not null default 'en' check (default_locale in ('en','es')),
  brand_colors    jsonb,                                   -- MSP white-label only
  force_2d        boolean not null default false,
  created_by      uuid references users(id),
  created_at      timestamptz not null default now(),
  unique (tenant_id, version),
  check (report_channel_kind <> 'portal_url' or report_channel_value like 'https://%')
);
comment on table tenant_settings is 'Insert a new version for every change (never update). Rendered as TEXT ONLY in the game.';

-- =============================================================================
-- 5. CONTENT CATALOG: controls, modules, versions, mappings (global, not tenant-scoped)
-- =============================================================================

-- Seeded from src/content/controls.ts CONTROLS[].
create table controls (
  id            text primary key,                         -- 'CIS-14.2', 'AT-2(3)', 'AT.L2-3.2.3', …
  framework     text not null check (framework in ('CIS','NIST53','NIST171','CMMC','HIPAA','CSF','PCI')),
  title         text not null,
  program_level boolean not null default false
);

create table modules (
  id         text primary key,                            -- 'core-shift', 'insider-tuesday', 'human-pause', 'drill:inbox'
  kind       text not null check (kind in ('shift','lesson','drill','episode','remediation','knowledge_check')),
  title      text not null,
  skill_tags text[] not null default '{}',                 -- drives remediation + policy-change suggestions
  default_track_id text references tracks(id),
  created_at timestamptz not null default now()
);

create table module_versions (
  module_id     text not null references modules(id),
  version       text not null,                             -- semver from scenario JSON
  content_hash  text not null,                             -- sha256 of canonical scenario JSON bundle
  pass_pct      smallint not null default 80,
  released_at   timestamptz not null default now(),
  retired_at    timestamptz,
  primary key (module_id, version)
);

-- Seeded from CONTENT_CONTROLS + scenario JSON "controls".
create table module_controls (
  module_id  text not null,
  version    text not null,
  control_id text not null references controls(id),
  primary key (module_id, version, control_id),
  foreign key (module_id, version) references module_versions(module_id, version)
);

create table track_modules (
  track_id  text not null references tracks(id),
  module_id text not null references modules(id),
  sort      smallint not null default 0,
  primary key (track_id, module_id)
);

-- =============================================================================
-- 6. ASSIGNMENTS
-- =============================================================================

create table assignment_rules (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id),
  trigger     assignment_reason not null,
  target      jsonb not null,                              -- {all:true} | {group_ids:[…]} | {track_id:'finance'}
  module_ids  text[] not null,
  due_days    smallint not null default 30 check (due_days between 1 and 365),
  annual_mode text check (annual_mode in ('anniversary','calendar')),
  annual_date date,                                        -- when annual_mode = 'calendar' (month/day used)
  remediation_threshold jsonb,                             -- {fails:2, of_last:3, cooldown_days:30}
  enabled     boolean not null default true,
  created_by  uuid references users(id),
  created_at  timestamptz not null default now()
);

-- Current state; one row per user × module × cycle.
create table assignments (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id),
  msp_id        uuid not null references msps(id),
  user_id       uuid not null references users(id),
  module_id     text not null references modules(id),
  reason        assignment_reason not null,
  rule_id       uuid references assignment_rules(id),
  policy_id     uuid references policies(id),               -- when reason = policy_change
  cycle_key     text not null,                              -- 'hire', '2027', 'policy:<id>', 'rem:<skill>:<date>'
  assigned_at   timestamptz not null default now(),
  due_at        timestamptz not null,
  status        assignment_status not null default 'open',
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique (org_id, user_id, module_id, cycle_key)            -- idempotent rule application
);
create index assignments_due_idx on assignments (org_id, status, due_at);
create trigger assignments_touch before update on assignments for each row execute function touch_updated_at();

-- Every change to an assignment (TRAINING_SPEC §4: "Log every edit"). Append-only.
create table assignment_events (
  id            bigint generated always as identity primary key,
  org_id        uuid not null references orgs(id),
  assignment_id uuid not null references assignments(id),
  event         text not null check (event in ('created','due_extended','waived','cancelled','paused',
                                                'resumed','completed','overdue','reassigned')),
  from_value    jsonb,
  to_value      jsonb,
  reason        text,
  actor_id      uuid,                                       -- null = system rule
  actor_tenant_id uuid,
  at            timestamptz not null default now()
);
create trigger assignment_events_no_mutation before update or delete on assignment_events
  for each row execute function forbid_mutation();

-- =============================================================================
-- 7. ATTEMPTS AND DECISIONS
-- =============================================================================

-- Working row for one play of one module version (mutable until completed).
create table attempts (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references orgs(id),
  user_id          uuid not null references users(id),
  assignment_id    uuid references assignments(id),          -- null for self-practice
  module_id        text not null,
  module_version   text not null,
  settings_id      uuid references tenant_settings(id),      -- the exact config the learner saw
  attempt_no       smallint not null,
  channel          delivery_channel not null,
  render_mode      render_mode not null default '3d',
  lms_registration text,                                     -- cmi5 registration / SCORM attempt id
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  score            numeric(5,2) check (score between 0 and 100),
  passed           boolean,
  kc_score         numeric(5,2),                             -- end-of-shift knowledge check
  attestation_accepted_at timestamptz,
  foreign key (module_id, module_version) references module_versions(module_id, version),
  unique (user_id, module_id, attempt_no)
);
create index attempts_org_user_idx on attempts (org_id, user_id);

-- One row per in-game choice. Append-only. Maps 1:1 to an xAPI "decided"/"reported" statement.
create table decisions (
  id              bigint generated always as identity primary key,
  org_id          uuid not null references orgs(id),
  attempt_id      uuid not null references attempts(id),
  client_event_id uuid not null,                             -- idempotency from the offline queue
  beat_id         text not null,                             -- 'MON-03-vishing-mfa'
  variant_id      text,
  choice_id       text not null,
  outcome         text not null,                             -- 'safe_reported', 'account_takeover', …
  score           smallint not null check (score between 0 and 100),
  reported        boolean not null default false,
  latency_ms      int check (latency_ms >= 0),               -- time-to-decide / time-to-report
  skill_tags      text[] not null default '{}',
  control_ids     text[] not null default '{}',
  occurred_at     timestamptz not null,
  received_at     timestamptz not null default now(),
  unique (attempt_id, client_event_id)
);
create index decisions_org_time_idx on decisions (org_id, occurred_at);
create trigger decisions_no_mutation before update or delete on decisions
  for each row execute function forbid_mutation();

-- =============================================================================
-- 8. EVIDENCE: training_records with a per-org-per-year hash chain
-- =============================================================================

-- Chain head per segment (org × year). The insert trigger locks it, so seq is
-- gapless and ordering is serial per org without blocking other orgs.
create table record_chain_heads (
  org_id     uuid not null references orgs(id),
  segment    smallint not null,                              -- calendar year of the record
  seq        bigint not null default 0,
  last_hash  bytea not null default '\x00'::bytea,           -- genesis = 0x00
  updated_at timestamptz not null default now(),
  primary key (org_id, segment)
);

create table training_records (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references orgs(id),
  msp_id             uuid not null references msps(id),
  segment            smallint not null,
  seq                bigint not null,
  event              record_event not null,
  -- TRAINING_SPEC §4 fields (frozen snapshot at the time of the event)
  user_id            uuid not null references users(id),
  email_snapshot     citext,
  name_snapshot      text not null,
  roles_snapshot     text[] not null default '{}',           -- group/track names at the time
  module_id          text not null,
  module_version     text not null,
  content_hash       text not null,
  assignment_id      uuid references assignments(id),
  assigned_at        timestamptz,
  reason             assignment_reason,
  started_at         timestamptz,
  completed_at       timestamptz,
  attempt_id         uuid references attempts(id),
  decisions_count    int,
  decisions_digest   bytea,                                  -- sha256 over the attempt's decision rows (canonical)
  score              numeric(5,2),
  passed             boolean,
  attempts           smallint,
  attestation_accepted_at timestamptz,
  certificate_id     uuid,
  settings_id        uuid references tenant_settings(id),
  identity_source    identity_source not null,
  channel            delivery_channel,
  supersedes_id      uuid references training_records(id),   -- for 'correction'
  note               text,                                   -- correction/waiver reason
  actor_id           uuid,                                   -- who caused it (null = learner/system)
  -- Tamper evidence
  payload            jsonb not null,                         -- all fields above, as the app canonicalized them
  payload_canonical  text  not null,                         -- RFC 8785 JCS text of payload
  prev_hash          bytea not null,
  record_hash        bytea not null,
  created_at         timestamptz not null default now(),
  unique (org_id, segment, seq),
  check (event <> 'correction' or (supersedes_id is not null and note is not null))
);
create index training_records_user_idx   on training_records (org_id, user_id, module_id);
create index training_records_module_idx on training_records (org_id, module_id, event, created_at);

-- Assign seq + chain hashes. The app supplies payload + payload_canonical; the
-- DB verifies they agree and computes the chain, so app code can't skip it.
create or replace function training_records_chain() returns trigger
language plpgsql as $$
declare
  head record_chain_heads%rowtype;
begin
  if new.payload_canonical::jsonb is distinct from new.payload then
    raise exception 'payload_canonical does not match payload';
  end if;
  new.segment := extract(year from coalesce(new.created_at, now()))::smallint;

  insert into record_chain_heads (org_id, segment) values (new.org_id, new.segment)
    on conflict do nothing;
  select * into head from record_chain_heads
    where org_id = new.org_id and segment = new.segment
    for update;

  new.seq         := head.seq + 1;
  new.prev_hash   := head.last_hash;
  new.record_hash := digest(head.last_hash || convert_to(new.payload_canonical, 'UTF8'), 'sha256');

  update record_chain_heads
     set seq = new.seq, last_hash = new.record_hash, updated_at = now()
   where org_id = new.org_id and segment = new.segment;
  return new;
end $$;

create trigger training_records_chain_bi before insert on training_records
  for each row execute function training_records_chain();
create trigger training_records_no_mutation before update or delete on training_records
  for each row execute function forbid_mutation();
comment on table training_records is 'Append-only evidence. Fix mistakes with event=correction + supersedes_id. Hash chain per (org, year).';

-- Daily signed anchors (Ed25519 via KMS). Copies also go to a retention-locked R2 bucket.
create table record_anchors (
  id           bigint generated always as identity primary key,
  org_id       uuid not null,
  segment      smallint not null,
  seq          bigint not null,
  last_hash    bytea not null,
  signed_at    timestamptz not null default now(),
  kms_key_id   text not null,
  signature    bytea not null,
  r2_object_key text not null,
  foreign key (org_id, segment) references record_chain_heads(org_id, segment)
);
create trigger record_anchors_no_mutation before update or delete on record_anchors
  for each row execute function forbid_mutation();

create table certificates (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references orgs(id),
  user_id        uuid not null references users(id),
  record_id      uuid not null references training_records(id),
  record_hash    bytea not null,
  module_id      text not null,
  module_version text not null,
  issued_at      timestamptz not null default now(),
  pdf_object_key text,                                       -- R2 certs/{org}/{id}.pdf
  revoked_record_id uuid references training_records(id)    -- set via insert of a revoke record + this pointer
);
comment on column certificates.revoked_record_id is 'Only column ever updated, and only by the certificate-revoke server function (audited).';

-- Tombstones for retention purges (whole expired segments only).
create table retention_purges (
  id            bigint generated always as identity primary key,
  org_id        uuid not null,
  segment       smallint not null,
  records_deleted bigint not null,
  decisions_deleted bigint not null,
  final_seq     bigint not null,
  final_hash    bytea not null,
  approved_by   uuid,
  purged_at     timestamptz not null default now()
);

-- Security-definer purge: the ONLY delete path for evidence. Callable by
-- harbor_retention; refuses during legal hold or before retention expiry.
create or replace function purge_expired_segment(p_org uuid, p_segment smallint, p_approved_by uuid)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  yrs smallint; hold boolean; n_rec bigint; n_dec bigint; head record_chain_heads%rowtype;
begin
  select retention_years, legal_hold into yrs, hold from orgs where id = p_org;
  if hold then raise exception 'org % is under legal hold', p_org; end if;
  if make_date(p_segment + 1, 1, 1) + make_interval(years => yrs) > current_date then
    raise exception 'segment % not yet past % year retention', p_segment, yrs;
  end if;
  select * into head from record_chain_heads where org_id = p_org and segment = p_segment for update;
  if not found then
    return 0;                                               -- nothing was ever written in this segment
  end if;
  perform set_config('app.retention_purge', 'on', true);
  delete from certificates c using training_records r
    where c.record_id = r.id and r.org_id = p_org and r.segment = p_segment;
  delete from training_records where org_id = p_org and segment = p_segment;
  get diagnostics n_rec = row_count;
  delete from decisions d using attempts a
    where d.attempt_id = a.id and a.org_id = p_org
      and extract(year from d.occurred_at) = p_segment;
  get diagnostics n_dec = row_count;
  insert into retention_purges (org_id, segment, records_deleted, decisions_deleted, final_seq, final_hash, approved_by)
    values (p_org, p_segment, n_rec, n_dec, head.seq, head.last_hash, p_approved_by);
  return n_rec;
end $$;
-- revoke all on function purge_expired_segment from public;
-- grant execute on function purge_expired_segment to harbor_retention;

-- =============================================================================
-- 9. AUDIT LOG (hash-chained per tenant, append-only)
-- =============================================================================

create table audit_log (
  id              bigint generated always as identity primary key,
  tenant_id       uuid not null references tenants(id),      -- the tenant whose data was touched
  actor_id        uuid,                                      -- null = system
  actor_tenant_id uuid,                                      -- MSP id when an MSP acts in an org
  via_break_glass boolean not null default false,
  action          text not null,                             -- 'org.settings.update', 'records.export', 'idp.connect', …
  target_type     text,
  target_id       text,
  diff            jsonb,                                     -- before/after, PII-redacted
  ip              inet,
  user_agent      text,
  request_id      text,
  at              timestamptz not null default now(),
  prev_hash       bytea not null,
  entry_hash      bytea not null
);
create index audit_log_tenant_time_idx on audit_log (tenant_id, at desc);
create index audit_log_actor_tenant_idx on audit_log (actor_tenant_id, at desc) where actor_tenant_id is not null;

create table audit_chain_heads (
  tenant_id uuid primary key references tenants(id),
  last_hash bytea not null default '\x00'::bytea
);

create or replace function audit_log_chain() returns trigger
language plpgsql as $$
declare h bytea;
begin
  insert into audit_chain_heads (tenant_id) values (new.tenant_id) on conflict do nothing;
  select last_hash into h from audit_chain_heads where tenant_id = new.tenant_id for update;
  new.prev_hash  := h;
  new.entry_hash := digest(h || convert_to(jsonb_build_object(
      'tenant_id', new.tenant_id, 'actor_id', new.actor_id, 'actor_tenant_id', new.actor_tenant_id,
      'action', new.action, 'target_type', new.target_type, 'target_id', new.target_id,
      'diff', new.diff, 'at', new.at)::text, 'UTF8'), 'sha256');
  update audit_chain_heads set last_hash = new.entry_hash where tenant_id = new.tenant_id;
  return new;
end $$;
create trigger audit_log_chain_bi before insert on audit_log for each row execute function audit_log_chain();
create trigger audit_log_no_mutation before update or delete on audit_log
  for each row execute function forbid_mutation();
-- Review note: jsonb::text output is deterministic within Postgres but is not
-- RFC 8785. The offline verifier must recompute it the same way (or switch to an
-- app-supplied canonical string like training_records).

-- =============================================================================
-- 10. LMS DELIVERY
-- =============================================================================

create table lms_packages (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id),
  standard      lms_standard not null,
  module_id     text not null references modules(id),
  package_key   text not null unique,                        -- public, in the zip; NOT a secret
  allowed_origins text[] not null default '{}',              -- LMS origins for frame-ancestors + postMessage
  auto_create_learners boolean not null default true,
  seat_cap      int,
  created_by    uuid references users(id),
  created_at    timestamptz not null default now(),
  revoked_at    timestamptz
);

create table lms_launches (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references orgs(id),
  package_id     uuid not null references lms_packages(id),
  user_id        uuid not null references users(id),
  attempt_id     uuid references attempts(id),
  lms_learner_id text not null,
  registration   text,                                        -- cmi5 registration
  launched_at    timestamptz not null default now(),
  ip             inet
);

-- =============================================================================
-- 11. COMMERCIAL: subscriptions, usage metering
-- =============================================================================

create table subscriptions (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references orgs(id),
  msp_id         uuid not null references msps(id),
  plan           text not null,                               -- 'core', 'compliance', 'white_label', 'records_vault'
  committed_seats int not null default 0,
  term           text not null check (term in ('monthly','annual')),
  starts_at      date not null,
  ends_at        date,
  source         subscription_source not null default 'direct',
  external_ref   text,                                        -- marketplace subscription id (v2)
  status         text not null default 'active' check (status in ('active','suspended','cancelled')),
  created_at     timestamptz not null default now(),
  unique (source, external_ref)
);

create table usage_daily (
  org_id            uuid not null references orgs(id),
  msp_id            uuid not null references msps(id),
  day               date not null,
  billable_learners int not null,
  active_learners   int not null,
  launches          int not null,
  lms_launches      int not null default 0,
  primary key (org_id, day)
);

-- =============================================================================
-- 12. OUTBOX / EXPORTS
-- =============================================================================

create table notification_outbox (
  id          bigint generated always as identity primary key,
  org_id      uuid not null references orgs(id),
  user_id     uuid references users(id),
  channel     text not null check (channel in ('email','teams_webhook')),
  template    text not null,                                  -- 'invite','due_soon','overdue','certificate','admin_digest'
  locale      text not null default 'en',
  payload     jsonb not null default '{}',
  status      text not null default 'pending' check (status in ('pending','sent','failed','suppressed')),
  attempts    smallint not null default 0,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notification_outbox_pending_idx on notification_outbox (status, created_at) where status = 'pending';

create table data_exports (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id),
  kind          text not null check (kind in ('evidence_package','full_export','report')),
  params        jsonb not null default '{}',
  requested_by  uuid not null references users(id),
  status        text not null default 'queued' check (status in ('queued','running','ready','failed','expired')),
  object_key    text,
  manifest_sha256 bytea,
  expires_at    timestamptz,                                  -- signed-URL style; default 7 days
  created_at    timestamptz not null default now()
);

-- =============================================================================
-- 13. ROW-LEVEL SECURITY
-- =============================================================================
-- Pattern: enable + FORCE RLS (FORCE so even the owner is subject in normal
-- sessions; migrations run as owner with RLS bypass only via a deliberate role).
-- Policies are shown for the main tables; apply the same pattern to every
-- table with org_id / tenant_id.

do $$
declare t text;
begin
  foreach t in array array[
    'users','identities','webauthn_credentials','totp_factors','auth_sessions','one_time_tokens',
    'role_grants','idp_connections','scim_tokens','directory_events','tenant_secrets','groups',
    'group_members','group_track_mappings','policies','tenant_settings','assignment_rules',
    'assignments','assignment_events','attempts','decisions','training_records','record_chain_heads',
    'record_anchors','certificates','audit_log','lms_packages','lms_launches','subscriptions',
    'usage_daily','notification_outbox','data_exports']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
  end loop;
end $$;

-- Tables keyed by org_id
do $$
declare t text;
begin
  foreach t in array array[
    'idp_connections','scim_tokens','directory_events','groups','group_members','group_track_mappings',
    'policies','assignment_rules','assignments','assignment_events','attempts','decisions',
    'training_records','record_chain_heads','record_anchors','certificates','lms_packages',
    'lms_launches','subscriptions','usage_daily','notification_outbox','data_exports']
  loop
    execute format(
      'create policy %I on %I using (org_id = any(app_tenant_ids())) with check (org_id = any(app_tenant_ids()))',
      t || '_tenant_isolation', t);
  end loop;
end $$;

-- Tables keyed by tenant_id (msp or org)
do $$
declare t text;
begin
  foreach t in array array[
    'users','identities','webauthn_credentials','totp_factors','auth_sessions','one_time_tokens',
    'tenant_secrets','tenant_settings','audit_log']
  loop
    execute format(
      'create policy %I on %I using (tenant_id = any(app_tenant_ids())) with check (tenant_id = any(app_tenant_ids()))',
      t || '_tenant_isolation', t);
  end loop;
end $$;

-- role_grants: visible if the grant's scope OR the grantee's home tenant is in scope.
create policy role_grants_tenant_isolation on role_grants
  using (scope_tenant_id = any(app_tenant_ids())
         or exists (select 1 from users u where u.id = role_grants.user_id and u.tenant_id = any(app_tenant_ids())))
  with check (scope_tenant_id = any(app_tenant_ids()));

-- Review notes on RLS:
--  * Pre-auth lookups (resolve a session token, a magic-link token, an Entra
--    (tid, oid), a SCIM token or an LMS package_key) happen BEFORE tenant scope
--    is known. Do them through narrow SECURITY DEFINER functions that return
--    only (user_id, tenant_id) for an exact hash/key match, e.g.
--    auth_resolve_session(token_hash) — never by granting broad SELECT.
--  * Cron/queue jobs run per org: the job sets app.tenant_ids to that one org.
--  * The MSP roll-up dashboard sets app.tenant_ids to all orgs of the MSP
--    (computed from role_grants), so cross-org reads remain RLS-bounded.
--  * tenants/msps/orgs and the global catalog (controls, modules,
--    module_versions, module_controls, tracks, track_modules) need their own
--    policies: catalog is read-only to harbor_app; tenants readable where
--    id = any(app_tenant_ids()).

-- =============================================================================
-- 14. GRANTS (append-only enforcement at the privilege layer too)
-- =============================================================================
-- grant select, insert, update on users, identities, webauthn_credentials, totp_factors,
--   auth_sessions, one_time_tokens, role_grants, idp_connections, scim_tokens, tenant_secrets,
--   groups, group_members, group_track_mappings, policies, assignment_rules, assignments,
--   attempts, lms_packages, subscriptions, notification_outbox, data_exports, directory_events
--   to harbor_app;
-- grant delete on auth_sessions, one_time_tokens, group_members, group_track_mappings to harbor_app;
-- grant select, insert on tenant_settings, assignment_events, decisions, training_records,
--   record_anchors, audit_log, lms_launches, usage_daily to harbor_app;   -- NO update/delete
-- grant update (revoked_record_id) on certificates to harbor_app;
-- grant select, insert on certificates to harbor_app;
-- grant select on controls, modules, module_versions, module_controls, tracks, track_modules to harbor_app;
-- grant select, update on record_chain_heads, audit_chain_heads to harbor_app; -- needed by triggers
--   (better: make the chain trigger functions SECURITY DEFINER and grant nothing here)

-- =============================================================================
-- 15. SEED (illustrative)
-- =============================================================================
insert into tracks (id, name) values
  ('core', 'Core Shift (all staff)'), ('finance', 'Finance and AP'), ('hr', 'HR'),
  ('it', 'IT and help desk'), ('executive', 'Executives'), ('shop_floor_ot', 'Shop floor / OT'),
  ('cui_handler', 'CUI handlers'), ('clinical', 'Clinical / PHI')
on conflict do nothing;
-- controls: generated from src/content/controls.ts CONTROLS[] by a build script (ticket P0-15).
-- module_controls: generated from CONTENT_CONTROLS + scenario JSON "controls".

-- =============================================================================
-- AUTH NOTE: migrations/auth/0001_auth.sql (Better Auth's "user/session/account/
-- verification" camelCase tables) is superseded by users / identities /
-- auth_sessions / one_time_tokens above. Either map Better Auth's models onto
-- these tables with its modelName/fields options, or keep Better Auth's tables
-- as an internal detail with a 1:1 FK from "user".id to users.id. Decide in
-- ticket P0-06 after checking Better Auth 1.6's adapter options.
-- =============================================================================
