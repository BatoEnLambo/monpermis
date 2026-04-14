'use client'

import { createContext, useContext, useState, useCallback } from 'react'

const ADMIN_PASSWORD = 'permisclair2026'
const ACCENT = "#1a5c3a"
const GRAY_900 = "#1c1c1a"
const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`

const AdminAuthContext = createContext(null)

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}

export function AdminAuthProvider({ children }) {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')

  const login = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
    } else {
      alert('Mot de passe incorrect')
    }
  }

  const logout = useCallback(() => setAuthed(false), [])

  if (!authed) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: 20, fontFamily: FONT }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: GRAY_900 }}>Admin PermisClair</h1>
        <form onSubmit={login}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe"
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 16, marginBottom: 12, boxSizing: 'border-box', fontFamily: FONT }}
          />
          <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
            Connexion
          </button>
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
