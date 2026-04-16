'use client'

import { AdminAuthProvider } from './AdminAuthContext'
import { ui } from '../../lib/ui'

export default function AdminLayout({ children }) {
  return (
    <AdminAuthProvider>
      <div style={{ fontFamily: ui.font.sans }}>
        {children}
      </div>
    </AdminAuthProvider>
  )
}
