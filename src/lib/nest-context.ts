import { createContext, useContext } from 'react'
import type { NestData, Profile } from './api'

export type NestState =
  | { status: 'loading' }
  | { status: 'logged-out' }
  | { status: 'error'; message: string }
  | { status: 'ready'; sessionId: string | null; data: NestData; deviceName: string | null }

export type ProfilePatch = Partial<Pick<Profile, 'display_name' | 'avatar' | 'pinned_modules'>>

export interface NestContextValue {
  state: NestState
  signIn: (username: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  updateMe: (patch: ProfilePatch) => Promise<void>
  nameDevice: (name: string) => Promise<void>
  changePassword: (password: string) => Promise<string | null>
  retry: () => void
}

export const NestContext = createContext<NestContextValue | null>(null)

export function useNest(): NestContextValue {
  const value = useContext(NestContext)
  if (!value) throw new Error('useNest must be used inside <NestProvider>')
  return value
}

/** For screens that only render once someone is logged in. */
export function useReady() {
  const nest = useNest()
  if (nest.state.status !== 'ready') throw new Error('useReady used before the nest was ready')
  return { ...nest, ...nest.state }
}
