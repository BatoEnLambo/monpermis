'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ACCENT = "#1a5c3a"
const GRAY_900 = "#1c1c1a"
const GRAY_500 = "#8a8985"
const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`

const AdminAuthContext = createContext(null)

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}

export function AdminAuthProvider({ children }) {
  const [status, setStatus] = useState('loading') // loading | out | in
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Check session on mount via server
  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/me', { cache: 'no-store', credentials: 'same-origin' })
      .then(r => (r.ok ? 'in' : 'out'))
      .catch(() => 'out')
      .then(next => {
        if (!cancelled) setStatus(next)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = async (e) => {
    e.preventDefault()
    if (submitting) return
    setErrorMsg('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setPassword('')
        setStatus('in')
      } else {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error || 'Mot de passe incorrect')
      }
    } catch (err) {
      setErrorMsg('Erreur réseau. Réessaie.')
    } finally {
      setSubmitting(false)
    }
  }

  const logout = useCallback(async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'same-origin',
      })
    } catch {
      /* ignore */
    }
    setStatus('out')
  }, [])

  if (status === 'loading') {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: 20, fontFamily: FONT, textAlign: 'center', color: GRAY_500 }}>
        Chargement…
      </div>
    )
  }

  if (status === 'out') {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: 20, fontFamily: FONT }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: GRAY_900 }}>Admin PermisClair</h1>
        <form onSubmit={login}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe"
            autoComplete="current-password"
            disabled={submitting}
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 16, marginBottom: 12, boxSizing: 'border-box', fontFamily: FONT }}
          />
          <button type="submit" disabled={submitting || !password} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: 15, fontWeight: 600, cursor: submitting ? 'default' : 'pointer', opacity: submitting || !password ? 0.7 : 1, fontFamily: FONT }}>
            {submitting ? 'Connexion…' : 'Connexion'}
          </button>
          {errorMsg && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: '#fdecec', color: '#a12', borderRadius: 8, fontSize: 13, fontFamily: FONT }}>
              {errorMsg}
            </div>
          )}
        </form>
      </div>
    )
  }

  return (
    <AdminAuthContext.Provider value={{ logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
