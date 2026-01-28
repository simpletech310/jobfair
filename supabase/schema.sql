-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS (Managed by Supabase Auth, but we use public tables for profiles)
-- We will use a trigger to create public.seekers or public.employers on auth.users creation?
-- Or just let the client create it? For MVP, client creation is easier but less secure.
-- Better: Shared public profiles or role-based tables.

-- ENUMS
create type user_role as enum ('seeker', 'employer');
create type job_type as enum ('Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship');
create type application_status as enum ('pending', 'reviewing', 'interviewing', 'rejected', 'accepted');
create type job_status as enum ('open', 'filled', 'on_hold', 'closed');

-- SEEKERS TABLE
create table public.seekers (
  id uuid references auth.users not null primary key,
  email text not null,
  full_name text,
  title text,
  bio text,
  skills text[], -- Array of strings
  experience_years int default 0,
  resume_stats jsonb, -- Metadata about uploaded resumes
  intro_video_url text,
  social_links jsonb default '{}'::jsonb,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- EMPLOYERS TABLE
create table public.employers (
  id uuid references auth.users not null primary key,
  email text not null,
  company_name text not null,
  company_logo_url text,
  mission text,
  culture_description text,
  website text,
  social_links jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- JOBS TABLE
create table public.jobs (
  id uuid default uuid_generate_v4() primary key,
  employer_id uuid references public.employers(id) not null,
  title text not null,
  description text not null,
  location text not null,
  salary_range text,
  job_type job_type default 'Full-time',
  requirements text[],
  status job_status default 'open', -- NEW: Replaces is_active for granular control
  is_active boolean default true, -- DEPRECATED: Keep for backward compat if needed, but logic should move to status
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- APPLICATIONS TABLE
create table public.applications (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs(id) not null,
  seeker_id uuid references public.seekers(id) not null,
  status application_status default 'pending',
  resume_url text,
  video_url text,
  cover_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(job_id, seeker_id)
);

-- STORAGE BUCKETS (Executed in SQL Editor or via UI, but documented here)
-- insert into storage.buckets (id, name) values ('resumes', 'resumes');
-- insert into storage.buckets (id, name) values ('videos', 'videos');
-- insert into storage.buckets (id, name) values ('avatars', 'images');

-- RLS POLICIES (Draft)

alter table public.seekers enable row level security;
alter table public.employers enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;

-- Seekers: Public read? Or only employers?
-- For MVP, let's make seekers viewable by authenticated users (employers need to see them).
create policy "Seekers are project-visible" on public.seekers for select using (auth.role() = 'authenticated');
create policy "Users can update own seeker profile" on public.seekers for update using (auth.uid() = id);
create policy "Users can insert own seeker profile" on public.seekers for insert with check (auth.uid() = id);

-- Employers: Public read (jobs are public)
create policy "Employers are public" on public.employers for select using (true);
create policy "Employers can update own profile" on public.employers for update using (auth.uid() = id);
create policy "Employers can insert own profile" on public.employers for insert with check (auth.uid() = id);

-- Jobs: Public read
create policy "Jobs are public" on public.jobs for select using (true);
create policy "Employers can insert/update own jobs" on public.jobs for all using (auth.uid() = employer_id);

-- Applications:
-- Seekers can see their own applications
create policy "Seekers see own applications" on public.applications for select using (auth.uid() = seeker_id);
create policy "Seekers can create applications" on public.applications for insert with check (auth.uid() = seeker_id);
-- Employers can see applications for their jobs
create policy "Employers see applications for their jobs" on public.applications for select using (
  exists (select 1 from public.jobs where jobs.id = applications.job_id and jobs.employer_id = auth.uid())
);
