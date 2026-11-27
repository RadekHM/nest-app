import { useState } from 'react'
import { PinIcon } from '../components/ModuleCard'
import { enabledModules, moduleName } from '../lib/modules'
import { useReady } from '../lib/nest-context'
import { togglePin } from '../lib/pins'
import type { Route } from '../lib/route'
import { useToast } from '../lib/toast-context'
import './All.css'

/** Search appears once the list is long enough to need it. */
export const SEARCH_FROM = 9

export function All({ go }: { go: (to: Route) => void }) {
  const { data, updateMe } = useReady()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const modules = enabledModules(data.modules)
  const pins = data.me.pinned_modules
  const q = query.trim().toLowerCase()
  const shown = q ? modules.filter((m) => `${m.name} ${m.blurb}`.toLowerCase().includes(q)) : modules

  const pin = (key: string) => {
    const next = togglePin(pins, key, moduleName)
    updateMe({ pinned_modules: next.pins }).then(
      () => toast(next.message),
      () => toast("That didn't save. Try again in a moment."),
    )
  }

  return (
    <main className="screen rise">
      <div>
        <h1 className="screen__title">Everything</h1>
        <p className="screen__lead">Pin up to two to the bar for quick access.</p>
      </div>

      {modules.length >= SEARCH_FROM && (
        <label className="field">
          <span className="visually-hidden">Search</span>
          <input type="search" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      )}

      {modules.length === 0 && (
        <div className="panel">
          <strong>Nothing here yet</strong>
          <span className="screen__lead">Lists and other bits appear here once they're switched on.</span>
        </div>
      )}

      <ul className="all-list stagger">
        {shown.map((m) => {
          const pinned = pins.includes(m.key)
          return (
            <li key={m.key} className="all-row">
              <button
                type="button"
                className="all-row__open squish"
                onClick={() => go({ name: 'module', key: m.key })}
              >
                <span className="all-row__icon" style={{ background: m.tint, color: m.ink }}>
                  {m.icon}
                </span>
                <span className="all-row__text">
                  <strong>{m.name}</strong>
                  <span>{m.blurb}</span>
                </span>
              </button>
              <button
                type="button"
                className={pinned ? 'all-row__pin all-row__pin--on' : 'all-row__pin'}
                onClick={() => pin(m.key)}
                aria-pressed={pinned}
                aria-label={pinned ? `Unpin ${m.name}` : `Pin ${m.name}`}
              >
                <PinIcon size={18} />
              </button>
            </li>
          )
        })}
      </ul>
      {q && shown.length === 0 && <p className="screen__lead">Nothing matches “{query}”.</p>}
    </main>
  )
}
