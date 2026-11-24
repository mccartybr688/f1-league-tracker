import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isDemo } from '../lib/supabase'

const SessionContext = createContext(null)
export const useSession = () => useContext(SessionContext)

/**
 * Live mode: nothing renders until someone signs in (the database also
 * refuses anonymous reads). Demo mode: no sign-in needed.
 */
export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    if (isDemo) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (isDemo) return children
  if (session === undefined) return null
  if (!session) return <SignIn />
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setBusy(false)
  }

  return (
    <main className="signin">
      <form className="card signin-card" onSubmit={submit}>
        <p className="eyebrow">Members only</p>
        <h1>🏁 League sign-in</h1>
        <label>
          Email
          <input type="email" autoComplete="username" value={email}
                 onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" value={password}
                 onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  )
}

export async function signOut() {
  await supabase?.auth.signOut()
}
