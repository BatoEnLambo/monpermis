'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

const HIDDEN_ROUTES = ['/formulaire', '/paiement']

export default function ConditionalFooter() {
  const pathname = usePathname()
  if (HIDDEN_ROUTES.includes(pathname) || pathname.startsWith('/projet')) return null
  return <Footer />
}
