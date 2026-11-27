import type { ModuleDef } from '../modules/registry'
import { useLongPress } from '../lib/useLongPress'
import './ModuleCard.css'

interface Props {
  module: ModuleDef
  pinned: boolean
  big?: boolean
  onOpen: () => void
  onTogglePin: () => void
}

/** A module's card. Tap to open it; press and hold to pin it to the bar. */
export function ModuleCard({ module, pinned, big = false, onOpen, onTogglePin }: Props) {
  const press = useLongPress(onTogglePin, onOpen)
  return (
    <button
      type="button"
      className={`module-card squish${big ? ' module-card--big' : ''}`}
      style={{ background: module.tint, color: module.ink }}
      aria-label={`${module.name}${pinned ? ', pinned' : ''}`}
      {...press}
    >
      <span className="module-card__icon">{module.icon}</span>
      <span className="module-card__text">
        <span className="module-card__name">{module.name}</span>
        <span className="module-card__blurb">{module.blurb}</span>
      </span>
      {pinned && (
        <span className="module-card__pin pop-in" aria-hidden="true">
          <PinIcon />
        </span>
      )}
    </button>
  )
}

export function PinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M15 3l6 6-3 1-3.5 3.5L15 18l-2 2-4-4-5 5-1-1 5-5-4-4 2-2 4.5.5L14 6z" />
    </svg>
  )
}
