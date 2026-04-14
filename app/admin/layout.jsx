'use client'

import { AdminAuthProvider } from './AdminAuthContext'

export default function AdminLayout({ children }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>
}
