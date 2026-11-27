import { NestLogo } from './components/NestLogo'
import type { Api } from './lib/api'
import { NestProvider } from './lib/nest'
import { useNest } from './lib/nest-context'
import { ToastProvider } from './lib/toast'
import { Login } from './screens/Login'
import { NamePhone } from './screens/NamePhone'
import { Shell } from './Shell'
import './App.css'

export default function App({ api }: { api?: Api }) {
  return (
    <NestProvider api={api}>
      <ToastProvider>
        <Gate />
      </ToastProvider>
    </NestProvider>
  )
}

/** Decides what to show: loading, login, naming this phone, or the app. */
function Gate() {
  const { state, retry, signOut } = useNest()
  switch (state.status) {
    case 'loading':
      return (
        <main className="splash" aria-busy="true">
          <NestLogo size={112} />
          <span className="visually-hidden">Loading</span>
        </main>
      )
    case 'logged-out':
      return <Login />
    case 'error':
      return (
        <main className="splash">
          <NestLogo size={88} />
          <h1>Something went wrong</h1>
          <p>We couldn't open the nest. Check the connection and try again.</p>
          <button type="button" className="button squish" onClick={retry}>
            Try again
          </button>
          <button type="button" className="button button--quiet" onClick={() => void signOut()}>
            Log out
          </button>
        </main>
      )
    case 'ready':
      return state.sessionId && state.deviceName === null ? <NamePhone /> : <Shell />
  }
}
