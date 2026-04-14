'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import '../../styles/payment.css'
import { supabase } from '../../lib/supabase'
import { getProjectPricing, computePrice, OPTIONS } from '../../src/config/pricing'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const ACCENT_HOVER = "#14482e"
const GRAY_50 = "#fafaf9"
const GRAY_100 = "#f5f4f2"
const GRAY_200 = "#e8e7e4"
const GRAY_300 = "#d4d3d0"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"
const SUCCESS = "#1a7a3a"
const SUCCESS_BG = "#eefbf2"
const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`

// getPricing, PC_INCLUDES, DP_INCLUDES remplacés par getProjectPricing depuis src/config/pricing.js

export default function PaiementPage() {
  const router = useRouter()
  const [form, setForm] = useState(null)
  useEffect(() => {
    const data = localStorage.getItem('projectData')
    if (data) {
      setForm(JSON.parse(data))
    } else {
      router.push('/formulaire')
    }
  }, [router])

  if (!form) return null

  const pricing = getProjectPricing(form.projectType)
  const re2020 = !!form.re2020
  const activeOptions = re2020 ? ['RE2020'] : []
  const totalPrice = computePrice({ category: pricing.category, options: activeOptions })

  const projectData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('projectData') || '{}') : {}

  return (
    <div className="page-payment payment-page" style={{ maxWidth: 520, margin: "0 auto" }}>
      <button className="payment-back" onClick={() => router.push('/formulaire?step=3')} style={{ background: "none", border: "none", color: GRAY_500, fontSize: 13, cursor: "pointer", fontFamily: FONT, padding: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 4 }}>
        ← Modifier mon projet
      </button>

      <div className="payment-card" style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, overflow: "hidden" }}>
        <div className="payment-card-header" style={{ padding: "24px 28px", borderBottom: `1px solid ${GRAY_100}` }}>
          <div className="pay-offer-label" style={{ fontSize: 12, color: ACCENT, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Votre offre</div>
          <h2 className="pay-offer-title" style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{pricing.label}</h2>
          <p className="pay-offer-address" style={{ fontSize: 13, color: GRAY_500, margin: 0 }}>
            {form.address}, {form.postalCode} {form.city} — {form.surface} m²
          </p>
        </div>

        <div className="payment-card-includes" style={{ padding: "20px 28px", borderBottom: `1px solid ${GRAY_100}` }}>
          <div className="pay-includes-title" style={{ fontSize: 13, fontWeight: 600, color: GRAY_700, marginBottom: 12 }}>Ce qui est inclus :</div>
          {pricing.includes.map((item, i) => (
            <div key={i} className="pay-includes-item" style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13, color: GRAY_700 }}>
              <span className="pay-check" style={{ color: ACCENT, fontSize: 14 }}>✓</span>
              {item}
            </div>
          ))}
          {re2020 && (
            <div className="pay-includes-item" style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13, color: GRAY_700 }}>
              <span className="pay-check" style={{ color: ACCENT, fontSize: 14 }}>✓</span>
              Attestation RE2020 (Bbio) par partenaire certifié
            </div>
          )}
          <div className="pay-delivery" style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13, color: ACCENT, fontWeight: 500, marginTop: 4 }}>
            <span style={{ fontSize: 14 }}>⚡</span>
            Livraison en {pricing.delay}
          </div>
        </div>

        <div className="pay-garantie" style={{ padding: "14px 28px", background: SUCCESS_BG, borderTop: `1px solid #c3e6cb`, borderBottom: `1px solid #c3e6cb`, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ color: SUCCESS, fontSize: 16, marginTop: 1 }}>✓</span>
          <div>
            <div className="pay-garantie-title" style={{ fontSize: 13, fontWeight: 700, color: SUCCESS }}>Garantie acceptation</div>
            <div className="pay-garantie-text" style={{ fontSize: 12, color: GRAY_700, lineHeight: 1.5, marginTop: 2 }}>Corrections illimitées si la mairie demande des modifications. Remboursé sous 14 jours si insatisfait.</div>
          </div>
        </div>


        <div className="payment-card-price" style={{ padding: "24px 28px", background: GRAY_50, textAlign: "center" }}>
          {pricing.price ? (
            <>
              <div className="pay-amount-row" style={{ marginBottom: re2020 ? 8 : 20 }}>
                <span className="pay-amount" style={{ fontSize: 36, fontWeight: 700, color: GRAY_900, letterSpacing: "-0.03em" }}>{totalPrice} €</span>
                <span style={{ fontSize: 14, color: GRAY_500, marginLeft: 4 }}>TTC</span>
              </div>
              {re2020 && (
                <div style={{ fontSize: 12, color: GRAY_500, marginBottom: 16 }}>
                  {pricing.price} € (dossier) + {OPTIONS.RE2020.price} € (RE2020)
                </div>
              )}

              <form method="POST" action="/api/checkout">
                <input type="hidden" name="projectId" value={projectData?.id || ''} />
                <input type="hidden" name="reference" value={projectData?.reference || ''} />
                <input type="hidden" name="category" value={pricing.category} />
                <input type="hidden" name="options" value={JSON.stringify(activeOptions)} />
                <input type="hidden" name="label" value={`${pricing.label}${re2020 ? ' + RE2020' : ''}`} />
                <input type="hidden" name="email" value={form?.email || projectData?.email || ''} />
                <button type="submit"
                  style={{
                    width: "100%", padding: "14px", borderRadius: 10, border: "none",
                    background: ACCENT, color: WHITE,
                    fontSize: 15, fontWeight: 600, cursor: "pointer",
                    fontFamily: FONT, transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                  onMouseOver={e => e.currentTarget.style.background = ACCENT_HOVER}
                  onMouseOut={e => e.currentTarget.style.background = ACCENT}>
                  🔒 Payer {totalPrice} € — dossier livré en 5 jours ouvrés
                </button>
              </form>

              <div className="payment-badges" style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
                {[
                  { icon: "🔒", text: "Paiement sécurisé Stripe" },
                  { icon: "✓", text: "Satisfait ou remboursé 14j" },
                  { icon: "🛡️", text: "Corrections illimitées" },
                ].map((item, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", fontSize: "0.7rem", color: "#888", lineHeight: 1.3 }}>
                    <div>{item.icon}</div>
                    <div>{item.text}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 14, color: GRAY_700, marginBottom: 16, lineHeight: 1.5 }}>
                Votre projet nécessite une analyse personnalisée. On vous envoie un devis sous 24h.
              </p>
              <a href="mailto:contact@permisclair.fr?subject=Demande de devis — Projet sur mesure"
                style={{ display: 'block', width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: ACCENT, color: WHITE, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>
                Nous contacter pour un devis →
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
