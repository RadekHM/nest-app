export function greeting(hour: number): { text: string; sky: 'sun' | 'moon' } {
  if (hour >= 5 && hour < 12) return { text: 'Good morning', sky: 'sun' }
  if (hour >= 12 && hour < 18) return { text: 'Good afternoon', sky: 'sun' }
  if (hour >= 18 && hour < 23) return { text: 'Good evening', sky: 'moon' }
  return { text: 'Hello, night owl', sky: 'moon' }
}
