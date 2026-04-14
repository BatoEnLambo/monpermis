'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import AdminNav from '../../../../components/AdminNav'

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

export default function DevisDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [updating, setUpdating] = useState(false)

  const fetchQuote = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', params.id)
      .single()
    setQuote(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchQuote()
  }, [])

  const copyLink = () => {
    const url = `https://permisclair.fr/devis/${quote.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const markAsSent = async () => {
    setUpdating(true)
    await supabase.from('quotes').update({ status: 'sent' }).eq('id', quote.id)
    setQuote(prev => ({ ...prev, status: 'sent' }))
    setUpdating(false)
  }

  if (loading) return <p style={{ textAlign: 'center', padding: 60, color: GRAY_500, fontFamily: FONT }}>Chargement...</p>
  if (!quote) return <p style={{ textAlign: 'center', padding: 60, color: GRAY_500, fontFamily: FONT }}>Devis introuvable.</p>

  const badge = STATUS_BADGE[quote.status] || STATUS_BADGE.draft
  const publicUrl = `https://permisclair.fr/devis/${quote.id}`

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', fontFamily: FONT, padding: '0 16px' }}>
      <AdminNav />

      <div style={{ border: `1px solid ${GRAY_200}`, borderRadius: 14, background: WHITE, overflow: 'hidden' }}>
        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${GRAY_200}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: GRAY_900, margin: 0 }}>{quote.project_title}</h1>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: badge.bg, color: badge.color }}>{badge.label}</span>
          </div>
          <div style={{ fontSize: 14, color: GRAY_700 }}>{quote.client_name}</div>
          <div style={{ fontSize: 13, color: GRAY_500 }}>{quote.client_email}</div>
          <div style={{ fontSize: 13, color: GRAY_500, marginTop: 4 }}>Créé le {new Date(quote.created_at).toLocaleDateString('fr-FR')}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: GRAY_900, marginTop: 16 }}>{quote.amount} € <span style={{ fontSize: 14, fontWeight: 400, color: GRAY_500 }}>TTC</span></div>
        </div>

        <div style={{ padding: '20px 28px', borderBottom: `1px solid ${GRAY_200}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: GRAY_700, marginBottom: 8 }}>Lien public</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input readOnly value={publicUrl} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${GRAY_200}`, fontSize: 13, fontFamily: FONT, color: GRAY_700, background: '#f9f9f8' }} />
            <button onClick={copyLink}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: copied ? ACCENT_LIGHT : ACCENT, color: copied ? ACCENT : WHITE, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
              {copied ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 28px' }}>
          {quote.status === 'draft' && (
            <button onClick={markAsSent} disabled={updating}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: '#e65100', color: WHITE, fontWeight: 600, fontSize: 14, cursor: updating ? 'default' : 'pointer', fontFamily: FONT }}>
              {updating ? 'Mise à jour...' : 'Marquer comme envoyé'}
            </button>
          )}
          {quote.status === 'sent' && (
            <div style={{ fontSize: 14, color: GRAY_500, textAlign: 'center' }}>En attente de paiement du client.</div>
          )}
          {quote.status === 'paid' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: ACCENT, fontWeight: 600, marginBottom: 8 }}>Payé le {new Date(quote.paid_at).toLocaleDateString('fr-FR')}</div>
              {quote.project_id && (
                <button onClick={() => router.push(`/admin`)}
                  style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${GRAY_200}`, background: WHITE, color: GRAY_700, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>
                  Voir le projet dans l'admin →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
