import Link from 'next/link'
import '../styles/layout.css'

export default function Header() {
  return (
    <nav className="site-header">
      <Link href="/" className="site-header-logo">
        <div className="site-header-logo-icon">PC</div>
        <span className="site-header-logo-text">PermisClair</span>
      </Link>
    </nav>
  )
}
