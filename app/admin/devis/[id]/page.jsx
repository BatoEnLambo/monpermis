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

const STATUS_CONFIG = {
  draft: { bg: '#f5f4f2', color: '#888', label: 'Brouillon', border: '#ddd' },
  sent: { bg: '#fff3e0', color: '#e65100', label: 'Envoyé', border: '#e6510044' },
  paid: { bg: ACCENT, color: WHITE, label: 'Payé', border: ACCENT },
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

  const status = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft
  const publicUrl = `https://permisclair.fr/devis/${quote.id}`

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', fontFamily: FONT, padding: '0 16px' }}>
      <AdminNav />

      {/* Bandeau statut */}
      <div style={{
        background: status.bg,
        color: status.color,
        border: `1px solid ${status.border}`,
        borderRadius: 10,
        padding: '12px 20px',
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 14,
        fontWeight: 600,
      }}>
        <span>{status.label}</span>
        {quote.status === 'paid' && quote.paid_at && (
          <span style={{ fontWeight: 400, fontSize: 13 }}>
            Payé le {new Date(quote.paid_at).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>

      <div style={{ border: `1px solid ${GRAY_200}`, borderRadius: 14, background: WHITE, overflow: 'hidden' }}>
        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${GRAY_200}` }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: GRAY_900, margin: '0 0 12px' }}>{quote.project_title}</h1>
          <div style={{ fontSize: 14, color: GRAY_700 }}>{quote.client_name}</div>
          <div style={{ fontSize: 13, color: GRAY_500 }}>{quote.client_email || '—'}</div>
          <div style={{ fontSize: 13, color: GRAY_500, marginTop: 4 }}>Créé le {new Date(quote.created_at).toLocaleDateString('fr-FR')}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: GRAY_900, marginTop: 16 }}>{quote.amount} € <span style={{ fontSize: 14, fontWeight: 400, color: GRAY_500 }}>TTC</span></div>
        </div>

        {/* Infos Stripe / projet (si payé) */}
        {quote.status === 'paid' && (
          <div style={{ padding: '16px 28px', borderBottom: `1px solid ${GRAY_200}`, background: '#fafaf9' }}>
            {quote.stripe_session_id && (
              <div style={{ fontSize: 12, color: GRAY_500, marginBottom: 4 }}>
                Session Stripe : <span style={{ fontFamily: 'monospace', color: GRAY_700 }}>{quote.stripe_session_id}</span>
              </div>
            )}
            {quote.project_id && (
              <div style={{ fontSize: 13, marginTop: 8 }}>
                <button onClick={() => router.push('/admin')}
                  style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${ACCENT}`, background: ACCENT_LIGHT, color: ACCENT, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>
                  Voir le projet lié →
                </button>
              </div>
            )}
          </div>
        )}

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
          {quote.status === 'paid' && !quote.project_id && (
            <div style={{ fontSize: 13, color: GRAY_500, textAlign: 'center' }}>Payé — projet en cours de création par le webhook.</div>
          )}
        </div>
      </div>
    </div>
  )
}
