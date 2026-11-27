import { moduleByKey } from '../modules/registry'
import { useReady } from '../lib/nest-context'
import type { Route } from '../lib/route'
import './ModuleScreen.css'

/** Opens a module, or shows a little egg for one that isn't built yet. */
export function ModuleScreen({ moduleKey, go }: { moduleKey: string; go: (to: Route) => void }) {
  const { data } = useReady()
  const def = moduleByKey(moduleKey)
  const on = data.modules.some((s) => s.module_key === moduleKey && s.enabled)

  if (def && on && def.Screen) return <def.Screen />

  return (
    <main className="screen rise">
      <div className="module-soon" style={{ background: def?.tint ?? 'var(--mint)' }}>
        <svg className="module-soon__egg" width="96" height="112" viewBox="0 0 96 112" aria-hidden="true">
          <g className="egg-a">
            <ellipse cx="48" cy="60" rx="36" ry="46" fill="#FBEFD9" stroke="#C9A46A" strokeWidth="4" />
            <path d="M30 52l8 8 8-10 8 10 8-8" fill="none" stroke="#C9A46A" strokeWidth="3" strokeLinejoin="round" />
          </g>
        </svg>
        <h1 className="screen__title">{def?.name ?? 'Not found'}</h1>
        <p className="screen__lead">
          {!def
            ? "We couldn't find that page."
            : on
              ? "This one is still hatching. We'll build it together soon."
              : "This one isn't switched on right now."}
        </p>
        <button type="button" className="button squish" onClick={() => go({ name: 'home' })}>
          Back home
        </button>
      </div>
    </main>
  )
}
