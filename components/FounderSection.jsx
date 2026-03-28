import '../styles/landing.css'

const GRAY_50 = "#fafaf9"
const GRAY_200 = "#e8e7e4"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"

const badges = [
  "Permis refusé puis accepté",
  "Plans réalisés sur logiciel pro",
  "Basé en Vendée (85)",
]

export default function FounderSection() {
  return (
    <div className="founder-section" style={{ marginTop: 56, paddingTop: 48, borderTop: `1px solid ${GRAY_200}` }}>
      <div className="founder-layout" style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
        <img className="founder-photo" src="/images/baptiste.png" alt="Baptiste, fondateur de PermisClair" style={{ width: 120, height: 120, minWidth: 120, borderRadius: "50%", objectFit: "cover", objectPosition: "center top" }} />
        <div className="founder-content" style={{ flex: 1 }}>
          <h2 className="founder-name section-title" style={{ fontSize: 28, fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.02em", color: GRAY_900 }}>
            Baptiste, fondateur de PermisClair
          </h2>
          <p style={{ fontSize: 14, color: GRAY_700, lineHeight: 1.7, margin: "0 0 20px" }}>
            Je construis ma propre maison en ossature bois en Vendée. J'ai fait mes plans moi-même sur un logiciel de conception professionnel et déposé mon permis de construire. La mairie l'a refusé. J'ai compris pourquoi, corrigé le dossier, et obtenu l'acceptation. Cette expérience m'a appris exactement ce que les mairies attendent, ce qui bloque un dossier et ce qui le fait passer. J'ai créé PermisClair pour vous éviter ces allers-retours.
          </p>
          <div className="founder-badges" style={{ display: "flex", gap: 16 }}>
            {badges.map((stat, i) => (
              <div key={i} style={{ background: GRAY_50, border: `1px solid ${GRAY_200}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: GRAY_700 }}>
                {stat}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
