import './globals.css'

export const metadata = {
  title: 'PermisClair — Plans et permis de construire, clé en main',
  description: 'Plans de maison et permis de construire : on s\'occupe de tout. Dossier complet livré en 5 jours ouvrés.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
