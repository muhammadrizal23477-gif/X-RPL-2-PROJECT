-- XI RPL 2 PROJECT
-- Run this in Supabase SQL Editor after creating your project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  class_name text default 'XI RPL 2',
  role text not null default 'student' check (role in ('student','admin','superadmin')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  label text not null default 'Admin Khusus',
  created_by uuid not null references public.profiles(id) on delete cascade,
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text,
  due_date date,
  status text not null default 'todo' check (status in ('todo','done')),
  owner_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  day_name text not null,
  start_time time not null,
  end_time time not null,
  subject text not null,
  teacher text,
  room text
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.finance (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  title text not null,
  amount bigint not null check (amount >= 0),
  transaction_date date not null default current_date,
  note text
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  category text,
  url text
);

create table if not exists public.scholarships (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  deadline date,
  url text
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','superadmin')
  );
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'superadmin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.admin_codes enable row level security;
alter table public.tasks enable row level security;
alter table public.schedules enable row level security;
alter table public.announcements enable row level security;
alter table public.finance enable row level security;
alter table public.notes enable row level security;
alter table public.books enable row level security;
alter table public.scholarships enable row level security;

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update using (id = auth.uid() or public.is_admin());

drop policy if exists "admin codes admin read" on public.admin_codes;
create policy "admin codes admin read" on public.admin_codes for select using (public.is_admin());

drop policy if exists "admin codes super create" on public.admin_codes;
create policy "admin codes super create" on public.admin_codes for insert with check (public.is_superadmin() and created_by = auth.uid());

drop policy if exists "admin codes super revoke" on public.admin_codes;
create policy "admin codes super revoke" on public.admin_codes for update using (public.is_superadmin());

drop policy if exists "tasks read" on public.tasks;
create policy "tasks read" on public.tasks for select using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "tasks own insert" on public.tasks;
create policy "tasks own insert" on public.tasks for insert with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "tasks own update" on public.tasks;
create policy "tasks own update" on public.tasks for update using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "tasks own delete" on public.tasks;
create policy "tasks own delete" on public.tasks for delete using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "schedule read" on public.schedules;
create policy "schedule read" on public.schedules for select using (auth.uid() is not null or true);

drop policy if exists "announcement read" on public.announcements;
create policy "announcement read" on public.announcements for select using (auth.uid() is not null or true);

drop policy if exists "announcement admin write" on public.announcements;
create policy "announcement admin write" on public.announcements for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "finance own" on public.finance;
create policy "finance own" on public.finance for select using (owner_id = auth.uid() or public.is_admin());
create policy "finance insert own" on public.finance for insert with check (owner_id = auth.uid() or public.is_admin());
create policy "finance update own" on public.finance for update using (owner_id = auth.uid() or public.is_admin());
create policy "finance delete own" on public.finance for delete using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "notes own" on public.notes;
create policy "notes own" on public.notes for select using (owner_id = auth.uid());
create policy "notes insert own" on public.notes for insert with check (owner_id = auth.uid());
create policy "notes update own" on public.notes for update using (owner_id = auth.uid());
create policy "notes delete own" on public.notes for delete using (owner_id = auth.uid());

drop policy if exists "books read" on public.books;
create policy "books read" on public.books for select using (auth.uid() is not null or true);
drop policy if exists "books admin write" on public.books;
create policy "books admin write" on public.books for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "scholarships read" on public.scholarships;
create policy "scholarships read" on public.scholarships for select using (auth.uid() is not null or true);
drop policy if exists "scholarships admin write" on public.scholarships;
create policy "scholarships admin write" on public.scholarships for all using (public.is_admin()) with check (public.is_admin());

-- Secure server-side RPCs for admin-code workflow.
create or replace function public.create_admin_code(p_label text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya superadmin yang boleh membuat kode admin';
  end if;
  loop
    v_code := 'RPL2-' || upper(substr(encode(gen_random_bytes(6),'hex'),1,8));
    exit when not exists(select 1 from public.admin_codes where code = v_code);
  end loop;
  insert into public.admin_codes(code,label,created_by)
  values(v_code,coalesce(nullif(trim(p_label),''),'Admin Khusus'),auth.uid());
  return v_code;
end;
$$;

create or replace function public.redeem_admin_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from public.admin_codes
  where code = upper(trim(p_code))
    and used_by is null
    and revoked_at is null
  limit 1;
  if v_id is null then
    return false;
  end if;
  update public.profiles set role = 'admin' where id = auth.uid();
  update public.admin_codes set used_by = auth.uid(), used_at = now() where id = v_id;
  return true;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles(id,username,full_name)
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(coalesce(new.email,''),'@',1)),
    coalesce(new.raw_user_meta_data->>'full_name','')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- IMPORTANT:
-- After creating the first account in Supabase Auth, replace THE_UUID below
-- with that user's UUID and run:
-- update public.profiles set role='superadmin' where id='THE_UUID';
