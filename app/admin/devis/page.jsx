'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import AdminNav from '../../../components/AdminNav'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const GRAY_200 = "#e8e7e4"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"
const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`

const STATUS_BADGE = {
  draft: { bg: '#f5f4f2', color: '#888', label: 'Brouillon' },
  sent: { bg: '#fff3e0', color: '#e65100', label: 'Envoyé' },
  paid: { bg: ACCENT_LIGHT, color: ACCENT, label: 'Payé' },
}

export default function DevisListPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchQuotes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })
    setQuotes(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchQuotes()
  }, [])

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: FONT, padding: '0 16px' }}>
      <AdminNav onRefresh={fetchQuotes} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: GRAY_900, margin: 0 }}>Devis</h1>
        <button onClick={() => router.push('/admin/devis/new')}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: ACCENT, color: WHITE, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: FONT }}>
          + Nouveau devis
        </button>
      </div>

      {loading ? (
        <p style={{ color: GRAY_500, fontSize: 14 }}>Chargement...</p>
      ) : quotes.length === 0 ? (
        <p style={{ color: GRAY_500, fontSize: 14 }}>Aucun devis pour le moment.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {quotes.map(q => {
            const badge = STATUS_BADGE[q.status] || STATUS_BADGE.draft
            return (
              <div key={q.id} onClick={() => router.push(`/admin/devis/${q.id}`)}
                style={{ border: `1px solid ${GRAY_200}`, borderRadius: 10, padding: 16, background: WHITE, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: GRAY_900 }}>{q.project_title}</div>
                  <div style={{ fontSize: 13, color: GRAY_500, marginTop: 2 }}>{q.client_name} — {q.client_email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: GRAY_900 }}>{q.amount} €</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: badge.bg, color: badge.color }}>{badge.label}</span>
                  <span style={{ fontSize: 12, color: GRAY_500 }}>{new Date(q.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
