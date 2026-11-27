import { useState } from 'react'
import { HomeHeader } from '../components/HomeHeader'
import { ModuleCard } from '../components/ModuleCard'
import { WalkingBird } from '../components/WalkingBird'
import { isInstalled, isIos } from '../lib/device'
import { greeting } from '../lib/greeting'
import { enabledModules, moduleName } from '../lib/modules'
import { useReady } from '../lib/nest-context'
import { togglePin } from '../lib/pins'
import type { Route } from '../lib/route'
import { useToast } from '../lib/toast-context'
import './Home.css'

export function Home({ go }: { go: (to: Route) => void }) {
  const [now] = useState(() => new Date())
  const { data, updateMe } = useReady()
  const toast = useToast()
  const { me, members } = data
  const modules = enabledModules(data.modules)
  const admin = members.find((m) => m.role === 'admin')
  const hello = greeting(now.getHours())
  const showInstallTip = isIos(navigator.userAgent) && !isInstalled()

  const pin = (key: string) => {
    const next = togglePin(me.pinned_modules, key, moduleName)
    updateMe({ pinned_modules: next.pins }).then(
      () => toast(next.message),
      () => toast("That didn't save. Try again in a moment."),
    )
  }

  return (
    <main className="screen rise">
      <HomeHeader members={members} />

      <div className="home-hello">
        <div>
          <h1 className="screen__title">
            {hello.text},<br />
            {me.display_name}
          </h1>
          <p className="screen__lead">Everything for home, in one cosy place.</p>
        </div>
        {hello.sky === 'moon' ? <Moon /> : <Sun />}
      </div>

      {showInstallTip && (
        <div className="home-tip">
          <strong>Keep Nest on your home screen</strong>
          <span>
            Tap the Share button, then <b>Add to Home Screen</b>. Nest then opens like an app and keeps you logged in.
          </span>
        </div>
      )}

      {modules.length > 0 ? (
        <>
          <div className="home-grid stagger">
            {modules.map((m, i) => (
              <ModuleCard
                key={m.key}
                module={m}
                big={i === 0}
                pinned={me.pinned_modules.includes(m.key)}
                onOpen={() => go({ name: 'module', key: m.key })}
                onTogglePin={() => pin(m.key)}
              />
            ))}
          </div>
          <p className="home-hint">Tip: press and hold a card to pin it to the bar.</p>
        </>
      ) : (
        <div className="home-empty">
          <strong>Your nest is ready</strong>
          <span>
            {me.role === 'admin'
              ? "Nothing's switched on yet. Soon you'll switch on the first lists from Us."
              : `${admin?.display_name ?? 'The admin'} will switch on the first lists soon.`}
          </span>
          <WalkingBird />
        </div>
      )}
    </main>
  )
}

function Moon() {
  return (
    <svg className="float" width="48" height="48" viewBox="0 0 44 44" aria-hidden="true">
      <path d="M30 6a16 16 0 1 0 8 26A14 14 0 0 1 30 6Z" fill="#F2C86B" />
      <circle cx="12" cy="10" r="2" fill="#B9AEE0" />
      <circle cx="38" cy="8" r="1.5" fill="#B9AEE0" />
    </svg>
  )
}

function Sun() {
  return (
    <svg className="float" width="48" height="48" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="9" fill="#F2C86B" />
      <g stroke="#F2C86B" strokeWidth="3" strokeLinecap="round">
        <path d="M22 4v5M22 35v5M4 22h5M35 22h5M9 9l3.5 3.5M31.5 31.5 35 35M9 35l3.5-3.5M31.5 12.5 35 9" />
      </g>
    </svg>
  )
}
