import '../styles/landing.css'

const ACCENT = "#1a5c3a"
const GRAY_500 = "#8a8985"
const GRAY_900 = "#1c1c1a"

export default function ContactBanner() {
  return (
    <div className="contact-banner" style={{ marginTop: 56, padding: "32px 24px", borderTop: "1px solid #eee", borderBottom: "1px solid #eee", textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: GRAY_900, marginBottom: 6 }}>Une question avant de vous lancer ?</div>
      <div style={{ fontSize: 14, color: GRAY_500, marginBottom: 20 }}>Écrivez-moi, je vous réponds personnellement en moins de 24h.</div>
      <div className="contact-links" style={{ display: "flex", justifyContent: "center", gap: 24 }}>
        <a href="https://wa.me/33612345678" target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 600, color: ACCENT, textDecoration: "none" }}>
          💬 WhatsApp
        </a>
        <a href="mailto:contact@permisclair.fr" style={{ fontSize: 15, fontWeight: 600, color: ACCENT, textDecoration: "none" }}>
          📧 contact@permisclair.fr
        </a>
      </div>
    </div>
  )
}
