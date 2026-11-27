import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Tests never talk to the real Supabase project. Screens get a fake API
// instead (see fakeApi.ts).
vi.mock('../lib/supabase', () => ({ supabase: {} }))

// Unmount rendered components after each test (Vitest globals are off).
afterEach(() => {
  cleanup()
  // The database tests run in Node, without a browser window.
  if (typeof window !== 'undefined') {
    window.localStorage.clear()
    window.location.hash = ''
  }
})
