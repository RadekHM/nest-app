// Every module registers itself here once. The bottom bar, Home and All read
// from this list, and the database's household_modules table holds the on/off
// switch for each key. To add a module: add an entry here and a row for its
// key in a migration.
import type { ReactNode } from 'react'

export interface ModuleDef {
  key: string
  name: string
  /** One short line under the name on Home. */
  blurb: string
  /** Card colours: background, and the ink used for the icon and blurb. */
  tint: string
  ink: string
  icon: ReactNode
  /** The module's screen. Undefined until the module is built. */
  Screen?: () => ReactNode
}

const svg = (ink: string, paths: ReactNode) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke={ink}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {paths}
  </svg>
)

export const MODULES: ModuleDef[] = [
  {
    key: 'groceries',
    name: 'Groceries',
    blurb: 'What we need from the shop',
    tint: 'var(--mint)',
    ink: 'var(--mint-ink)',
    icon: svg(
      'currentColor',
      <>
        <path d="M5 9h14l-1.5 10a2 2 0 0 1-2 1.7h-7a2 2 0 0 1-2-1.7Z" />
        <path d="M9 9V7a3 3 0 0 1 6 0v2" />
        <path d="M9.5 13v4M14.5 13v4" />
      </>,
    ),
  },
  {
    key: 'todos',
    name: 'To-dos',
    blurb: 'Jobs around the house',
    tint: 'var(--peach)',
    ink: 'var(--peach-ink)',
    icon: svg(
      'currentColor',
      <>
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <path d="m8.5 12 2.5 2.5 4.5-5" />
      </>,
    ),
  },
  {
    key: 'wishlists',
    name: 'Wishes',
    blurb: 'Gift ideas and dreams',
    tint: 'var(--lilac)',
    ink: 'var(--lilac-ink)',
    icon: svg('currentColor', <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />),
  },
  {
    key: 'finances',
    name: 'Money',
    blurb: 'Income, bills and savings',
    tint: 'var(--sky)',
    ink: 'var(--sky-ink)',
    icon: svg(
      'currentColor',
      <>
        <rect x="3" y="6" width="18" height="13" rx="4" />
        <path d="M3 10h18M7 15h3" />
      </>,
    ),
  },
]

export function moduleByKey(key: string): ModuleDef | undefined {
  return MODULES.find((m) => m.key === key)
}
