'use client'

import { useState } from 'react'
import '../styles/landing.css'

const GRAY_200 = "#e8e7e4"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const GRAY_100 = "#f5f4f2"
const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`

const items = [
  {
    q: "Est-ce légal de ne pas passer par un architecte ?",
    a: "Oui. Pour toute construction de moins de 150 m² de surface de plancher, le recours à un architecte n'est pas obligatoire (article R.431-2 du Code de l'urbanisme). Vous pouvez faire appel à un dessinateur ou réaliser vos plans vous-même.",
  },
  {
    q: "Que se passe-t-il si la mairie refuse mon dossier ?",
    a: "C'est inclus. On analyse le motif de refus, on corrige le dossier et vous redéposez. Sans frais supplémentaires, jusqu'à acceptation.",
  },
  {
    q: "Combien de temps pour recevoir mon dossier ?",
    a: "En moyenne 5 jours ouvrés après réception de vos informations et photos. Les déclarations préalables simples peuvent être encore plus rapides.",
  },
  {
    q: "Qu'est-ce qui est inclus exactement ?",
    a: "Tout ce dont la mairie a besoin : plan de situation, plan de masse coté, plan en coupe, notice descriptive, plans de façades, insertion paysagère, photos, CERFA rempli, et le dossier complet assemblé en PDF prêt à déposer.",
  },
  {
    q: "Qui réalise les plans ?",
    a: "Les plans sont réalisés sur SketchUp par Baptiste, fondateur de PermisClair. Chaque dossier est vérifié pour sa conformité au PLU de votre commune avant envoi.",
  },
]

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <div id="faq" className="faq-section" style={{ marginTop: 56, background: GRAY_100, borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
      <h2 className="section-title" style={{ fontSize: 24, fontWeight: 700, margin: "0 0 32px", letterSpacing: "-0.02em", color: GRAY_900 }}>
        Questions fréquentes
      </h2>
      <div style={{ textAlign: "left" }}>
        {items.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div key={i} style={{ borderBottom: `1px solid ${GRAY_200}` }}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                style={{
                  width: "100%", padding: "16px 0", background: "none", border: "none",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  cursor: "pointer", fontFamily: FONT,
                }}>
                <span className="faq-question" style={{ fontSize: 14, fontWeight: 600, color: GRAY_900, textAlign: "left" }}>{item.q}</span>
                <span style={{ fontSize: 18, color: GRAY_500, transform: isOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s", minWidth: 20 }}>+</span>
              </button>
              {isOpen && (
                <div style={{ padding: "0 0 16px", fontSize: 13, color: GRAY_700, lineHeight: 1.7 }}>
                  {item.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
