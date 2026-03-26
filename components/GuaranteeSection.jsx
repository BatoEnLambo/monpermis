import '../styles/landing.css'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"

export default function GuaranteeSection() {
  return (
    <div className="garantie-box" style={{ marginTop: 48, background: ACCENT_LIGHT, border: `1px solid ${ACCENT}44`, borderRadius: 12, padding: "24px 28px", display: "flex", alignItems: "flex-start", gap: 16 }}>
      <div className="garantie-icon" style={{ fontSize: 28, minWidth: 36 }}>🛡️</div>
      <div>
        <div className="garantie-title" style={{ fontSize: 16, fontWeight: 700, color: GRAY_900, marginBottom: 6 }}>Votre dossier accepté, ou on corrige gratuitement.</div>
        <div className="garantie-text" style={{ fontSize: 14, color: GRAY_700, lineHeight: 1.6 }}>
          Si la mairie demande des modifications, on corrige et on vous renvoie le dossier. Sans frais, sans limite. Et si notre service ne vous convient pas : remboursé sous 14 jours, sans condition.
        </div>
      </div>
    </div>
  )
}
