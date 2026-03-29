import Link from 'next/link'
import { getAllGuides } from '../content/guides'
import '../styles/landing.css'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const GRAY_100 = "#f5f4f2"
const GRAY_200 = "#e8e7e4"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"

export default function GuidesSection() {
  const guides = getAllGuides().slice(0, 3)

  if (guides.length === 0) return null

  return (
    <div className="guides-section" style={{ background: GRAY_100, borderRadius: 16, padding: '48px 24px', marginTop: 56, textAlign: 'center' }}>
      <h2 className="section-title" style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em', color: GRAY_900 }}>
        Guides pratiques
      </h2>
      <p style={{ fontSize: 15, color: GRAY_500, margin: '0 0 28px' }}>
        Tout comprendre avant de se lancer
      </p>

      <div className="guides-section-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, textAlign: 'left' }}>
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="guides-section-card"
            style={{
              background: WHITE,
              border: `1px solid ${GRAY_200}`,
              borderRadius: 12,
              padding: 18,
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
          >
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: ACCENT,
              background: ACCENT_LIGHT,
              padding: '2px 7px',
              borderRadius: 5,
              alignSelf: 'flex-start',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}>
              {guide.category}
            </span>
            <div style={{ fontSize: 14, fontWeight: 700, color: GRAY_900, marginBottom: 6, lineHeight: 1.3 }}>
              {guide.title}
            </div>
            <p style={{
              fontSize: 12,
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

      <div style={{ marginTop: 24 }}>
        <Link href="/guides" style={{ fontSize: 14, fontWeight: 600, color: ACCENT, textDecoration: 'none' }}>
          Voir tous les guides →
        </Link>
      </div>
    </div>
  )
}
