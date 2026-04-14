'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { generateToken } from '../../../lib/token'
import { Suspense } from 'react'

function SuccesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [projectInfo, setProjectInfo] = useState(null)

  useEffect(() => {
    const init = async () => {
      // ── Mode devis ──
      const quoteId = searchParams.get('quote_id')
      if (quoteId) {
        // Fetch le devis
        const { data: quote } = await supabase
          .from('quotes')
          .select('*')
          .eq('id', quoteId)
          .single()

        if (!quote || quote.status === 'paid') {
          // Déjà traité ou invalide
          return
        }

        // Créer le projet
        const reference = 'PC-' + Date.now().toString(36).toUpperCase()
        const token = generateToken()
        const nameParts = (quote.client_name || '').split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        const { data: project } = await supabase
          .from('projects')
          .insert({
            reference,
            token,
            project_type: 'custom',
            first_name: firstName,
            last_name: lastName,
            email: quote.client_email,
            price: quote.amount,
            status: 'paid',
            paid_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (project) {
          // Lier le projet au devis et marquer payé
          await supabase
            .from('quotes')
            .update({ status: 'paid', paid_at: new Date().toISOString(), project_id: project.id })
            .eq('id', quoteId)

          // Email de bienvenue
          await fetch('/api/send-welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: quote.client_email,
              firstName,
              reference,
              token,
              projectType: quote.project_title,
              price: quote.amount,
              options: [],
            }),
          })

          setProjectInfo({ reference, token })
        }
        return
      }

      // ── Mode self-service ──
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
              options: projectData.options || [],
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
