import { useState, type FormEvent } from 'react'
import { BirdAvatar } from '../components/birds'
import { suggestDeviceName } from '../lib/device'
import { useReady } from '../lib/nest-context'
import './NamePhone.css'

/** Asked once per phone, right after the first login. */
export function NamePhone() {
  const { data, nameDevice } = useReady()
  const [name, setName] = useState(() => suggestDeviceName(data.me.display_name, navigator.userAgent))
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const clean = name.trim()
    if (!clean || busy) return
    setBusy(true)
    setFailed(false)
    try {
      await nameDevice(clean)
    } catch {
      setBusy(false)
      setFailed(true)
    }
  }

  return (
    <main className="name-phone rise">
      <BirdAvatar bird={data.me.avatar} size={96} className="hop" />
      <h1>Hi {data.me.display_name}!</h1>
      <p>What should we call this phone? It helps you spot it later in the list of devices.</p>
      <form className="name-phone__card" onSubmit={save}>
        <label className="field">
          <span>This phone's name</span>
          <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} enterKeyHint="done" />
        </label>
        {failed && (
          <p className="name-phone__oops" role="alert">
            That didn't save. Check the connection and try again.
          </p>
        )}
        <button className="button squish" type="submit" disabled={busy || !name.trim()}>
          {busy ? 'Saving…' : 'Looks good'}
        </button>
      </form>
    </main>
  )
}
