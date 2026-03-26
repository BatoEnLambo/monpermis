import './globals.css'
import Header from '../components/Header'
import ConditionalFooter from '../components/ConditionalFooter'

export const metadata = {
  title: 'PermisClair — Plans et permis de construire, clé en main',
  description: 'Plans de maison et permis de construire : on s\'occupe de tout. Dossier complet livré en 5 jours ouvrés.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" }}>
        <Header />
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px", flex: 1, width: "100%", boxSizing: "border-box" }}>
          {children}
        </main>
        <ConditionalFooter />
      </body>
    </html>
  )
}
