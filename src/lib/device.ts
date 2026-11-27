/** A friendly guess at what kind of device this is, from the browser. */
export function deviceKind(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  if (ua.includes('iphone')) return 'iPhone'
  if (ua.includes('ipad')) return 'iPad'
  if (ua.includes('android')) return ua.includes('mobile') ? 'Android phone' : 'Android tablet'
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'Mac'
  if (ua.includes('windows')) return 'Windows PC'
  if (ua.includes('linux')) return 'computer'
  return 'phone'
}

/** "Radek" + iPhone → "Radek's iPhone" (kept under the 40-character limit). */
export function suggestDeviceName(displayName: string, userAgent: string): string {
  const owner = displayName.trim()
  const kind = deviceKind(userAgent)
  const name = owner ? `${owner}${owner.toLowerCase().endsWith('s') ? "'" : "'s"} ${kind}` : kind
  return name.slice(0, 40)
}

/** True when Nest runs from the home screen rather than in a browser tab. */
export function isInstalled(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true
}

export function isIos(userAgent: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgent)
}
