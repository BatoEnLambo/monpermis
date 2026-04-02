'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getDocuments } from '../../../lib/storage'
import { getMessages, sendMessage } from '../../../lib/messages'
import ConstructionDetailsForm from '../../../components/ConstructionDetailsForm'
import TerrainDetailsForm from '../../../components/TerrainDetailsForm'
import OuverturesForm from '../../../components/OuverturesForm'
import TerrainPhotosUpload from '../../../components/TerrainPhotosUpload'
import CoordonneesCerfaForm from '../../../components/CoordonneesCerfaForm'
import CroquisUploadForm from '../../../components/CroquisUploadForm'
import ChauffageEnergieForm from '../../../components/ChauffageEnergieForm'
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

const PHASES = [
  { id: "paid", label: "Paiement reçu", desc: "Votre paiement a bien été enregistré" },
  { id: "in_progress", label: "Dossier en cours", desc: "Vos plans et votre dossier sont en cours de réalisation" },
  { id: "review", label: "Votre relecture", desc: "Vérifiez le dossier, demandez des ajustements si besoin" },
  { id: "delivered", label: "Dossier livré ✓", desc: "Votre dossier complet est prêt à déposer en mairie" },
  { id: "deposited", label: "Déposé en mairie", desc: "Le dossier a été déposé, en attente de réponse" },
  { id: "accepted", label: "Permis accepté ✓", desc: "Félicitations, votre permis est accepté !" },
]

function getPhaseIndex(status) {
  const idx = PHASES.findIndex(p => p.id === status)
  return idx >= 0 ? idx : 0
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

  // Fiche technique (Maison neuve only)
  const [details, setDetails] = useState(null)
  const [photoCount, setPhotoCount] = useState(0)
  const [croquisCount, setCroquisCount] = useState(0)
  const [saved, setSaved] = useState(false)
  const debounceRef = useRef({})

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

  // Charge les project_details pour Maison neuve
  useEffect(() => {
    if (!project?.id || !project.project_type?.startsWith('Maison neuve')) return
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
    // Construction (10)
    if (d.dimensions_longueur) count++
    if (d.dimensions_largeur) count++
    if (d.fondation) count++
    if (d.hauteur_faitage || d.hauteur_faitage_nsp) count++
    if (d.hauteur_egout || d.hauteur_egout_nsp) count++
    if (d.pente_toiture || d.pente_toiture_nsp) count++
    if (d.debord_toit || d.debord_toit_nsp) count++
    if (d.materiau_facade) count++
    if (d.materiau_couverture) count++
    if (d.menuiserie_materiau || d.menuiserie_couleur) count++
    // Pièces (1)
    try {
      const ouv = JSON.parse(d.ouvertures_description || '[]')
      if (Array.isArray(ouv) && ouv.some(p => p.piece && p.longueur && p.largeur)) count++
    } catch { if (d.ouvertures_description) count++ }
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
    // Croquis (1)
    if (croquisCount > 0) count++
    // Chauffage et énergie (3)
    if (d.chauffage_principal) count++
    if (d.eau_chaude) count++
    if (d.isolation_type) count++
    // Photos
    count += photoCount
    return Math.round((count / 33) * 100)
  }, [details, photoCount, croquisCount])

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

  const currentPhase = getPhaseIndex(project.status)
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
          <h1 className="dash-title" style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            {project.project_type}
          </h1>
          <p className="dash-address" style={{ fontSize: 14, color: GRAY_500, margin: 0 }}>
            {project.address}, {project.postal_code} {project.city} · {project.surface} m²
          </p>
        </div>
        <div className="dash-id" style={{ background: ACCENT_LIGHT, color: ACCENT, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 6 }}>
          {project.reference}
        </div>
      </div>

      {/* 2. Timeline avancement */}
      <div className="dash-progress" style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 20px", color: GRAY_900 }}>Avancement du dossier</h3>
        <div style={{ position: "relative" }}>
          {PHASES.map((phase, i) => {
            const isActive = i === currentPhase
            const isDone = i < currentPhase
            const isFuture = i > currentPhase
            return (
              <div key={phase.id} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
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
                  {i < PHASES.length - 1 && (
                    <div style={{ width: 2, height: 32, background: isDone ? ACCENT : GRAY_200, transition: "background 0.3s" }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < PHASES.length - 1 ? 14 : 0, paddingTop: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: isActive ? 600 : 500, color: isFuture ? GRAY_500 : GRAY_900 }}>
                    {phase.label}
                  </div>
                  {(isActive || isDone) && (
                    <div style={{ fontSize: 12, color: GRAY_500, marginTop: 2 }}>{phase.desc}</div>
                  )}
                  {phase.id === 'delivered' && (isDone || isActive) && adminDocs.length > 0 && (
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
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: 13, color: GRAY_500, fontStyle: "italic", margin: "16px 0 0" }}>Si la mairie demande des modifications après votre dépôt, on corrige et on vous renvoie le dossier gratuitement.</p>
      </div>

      {/* Fiche technique — Maison neuve uniquement */}
      {project.project_type?.startsWith('Maison neuve') && details && (() => {
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
              // ② Votre construction (15 = construction 10 + pièces 1 + croquis 1 + chauffage 3)
              let constrCount = 0
              if (d.dimensions_longueur) constrCount++
              if (d.dimensions_largeur) constrCount++
              if (d.fondation) constrCount++
              if (d.hauteur_faitage || d.hauteur_faitage_nsp) constrCount++
              if (d.hauteur_egout || d.hauteur_egout_nsp) constrCount++
              if (d.pente_toiture || d.pente_toiture_nsp) constrCount++
              if (d.debord_toit || d.debord_toit_nsp) constrCount++
              if (d.materiau_facade) constrCount++
              if (d.materiau_couverture) constrCount++
              if (d.menuiserie_materiau || d.menuiserie_couleur) constrCount++
              try {
                const ouv = JSON.parse(d.ouvertures_description || '[]')
                if (Array.isArray(ouv) && ouv.some(p => p.piece && p.longueur && p.largeur)) constrCount++
              } catch { if (d.ouvertures_description) constrCount++ }
              if (croquisCount > 0) constrCount++
              if (d.chauffage_principal) constrCount++
              if (d.eau_chaude) constrCount++
              if (d.isolation_type) constrCount++
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
              terrainCount += photoCount

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
                  <p style={{ fontSize: 12, color: GRAY_500, margin: '10px 0 0' }}>
                    {progress === 100
                      ? 'Fiche complète — merci !'
                      : 'Complétez ces informations pour que nous puissions réaliser vos plans.'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    <span style={badgeStyle(infoCount, 8)}><strong>①</strong> Vos informations {infoCount}/8</span>
                    <span style={badgeStyle(constrCount, 15)}><strong>②</strong> Votre construction {constrCount}/15</span>
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

            {/* Bloc ② Votre construction */}
            {(() => {
              const d = details
              let cCount = 0
              if (d.dimensions_longueur) cCount++
              if (d.dimensions_largeur) cCount++
              if (d.fondation) cCount++
              if (d.hauteur_faitage || d.hauteur_faitage_nsp) cCount++
              if (d.hauteur_egout || d.hauteur_egout_nsp) cCount++
              if (d.pente_toiture || d.pente_toiture_nsp) cCount++
              if (d.debord_toit || d.debord_toit_nsp) cCount++
              if (d.materiau_facade) cCount++
              if (d.materiau_couverture) cCount++
              if (d.menuiserie_materiau || d.menuiserie_couleur) cCount++
              try {
                const ouv = JSON.parse(d.ouvertures_description || '[]')
                if (Array.isArray(ouv) && ouv.some(p => p.piece && p.longueur && p.largeur)) cCount++
              } catch { if (d.ouvertures_description) cCount++ }
              if (croquisCount > 0) cCount++
              if (d.chauffage_principal) cCount++
              if (d.eau_chaude) cCount++
              if (d.isolation_type) cCount++
              const hrStyle = { border: 'none', borderTop: '1px solid #eee', margin: '24px 0' }
              return (
                <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a472a', color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>2</div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: GRAY_900, margin: 0, letterSpacing: '-0.02em' }}>Votre construction</h3>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: GRAY_500 }}>{cCount}/15 remplis</span>
                  </div>

                  <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>Dimensions et matériaux</div>
                  <ConstructionDetailsForm data={details} onFieldUpdate={handleFieldUpdate} />

                  <hr style={hrStyle} />
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>Pièces et ouvertures</div>
                  <OuverturesForm data={details.ouvertures_description} onFieldUpdate={handleFieldUpdate} />

                  <hr style={hrStyle} />
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>Croquis de votre projet</div>
                  <CroquisUploadForm projectId={project.id} details={details} onFieldUpdate={handleFieldUpdate} onCroquisCountChange={setCroquisCount} />

                  <hr style={hrStyle} />
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Chauffage et énergie</div>
                  <p style={{ fontSize: 12, color: GRAY_500, margin: '0 0 16px', lineHeight: 1.4 }}>
                    Ces informations sont nécessaires pour l'étude thermique RE2020.
                  </p>
                  <ChauffageEnergieForm details={details} onFieldUpdate={handleFieldUpdate} />
                </div>
              )
            })()}

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
