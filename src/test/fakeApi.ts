// An in-memory stand-in for src/lib/api.ts, so screen tests run without
// Supabase. It records calls and lets a test log someone in or out.
import type { Session } from '@supabase/supabase-js'
import { vi } from 'vitest'
import type { Api, NestData, Profile } from '../lib/api'

export const RADEK: Profile = {
  id: 'u-radek',
  household_id: 'hh',
  username: 'radek',
  display_name: 'Radek',
  avatar: 'sparrow',
  role: 'admin',
  pinned_modules: [],
}

export const DIDEM: Profile = {
  id: 'u-didem',
  household_id: 'hh',
  username: 'didem',
  display_name: 'Didem',
  avatar: 'robin',
  role: 'member',
  pinned_modules: [],
}

/** A fake access token whose payload carries the session id. */
function token(sessionId: string): string {
  const payload = btoa(JSON.stringify({ session_id: sessionId })).replace(/=+$/, '')
  return `header.${payload}.signature`
}

export function sessionFor(user: Profile, sessionId = 'session-1'): Session {
  return { access_token: token(sessionId), user: { id: user.id } } as unknown as Session
}

interface Options {
  me?: Profile
  loggedIn?: boolean
  enabled?: string[]
  deviceName?: string | null
  password?: string
  loadFails?: boolean
}

export function fakeApi(opts: Options = {}) {
  const me = { ...(opts.me ?? RADEK) }
  let session: Session | null = opts.loggedIn ? sessionFor(me) : null
  let listener: ((s: Session | null) => void) | null = null
  let deviceName = opts.deviceName === undefined ? "Radek's iPhone" : opts.deviceName
  const enabled = new Set(opts.enabled ?? [])

  const setSession = (s: Session | null) => {
    session = s
    listener?.(s)
  }

  const data = (): NestData => ({
    me: { ...me },
    members: [RADEK, DIDEM].map((p) => (p.id === me.id ? { ...me } : { ...p })),
    household: { id: 'hh', name: 'Nest', currency: 'NOK' },
    modules: ['groceries', 'todos', 'wishlists', 'finances'].map((key, i) => ({
      module_key: key,
      enabled: enabled.has(key),
      sort_order: i + 1,
    })),
  })

  const api = {
    getSession: vi.fn(async () => session),
    onSessionChange: vi.fn((cb: (s: Session | null) => void) => {
      listener = cb
      return () => {
        listener = null
      }
    }),
    signIn: vi.fn(async (username: string, password: string) => {
      const ok = username.trim().toLowerCase() === me.username && password === (opts.password ?? 'correct horse')
      if (ok) setSession(sessionFor(me))
      return ok
    }),
    signOut: vi.fn(async () => setSession(null)),
    changePassword: vi.fn(async () => null as string | null),
    load: vi.fn(async () => {
      if (opts.loadFails) throw new Error('offline')
      return data()
    }),
    updateMe: vi.fn(async (_id: string, patch: Partial<Profile>) => {
      Object.assign(me, patch)
    }),
    deviceName: vi.fn(async () => deviceName),
    nameDevice: vi.fn(async (_me: Profile, _sessionId: string, name: string) => {
      deviceName = name
    }),
  } satisfies Api

  return { api, setSession }
}
