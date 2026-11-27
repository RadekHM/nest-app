import { useEffect, useRef, useState } from 'react'
import type { Profile } from '../lib/api'
import { BirdAvatar } from './birds'
import { NestLogo } from './NestLogo'

const PEEPS = ['peep!', 'hi there!', 'cosy!', 'tweet!']

/** The nest logo (tap it to say hello) and everyone's birds. */
export function HomeHeader({ members }: { members: Profile[] }) {
  const [taps, setTaps] = useState(0)
  const [peepOn, setPeepOn] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const sayHello = () => {
    setTaps((t) => t + 1)
    setPeepOn(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setPeepOn(false), 1400)
  }

  return (
    <header className="home-header">
      <div className="home-header__brand">
        <button
          key={taps}
          type="button"
          className={taps > 0 ? 'home-header__logo hop' : 'home-header__logo'}
          onClick={sayHello}
          aria-label="Say hello to Nest"
        >
          <NestLogo size={46} />
        </button>
        <span className="home-header__word">nest</span>
        {peepOn && (
          <span className="home-header__peep pop-in" role="status">
            {PEEPS[(taps - 1) % PEEPS.length]}
          </span>
        )}
      </div>
      <span className="home-header__birds">
        {members.map((m) => (
          <BirdAvatar key={m.id} bird={m.avatar} size={38} className="home-header__bird" />
        ))}
      </span>
    </header>
  )
}
