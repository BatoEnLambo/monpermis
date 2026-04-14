'use client'

import { usePathname, useRouter } from 'next/navigation'

const ACCENT = "#1a5c3a"
const GRAY_500 = "#8a8985"
const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`

const tabs = [
  { label: 'Projets', href: '/admin' },
  { label: 'Devis', href: '/admin/devis' },
]

export default function AdminNav({ onRefresh, onLogout }) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {tabs.map(tab => {
          const active = isActive(tab.href)
          return (
            <button key={tab.href} onClick={() => router.push(tab.href)}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: active ? ACCENT : 'transparent',
                color: active ? '#fff' : GRAY_500,
                fontSize: 14, fontWeight: active ? 600 : 500,
                cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
              }}>
              {tab.label}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {onRefresh && (
          <button onClick={onRefresh} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: FONT }}>
            ↻ Rafraîchir
          </button>
        )}
        {onLogout && (
          <button onClick={onLogout} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: FONT }}>
            Déconnexion
          </button>
        )}
      </div>
    </div>
  )
}
