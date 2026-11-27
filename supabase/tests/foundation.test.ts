// @vitest-environment node
//
// Runs the real migrations in an in-memory Postgres (PGlite) with a small
// stand-in for Supabase's `auth` schema, then checks the row-level security
// rules as each kind of user would hit them.
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, test } from 'vitest'

const MIGRATIONS = join(__dirname, '..', 'migrations')

const RADEK = '00000000-0000-0000-0000-00000000000a'
const DIDEM = '00000000-0000-0000-0000-00000000000b'
const RADEK_PHONE = '10000000-0000-0000-0000-00000000000a'
const DIDEM_PHONE = '10000000-0000-0000-0000-00000000000b'

const SUPABASE_STANDIN = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  grant usage on schema public to anon, authenticated, service_role;
  grant usage on schema auth to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;

  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb not null default '{}'
  );
  create table auth.sessions (
    id uuid primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    refreshed_at timestamp,
    user_agent text
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
  $$;
`

let db: PGlite

async function as<T>(user: string | null, session: string | null, fn: () => Promise<T>): Promise<T> {
  const claims = user ? JSON.stringify({ sub: user, session_id: session, role: 'authenticated' }) : ''
  await db.query(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)`, [
    user ?? '',
    claims,
  ])
  await db.exec(`set role ${user ? 'authenticated' : 'anon'}`)
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
  }
}

const asRadek = <T>(fn: () => Promise<T>) => as(RADEK, RADEK_PHONE, fn)
const asDidem = <T>(fn: () => Promise<T>) => as(DIDEM, DIDEM_PHONE, fn)

beforeAll(async () => {
  db = new PGlite()
  await db.exec(SUPABASE_STANDIN)
  for (const file of readdirSync(MIGRATIONS).sort()) {
    await db.exec(readFileSync(join(MIGRATIONS, file), 'utf8'))
  }
  // Radek is created first (in the dashboard), Didem later by the admin function.
  await db.query(`insert into auth.users (id, email) values ($1, 'radek@nest.home')`, [RADEK])
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values ($1, 'didem@nest.home', '{"username":"didem","display_name":"Didem"}')`,
    [DIDEM],
  )
  await db.query(`insert into auth.sessions (id, user_id, user_agent) values ($1, $2, 'iPhone'), ($3, $4, 'Android')`, [
    RADEK_PHONE,
    RADEK,
    DIDEM_PHONE,
    DIDEM,
  ])
})

describe('new users', () => {
  test('the first user creates the household and becomes admin', async () => {
    const { rows } = await db.query<{ username: string; role: string; display_name: string }>(
      `select username, role, display_name from public.profiles order by username`,
    )
    expect(rows).toEqual([
      { username: 'didem', role: 'member', display_name: 'Didem' },
      { username: 'radek', role: 'admin', display_name: 'Radek' },
    ])
    const households = await db.query(`select name, currency from public.households`)
    expect(households.rows).toEqual([{ name: 'Nest', currency: 'NOK' }])
  })

  test('the household starts with every module switched off', async () => {
    const { rows } = await db.query<{ module_key: string; enabled: boolean }>(
      `select module_key, enabled from public.household_modules order by sort_order`,
    )
    expect(rows.map((r) => r.module_key)).toEqual(['groceries', 'todos', 'wishlists', 'finances'])
    expect(rows.every((r) => !r.enabled)).toBe(true)
  })
})

describe('profiles', () => {
  test('logged-out visitors cannot read anything', async () => {
    await expect(as(null, null, () => db.query(`select * from public.profiles`))).rejects.toThrow(/permission denied/)
  })

  test('members see everyone in the household', async () => {
    const { rows } = await asDidem(() => db.query(`select username from public.profiles`))
    expect(rows).toHaveLength(2)
  })

  test('you can rename yourself and pick an avatar', async () => {
    await asDidem(() => db.query(`update public.profiles set display_name = 'Didi', avatar = 'robin' where id = $1`, [DIDEM]))
    const { rows } = await db.query(`select display_name, avatar from public.profiles where id = $1`, [DIDEM])
    expect(rows).toEqual([{ display_name: 'Didi', avatar: 'robin' }])
  })

  test("you cannot change someone else's profile", async () => {
    await asDidem(() => db.query(`update public.profiles set display_name = 'Nope' where id = $1`, [RADEK]))
    const { rows } = await db.query<{ display_name: string }>(`select display_name from public.profiles where id = $1`, [RADEK])
    expect(rows[0].display_name).toBe('Radek')
  })

  test('you cannot make yourself admin', async () => {
    await expect(asDidem(() => db.query(`update public.profiles set role = 'admin' where id = $1`, [DIDEM]))).rejects.toThrow(
      /permission denied/,
    )
  })

  test('only two pinned modules fit in the bottom bar', async () => {
    await expect(
      asDidem(() =>
        db.query(`update public.profiles set pinned_modules = array['groceries','todos','finances'] where id = $1`, [DIDEM]),
      ),
    ).rejects.toThrow(/check constraint/)
  })
})

describe('module switches', () => {
  test('members cannot switch modules', async () => {
    const res = await asDidem(() =>
      db.query(`update public.household_modules set enabled = true where module_key = 'groceries'`),
    )
    expect(res.affectedRows).toBe(0)
  })

  test('the admin can', async () => {
    const res = await asRadek(() =>
      db.query(`update public.household_modules set enabled = true where module_key = 'groceries'`),
    )
    expect(res.affectedRows).toBe(1)
  })
})

describe('devices', () => {
  test('you can name only the session you are using', async () => {
    const hh = (await db.query<{ id: string }>(`select id from public.households`)).rows[0].id
    await expect(
      asDidem(() =>
        db.query(`insert into public.devices (session_id, user_id, household_id, name) values ($1, $2, $3, 'Sneaky')`, [
          RADEK_PHONE,
          DIDEM,
          hh,
        ]),
      ),
    ).rejects.toThrow(/row-level security/)

    await asDidem(() =>
      db.query(`insert into public.devices (session_id, user_id, household_id, name) values ($1, $2, $3, 'Didem''s phone')`, [
        DIDEM_PHONE,
        DIDEM,
        hh,
      ]),
    )
    const { rows } = await db.query(`select name from public.devices`)
    expect(rows).toEqual([{ name: "Didem's phone" }])
  })

  test('members list their own devices, the admin lists all', async () => {
    const mine = await asDidem(() => db.query<{ name: string | null; is_current: boolean }>(`select * from public.list_devices()`))
    expect(mine.rows).toHaveLength(1)
    expect(mine.rows[0]).toMatchObject({ name: "Didem's phone", is_current: true })

    const all = await asRadek(() => db.query(`select * from public.list_devices()`))
    expect(all.rows).toHaveLength(2)
  })

  test("members cannot log out someone else's device", async () => {
    await expect(asDidem(() => db.query(`select public.end_session($1)`, [RADEK_PHONE]))).rejects.toThrow(/not allowed/)
  })

  test('the admin can log a device out, which removes its session', async () => {
    await asRadek(() => db.query(`select public.end_session($1)`, [DIDEM_PHONE]))
    const sessions = await db.query(`select id from auth.sessions where id = $1`, [DIDEM_PHONE])
    expect(sessions.rows).toHaveLength(0)
    const devices = await db.query(`select * from public.devices`)
    expect(devices.rows).toHaveLength(0)
  })

  test('only the admin can log someone out everywhere', async () => {
    await expect(asDidem(() => db.query(`select public.end_user_sessions($1)`, [RADEK]))).rejects.toThrow(/not allowed/)
  })
})
