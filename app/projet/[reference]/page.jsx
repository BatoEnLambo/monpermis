'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const STATUS_STEPS = [
  { key: 'paid', label: 'Paiement reçu', icon: '✓' },
  { key: 'in_progress', label: 'Dossier en cours', icon: '✏️' },
  { key: 'review', label: 'En relecture', icon: '🔍' },
  { key: 'delivered', label: 'Dossier livré', icon: '📦' },
  { key: 'deposited', label: 'Déposé en mairie', icon: '📬' },
  { key: 'accepted', label: 'Permis accepté', icon: '✅' },
]

function getStepIndex(status) {
  const idx = STATUS_STEPS.findIndex(s => s.key === status)
  return idx >= 0 ? idx : 0
}

function ProjetContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadProject = async () => {
      const reference = params.reference
      const urlToken = searchParams.get('token')

      // Essaie d'abord le token dans l'URL
      let token = urlToken

      // Sinon, cherche dans le cookie
      if (!token) {
        const cookies = document.cookie.split(';').map(c => c.trim())
        const found = cookies.find(c => c.startsWith(`pc_${reference}=`))
        if (found) token = found.split('=')[1]
      }

      if (!token) {
        setError('Lien invalide. Vérifiez le lien reçu par email.')
        setLoading(false)
        return
      }

      // Charge le projet depuis Supabase
      const { data, error: dbError } = await supabase
        .from('projects')
        .select('*')
        .eq('reference', reference)
        .eq('token', token)
        .single()

      if (dbError || !data) {
        setError('Projet introuvable. Vérifiez le lien reçu par email.')
        setLoading(false)
        return
      }

      // Sauvegarde le token dans un cookie (expire dans 1 an)
      document.cookie = `pc_${reference}=${token}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`

      setProject(data)
      setLoading(false)
    }

    loadProject()
  }, [params.reference, searchParams])

  if (loading) {
    return <div style={{ padding: '60px 20px', textAlign: 'center', color: '#888' }}>Chargement de votre espace...</div>
  }

  if (error) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Accès refusé</h1>
        <p style={{ color: '#888', fontSize: 14 }}>{error}</p>
      </div>
    )
  }

  const currentStep = getStepIndex(project.status)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* En-tête projet */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: '#1a5c3a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
          {project.reference}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          {project.project_type}
        </h1>
        <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
          {project.address}, {project.postal_code} {project.city} — {project.surface} m²
        </p>
      </div>

      {/* Timeline d'avancement */}
      <div style={{ background: '#fff', border: '1px solid #e8e7e4', borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.01em' }}>Avancement</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STATUS_STEPS.map((step, i) => {
            const isDone = i <= currentStep
            const isCurrent = i === currentStep
            return (
              <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, position: 'relative' }}>
                {/* Ligne verticale */}
                {i < STATUS_STEPS.length - 1 && (
                  <div style={{
                    position: 'absolute', left: 15, top: 32, width: 2, height: 28,
                    background: isDone && i < currentStep ? '#1a5c3a' : '#e8e7e4',
                  }} />
                )}
                {/* Pastille */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                  background: isDone ? '#e8f5ee' : '#f5f4f2',
                  border: isCurrent ? '2px solid #1a5c3a' : '2px solid transparent',
                  color: isDone ? '#1a5c3a' : '#888',
                }}>
                  {isDone ? step.icon : (i + 1)}
                </div>
                {/* Texte */}
                <div style={{ paddingTop: 6, paddingBottom: 20 }}>
                  <div style={{
                    fontSize: 14, fontWeight: isCurrent ? 700 : 500,
                    color: isDone ? '#1c1c1a' : '#888',
                  }}>
                    {step.label}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Infos du projet */}
      <div style={{ background: '#fff', border: '1px solid #e8e7e4', borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.01em' }}>Votre projet</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 14 }}>
          <div><span style={{ color: '#888' }}>Type : </span>{project.project_type}</div>
          <div><span style={{ color: '#888' }}>Surface : </span>{project.surface} m²</div>
          <div><span style={{ color: '#888' }}>Niveaux : </span>{project.floors}</div>
          <div><span style={{ color: '#888' }}>Chambres : </span>{project.rooms}</div>
          <div><span style={{ color: '#888' }}>Toiture : </span>{project.roof_type || '-'}</div>
          <div><span style={{ color: '#888' }}>Style : </span>{project.style || '-'}</div>
        </div>
        {project.description && (
          <div style={{ marginTop: 12, fontSize: 14 }}>
            <span style={{ color: '#888' }}>Description : </span>{project.description}
          </div>
        )}
      </div>

      {/* Contact */}
      <div style={{ background: '#fff', border: '1px solid #e8e7e4', borderRadius: 14, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em' }}>Une question ?</h2>
        <p style={{ fontSize: 14, color: '#888', margin: 0, lineHeight: 1.6 }}>
          Contactez-nous à <a href="mailto:contact@permisclair.fr" style={{ color: '#1a5c3a', fontWeight: 600 }}>contact@permisclair.fr</a> en précisant votre référence {project.reference}.
        </p>
      </div>
    </div>
  )
}

export default function ProjetPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px 20px', textAlign: 'center' }}>Chargement...</div>}>
      <ProjetContent />
    </Suspense>
  )
}
