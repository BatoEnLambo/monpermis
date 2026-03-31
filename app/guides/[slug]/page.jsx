import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getGuideBySlug, getAllGuides } from '../../../content/guides'
import TableOfContents from '../../../components/TableOfContents'
import '../../../styles/guide.css'

const ACCENT = "#1a5c3a"
const GRAY_200 = "#e8e7e4"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function parseTableOfContents(html) {
  const items = []
  const processedHtml = html.replace(/<h2>(.*?)<\/h2>/gi, (_, text) => {
    const id = slugify(text)
    items.push({ id, text })
    return `<h2 id="${id}">${text}</h2>`
  })
  return { items, html: processedHtml }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const guide = getGuideBySlug(slug)
  if (!guide) return {}

  const url = `https://www.permisclair.fr/guides/${guide.slug}`

  return {
    title: `${guide.title} — PermisClair`,
    description: guide.description,
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: 'article',
      url,
      ...(guide.image && { images: [guide.image] }),
    },
  }
}

export default async function GuidePage({ params }) {
  const { slug } = await params
  const guide = getGuideBySlug(slug)

  if (!guide) notFound()

  const { items: tocItems, html: contentHtml } = parseTableOfContents(guide.content)
  const url = `https://www.permisclair.fr/guides/${guide.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt || guide.publishedAt,
    url,
    author: {
      '@type': 'Person',
      name: 'Baptiste Dubreil',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PermisClair',
      url: 'https://www.permisclair.fr',
    },
  }

  return (
    <div className="guide-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="guide-breadcrumb" style={{ fontSize: 13, color: GRAY_500, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: ACCENT, textDecoration: 'none' }}>Accueil</Link>
        <span style={{ color: GRAY_500 }}>›</span>
        <Link href="/guides" style={{ color: ACCENT, textDecoration: 'none' }}>Guides</Link>
        <span style={{ color: GRAY_500 }}>›</span>
        <span style={{ color: GRAY_700 }}>{guide.title}</span>
      </nav>

      <header style={{ marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${GRAY_200}` }}>
        <h1 className="guide-h1" style={{ fontSize: 32, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em', color: GRAY_900, lineHeight: 1.2 }}>
          {guide.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: GRAY_500 }}>
          <time dateTime={guide.publishedAt}>{formatDate(guide.publishedAt)}</time>
          {guide.readingTime && (
            <>
              <span>·</span>
              <span>{guide.readingTime} de lecture</span>
            </>
          )}
        </div>
      </header>

      <TableOfContents items={tocItems} />

      <article
        className="guide-content"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  )
}
