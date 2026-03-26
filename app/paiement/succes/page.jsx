'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { Suspense } from 'react'

function SuccesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [projectInfo, setProjectInfo] = useState(null)

  useEffect(() => {
    const init = async () => {
      const projectId = searchParams.get('project_id')

      if (projectId) {
        // Met à jour le statut en base
        await supabase
          .from('projects')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', projectId)

        // Récupère les données complètes du projet
        const { data: projectData } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (projectData) {
          // Envoie l'email de bienvenue
          await fetch('/api/send-welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: projectData.email,
              firstName: projectData.first_name,
              reference: projectData.reference,
              token: projectData.token,
              projectType: projectData.project_type,
              price: projectData.price,
            }),
          })

          // Stocke les infos pour le bouton
          setProjectInfo({ reference: projectData.reference, token: projectData.token })
          return
        }
      }

      // Fallback: essaie localStorage
      const localData = JSON.parse(localStorage.getItem('projectData'))
      if (localData?.reference && localData?.token) {
        setProjectInfo({ reference: localData.reference, token: localData.token })
      }
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
        onClick={() => projectInfo && router.push(`/projet/${projectInfo.reference}?token=${projectInfo.token}`)}
        disabled={!projectInfo}
        style={{
          padding: '12px 32px',
          borderRadius: 10,
          border: 'none',
          background: projectInfo ? '#1a5c3a' : '#d1d5db',
          color: projectInfo ? '#fff' : '#9ca3af',
          fontSize: 15,
          fontWeight: 600,
          cursor: projectInfo ? 'pointer' : 'default',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {projectInfo ? 'Accéder à mon espace client →' : 'Chargement...'}
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
