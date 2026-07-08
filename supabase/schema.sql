-- ============================================================================
-- COMPUTRONIUM DATABASE SCHEMA
--
-- HOW TO USE (one time, ~2 minutes):
--   1. Create a free project at https://supabase.com
--   2. Open your project → SQL Editor → New query
--   3. Paste this ENTIRE file and click "Run"
--   4. Then: Authentication → Sign In / Up → Email → turn OFF "Confirm email"
--      (accounts here are username-only; the fake emails can't receive mail)
--
-- Safe to re-run: everything uses IF NOT EXISTS / ON CONFLICT.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PROFILES — one row per registered user (linked to Supabase Auth)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  bio text,
  recovery_email text,            -- optional, user can add in /settings
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- POSTS — one row per project (always showing its LATEST content;
--         old content lives in post_versions)
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete set null,
  anon_edit_password text,        -- sha256 hash; only set for account-less posts
  name text not null default 'Untitled project',
  description text,
  answers jsonb not null default '{}'::jsonb,  -- prompted-question answers, keyed by question id
  instructions text,
  code_text text,                 -- pasted code (uploaded code files live in post_files)
  video_url text,
  difficulty text check (difficulty in ('green','yellow','red')),
  advanced boolean not null default false,     -- true → also shown on /advanced
  price_estimate numeric,
  fork_of uuid references public.posts (id) on delete set null,
  fork_count integer not null default 0,
  alternatives_category text,     -- id from config/categories.ts (admin-assigned)
  alternatives_rank integer,      -- 1–3 = "top pick" on the category page
  pinned boolean not null default false,       -- admin: boost in the feed
  upvotes integer not null default 0,
  views integer not null default 0,
  current_version integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_owner_idx on public.posts (owner_id);
create index if not exists posts_alt_category_idx on public.posts (alternatives_category);

-- ---------------------------------------------------------------------------
-- POST_VERSIONS — GitHub-style history: a FULL json snapshot per edit.
-- Never deleted, never diffed. The History tab reads these.
-- ---------------------------------------------------------------------------
create table if not exists public.post_versions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (post_id, version_number)
);

-- ---------------------------------------------------------------------------
-- POST_HARDWARE — which parts a post uses.
-- Either hardware_id (an id from config/hardware.ts) OR a custom part.
-- ---------------------------------------------------------------------------
create table if not exists public.post_hardware (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  hardware_id text,               -- id from config/hardware.ts, or null
  custom_name text,               -- for add-your-own parts
  custom_link text,
  custom_price numeric
);

create index if not exists post_hardware_post_idx on public.post_hardware (post_id);
create index if not exists post_hardware_hw_idx on public.post_hardware (hardware_id);

-- ---------------------------------------------------------------------------
-- POST_FILES — uploaded files and external links.
-- kind: 'image' | 'model' (STL/3MF) | 'code'
-- is_external: true when it's a pasted link (GitHub etc.) instead of an upload
-- ---------------------------------------------------------------------------
create table if not exists public.post_files (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  kind text not null check (kind in ('image','model','code')),
  url text not null,
  storage_path text,              -- set for uploads (used to delete from storage)
  filename text,
  is_external boolean not null default false
);

create index if not exists post_files_post_idx on public.post_files (post_id);

-- ---------------------------------------------------------------------------
-- STORAGE BUCKET — public bucket for images / small STL / code uploads.
-- The storage adapter (lib/storage.ts) reads and writes this bucket.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('computronium-files', 'computronium-files', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
--
-- Simple, beginner-friendly model:
--   * Anyone (even logged out) can READ posts, versions, hardware, files,
--     and profiles — it's a public site.
--   * NOBODY can write directly from the browser. All writes go through the
--     app's API routes, which use the secret service-role key (it bypasses
--     RLS) after checking permissions in plain TypeScript you can read in
--     app/api/*. One place to look, no SQL policy archaeology.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_versions enable row level security;
alter table public.post_hardware enable row level security;
alter table public.post_files enable row level security;

drop policy if exists "public read profiles" on public.profiles;
create policy "public read profiles" on public.profiles for select using (true);

drop policy if exists "public read posts" on public.posts;
create policy "public read posts" on public.posts for select using (true);

drop policy if exists "public read versions" on public.post_versions;
create policy "public read versions" on public.post_versions for select using (true);

drop policy if exists "public read hardware" on public.post_hardware;
create policy "public read hardware" on public.post_hardware for select using (true);

drop policy if exists "public read files" on public.post_files;
create policy "public read files" on public.post_files for select using (true);
