create extension if not exists pgcrypto;

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  canonical_url text not null unique,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  last_checked_at timestamptz not null default now()
);

create table if not exists opportunity_sources (
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  mode text not null check (mode in ('keyword', 'competitor_search')),
  input text not null,
  payload jsonb not null,
  primary key (opportunity_id, mode, input)
);

create table if not exists discovery_jobs (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('keyword', 'competitor_search')),
  input text not null,
  language text not null default 'en',
  region text not null default 'us',
  requested_limit integer not null check (requested_limit in (50, 100, 200, 500)),
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  summary jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists opportunity_sources_mode_opportunity_id_idx on opportunity_sources (mode, opportunity_id);
create index if not exists discovery_jobs_status_created_at_idx on discovery_jobs (status, created_at);
