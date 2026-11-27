-- Tidy-ups suggested by Supabase's security and performance advisors after
-- the foundation migration. Behaviour is unchanged.

-- 1. The policy helpers are for signed-in users only. Logged-out visitors
--    could call them before (they only ever got "false" or nothing back).
revoke all on function public.my_household() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.my_household() to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;

-- 2. Wrap auth.uid(), auth.jwt() and the helpers in a sub-select, so Postgres
--    works them out once per query instead of once per row.
alter policy "members read their household" on public.households
  using (id = (select public.my_household()));
alter policy "admin updates the household" on public.households
  using (id = (select public.my_household()) and (select public.is_admin()))
  with check (id = (select public.my_household()));

alter policy "members read household profiles" on public.profiles
  using (household_id = (select public.my_household()));
alter policy "users update their own profile" on public.profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy "members read module switches" on public.household_modules
  using (household_id = (select public.my_household()));

alter policy "members read household devices" on public.devices
  using (household_id = (select public.my_household()));
alter policy "users register their current session" on public.devices
  with check (
    user_id = (select auth.uid())
    and household_id = (select public.my_household())
    and session_id = ((select auth.jwt()) ->> 'session_id')::uuid
  );
alter policy "users update their own devices" on public.devices
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 3. The admin's "for all" policy also covered reading, so every read ran two
--    policies. Split it into insert, update and delete.
drop policy "admin changes module switches" on public.household_modules;
create policy "admin adds module switches" on public.household_modules
  for insert to authenticated
  with check (household_id = (select public.my_household()) and (select public.is_admin()));
create policy "admin changes module switches" on public.household_modules
  for update to authenticated
  using (household_id = (select public.my_household()) and (select public.is_admin()))
  with check (household_id = (select public.my_household()) and (select public.is_admin()));
create policy "admin removes module switches" on public.household_modules
  for delete to authenticated
  using (household_id = (select public.my_household()) and (select public.is_admin()));

-- 4. Index the household foreign key on devices.
create index devices_household_idx on public.devices (household_id);
