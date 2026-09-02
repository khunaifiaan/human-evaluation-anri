create extension if not exists pgcrypto;

create table if not exists public.evaluation_sessions (
  id uuid primary key default gen_random_uuid(),
  evaluator_label text not null check (char_length(evaluator_label) between 1 and 120),
  resume_code text not null unique check (char_length(resume_code) = 8),
  consent_at timestamptz not null,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.evaluation_responses (
  session_id uuid not null references public.evaluation_sessions(id) on delete cascade,
  item_order integer not null check (item_order between 1 and 152),
  image_id text not null,
  fluency smallint not null check (fluency between 1 and 5),
  accuracy smallint not null check (accuracy between 1 and 5),
  factual_error text not null check (factual_error in ('ya', 'tidak', 'tidak_berlaku')),
  note text not null default '' check (char_length(note) <= 800),
  updated_at timestamptz not null default now(),
  primary key (session_id, item_order)
);

create index if not exists idx_evaluation_responses_session
  on public.evaluation_responses(session_id, item_order);

alter table public.evaluation_sessions enable row level security;
alter table public.evaluation_responses enable row level security;

-- Tidak ada policy publik. Seluruh akses dilakukan oleh API server Netlify
-- menggunakan SUPABASE_SERVICE_ROLE_KEY yang disimpan sebagai secret.
