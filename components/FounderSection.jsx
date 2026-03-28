import '../styles/landing.css'

const GRAY_50 = "#fafaf9"
const GRAY_200 = "#e8e7e4"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"

const badges = [
  "Permis obtenu après refus",
  "Dossiers réalisés sur logiciel pro",
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
            Je construis ma propre maison en Vendée. Quand j'ai déposé mon premier permis de construire, la mairie l'a refusé. Plutôt que d'abandonner, j'ai appris à décrypter ce que les instructeurs attendent vraiment : des plans cotés sans ambiguïté, une notice cohérente, une insertion paysagère soignée et un projet conforme au PLU. Résultat : dossier corrigé, permis accepté. Aujourd'hui, je mets cette expérience à votre service pour que votre dossier passe du premier coup.
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
