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
    url: 'https://permisclair.fr/guides',
  },
}

export default function GuidesPage() {
  const guides = getAllGuides()

  return (
    <div className="guides-index">
      <header style={{ marginBottom: 36 }}>
        <h1 className="guides-index-h1" style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em', color: GRAY_900, lineHeight: 1.2 }}>
          Guides pratiques pour vos projets de construction
        </h1>
        <p style={{ fontSize: 15, color: GRAY_500, margin: 0, lineHeight: 1.6 }}>
          Tout comprendre avant de se lancer : démarches, plans, prix, erreurs à éviter.
        </p>
      </header>

      <div className="guides-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {guides.map((guide) => (
          <Link
            key={guide.slug}
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
        ))}
      </div>

      {guides.length === 0 && (
        <p style={{ fontSize: 14, color: GRAY_500, textAlign: 'center', marginTop: 40 }}>
          Les guides arrivent bientôt.
        </p>
      )}
    </div>
  )
}
