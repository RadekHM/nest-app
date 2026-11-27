import { useEffect, useRef, useState } from 'react'
import { NestLogo } from './components/NestLogo'
import { WalkingBird } from './components/WalkingBird'
import './App.css'

const PEEPS = ['peep!', 'hi there!', 'cosy!', 'tweet!']

// Placeholder home screen until login and the app shell arrive. It already
// uses the Meadow design: tap the nest and it hops and says hello.
export default function App() {
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
    <main className="welcome rise">
      <div className="welcome__brand">
        <button
          key={taps}
          type="button"
          className={taps > 0 ? 'welcome__logo hop' : 'welcome__logo'}
          onClick={sayHello}
          aria-label="Say hello to Nest"
        >
          <NestLogo size={112} />
        </button>
        {peepOn && (
          <span className="welcome__peep pop-in" role="status">
            {PEEPS[(taps - 1) % PEEPS.length]}
          </span>
        )}
      </div>
      <h1>nest</h1>
      <p>Everything for home, in one cosy place.</p>
      <div className="welcome__card">
        <strong>We're building your nest</strong>
        <span>Lists, to-dos and money are on their way.</span>
        <WalkingBird />
      </div>
    </main>
  )
}
