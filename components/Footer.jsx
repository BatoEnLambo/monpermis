import Link from 'next/link'
import '../styles/layout.css'

export default function Footer() {
  const links = [
    { label: "Accueil", href: "/" },
    { label: "Tarifs", href: "/#tarifs" },
    { label: "FAQ", href: "/#faq" },
    { label: "Mentions légales", href: "/mentions-legales" },
  ]

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-logo">
          <div className="site-footer-logo-icon">PC</div>
          <span className="site-footer-logo-text">PermisClair</span>
        </div>
        <div className="site-footer-baseline">Plans et permis de construire, clé en main.</div>
        <div className="site-footer-links">
          {links.map((link, i) => (
            <span key={link.label}>
              <Link href={link.href} className="site-footer-link">{link.label}</Link>
              {i < links.length - 1 && <span className="site-footer-separator">·</span>}
            </span>
          ))}
        </div>
        <div className="site-footer-contact">contact@permisclair.fr</div>
        <div className="site-footer-copyright">
          © 2026 PermisClair — <Link href="/mentions-legales">Mentions légales · CGV</Link>
        </div>
      </div>
    </footer>
  )
}
