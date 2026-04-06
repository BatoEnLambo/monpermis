import Link from 'next/link'
import '../styles/landing.css'

const ACCENT = "#1a5c3a"
const GRAY_100 = "#f5f4f2"
const GRAY_500 = "#8a8985"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"
const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`

export default function FinalCta() {
  return (
    <div className="cta-final" style={{ marginTop: 56, background: GRAY_100, borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
      <h2 className="cta-final-title" style={{ fontSize: 28, fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.02em", color: GRAY_900 }}>
        Votre dossier prêt dans 5 jours.
      </h2>
      <p className="section-subtitle" style={{ fontSize: 16, fontWeight: 400, color: GRAY_500, margin: "0 0 28px" }}>
        Décrivez votre projet en 5 minutes. On fait le reste.
      </p>
      <Link href="/formulaire" className="cta-btn" style={{ display: "inline-block", background: ACCENT, color: WHITE, border: "none", padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", textDecoration: "none" }}>
        Commencer mon dossier →
      </Link>
      <p style={{ fontSize: 12, color: GRAY_500, marginTop: 14 }}>
        Sans engagement — vous ne payez qu'après avoir vu le devis exact de votre projet.
      </p>
    </div>
  )
}
