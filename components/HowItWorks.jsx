import Link from 'next/link'
import '../styles/landing.css'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const GRAY_100 = "#f5f4f2"
const GRAY_200 = "#e8e7e4"
const GRAY_500 = "#8a8985"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"
const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`

const steps = [
  { num: "1", title: "Décrivez votre projet", desc: "Type de projet, surface, adresse du terrain. 5 minutes chrono." },
  { num: "2", title: "On produit votre dossier", desc: "Plans de masse, façades, coupes, notice descriptive, insertion paysagère. Tout assemblé, prêt à déposer." },
  { num: "3", title: "Déposez et c'est tout", desc: "Vous déposez le dossier en mairie. Si la mairie demande des corrections, on les fait sans frais." },
]

export default function HowItWorks() {
  return (
    <div className="steps-section" style={{ background: GRAY_100, borderRadius: 16, padding: "48px 24px", marginTop: 56 }}>
      <h2 className="section-title" style={{ fontSize: 28, fontWeight: 700, textAlign: "center", margin: "0 0 32px", letterSpacing: "-0.02em", color: GRAY_900 }}>
        Comment ça marche
      </h2>
      <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, textAlign: "left" }}>
        {steps.map((s, i) => (
          <div key={i} className="step-card" style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 12, padding: 24 }}>
            <div className="step-num" style={{ width: 32, height: 32, borderRadius: "50%", background: ACCENT_LIGHT, color: ACCENT, fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              {s.num}
            </div>
            <div className="step-title" style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: GRAY_900 }}>{s.title}</div>
            <div className="step-desc" style={{ fontSize: 13, color: GRAY_500, lineHeight: 1.6 }}>{s.desc}</div>
          </div>
        ))}
      </div>
      <div className="steps-cta" style={{ textAlign: "center", marginTop: 36 }}>
        <Link href="/formulaire" className="cta-btn" style={{ display: "inline-block", background: ACCENT, color: WHITE, border: "none", padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", textDecoration: "none" }}>
          Commencer mon dossier →
        </Link>
      </div>
    </div>
  )
}
