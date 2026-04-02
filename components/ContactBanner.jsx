import '../styles/landing.css'

const ACCENT = "#1a5c3a"
const GRAY_500 = "#8a8985"
const GRAY_900 = "#1c1c1a"

export default function ContactBanner() {
  return (
    <div className="contact-banner" style={{ marginTop: 56, padding: "32px 24px", borderTop: "1px solid #eee", borderBottom: "1px solid #eee", textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: GRAY_900, marginBottom: 6 }}>Une question avant de vous lancer ?</div>
      <div style={{ fontSize: 14, color: GRAY_500, marginBottom: 20 }}>Écrivez-moi, je vous réponds personnellement en moins de 24h.</div>
      <div className="contact-links" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <a href="https://wa.me/33633173115?text=Bonjour%20Baptiste%2C%20j%27ai%20un%20projet%20de%20%5Bextension%20%2F%20garage%20%2F%20piscine%20%2F%20maison%5D%20et%20j%27aimerais%20un%20devis.%0A%0AVoici%20les%20infos%20principales%20%3A%0A-%20Type%20de%20projet%20%3A%0A-%20Surface%20estim%C3%A9e%20%3A%0A-%20Commune%20%3A" target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 600, color: ACCENT, textDecoration: "none" }}>
          💬 WhatsApp — réponse en quelques heures
        </a>
        <a href="mailto:contact@permisclair.fr" style={{ fontSize: 15, fontWeight: 600, color: ACCENT, textDecoration: "none" }}>
          📧 contact@permisclair.fr
        </a>
      </div>
    </div>
  )
}
