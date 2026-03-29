import Link from 'next/link'

const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`

export default function GuideCTA({ title, text, price }) {
  return (
    <div className="guide-cta" style={{
      background: '#f0fdf4',
      borderLeft: '4px solid #16a34a',
      borderRadius: 10,
      padding: '20px 24px',
      margin: '28px 0',
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1c1c1a', marginBottom: 6 }}>
        {title}
      </div>
      <p style={{ fontSize: 14, color: '#44433f', lineHeight: 1.6, margin: '0 0 14px' }}>
        {text}
      </p>
      <Link href="/formulaire" style={{
        display: 'inline-block',
        background: '#1a5c3a',
        color: '#ffffff',
        padding: '10px 24px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        textDecoration: 'none',
        fontFamily: FONT,
        transition: 'background 0.15s',
      }}>
        {price ? `Décrire mon projet — Dès ${price}` : 'Décrire mon projet →'}
      </Link>
    </div>
  )
}
