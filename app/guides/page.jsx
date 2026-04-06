import Link from 'next/link'
import { getAllGuides } from '../../content/guides'
import '../../styles/guide.css'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const GRAY_100 = "#f5f4f2"
const GRAY_200 = "#e8e7e4"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"

export const metadata = {
  title: 'Guides pratiques | PermisClair',
  description: 'Guides complets pour vos projets de construction : extension, piscine, garage, maison neuve. Démarches, plans, prix et conseils pratiques.',
  openGraph: {
    title: 'Guides pratiques | PermisClair',
    description: 'Guides complets pour vos projets de construction : extension, piscine, garage, maison neuve. Démarches, plans, prix et conseils pratiques.',
    type: 'website',
    url: 'https://www.permisclair.fr/guides',
  },
}

// Ordre des articles dans chaque section (piliers / gros volumes en premier)
const SECTION_ORDER = {
  extension: [
    'extension-maison',
    'extension-maison-prix',
    'plan-extension-maison',
    'extension-40m2-sans-permis',
  ],
  demarches: [
    'declaration-prealable-travaux',
    'faire-ses-plans-maison',
    'permis-construire-refuse',
    'plan-de-masse',
    'plan-de-coupe',
    'plan-de-situation',
    'emprise-au-sol-surface-de-plancher',
    'cerfa-declaration-prealable',
    'etude-re2020-permis-construire',
    'prix-permis-construire',
    'dessinateur-en-batiment',
  ],
  projets: [
    'piscine-declaration-prealable',
    'plan-garage',
  ],
}

const SECTIONS = [
  {
    key: 'extension',
    title: 'Agrandir votre maison',
    subtitle: 'Extension, surélévation, véranda : tout ce qu\'il faut savoir avant de lancer vos travaux.',
    categories: ['Extension'],
  },
  {
    key: 'demarches',
    title: 'Les démarches administratives',
    subtitle: 'Plans, formulaires, calculs de surface : le guide pour monter un dossier solide.',
    categories: ['Démarches'],
  },
  {
    key: 'projets',
    title: 'Piscine, garage et autres projets',
    subtitle: 'Déclaration préalable, plans à fournir et pièges à éviter pour chaque type de projet.',
    categories: ['Piscine', 'Garage'],
  },
]

function GuideCard({ guide }) {
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="guide-card"
      style={{
        background: WHITE,
        border: `1px solid ${GRAY_200}`,
        borderRadius: 12,
        padding: 20,
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: ACCENT,
          background: ACCENT_LIGHT,
          padding: '3px 8px',
          borderRadius: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}>
          {guide.category}
        </span>
        {guide.readingTime && (
          <span style={{ fontSize: 12, color: GRAY_500 }}>{guide.readingTime}</span>
        )}
      </div>
      <div className="guide-card-title" style={{ fontSize: 16, fontWeight: 700, color: GRAY_900, marginBottom: 6, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
        {guide.title}
      </div>
      <p className="guide-card-desc" style={{
        fontSize: 13,
        color: GRAY_700,
        lineHeight: 1.5,
        margin: 0,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {guide.description}
      </p>
    </Link>
  )
}

export default function GuidesPage() {
  const allGuides = getAllGuides()

  return (
    <div className="guides-index">
      <header style={{ marginBottom: 40 }}>
        <h1 className="guides-index-h1" style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em', color: GRAY_900, lineHeight: 1.2 }}>
          Guides pratiques pour vos projets de construction
        </h1>
        <p style={{ fontSize: 15, color: GRAY_500, margin: 0, lineHeight: 1.6 }}>
          Tout comprendre avant de se lancer : démarches, plans, prix, erreurs à éviter.
        </p>
      </header>

      {SECTIONS.map((section, i) => {
        const order = SECTION_ORDER[section.key] || []
        const sectionGuides = order
          .map(slug => allGuides.find(g => g.slug === slug))
          .filter(Boolean)
        // Ajouter les articles de la catégorie qui ne seraient pas dans l'ordre explicite
        const remaining = allGuides.filter(
          g => section.categories.includes(g.category) && !order.includes(g.slug)
        )
        const guides = [...sectionGuides, ...remaining]

        if (guides.length === 0) return null

        return (
          <section key={section.key} style={{ marginTop: i === 0 ? 0 : 48 }}>
            <h2 className="guides-section-title" style={{
              fontSize: 22,
              fontWeight: 700,
              color: GRAY_900,
              margin: '0 0 6px',
              letterSpacing: '-0.02em',
            }}>
              {section.title}
            </h2>
            <p className="guides-section-subtitle" style={{
              fontSize: 14,
              color: GRAY_500,
              margin: '0 0 20px',
              lineHeight: 1.5,
            }}>
              {section.subtitle}
            </p>
            <div className="guides-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {guides.map(guide => (
                <GuideCard key={guide.slug} guide={guide} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
