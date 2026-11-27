import { useState, type FormEvent } from 'react'
import { BirdAvatar } from '../components/birds'
import { BIRDS, BIRD_NAMES, type Bird } from '../lib/birds'
import { useReady } from '../lib/nest-context'
import { useToast } from '../lib/toast-context'
import './Us.css'

export function Us() {
  const { data, deviceName, updateMe, nameDevice, changePassword, signOut } = useReady()
  const toast = useToast()
  const { me, members, household } = data
  const [hops, setHops] = useState(0)

  const pickBird = (bird: Bird) => {
    if (bird === me.avatar) return
    setHops((h) => h + 1)
    updateMe({ avatar: bird }).catch(() => toast("That didn't save. Try again in a moment."))
  }

  return (
    <main className="screen rise">
      <div className="us-me">
        <button
          key={hops}
          type="button"
          className={hops ? 'us-me__bird hop' : 'us-me__bird'}
          onClick={() => setHops((h) => h + 1)}
          aria-label="Your bird"
        >
          <BirdAvatar bird={me.avatar} size={88} />
        </button>
        <div>
          <h1 className="screen__title">{me.display_name}</h1>
          <p className="screen__lead">
            @{me.username}
            {me.role === 'admin' && <span className="us-badge">Admin</span>}
          </p>
        </div>
      </div>

      <section className="panel">
        <h2 className="panel__label">Pick your bird</h2>
        <div className="us-birds" role="radiogroup" aria-label="Your bird">
          {BIRDS.map((bird) => (
            <button
              key={bird}
              type="button"
              role="radio"
              aria-checked={bird === me.avatar}
              className={bird === me.avatar ? 'us-birds__one us-birds__one--on' : 'us-birds__one'}
              onClick={() => pickBird(bird)}
            >
              <BirdAvatar bird={bird} size={56} decorative />
              <span>{BIRD_NAMES[bird]}</span>
            </button>
          ))}
        </div>
      </section>

      <SaveText
        label="Your name"
        initial={me.display_name}
        max={40}
        onSave={(display_name) => updateMe({ display_name }).then(() => toast('Name saved'))}
      />

      <SaveText
        label="This phone's name"
        initial={deviceName ?? ''}
        max={40}
        onSave={(name) => nameDevice(name).then(() => toast('Phone name saved'))}
      />

      <section className="panel">
        <h2 className="panel__label">{household.name}</h2>
        <ul className="us-members">
          {members.map((m) => (
            <li key={m.id}>
              <BirdAvatar bird={m.avatar} size={40} decorative />
              <span>
                <strong>{m.display_name}</strong>
                {m.id === me.id && ' (you)'}
              </span>
              {m.role === 'admin' && <span className="us-badge">Admin</span>}
            </li>
          ))}
        </ul>
      </section>

      <NewPassword onSave={changePassword} />

      <button type="button" className="button button--soft squish" onClick={() => void signOut()}>
        Log out of this phone
      </button>
    </main>
  )
}

function SaveText({
  label,
  initial,
  max,
  onSave,
}: {
  label: string
  initial: string
  max: number
  onSave: (value: string) => Promise<void>
}) {
  const [value, setValue] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const clean = value.trim()
  const changed = clean !== initial && clean.length > 0

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!changed || busy) return
    setBusy(true)
    setFailed(false)
    try {
      await onSave(clean)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <label className="field">
        <span className="panel__label">{label}</span>
        <span className="us-inline">
          <input value={value} maxLength={max} onChange={(e) => setValue(e.target.value)} />
          {changed && (
            <button className="button pop-in" type="submit" disabled={busy}>
              Save
            </button>
          )}
        </span>
      </label>
      {failed && (
        <p className="us-oops" role="alert">
          That didn't save. Try again in a moment.
        </p>
      )}
    </form>
  )
}

function NewPassword({ onSave }: { onSave: (password: string) => Promise<string | null> }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)

  const problem =
    password.length > 0 && password.length < 8
      ? 'At least 8 characters, please.'
      : again.length > 0 && again !== password
        ? "The two passwords don't match yet."
        : null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy || problem || password.length < 8 || again !== password) return
    setBusy(true)
    const error = await onSave(password)
    setBusy(false)
    if (error) {
      setNote({ ok: false, text: "That didn't work. Try a different password." })
    } else {
      setNote({ ok: true, text: 'Password changed. Use it next time you log in.' })
      setPassword('')
      setAgain('')
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <div className="panel">
        <h2 className="panel__label">Password</h2>
        {note && <p className={note.ok ? 'us-ok' : 'us-oops'}>{note.text}</p>}
        <button type="button" className="button button--soft squish" onClick={() => setOpen(true)}>
          Change my password
        </button>
      </div>
    )
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2 className="panel__label">New password</h2>
      <label className="field">
        <span>New password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <label className="field">
        <span>Type it again</span>
        <input type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
      </label>
      {(problem || (note && !note.ok)) && (
        <p className="us-oops" role="alert">
          {problem ?? note?.text}
        </p>
      )}
      <div className="us-actions">
        <button type="button" className="button button--quiet" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button className="button squish" type="submit" disabled={busy || !!problem || !password || again !== password}>
          {busy ? 'Saving…' : 'Save password'}
        </button>
      </div>
    </form>
  )
}
