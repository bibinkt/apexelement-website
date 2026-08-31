-- FrontlinePros schema. Lives in the shared A2Z Supabase project; every table
-- is prefixed fp_ so it never collides with a2z_* or the marketing contacts table.
--
-- Run once:  psql "$SUPABASE_DB_URL" -f db/frontlinepros.sql
-- Safe to re-run.

-- ─────────────────────────────────────────────────────────────
-- shops — one row per onboarded business. The assigned Twilio
-- number is the identity key: a forwarded call carries the
-- caller's number, not the shop's, so the number the call LANDS
-- on is the only deterministic way to know whose call it is.
-- ─────────────────────────────────────────────────────────────
create table if not exists fp_shops (
  id                uuid primary key default gen_random_uuid(),
  business_name     text not null,
  trade_id          text not null default 'appliance',
  owner_phone       text not null unique,          -- E.164, also the login identity
  owner_name        text,
  owner_email       text,
  assigned_number   text unique,                   -- E.164 FrontlinePros number for this shop
  website           text,
  service_area      text,
  address           text,
  timezone          text default 'America/New_York',
  status            text not null default 'onboarding',  -- onboarding | active | paused
  onboarding_step   text not null default 'start',
  onboarding_data   jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  activated_at      timestamptz
);
create index if not exists fp_shops_number_idx on fp_shops (assigned_number);
create index if not exists fp_shops_phone_idx  on fp_shops (owner_phone);

-- ─────────────────────────────────────────────────────────────
-- conversations — one per rescued call
-- ─────────────────────────────────────────────────────────────
create table if not exists fp_conversations (
  id                uuid primary key default gen_random_uuid(),
  shop_id           uuid not null references fp_shops(id) on delete cascade,
  caller_phone      text not null,
  status            text not null default 'open',   -- open | carded | hazard | abandoned | stopped
  state             jsonb not null default '{}'::jsonb,
  reshoot_attempts  int  not null default 0,
  hazard            boolean not null default false,
  hazard_phrase     text,
  call_sid          text,
  started_at        timestamptz not null default now(),
  first_reply_at    timestamptz,
  closed_at         timestamptz
);
create index if not exists fp_conv_shop_idx   on fp_conversations (shop_id, started_at desc);
create index if not exists fp_conv_caller_idx on fp_conversations (shop_id, caller_phone, status);

-- ─────────────────────────────────────────────────────────────
-- messages — full transcript, including drafts the guard blocked
-- ─────────────────────────────────────────────────────────────
create table if not exists fp_messages (
  id               bigserial primary key,
  conversation_id  uuid not null references fp_conversations(id) on delete cascade,
  direction        text not null,        -- in | out
  body             text,
  media_url        text,
  blocked          boolean not null default false,
  violation        text,
  created_at       timestamptz not null default now()
);
create index if not exists fp_msg_conv_idx on fp_messages (conversation_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- job cards — assembled in code (L5), never written by a model
-- ─────────────────────────────────────────────────────────────
create table if not exists fp_jobcards (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references fp_conversations(id) on delete cascade,
  shop_id          uuid not null references fp_shops(id) on delete cascade,
  card_text        text not null,
  fields           jsonb not null default '{}'::jsonb,
  identified       boolean not null default false,
  delivered_at     timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists fp_card_shop_idx on fp_jobcards (shop_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- opt-outs — carrier requirement. Scoped per shop because each
-- shop sends from its own number.
-- ─────────────────────────────────────────────────────────────
create table if not exists fp_optouts (
  shop_id     uuid not null references fp_shops(id) on delete cascade,
  phone       text not null,
  created_at  timestamptz not null default now(),
  primary key (shop_id, phone)
);

-- ─────────────────────────────────────────────────────────────
-- owner sessions — login is the owner's phone plus a code we text
-- ─────────────────────────────────────────────────────────────
create table if not exists fp_sessions (
  token       text primary key,
  shop_id     uuid not null references fp_shops(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);
create table if not exists fp_login_codes (
  phone       text primary key,
  code        text not null,
  attempts    int not null default 0,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- cost metering — instrumented from the first commit, because the
-- pricing decision depends on real per-conversation numbers
-- ─────────────────────────────────────────────────────────────
create table if not exists fp_costs (
  id               bigserial primary key,
  conversation_id  uuid references fp_conversations(id) on delete cascade,
  shop_id          uuid references fp_shops(id) on delete cascade,
  kind             text not null,     -- l0_safety | l1_dialogue | l2_vision | l4_triage | l6_guard | sms_out | sms_in | mms_in | voice
  model            text,
  input_tokens     int,
  output_tokens    int,
  usd              numeric(10,6) not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists fp_costs_conv_idx on fp_costs (conversation_id);
create index if not exists fp_costs_shop_idx on fp_costs (shop_id, created_at desc);

-- Service-role only. No anon access to any fp_ table.
alter table fp_shops         enable row level security;
alter table fp_conversations enable row level security;
alter table fp_messages      enable row level security;
alter table fp_jobcards      enable row level security;
alter table fp_optouts       enable row level security;
alter table fp_sessions      enable row level security;
alter table fp_login_codes   enable row level security;
alter table fp_costs         enable row level security;
