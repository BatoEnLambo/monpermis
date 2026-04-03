'use client'

import Link from 'next/link'
import '../styles/landing.css'

const ACCENT = "#1a5c3a"
const GRAY_200 = "#e8e7e4"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"
const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`

const cards = [
  { title: "Piscine / Garage / Terrasse", sub: "Déclaration préalable", price: "350€", detail: "Dossier DP complet", projectType: "Piscine" },
  { title: "Extension / Surélévation", sub: "DP ou permis de construire", price: "490€", detail: "Plans + dossier complet", projectType: "Extension / Agrandissement" },
  { title: "Maison neuve", sub: "Permis de construire", price: "690€", detail: "Plans + dossier PC complet", popular: true, projectType: "Maison neuve" },
]

export default function PricingCards() {
  return (
    <div id="tarifs" className="tarifs-section" style={{ marginTop: 56, paddingTop: 48, borderTop: `1px solid ${GRAY_200}`, textAlign: "center", scrollMarginTop: 80 }}>
      <h2 className="section-title" style={{ fontSize: 28, fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.02em", color: GRAY_900 }}>
        Des prix clairs, sans surprise
      </h2>
      <p className="section-subtitle" style={{ fontSize: 16, fontWeight: 400, color: GRAY_500, margin: "0 0 32px" }}>
        Jusqu'à 4× moins cher qu'un architecte, et 5× plus rapide. Même dossier, même résultat en mairie.
      </p>
      <div className="pricing-grid" style={{ display: "grid" }}>
        {cards.map((card, i) => (
          <Link key={i} href={`/formulaire?type=${encodeURIComponent(card.projectType)}${card.floors ? `&floors=${encodeURIComponent(card.floors)}` : ''}`}
            className={`pricing-card${card.popular ? " pricing-card-popular" : ""}`}
            style={{
              background: card.popular ? ACCENT : WHITE,
              border: card.popular ? "none" : "1px solid #e5e5e5",
              borderRadius: 12, padding: "1.25rem", textAlign: "left", cursor: "pointer", transition: "all 0.2s ease",
              display: "flex", flexDirection: "column", textDecoration: "none",
            }}>
            <div className="pricing-sub" style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: card.popular ? "rgba(255,255,255,0.7)" : "#888", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: 6 }}>
              {card.sub}
              {card.popular && (
                <span className="pricing-badge" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: "0.6rem", fontWeight: 600, padding: "3px 8px", borderRadius: 20 }}>Populaire</span>
              )}
            </div>
            <div className="pricing-name" style={{ fontSize: "1rem", fontWeight: 700, color: card.popular ? "#fff" : "#111", marginBottom: "0.5rem" }}>{card.title}</div>
            <div className="pricing-price" style={{ fontSize: "1.75rem", fontWeight: 800, color: card.popular ? "#fff" : ACCENT, marginBottom: "0.15rem" }}>{card.price}</div>
            <div className="pricing-detail" style={{ fontSize: "0.75rem", color: card.popular ? "rgba(255,255,255,0.7)" : "#888", marginBottom: "0.75rem" }}>{card.detail}</div>
            <span className="pricing-cta" style={{
              display: "block", width: "100%", textAlign: "center", padding: "0.5rem", borderRadius: 8, fontSize: "0.8rem", fontWeight: card.popular ? 700 : 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s", marginTop: "auto",
              background: card.popular ? "#fff" : "transparent",
              color: card.popular ? ACCENT : ACCENT,
              border: card.popular ? "none" : `1.5px solid ${ACCENT}`,
            }}>
              Choisir cette offre
            </span>
          </Link>
        ))}
      </div>
      <p className="pricing-option-re2020" style={{ fontSize: 13, color: GRAY_700, marginTop: 20, lineHeight: 1.6 }}>
        <strong>Option RE2020 : +250 €</strong> — Attestation thermique obligatoire pour toute construction neuve, réalisée par notre partenaire certifié.
      </p>
      <p className="pricing-compare" style={{ fontSize: 13, color: GRAY_500, marginTop: 12 }}>
        Un dessinateur facture 600 à 2 000€ et livre en 2 à 6 semaines. Un architecte, 1 500 à 4 000€.
      </p>
    </div>
  )
}
