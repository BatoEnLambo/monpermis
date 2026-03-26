'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { Suspense } from 'react'

function SuccesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [done, setDone] = useState(false)

  useEffect(() => {
    const projectId = searchParams.get('project_id')
    if (projectId) {
      supabase
        .from('projects')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', projectId)
        .then(() => setDone(true))
    }
  }, [searchParams])

  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Paiement confirmé !</h1>
      <p style={{ fontSize: 15, color: '#666', marginBottom: 32, lineHeight: 1.6 }}>
        Votre dossier est en cours de préparation.<br />
        Vous recevrez un email de confirmation sous peu.
      </p>
      <button
        onClick={() => router.push('/dashboard')}
        style={{
          padding: '12px 32px',
          borderRadius: 10,
          border: 'none',
          background: '#1a5c3a',
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        Accéder à mon espace client →
      </button>
    </div>
  )
}

export default function SuccesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px 20px', textAlign: 'center' }}>Chargement...</div>}>
      <SuccesContent />
    </Suspense>
  )
}
