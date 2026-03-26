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
  const [magicLink, setMagicLink] = useState(null)

  useEffect(() => {
    const init = async () => {
      const projectId = searchParams.get('project_id')

      if (projectId) {
        await supabase
          .from('projects')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', projectId)
      }

      // Try localStorage first
      const projectData = JSON.parse(localStorage.getItem('projectData'))
      if (projectData?.reference && projectData?.token) {
        setMagicLink(`/projet/${projectData.reference}?token=${projectData.token}`)
        setDone(true)
        return
      }

      // Fallback: fetch from Supabase
      if (projectId) {
        const { data } = await supabase
          .from('projects')
          .select('reference, token')
          .eq('id', projectId)
          .single()
        if (data?.reference && data?.token) {
          setMagicLink(`/projet/${data.reference}?token=${data.token}`)
        }
      }

      setDone(true)
    }

    init()
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
        onClick={() => router.push(magicLink || '/dashboard')}
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
