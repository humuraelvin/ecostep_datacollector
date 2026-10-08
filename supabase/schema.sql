create extension if not exists pgcrypto;

create table if not exists public.research_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  wave text not null check (wave in ('baseline', 'follow_up')),
  participant_code text not null check (participant_code ~ '^[A-Z0-9]{6,10}$'),
  resident_confirmed boolean not null check (resident_confirmed is true),
  heard_news boolean not null,
  news_sources text[] not null default '{}',
  news_language text not null check (news_language in ('kinyarwanda', 'english', 'other')),
  environmental_issues text[] not null default '{}',
  waste_answers jsonb not null default '{}'::jsonb,
  clean_actions text[] not null default '{}',
  waste_disposal text not null,
  separates_waste text not null check (separates_waste in ('often', 'sometimes', 'no', 'not_sure')),
  services_used text[] not null default '{}',
  barriers text[] not null default '{}',
  knowledge_score integer not null default 0 check (knowledge_score between 0 and 5),
  unique (participant_code, wave)
);

create index if not exists research_responses_created_at_idx
  on public.research_responses (created_at desc);
create index if not exists research_responses_wave_idx
  on public.research_responses (wave);

alter table public.research_responses enable row level security;

-- Browser roles have no access. The Next.js server uses the secret key and
-- exposes only validated submissions and admin-authenticated review/export routes.
revoke all on table public.research_responses from anon, authenticated;
grant all on table public.research_responses to service_role;
