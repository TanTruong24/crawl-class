create extension if not exists pgcrypto;

create table if not exists public.tutor_classes (
  id uuid primary key default gen_random_uuid(),
  class_key text unique not null,
  title text not null,
  url text,
  location text,
  subject text,
  fee text,
  schedule text,
  raw_text text,
  first_seen_at timestamptz not null default now(),
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tutor_classes_class_key_idx
  on public.tutor_classes (class_key);
