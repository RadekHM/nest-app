-- A tiny function the keep-alive workflow calls so the free Supabase project
-- never pauses for inactivity. It reads no data.
create or replace function public.ping()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select now();
$$;

revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
