'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import '../../../styles/payment.css'

const ACCENT = "#1a5c3a"
const ACCENT_HOVER = "#14482e"
const ACCENT_LIGHT = "#e8f5ee"
const GRAY_50 = "#fafaf9"
const GRAY_100 = "#f5f4f2"
const GRAY_200 = "#e8e7e4"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"
const SUCCESS = "#1a7a3a"
const SUCCESS_BG = "#eefbf2"
const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`

const INCLUDES = [
  "Plans complets (PCMI1 à PCMI8)",
  "Notice descriptive",
  "CERFA rempli",
  "Insertion paysagère",
  "Dossier assemblé prêt à déposer",
  "Corrections illimitées jusqu'à acceptation",
]

export default function DevisPublicPage() {
  const params = useParams()
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', params.id)
        .single()
      if (error || !data) {
        setNotFound(true)
      } else {
        setQuote(data)
      }
      setLoading(false)
    }
    fetch()
  }, [params.id])

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: GRAY_500, fontFamily: FONT }}>Chargement...</div>

  if (notFound) return (
    <div style={{ textAlign: 'center', padding: 60, fontFamily: FONT }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>404</div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: GRAY_900, marginBottom: 8 }}>Devis introuvable</h1>
      <p style={{ fontSize: 14, color: GRAY_500 }}>Ce lien n'est pas valide ou le devis a été supprimé.</p>
    </div>
  )

  if (quote.status === 'paid') return (
    <div style={{ textAlign: 'center', padding: 60, fontFamily: FONT }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>Ce devis a déjà été réglé.</h1>
      <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>Consultez votre email pour accéder à votre espace client.</p>
    </div>
  )

  return (
    <div className="page-payment payment-page" style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="payment-card" style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, overflow: 'hidden' }}>
        <div className="payment-card-header" style={{ padding: '24px 28px', borderBottom: `1px solid ${GRAY_100}` }}>
          <div className="pay-offer-label" style={{ fontSize: 12, color: ACCENT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Votre offre</div>
          <h2 className="pay-offer-title" style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{quote.project_title}</h2>
          <p className="pay-offer-address" style={{ fontSize: 13, color: GRAY_500, margin: 0 }}>
            Préparé pour {quote.client_name}
          </p>
        </div>

        <div className="payment-card-includes" style={{ padding: '20px 28px', borderBottom: `1px solid ${GRAY_100}` }}>
          <div className="pay-includes-title" style={{ fontSize: 13, fontWeight: 600, color: GRAY_700, marginBottom: 12 }}>Ce qui est inclus :</div>
          {INCLUDES.map((item, i) => (
            <div key={i} className="pay-includes-item" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13, color: GRAY_700 }}>
              <span className="pay-check" style={{ color: ACCENT, fontSize: 14 }}>✓</span>
              {item}
            </div>
          ))}
          <div className="pay-delivery" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13, color: ACCENT, fontWeight: 500, marginTop: 4 }}>
            <span style={{ fontSize: 14 }}>⚡</span>
            Livraison en 5 jours ouvrés
          </div>
        </div>

        <div className="pay-garantie" style={{ padding: '14px 28px', background: SUCCESS_BG, borderTop: '1px solid #c3e6cb', borderBottom: '1px solid #c3e6cb', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ color: SUCCESS, fontSize: 16, marginTop: 1 }}>✓</span>
          <div>
            <div className="pay-garantie-title" style={{ fontSize: 13, fontWeight: 700, color: SUCCESS }}>Garantie acceptation</div>
            <div className="pay-garantie-text" style={{ fontSize: 12, color: GRAY_700, lineHeight: 1.5, marginTop: 2 }}>Corrections illimitées si la mairie demande des modifications. Remboursé sous 14 jours si insatisfait.</div>
          </div>
        </div>

        <div className="payment-card-price" style={{ padding: '24px 28px', background: GRAY_50, textAlign: 'center' }}>
          <div className="pay-amount-row" style={{ marginBottom: 20 }}>
            <span className="pay-amount" style={{ fontSize: 36, fontWeight: 700, color: GRAY_900, letterSpacing: '-0.03em' }}>{quote.amount} €</span>
            <span style={{ fontSize: 14, color: GRAY_500, marginLeft: 4 }}>TTC</span>
          </div>

          <form method="POST" action="/api/checkout">
            <input type="hidden" name="quote_id" value={quote.id} />
            <button type="submit"
              style={{
                width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                background: ACCENT, color: WHITE,
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
                fontFamily: FONT, transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseOver={e => e.currentTarget.style.background = ACCENT_HOVER}
              onMouseOut={e => e.currentTarget.style.background = ACCENT}>
              Payer {quote.amount} € — dossier livré en 5 jours ouvrés
            </button>
          </form>

          <div className="payment-badges" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
            {[
              { icon: '🔒', text: 'Paiement sécurisé Stripe' },
              { icon: '✓', text: 'Satisfait ou remboursé 14j' },
              { icon: '🛡️', text: 'Corrections illimitées' },
            ].map((item, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.7rem', color: '#888', lineHeight: 1.3 }}>
                <div>{item.icon}</div>
                <div>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
