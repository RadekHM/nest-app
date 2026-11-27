-- Foundation: household, profiles, module switches and devices.
--
-- Every row belongs to one household. Row-level security lets a signed-in
-- user see only rows of their own household; admin-only changes go through
-- the `admin` Edge Function or the security-definer functions below.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Nest' check (char_length(name) between 1 and 60),
  currency text not null default 'NOK' check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{2,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar text not null default 'sparrow'
    check (avatar in ('sparrow', 'robin', 'owl', 'bluetit', 'duck', 'kingfisher')),
  role text not null default 'member' check (role in ('admin', 'member')),
  pinned_modules text[] not null default '{}' check (cardinality(pinned_modules) <= 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_household_idx on public.profiles (household_id);

create table public.household_modules (
  household_id uuid not null references public.households (id) on delete cascade,
  module_key text not null check (module_key ~ '^[a-z][a-z0-9_]{1,31}$'),
  enabled boolean not null default false,
  sort_order integer not null default 0,
  primary key (household_id, module_key)
);

-- One row per logged-in phone, keyed by the Supabase Auth session id, so a
-- session can be given a friendly name ("Radek's iPhone").
create table public.devices (
  session_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  user_agent text check (char_length(user_agent) <= 400),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index devices_user_idx on public.devices (user_id);

-- ---------------------------------------------------------------------------
-- Helpers used by the policies
-- ---------------------------------------------------------------------------

create or replace function public.my_household()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- New users get a profile automatically.
--
-- The very first user (created in the Supabase dashboard) also creates the
-- household and becomes its admin. Everyone after that joins the same
-- household as a member. The admin Edge Function passes `username` and
-- `display_name` in the user metadata; otherwise they come from the email.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  hh uuid;
  new_role text := 'member';
  uname text;
begin
  select id into hh from public.households order by created_at limit 1;

  if hh is null then
    insert into public.households default values returning id into hh;
    new_role := 'admin';
    insert into public.household_modules (household_id, module_key, sort_order)
    values (hh, 'groceries', 1), (hh, 'todos', 2), (hh, 'wishlists', 3), (hh, 'finances', 4);
  end if;

  uname := lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));

  insert into public.profiles (id, household_id, username, display_name, role)
  values (
    new.id,
    hh,
    uname,
    coalesce(new.raw_user_meta_data ->> 'display_name', initcap(uname)),
    new_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.household_modules enable row level security;
alter table public.devices enable row level security;

-- Households: members read their own; only the admin renames it.
create policy "members read their household" on public.households
  for select to authenticated using (id = public.my_household());
create policy "admin updates the household" on public.households
  for update to authenticated
  using (id = public.my_household() and public.is_admin())
  with check (id = public.my_household());

revoke update on public.households from authenticated;
grant update (name, currency) on public.households to authenticated;

-- Profiles: everyone in the household can see each other. You can change
-- only your own name, avatar and pins; role and username are admin-only and
-- change through the Edge Function.
create policy "members read household profiles" on public.profiles
  for select to authenticated using (household_id = public.my_household());
create policy "users update their own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

revoke insert, update, delete on public.profiles from authenticated;
grant update (display_name, avatar, pinned_modules) on public.profiles to authenticated;

-- Module switches: everyone reads, the admin changes them.
create policy "members read module switches" on public.household_modules
  for select to authenticated using (household_id = public.my_household());
create policy "admin changes module switches" on public.household_modules
  for all to authenticated
  using (household_id = public.my_household() and public.is_admin())
  with check (household_id = public.my_household() and public.is_admin());

-- Devices: everyone in the household sees the list; you register and rename
-- only your current session. Logging a device out goes through end_session().
create policy "members read household devices" on public.devices
  for select to authenticated using (household_id = public.my_household());
create policy "users register their current session" on public.devices
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and household_id = public.my_household()
    and session_id = (auth.jwt() ->> 'session_id')::uuid
  );
create policy "users update their own devices" on public.devices
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke update, delete on public.devices from authenticated;
grant update (name, user_agent, last_seen_at) on public.devices to authenticated;

-- Nothing here is for logged-out visitors.
revoke all on public.households, public.profiles, public.household_modules, public.devices from anon;

-- ---------------------------------------------------------------------------
-- Device management (callable with supabase.rpc)
-- ---------------------------------------------------------------------------

-- Active sessions in the household, with their friendly name when known.
-- Members see their own; the admin sees everyone's.
create or replace function public.list_devices()
returns table (
  session_id uuid,
  user_id uuid,
  name text,
  user_agent text,
  created_at timestamptz,
  last_seen_at timestamptz,
  is_current boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    s.user_id,
    d.name,
    coalesce(d.user_agent, s.user_agent),
    s.created_at,
    greatest(s.refreshed_at, s.updated_at, d.last_seen_at),
    s.id = (auth.jwt() ->> 'session_id')::uuid
  from auth.sessions s
  join public.profiles p on p.id = s.user_id
  left join public.devices d on d.session_id = s.id
  where p.household_id = public.my_household()
    and (public.is_admin() or s.user_id = auth.uid())
  order by 6 desc nulls last;
$$;

-- Logs out one device. Deleting the session also revokes its refresh token,
-- so the phone is signed out once its short-lived access token expires.
create or replace function public.end_session(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() and not exists (
    select 1 from auth.sessions where id = target and user_id = auth.uid()
  ) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  delete from auth.sessions s
  using public.profiles p
  where s.id = target
    and p.id = s.user_id
    and p.household_id = public.my_household();
  delete from public.devices where session_id = target;
end;
$$;

-- Logs a person out everywhere (admin only).
create or replace function public.end_user_sessions(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.profiles where id = target and household_id = public.my_household()
  ) then
    raise exception 'not in your household' using errcode = '42501';
  end if;

  delete from auth.sessions where user_id = target;
  delete from public.devices where user_id = target;
end;
$$;

revoke all on function public.list_devices() from public, anon;
revoke all on function public.end_session(uuid) from public, anon;
revoke all on function public.end_user_sessions(uuid) from public, anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.list_devices() to authenticated;
grant execute on function public.end_session(uuid) to authenticated;
grant execute on function public.end_user_sessions(uuid) to authenticated;
