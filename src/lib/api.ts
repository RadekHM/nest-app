// Everything the app asks Supabase for goes through here, so screens never
// talk to the database directly and tests can swap this file for a fake.
import type { Session } from '@supabase/supabase-js'
import type { Bird } from './birds'
import { supabase } from './supabase'

export const EMAIL_DOMAIN = 'nest.home'

export type Role = 'admin' | 'member'

export interface Profile {
  id: string
  household_id: string
  username: string
  display_name: string
  avatar: Bird
  role: Role
  pinned_modules: string[]
}

export interface ModuleSwitch {
  module_key: string
  enabled: boolean
  sort_order: number
}

export interface Household {
  id: string
  name: string
  currency: string
}

export interface NestData {
  me: Profile
  members: Profile[]
  household: Household
  modules: ModuleSwitch[]
}

/** "Radek " → "radek@nest.home". A real email address is left alone. */
export function loginEmail(username: string): string {
  const u = username.trim().toLowerCase()
  return u.includes('@') ? u : `${u}@${EMAIL_DOMAIN}`
}

/** The Supabase Auth session id, read from the access token's claims. */
export function sessionIdOf(session: Session): string | null {
  try {
    const payload = session.access_token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return (JSON.parse(json) as { session_id?: string }).session_id ?? null
  } catch {
    return null
  }
}

const PROFILE_COLUMNS = 'id, household_id, username, display_name, avatar, role, pinned_modules'

export const api = {
  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  onSessionChange(callback: (session: Session | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
    return () => data.subscription.unsubscribe()
  },

  /** Resolves to true when the username and password match. */
  async signIn(username: string, password: string): Promise<boolean> {
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail(username), password })
    return !error
  },

  async signOut(): Promise<void> {
    // 'local' ends only this phone's session, not the person's other devices.
    await supabase.auth.signOut({ scope: 'local' })
  },

  async changePassword(password: string): Promise<string | null> {
    const { error } = await supabase.auth.updateUser({ password })
    return error ? error.message : null
  },

  async load(userId: string): Promise<NestData> {
    const [members, households, modules] = await Promise.all([
      supabase.from('profiles').select(PROFILE_COLUMNS).order('created_at'),
      supabase.from('households').select('id, name, currency').limit(1).single(),
      supabase.from('household_modules').select('module_key, enabled, sort_order').order('sort_order'),
    ])
    if (members.error) throw members.error
    if (households.error) throw households.error
    if (modules.error) throw modules.error
    const all = members.data as Profile[]
    const me = all.find((p) => p.id === userId)
    if (!me) throw new Error('No profile for this account')
    return { me, members: all, household: households.data as Household, modules: modules.data as ModuleSwitch[] }
  },

  async updateMe(
    userId: string,
    patch: Partial<Pick<Profile, 'display_name' | 'avatar' | 'pinned_modules'>>,
  ): Promise<void> {
    const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
    if (error) throw error
  },

  /** This phone's saved name, or null if it hasn't been named yet. */
  async deviceName(sessionId: string): Promise<string | null> {
    const { data, error } = await supabase.from('devices').select('name').eq('session_id', sessionId).maybeSingle()
    if (error) throw error
    if (data) {
      // Remember when this phone was last opened (best effort).
      void supabase.from('devices').update({ last_seen_at: new Date().toISOString() }).eq('session_id', sessionId)
    }
    return data?.name ?? null
  },

  /** Names this phone the first time, or renames it later. */
  async nameDevice(me: Profile, sessionId: string, name: string, firstTime: boolean): Promise<void> {
    const { error } = firstTime
      ? await supabase.from('devices').insert({
          session_id: sessionId,
          user_id: me.id,
          household_id: me.household_id,
          name,
          user_agent: navigator.userAgent.slice(0, 400),
        })
      : await supabase.from('devices').update({ name }).eq('session_id', sessionId)
    if (error) throw error
  },
}

export type Api = typeof api
