import { useState, type FormEvent } from 'react'
import { NestLogo } from '../components/NestLogo'
import { useNest } from '../lib/nest-context'
import { readLocal, writeLocal } from '../lib/storage'
import './Login.css'

export const USERNAME_KEY = 'nest.username'

export function Login() {
  const { signIn } = useNest()
  const remembered = readLocal(USERNAME_KEY) ?? ''
  const [username, setUsername] = useState(remembered)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [wrong, setWrong] = useState(0)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password || busy) return
    setBusy(true)
    const ok = await signIn(username, password)
    if (ok) {
      writeLocal(USERNAME_KEY, username.trim().toLowerCase())
      // The app moves on to Home by itself once the session arrives.
    } else {
      setBusy(false)
      setPassword('')
      setWrong((n) => n + 1)
    }
  }

  return (
    <main className="login rise">
      <div key={wrong} className={wrong ? 'login__logo shake' : 'login__logo'}>
        <NestLogo size={104} />
      </div>
      <h1>Welcome home</h1>
      <p className="login__lead">Log in to your nest.</p>

      <form className="login__card" onSubmit={submit} noValidate>
        <label className="field">
          <span>Username</span>
          <input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus={!remembered}
            enterKeyHint="next"
          />
        </label>
        <label className="field">
          <span>Password</span>
          <span className="field__row">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus={!!remembered}
              enterKeyHint="go"
            />
            <button
              type="button"
              className="field__peek"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </span>
        </label>

        {wrong > 0 && (
          <p className="login__oops pop-in" role="alert">
            Hmm, that didn't match. Check your username and password and try again.
          </p>
        )}

        <button className="button squish" type="submit" disabled={busy || !username.trim() || !password}>
          {busy ? 'Opening the nest…' : 'Come in'}
        </button>
      </form>
    </main>
  )
}
