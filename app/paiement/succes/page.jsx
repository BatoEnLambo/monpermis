'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { Suspense } from 'react'

const ACCENT = "#1a5c3a"
const GRAY_500 = "#8a8985"
const GRAY_900 = "#1c1c1a"
const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`

function SuccesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [projectInfo, setProjectInfo] = useState(null)
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    const init = async () => {
      // ── Mode devis ──
      // Le webhook Stripe gère la création du projet.
      // On poll Supabase pour récupérer le project_id dès qu'il est créé.
      const quoteId = searchParams.get('quote_id')
      if (quoteId) {
        setPolling(true)
        let attempts = 0
        const maxAttempts = 20 // 20 x 2s = 40s max

        const poll = async () => {
          const { data: quote } = await supabase
            .from('quotes')
            .select('status, project_id')
            .eq('id', quoteId)
            .single()

          if (quote?.status === 'paid' && quote?.project_id) {
            // Récupérer les infos du projet créé par le webhook
            const { data: project } = await supabase
              .from('projects')
              .select('reference, token')
              .eq('id', quote.project_id)
              .single()

            if (project) {
              setProjectInfo({ reference: project.reference, token: project.token })
              setPolling(false)
              return
            }
          }

          attempts++
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000)
          } else {
            // Timeout — le webhook n'a peut-être pas encore tourné
            setPolling(false)
          }
        }

        poll()
        return
      }

      // ── Mode self-service ──
      // Le webhook Stripe gère le passage à 'paid' et l'envoi d'email.
      // On poll pour vérifier que c'est fait, puis on affiche le lien.
      const projectId = searchParams.get('project_id')
      if (projectId) {
        setPolling(true)
        let attempts = 0
        const maxAttempts = 20

        const poll = async () => {
          const { data: project } = await supabase
            .from('projects')
            .select('reference, token, status')
            .eq('id', projectId)
            .single()

          if (project?.status === 'paid') {
            setProjectInfo({ reference: project.reference, token: project.token })
            setPolling(false)
            return
          }

          attempts++
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000)
          } else {
            // Fallback: afficher quand même si le projet existe
            if (project) {
              setProjectInfo({ reference: project.reference, token: project.token })
            }
            setPolling(false)
          }
        }

        poll()
        return
      }

      // Fallback: localStorage
      const localData = JSON.parse(localStorage.getItem('projectData'))
      if (localData?.reference && localData?.token) {
        setProjectInfo({ reference: localData.reference, token: localData.token })
      }
    }

    init()
  }, [searchParams])

  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: FONT }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em', color: GRAY_900 }}>Paiement confirmé !</h1>
      <p style={{ fontSize: 15, color: GRAY_500, marginBottom: 32, lineHeight: 1.6 }}>
        Votre dossier est en cours de préparation.<br />
        Vous recevrez un email de confirmation sous quelques instants.
      </p>
      {polling && !projectInfo && (
        <p style={{ fontSize: 13, color: GRAY_500, marginBottom: 16 }}>
          Préparation de votre espace client...
        </p>
      )}
      <button
        onClick={() => projectInfo && router.push(`/projet/${projectInfo.reference}?token=${projectInfo.token}`)}
        disabled={!projectInfo}
        style={{
          padding: '12px 32px',
          borderRadius: 10,
          border: 'none',
          background: projectInfo ? ACCENT : '#d1d5db',
          color: projectInfo ? '#fff' : '#9ca3af',
          fontSize: 15,
          fontWeight: 600,
          cursor: projectInfo ? 'pointer' : 'default',
          fontFamily: FONT,
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
