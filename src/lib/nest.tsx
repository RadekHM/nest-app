// Holds who is logged in and the household's shared data, and offers the few
// actions the shell needs. Screens read it with useNest() or useReady().
import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api as realApi, sessionIdOf, type Api, type Profile } from './api'
import { NestContext, type NestContextValue, type NestState, type ProfilePatch } from './nest-context'

type Loaded = { userId: string; attempt: number; state: NestState }

export function NestProvider({ api = realApi, children }: { api?: Api; children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [attempt, setAttempt] = useState(0)

  // Follow the login session, including silent token refreshes.
  useEffect(() => {
    let alive = true
    api.getSession().then((s) => alive && setSession(s))
    const stop = api.onSessionChange((s) => setSession(s))
    return () => {
      alive = false
      stop()
    }
  }, [api])

  // The session object changes on every token refresh, so loading only
  // depends on who is logged in and which session (phone) this is.
  const userId = session?.user.id ?? null
  const sessionId = session ? sessionIdOf(session) : null
  useEffect(() => {
    if (!userId) return
    let alive = true
    const done = (state: NestState) => alive && setLoaded({ userId, attempt, state })
    Promise.all([api.load(userId), sessionId ? api.deviceName(sessionId) : Promise.resolve(null)])
      .then(([data, deviceName]) => done({ status: 'ready', sessionId, data, deviceName }))
      .catch((err: unknown) => done({ status: 'error', message: err instanceof Error ? err.message : String(err) }))
    return () => {
      alive = false
    }
  }, [api, userId, sessionId, attempt])

  const known = session !== undefined
  const state = useMemo<NestState>(
    () =>
      !known
        ? { status: 'loading' }
        : !userId
          ? { status: 'logged-out' }
          : loaded && loaded.userId === userId && loaded.attempt === attempt
            ? loaded.state
            : { status: 'loading' },
    [known, userId, loaded, attempt],
  )

  const patchReady = useCallback((change: (s: Extract<NestState, { status: 'ready' }>) => NestState) => {
    setLoaded((l) => (l && l.state.status === 'ready' ? { ...l, state: change(l.state) } : l))
  }, [])

  const signIn = useCallback((u: string, p: string) => api.signIn(u, p), [api])
  const signOut = useCallback(() => api.signOut(), [api])
  const changePassword = useCallback((p: string) => api.changePassword(p), [api])
  const retry = useCallback(() => setAttempt((a) => a + 1), [])

  const updateMe = useCallback(
    async (patch: ProfilePatch) => {
      if (state.status !== 'ready') return
      const before = state.data.me
      const swap = (me: Profile) =>
        patchReady((s) => ({
          ...s,
          data: { ...s.data, me, members: s.data.members.map((m) => (m.id === me.id ? me : m)) },
        }))
      swap({ ...before, ...patch }) // show the change straight away
      try {
        await api.updateMe(before.id, patch)
      } catch (err) {
        swap(before) // and put it back if saving failed
        throw err
      }
    },
    [api, state, patchReady],
  )

  const nameDevice = useCallback(
    async (name: string) => {
      if (state.status !== 'ready' || !state.sessionId) return
      await api.nameDevice(state.data.me, state.sessionId, name, state.deviceName === null)
      patchReady((s) => ({ ...s, deviceName: name }))
    },
    [api, state, patchReady],
  )

  const value: NestContextValue = useMemo(
    () => ({ state, signIn, signOut, updateMe, nameDevice, changePassword, retry }),
    [state, signIn, signOut, updateMe, nameDevice, changePassword, retry],
  )
  return <NestContext.Provider value={value}>{children}</NestContext.Provider>
}
