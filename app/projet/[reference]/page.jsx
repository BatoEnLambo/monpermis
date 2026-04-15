'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getDocuments } from '../../../lib/storage'
import { getMessages, sendMessage } from '../../../lib/messages'
import TerrainDetailsForm from '../../../components/TerrainDetailsForm'
import TerrainPhotosUpload from '../../../components/TerrainPhotosUpload'
import CoordonneesCerfaForm from '../../../components/CoordonneesCerfaForm'
import OuvragesSection from '../../../components/OuvragesSection'
import { computeOuvragesGlobalProgress } from '../../../src/config/ouvrageTypes'
import '../../../styles/dashboard.css'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const GRAY_50 = "#fafaf9"
const GRAY_100 = "#f5f4f2"
const GRAY_200 = "#e8e7e4"
const GRAY_300 = "#d4d3d0"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"

const TIMELINE_STEPS = [
  { id: "paid", label: "Paiement reçu", desc: "Votre paiement a bien été enregistré" },
  { id: "info", label: "Vos informations", descActive: "Remplissez votre fiche technique ci-dessous", descDone: "Fiche technique complète !" },
  { id: "plans", label: "Plans en cours", desc: "Nous réalisons vos plans et votre dossier", descWaiting: "En attente de votre fiche technique" },
  { id: "review", label: "Votre relecture", desc: "Vérifiez vos plans avant finalisation" },
  { id: "delivered", label: "Dossier livré", desc: "Votre dossier complet est prêt" },
]

function getTimelineStates(status, ficheComplete) {
  // Map project status to step states
  // Status flow: paid → in_progress → review → delivered
  const statusOrder = ['paid', 'in_progress', 'review', 'delivered']
  const statusIdx = statusOrder.indexOf(status)

  return TIMELINE_STEPS.map((step, i) => {
    if (i === 0) {
      // Step 1: Paiement — always done
      return 'done'
    }
    if (i === 1) {
      // Step 2: Vos informations — linked to completion_percentage
      return ficheComplete ? 'done' : 'active'
    }
    if (i === 2) {
      // Step 3: Plans en cours
      if (statusIdx >= 2) return 'done' // review or delivered
      if (statusIdx >= 1 && ficheComplete) return 'active' // in_progress + fiche complete
      return 'future' // waiting
    }
    if (i === 3) {
      // Step 4: Votre relecture
      if (statusIdx >= 3) return 'done' // delivered
      if (statusIdx >= 2) return 'active' // review
      return 'future'
    }
    if (i === 4) {
      // Step 5: Dossier livré
      if (statusIdx >= 3) return 'active' // delivered
      return 'future'
    }
    return 'future'
  })
}

function ProjetContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [documents, setDocuments] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  // Fiche technique
  const [details, setDetails] = useState(null)
  const [photoCount, setPhotoCount] = useState(0)
  const [saved, setSaved] = useState(false)
  const [ouvrages, setOuvrages] = useState([])
  const [token, setToken] = useState(null)
  const debounceRef = useRef({})

  const fetchOuvrages = useCallback(async () => {
    if (!project?.reference || !token) return
    try {
      const res = await fetch(`/api/projet/${project.reference}/ouvrages?token=${token}`)
      if (res.ok) {
        const json = await res.json()
        setOuvrages(json.ouvrages || [])
      }
    } catch (err) {
      console.error('Fetch ouvrages error:', err)
    }
  }, [project?.reference, token])

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
      setToken(token)
      setLoading(false)
    }

    loadProject()
  }, [params.reference, searchParams])

  // Charge les ouvrages dès que project + token sont dispos
  useEffect(() => {
    if (project?.id && token) fetchOuvrages()
  }, [project?.id, token, fetchOuvrages])

  // Charge les documents quand le projet est chargé
  useEffect(() => {
    if (project?.id) {
      getDocuments(project.id).then(docs => setDocuments(docs))
    }
  }, [project])

  // Charge les messages et rafraîchit toutes les 10 secondes
  useEffect(() => {
    if (!project?.id) return
    const loadMessages = () => getMessages(project.id).then(msgs => setMessages(msgs))
    loadMessages()
    const interval = setInterval(loadMessages, 10000)
    return () => clearInterval(interval)
  }, [project])

  // Charge les project_details dès que le project est payé, quel que soit project_type.
  // Le système d'ouvrages (prompts 1/2) est universel et couvre 99% des cas DP/PC,
  // donc tous les projets self-service comme custom ont droit à la fiche technique.
  const showFicheTechnique = !!project && project.status !== 'pending'
  useEffect(() => {
    if (!project?.id || !showFicheTechnique) return
    const loadDetails = async () => {
      const { data, error } = await supabase
        .from('project_details')
        .select('*')
        .eq('project_id', project.id)
        .single()
      if (data) {
        setDetails(data)
      } else {
        // Créer le row s'il n'existe pas
        const { data: newRow } = await supabase
          .from('project_details')
          .insert({ project_id: project.id })
          .select()
          .single()
        if (newRow) setDetails(newRow)
      }
    }
    loadDetails()
  }, [project])

  const handleFieldUpdate = useCallback((field, value) => {
    setDetails(prev => ({ ...prev, [field]: value }))

    // Debounce la sauvegarde
    if (debounceRef.current[field]) clearTimeout(debounceRef.current[field])
    debounceRef.current[field] = setTimeout(async () => {
      const { error } = await supabase
        .from('project_details')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('project_id', project.id)
      if (!error) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    }, 500)
  }, [project?.id])

  // Calcul progression fiche technique
  // Section 1 (8 pts) : coordonnées
  // Section 2 (10 pts) : moyenne pondérée de la progression de chaque ouvrage
  // Section 3 (10 pts) : terrain 5 + photos 5
  // Total : 28 points
  const computeProgress = useCallback(() => {
    if (!details) return 0
    const d = details
    let count = 0
    // Coordonnées (8)
    if (d.client_civilite) count++
    if (d.client_nom) count++
    if (d.client_prenom) count++
    if (d.client_date_naissance) count++
    if (d.client_commune_naissance) count++
    if (d.client_departement_naissance) count++
    if (d.client_telephone) count++
    if (d.client_email) count++
    // Ouvrages (10 pts proportionnels à la complétion moyenne)
    const ouvragesRatio = computeOuvragesGlobalProgress(ouvrages) // 0..1
    count += ouvragesRatio * 10
    // Terrain (5)
    if (d.parcelle_nsp || d.parcelle_section || d.parcelle_numero) count++
    if (d.constructions_existantes === false) {
      count++
    } else if (d.constructions_existantes === true) {
      try {
        const liste = JSON.parse(d.constructions_existantes_liste || '[]')
        if (Array.isArray(liste) && liste.some(item => item.nom)) count++
      } catch { if (d.constructions_existantes_liste) count++ }
    }
    if (d.implantation_description) count++
    if (d.assainissement) count++
    if (d.raccordement_eau || d.raccordement_electricite || d.raccordement_gaz || d.raccordement_fibre || d.raccordement_aucun) count++
    // Photos (cap à 5)
    count += Math.min(photoCount, 5)
    return Math.round((count / 28) * 100)
  }, [details, photoCount, ouvrages])

  // Sauvegarde du pourcentage en DB pour l'admin et les relances
  const progressSaveRef = useRef(null)
  const progress = computeProgress()
  useEffect(() => {
    if (!project?.id || progress === undefined || progress === null) return
    if (progressSaveRef.current) clearTimeout(progressSaveRef.current)
    progressSaveRef.current = setTimeout(async () => {
      console.log('[PermisClair] Saving completion_percentage:', progress, 'for project:', project.id)
      const { error } = await supabase
        .from('project_details')
        .update({ completion_percentage: progress })
        .eq('project_id', project.id)
      if (error) console.error('[PermisClair] completion_percentage save error:', error)
    }, 2000)
  }, [progress, project?.id])

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

  const adminDocs = documents.filter(d => d.uploaded_by === 'admin')

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    setSendingMessage(true)
    try {
      await sendMessage(project.id, 'client', newMessage.trim())
      setNewMessage('')
      const msgs = await getMessages(project.id)
      setMessages(msgs)
    } catch (err) {
      console.error('Error sending message:', err)
    }
    setSendingMessage(false)
  }

  return (
    <div className="page-dashboard">
      {/* 1. Titre + référence */}
      <div className="dash-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          {(() => {
            // Priorité : title (devis custom) > project_type (self-service)
            // > "Votre projet" (cas extrême : ni l'un ni l'autre, ou
            // project_type brut = 'custom' sans title rempli).
            const rawTitle =
              (project.title && project.title.trim()) ||
              (project.project_type && project.project_type !== 'custom'
                ? project.project_type
                : null) ||
              'Votre projet'

            // Sous-titre : composer uniquement avec ce qui existe.
            // - address seule → "899 Rue Maréchal Leclerc"
            // - postal+city seuls → "59310 Landas"
            // - les trois → "899 Rue Maréchal Leclerc, 59310 Landas"
            // - surface > 0 → rajoutée en fin avec " · "
            // - si tout est null → pas de sous-titre du tout
            const addressPart = project.address?.trim() || ''
            const cityPart = [project.postal_code, project.city]
              .filter(Boolean)
              .map((s) => String(s).trim())
              .filter(Boolean)
              .join(' ')

            const addrLine = [addressPart, cityPart]
              .filter(Boolean)
              .join(', ')

            const subtitleParts = []
            if (addrLine) subtitleParts.push(addrLine)
            if (project.surface && Number(project.surface) > 0) {
              subtitleParts.push(`${project.surface} m²`)
            }
            const subtitle = subtitleParts.join(' · ')

            return (
              <>
                <h1 className="dash-title" style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
                  {rawTitle}
                </h1>
                {subtitle && (
                  <p className="dash-address" style={{ fontSize: 14, color: GRAY_500, margin: 0 }}>
                    {subtitle}
                  </p>
                )}
              </>
            )
          })()}
        </div>
        <div className="dash-id" style={{ background: ACCENT_LIGHT, color: ACCENT, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 6 }}>
          {project.reference}
        </div>
      </div>

      {/* 2. Timeline avancement */}
      {(() => {
        const ficheComplete = details ? computeProgress() === 100 : false
        const states = getTimelineStates(project.status, ficheComplete)
        return (
          <div className="dash-progress" style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 20px", color: GRAY_900 }}>Avancement du dossier</h3>
            <div style={{ position: "relative" }}>
              {TIMELINE_STEPS.map((step, i) => {
                const state = states[i]
                const isDone = state === 'done'
                const isActive = state === 'active'
                const isFuture = state === 'future'

                // Determine description text
                let desc = step.desc || ''
                if (step.id === 'info') {
                  desc = isDone ? step.descDone : step.descActive
                } else if (step.id === 'plans' && isFuture && !ficheComplete && ['in_progress', 'review', 'delivered'].includes(project.status) === false) {
                  desc = step.descWaiting
                } else if (step.id === 'plans' && isFuture && !ficheComplete) {
                  desc = step.descWaiting
                }

                return (
                  <div key={step.id} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 24 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: isDone ? ACCENT : isActive ? ACCENT : GRAY_200,
                        border: isActive ? `3px solid ${ACCENT_LIGHT}` : "none",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.3s",
                        boxShadow: isActive ? `0 0 0 3px ${ACCENT}33` : "none",
                      }}>
                        {isDone && <span style={{ color: WHITE, fontSize: 12 }}>✓</span>}
                        {isActive && <div style={{ width: 8, height: 8, borderRadius: "50%", background: WHITE }} />}
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div style={{ width: 2, height: 32, background: isDone ? ACCENT : GRAY_200, transition: "background 0.3s" }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: i < TIMELINE_STEPS.length - 1 ? 14 : 0, paddingTop: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: isActive ? 600 : 500, color: isFuture ? GRAY_500 : GRAY_900 }}>
                        {step.label}
                      </div>
                      {(isActive || isDone) && (
                        <div style={{ fontSize: 12, color: GRAY_500, marginTop: 2 }}>{desc}</div>
                      )}
                      {isFuture && step.id === 'plans' && !ficheComplete && (
                        <div style={{ fontSize: 12, color: GRAY_500, marginTop: 2, fontStyle: 'italic' }}>{step.descWaiting}</div>
                      )}
                      {step.id === 'delivered' && (isDone || isActive) && (
                        adminDocs.length > 0 ? (
                          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {adminDocs.map((doc) => (
                              <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                                  background: ACCENT, color: WHITE, borderRadius: 8, textDecoration: 'none',
                                  fontSize: 13, fontWeight: 600, width: 'fit-content',
                                }}>
                                📦 Télécharger votre dossier
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: GRAY_500, marginTop: 6, fontStyle: 'italic' }}>Votre dossier sera disponible ici</div>
                        )
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 13, color: GRAY_500, fontStyle: "italic", margin: "16px 0 0" }}>Si la mairie demande des modifications après votre dépôt, on corrige et on vous renvoie le dossier gratuitement.</p>
          </div>
        )
      })()}

      {/* Fiche technique — Maison neuve + devis custom */}
      {showFicheTechnique && details && (() => {
        const progress = computeProgress()
        return (
          <>
            {/* Barre de progression globale — sticky */}
            {(() => {
              const d = details
              // ① Vos informations (8)
              let infoCount = 0
              if (d.client_civilite) infoCount++
              if (d.client_nom) infoCount++
              if (d.client_prenom) infoCount++
              if (d.client_date_naissance) infoCount++
              if (d.client_commune_naissance) infoCount++
              if (d.client_departement_naissance) infoCount++
              if (d.client_telephone) infoCount++
              if (d.client_email) infoCount++
              // ② Vos ouvrages — pourcentage moyen de complétion
              const ouvragesList = ouvrages || []
              const ouvragesPct = Math.round(computeOuvragesGlobalProgress(ouvragesList) * 100)
              // ③ Votre terrain (10 = terrain 5 + photos 5)
              let terrainCount = 0
              if (d.parcelle_nsp || d.parcelle_section || d.parcelle_numero) terrainCount++
              if (d.constructions_existantes === false) { terrainCount++ }
              else if (d.constructions_existantes === true) {
                try {
                  const liste = JSON.parse(d.constructions_existantes_liste || '[]')
                  if (Array.isArray(liste) && liste.some(item => item.nom)) terrainCount++
                } catch { if (d.constructions_existantes_liste) terrainCount++ }
              }
              if (d.implantation_description) terrainCount++
              if (d.assainissement) terrainCount++
              if (d.raccordement_eau || d.raccordement_electricite || d.raccordement_gaz || d.raccordement_fibre || d.raccordement_aucun) terrainCount++
              terrainCount += Math.min(photoCount, 5)

              const badgeStyle = (filled, max) => {
                const s = filled === max ? 'complete' : filled > 0 ? 'partial' : 'empty'
                return {
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                  background: s === 'complete' ? '#e6f4ea' : s === 'partial' ? '#fff3e0' : '#f0f0f0',
                  color: s === 'complete' ? '#1a5c3a' : s === 'partial' ? '#e65100' : '#888',
                }
              }

              return (
                <div className="dash-progress-sticky" style={{
                  background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20,
                  position: 'sticky', top: 56, zIndex: 50,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}>
                  {saved && (
                    <span style={{ position: 'absolute', top: 16, right: 20, fontSize: 13, color: ACCENT, fontWeight: 500 }}>
                      Sauvegardé ✓
                    </span>
                  )}
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px', color: GRAY_900, letterSpacing: '-0.02em' }}>
                    Votre fiche technique : {progress}% complète
                  </h3>
                  <div style={{ background: GRAY_200, borderRadius: 6, height: 10, overflow: 'hidden' }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: progress === 100 ? '#16a34a' : ACCENT,
                      borderRadius: 6,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  {progress < 100 && (
                    <p style={{ fontSize: 12, color: GRAY_500, margin: '10px 0 0' }}>
                      {progress < 10
                        ? 'Ce formulaire nous permet de démarrer vos plans sans vous déranger ensuite. 10 minutes maintenant, zéro aller-retour.'
                        : 'Complétez ces informations pour que nous puissions réaliser vos plans.'}
                    </p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    <span style={badgeStyle(infoCount, 8)}><strong>①</strong> Vos informations {infoCount}/8</span>
                    <span style={badgeStyle(ouvragesPct, 100)}><strong>②</strong> Vos ouvrages {ouvragesList.length} · {ouvragesPct}%</span>
                    <span style={badgeStyle(terrainCount, 10)}><strong>③</strong> Votre terrain {terrainCount}/10</span>
                  </div>
                </div>
              )
            })()}

            {progress === 100 && (
              <div style={{ background: '#e6f4ea', border: '1px solid #1a5c3a44', borderRadius: 14, padding: 24, marginBottom: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a5c3a', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  Votre fiche technique est complète !
                </h3>
                <p style={{ fontSize: 14, color: GRAY_700, margin: 0, lineHeight: 1.6 }}>
                  Merci ! Nous avons toutes les informations nécessaires pour démarrer la réalisation de vos plans. Vous recevrez votre dossier complet sous 5 jours ouvrés. On vous tient au courant par email à chaque étape.
                </p>
              </div>
            )}

            {/* Bloc ① Vos informations */}
            <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a472a', color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>1</div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: GRAY_900, margin: 0, letterSpacing: '-0.02em' }}>Vos informations</h3>
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: GRAY_500 }}>
                  {[details.client_civilite, details.client_nom, details.client_prenom, details.client_date_naissance, details.client_commune_naissance, details.client_departement_naissance, details.client_telephone, details.client_email].filter(Boolean).length}/8 remplis
                </span>
              </div>
              <CoordonneesCerfaForm details={details} onFieldUpdate={handleFieldUpdate} />
            </div>

            {/* Bloc ② Vos ouvrages */}
            <OuvragesSection
              reference={project.reference}
              token={token}
              projectId={project.id}
              ouvrages={ouvrages}
              onChange={fetchOuvrages}
            />

            {/* Bloc ③ Votre terrain */}
            {(() => {
              const d = details
              let tCount = 0
              if (d.parcelle_nsp || d.parcelle_section || d.parcelle_numero) tCount++
              if (d.constructions_existantes === false) { tCount++ }
              else if (d.constructions_existantes === true) {
                try {
                  const liste = JSON.parse(d.constructions_existantes_liste || '[]')
                  if (Array.isArray(liste) && liste.some(item => item.nom)) tCount++
                } catch { if (d.constructions_existantes_liste) tCount++ }
              }
              if (d.implantation_description) tCount++
              if (d.assainissement) tCount++
              if (d.raccordement_eau || d.raccordement_electricite || d.raccordement_gaz || d.raccordement_fibre || d.raccordement_aucun) tCount++
              tCount += photoCount
              return (
                <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a472a', color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>3</div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: GRAY_900, margin: 0, letterSpacing: '-0.02em' }}>Votre terrain</h3>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: GRAY_500 }}>{tCount}/10 remplis</span>
                  </div>

                  <TerrainDetailsForm data={details} onFieldUpdate={handleFieldUpdate} />

                  <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '24px 0' }} />
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>Photos de votre terrain</div>
                  <TerrainPhotosUpload projectId={project.id} onPhotoCountChange={setPhotoCount} />
                </div>
              )
            })()}
          </>
        )
      })()}


      {/* 7. Chat flottant */}
      <div
        onClick={() => setChatOpen(!chatOpen)}
        style={{
          position: 'fixed', bottom: 24, right: 24, width: 56, height: 56,
          borderRadius: '50%', background: ACCENT, color: WHITE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 1000, fontSize: 24, transition: 'transform 0.2s',
          transform: chatOpen ? 'rotate(45deg)' : 'none',
        }}
      >
        {chatOpen ? '✕' : '💬'}
      </div>

      {chatOpen && (
        <div className="chat-popup" style={{
          position: 'fixed', bottom: 92, right: 24, width: 360, maxHeight: 480,
          background: WHITE, borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 999,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: `1px solid ${GRAY_200}`,
        }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${GRAY_200}`, background: ACCENT }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: WHITE }}>PermisClair</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>On répond en quelques heures</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320 }}>
            {messages.length === 0 ? (
              <p style={{ fontSize: 14, color: GRAY_500, textAlign: 'center', padding: '20px 0' }}>
                Une question sur votre dossier ? Écrivez-nous ici.
              </p>
            ) : (
              messages.map(msg => (
                <div key={msg.id} style={{ alignSelf: msg.sender === 'client' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.5,
                    background: msg.sender === 'client' ? ACCENT : GRAY_100,
                    color: msg.sender === 'client' ? WHITE : GRAY_900,
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: 11, color: GRAY_500, marginTop: 4, textAlign: msg.sender === 'client' ? 'right' : 'left' }}>
                    {msg.sender === 'admin' ? 'PermisClair' : 'Vous'} · {new Date(msg.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '12px 16px', borderTop: `1px solid ${GRAY_200}`, display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
              placeholder="Votre message..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${GRAY_200}`, fontSize: 16, outline: 'none',
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={sendingMessage || !newMessage.trim()}
              style={{
                padding: '10px 16px', borderRadius: 10, border: 'none',
                background: newMessage.trim() ? ACCENT : '#d1d5db',
                color: WHITE, fontSize: 14, fontWeight: 600,
                cursor: newMessage.trim() ? 'pointer' : 'default',
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            >
              →
            </button>
          </div>
        </div>
      )}
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
