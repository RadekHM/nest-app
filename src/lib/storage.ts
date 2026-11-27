// Small per-phone conveniences in localStorage. Every call is wrapped, because
// storage can be missing or blocked (private mode), and the app must still work.
export function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeLocal(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // Not worth bothering anyone about.
  }
}
