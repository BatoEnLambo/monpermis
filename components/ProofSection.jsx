import '../styles/landing.css'

const GRAY_100 = "#f5f4f2"
const GRAY_500 = "#8a8985"
const GRAY_900 = "#1c1c1a"
const SUCCESS = "#1a7a3a"
const SUCCESS_BG = "#eefbf2"

export default function ProofSection() {
  return (
    <div className="dossier-section" style={{ background: GRAY_100, borderRadius: 16, padding: "48px 24px", marginTop: 56, textAlign: "center" }}>
      <h2 className="section-title" style={{ fontSize: 28, fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.02em", color: GRAY_900 }}>
        Un vrai dossier, accepté en mairie
      </h2>
      <p className="section-subtitle" style={{ fontSize: 16, fontWeight: 400, color: GRAY_500, margin: "0 0 28px" }}>
        Mon propre dossier : refusé, puis corrigé et accepté par la mairie.
      </p>
      <img src="/images/dossier-accepte.png" alt="Dossier de permis de construire accepté" style={{ maxWidth: 500, width: "100%", borderRadius: 8, border: "1px solid #e5e5e5", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", display: "block", margin: "0 auto" }} />
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: SUCCESS_BG, color: SUCCESS, fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 20, marginTop: 20 }}>
        <span>✓</span> Permis accordé — Vendée
      </div>
    </div>
  )
}
