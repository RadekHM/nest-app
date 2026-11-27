import type { ModuleDef } from '../modules/registry'
import type { Route } from '../lib/route'
import './BottomBar.css'

interface Props {
  route: Route
  pins: ModuleDef[]
  go: (to: Route) => void
  onEmptyPin: () => void
}

type Spot =
  | { kind: 'home' | 'all' | 'us'; label: string; route: Route }
  | { kind: 'pin'; label: string; module: ModuleDef }
  | { kind: 'empty'; label: string }

/**
 * Always five spots, however many modules there are:
 * Home · Pin 1 · Pin 2 · All · Us.
 */
export function BottomBar({ route, pins, go, onEmptyPin }: Props) {
  const spots: Spot[] = [
    { kind: 'home', label: 'Home', route: { name: 'home' } },
    pins[0] ? { kind: 'pin', label: pins[0].name, module: pins[0] } : { kind: 'empty', label: 'Empty pin spot' },
    pins[1] ? { kind: 'pin', label: pins[1].name, module: pins[1] } : { kind: 'empty', label: 'Empty pin spot' },
    { kind: 'all', label: 'Everything', route: { name: 'all' } },
    { kind: 'us', label: 'Us', route: { name: 'us' } },
  ]

  const active = spots.findIndex((s) =>
    s.kind === 'pin'
      ? route.name === 'module' && route.key === s.module.key
      : s.kind !== 'empty' && s.route.name === route.name,
  )

  return (
    <nav className="bottom-bar" aria-label="Main">
      {active >= 0 && (
        <span className="bottom-bar__pill" aria-hidden="true" style={{ transform: `translateX(${active * 100}%)` }} />
      )}
      {spots.map((spot, i) => (
        <button
          key={i}
          type="button"
          className={`bottom-bar__spot${i === active ? ' bottom-bar__spot--on' : ''}`}
          aria-label={spot.label}
          aria-current={i === active ? 'page' : undefined}
          onClick={() =>
            spot.kind === 'empty'
              ? onEmptyPin()
              : spot.kind === 'pin'
                ? go({ name: 'module', key: spot.module.key })
                : go(spot.route)
          }
        >
          {spot.kind === 'pin' ? <span className="bottom-bar__mod">{spot.module.icon}</span> : ICONS[spot.kind]}
        </button>
      ))}
    </nav>
  )
}

const icon = (paths: React.ReactNode) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {paths}
  </svg>
)

const ICONS = {
  home: icon(
    <>
      <path d="M3 11 12 4l9 7" />
      <path d="M5 10v10h14V10" />
    </>,
  ),
  all: icon(
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="2" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="2" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="2" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2" />
    </>,
  ),
  us: icon(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>,
  ),
  empty: (
    <span className="bottom-bar__empty" aria-hidden="true">
      +
    </span>
  ),
}
