import Link from 'next/link'
import '../styles/landing.css'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const GRAY_500 = "#8a8985"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"
const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`

export default function HeroSection() {
  return (
    <div className="hero" style={{ textAlign: "center", paddingTop: 48, paddingBottom: 56 }}>
      <div className="hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ACCENT_LIGHT, color: ACCENT, fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 20, marginBottom: 24 }}>
        <span>✓</span> Dossier complet livré en 5 jours ouvrés
      </div>
      <h1 className="hero-title" style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.2, margin: "0 0 20px", letterSpacing: "-0.03em", color: GRAY_900, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
        Extension, garage, piscine, maison : on s'occupe de vos plans et de votre dossier.
      </h1>
      <p className="hero-subtitle" style={{ fontSize: 16, fontWeight: 400, color: GRAY_500, lineHeight: 1.7, maxWidth: 540, margin: "0 auto 32px" }}>
        Décrivez votre projet en 5 minutes — on réalise vos plans sur mesure et votre dossier complet, prêt à déposer en mairie. Dès 390€, sans architecte.
      </p>
      <Link href="/formulaire" className="cta-btn" style={{ display: "inline-block", background: ACCENT, color: WHITE, border: "none", padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", textDecoration: "none" }}>
        Décrire mon projet →
      </Link>
    </div>
  )
}
