import './globals.css'
import Header from '../components/Header'
import ConditionalFooter from '../components/ConditionalFooter'

export const metadata = {
  title: 'PermisClair — Plans et permis de construire, clé en main',
  description: 'Plans de maison et permis de construire : on s\'occupe de tout. Dossier complet livré en 5 jours ouvrés.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-B95LM2E7VZ"></script>
        <script dangerouslySetInnerHTML={{__html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-B95LM2E7VZ');
        `}} />
      </head>
      <body style={{ fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px", flex: 1, width: "100%", boxSizing: "border-box" }}>
          {children}
        </main>
        <ConditionalFooter />
      </body>
    </html>
  )
}
