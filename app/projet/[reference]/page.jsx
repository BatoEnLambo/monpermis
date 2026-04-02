'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { uploadFile, getDocuments, deleteDocument } from '../../../lib/storage'
import { getMessages, sendMessage } from '../../../lib/messages'
import ConstructionDetailsForm from '../../../components/ConstructionDetailsForm'
import TerrainDetailsForm from '../../../components/TerrainDetailsForm'
import OuverturesForm from '../../../components/OuverturesForm'
import TerrainPhotosUpload from '../../../components/TerrainPhotosUpload'
import CoordonneesCerfaForm from '../../../components/CoordonneesCerfaForm'
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
  const inputRef = useRef(null)
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  // Fiche technique (Maison neuve only)
  const [details, setDetails] = useState(null)
  const [photoCount, setPhotoCount] = useState(0)
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
    // Ouvertures (1)
    try {
      const ouv = JSON.parse(d.ouvertures_description || '[]')
      if (Array.isArray(ouv) && ouv.some(p => p.ouvertures?.some(o => o.largeur && o.hauteur && o.type))) count++
    } catch { if (d.ouvertures_description) count++ }
    // Terrain (4)
    if (d.constructions_existantes === true || d.constructions_existantes === false) count++
    if (d.implantation_description) count++
    if (d.assainissement) count++
    if (d.raccordement_eau || d.raccordement_electricite || d.raccordement_gaz || d.raccordement_fibre || d.raccordement_aucun) count++
    // Photos
    count += photoCount
    return Math.round((count / 28) * 100)
  }, [details, photoCount])

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
  const clientDocs = documents.filter(d => d.uploaded_by === 'client')
  const adminDocs = documents.filter(d => d.uploaded_by === 'admin')

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) {
        await uploadFile(file, project.id, 'client')
      }
      const docs = await getDocuments(project.id)
      setDocuments(docs)
    } catch (err) {
      console.error('Upload error:', err)
      alert('Erreur lors de l\'upload. Veuillez réessayer.')
    }
    setUploading(false)
    e.target.value = ''
  }

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

  const handleDelete = async (doc) => {
    try {
      await deleteDocument(doc.id, doc.file_url)
      const docs = await getDocuments(project.id)
      setDocuments(docs)
    } catch (err) {
      console.error('Delete error:', err)
      alert('Erreur lors de la suppression.')
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) {
        await uploadFile(file, project.id, 'client')
      }
      const docs = await getDocuments(project.id)
      setDocuments(docs)
    } catch (err) {
      console.error('Upload error:', err)
      alert('Erreur lors de l\'upload. Veuillez réessayer.')
    }
    setUploading(false)
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
            {/* Barre de progression globale */}
            <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20, position: 'relative' }}>
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
            </div>

            <CoordonneesCerfaForm details={details} onFieldUpdate={handleFieldUpdate} />

            <ConstructionDetailsForm data={details} onFieldUpdate={handleFieldUpdate} />

            <OuverturesForm data={details.ouvertures_description} onFieldUpdate={handleFieldUpdate} />

            <TerrainDetailsForm data={details} onFieldUpdate={handleFieldUpdate} />
            <TerrainPhotosUpload projectId={project.id} onPhotoCountChange={setPhotoCount} />
          </>
        )
      })()}

      {/* 3. Checklist documents */}
      {clientDocs.length < 3 && (
        <div className="dash-onboarding" style={{ background: "#FFF9E6", border: "1px solid #F0D060", borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: GRAY_900, marginBottom: 10 }}>Pour démarrer votre dossier, envoyez-nous ces éléments :</div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: GRAY_700, lineHeight: 1.8, listStyle: "none" }}>
            <li>📸 3-4 photos de votre terrain prises depuis la rue (face, gauche, droite)</li>
            <li>📸 1-2 photos de l'environnement proche (maisons voisines, rue)</li>
            <li>📐 Plan cadastral de votre parcelle (disponible sur cadastre.gouv.fr)</li>
            <li>✏️ Un croquis ou schéma de votre projet (même à main levée)</li>
            <li>📍 L'emplacement souhaité de la construction sur le terrain</li>
            <li>🎨 Matériaux et couleurs souhaitées (enduit, bois, tuile, ardoise...)</li>
          </ul>
          <div style={{ fontSize: 13, color: GRAY_500, marginTop: 10 }}>Déposez vos fichiers ci-dessous. Pas de panique si vous n'avez pas tout — on vous guidera.</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#B8860B", marginTop: 8 }}>{clientDocs.length}/3 documents minimum déposés</div>
        </div>
      )}

      {/* 4. Vos documents (upload client) */}
      <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px", color: GRAY_900 }}>Vos documents</h3>
        <p style={{ fontSize: 13, color: GRAY_500, margin: "0 0 16px", lineHeight: 1.5 }}>
          Envoyez-nous les documents nécessaires : photos du terrain, plan cadastral, extrait du PLU...
        </p>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="drop-zone"
          style={{
            padding: "24px 20px", textAlign: "center", cursor: uploading ? "default" : "pointer",
            border: `2px dashed ${dragOver ? ACCENT : GRAY_300}`,
            background: dragOver ? ACCENT_LIGHT : GRAY_50,
            borderRadius: 12, transition: "all 0.15s", marginBottom: clientDocs.length > 0 ? 16 : 0,
            opacity: uploading ? 0.6 : 1,
          }}>
          {uploading ? (
            <div style={{ fontSize: 14, color: GRAY_500 }}>Envoi en cours...</div>
          ) : (
            <>
              <div style={{ fontSize: 28, marginBottom: 6 }}>📎</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: GRAY_900, marginBottom: 4 }}>
                <span style={{ color: ACCENT }}>Cliquez</span> ou glissez-déposez vos fichiers
              </div>
              <div style={{ fontSize: 13, color: GRAY_500 }}>Photos, plans, croquis, PDF...</div>
            </>
          )}
          <input ref={inputRef} type="file" multiple style={{ display: "none" }}
            onChange={handleUpload} disabled={uploading} />
        </div>

        {clientDocs.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: GRAY_900 }}>Fichiers envoyés</span>
              <span style={{ background: ACCENT_LIGHT, color: ACCENT, fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 10 }}>
                {clientDocs.length} fichier{clientDocs.length > 1 ? "s" : ""}
              </span>
            </div>
            {clientDocs.map((doc) => (
              <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${GRAY_100}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: GRAY_500 }}>📄</span>
                  <span style={{ fontSize: 13, color: GRAY_700 }}>{doc.file_name}</span>
                  <span style={{ fontSize: 11, color: GRAY_500 }}>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: ACCENT, fontWeight: 600, textDecoration: "none" }}>
                    Télécharger
                  </a>
                  <span
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc) }}
                    style={{ color: '#bbb', cursor: 'pointer', fontSize: 13 }}
                    title="Supprimer"
                    onMouseOver={e => e.target.style.color = '#c0392b'}
                    onMouseOut={e => e.target.style.color = '#bbb'}
                  >
                    🗑
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Votre dossier (fichiers admin) */}
      <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px", color: GRAY_900 }}>Votre dossier</h3>
        {adminDocs.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {adminDocs.map((doc) => (
              <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                  background: ACCENT_LIGHT, borderRadius: 10, textDecoration: "none", transition: "all 0.15s",
                }}>
                <span style={{ fontSize: 24 }}>📦</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: GRAY_900 }}>{doc.file_name}</div>
                  <div style={{ fontSize: 12, color: GRAY_500 }}>Ajouté le {new Date(doc.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>Télécharger ↓</span>
              </a>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 14, color: GRAY_500, margin: 0, lineHeight: 1.6 }}>
            Votre dossier est en cours de préparation. Vous pourrez le télécharger ici dès qu'il sera prêt.
          </p>
        )}
      </div>

      {/* 6. Récapitulatif du projet */}
      <div className="dash-recap" style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: GRAY_900 }}>Récapitulatif du projet</h3>
        <div className="dash-recap-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            ["Type", project.project_type],
            ["Surface", `${project.surface} m²`],
            ["Niveaux", project.floors],
            ["Chambres", project.rooms],
            ["Toiture", project.roof_type || "—"],
            ["Style", project.style || "—"],
          ].map(([label, value], i) => (
            <div key={i} style={{ padding: 10, background: GRAY_50, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: GRAY_500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: GRAY_900 }}>{value}</div>
            </div>
          ))}
        </div>
        {project.description && (
          <div style={{ padding: 12, background: GRAY_50, borderRadius: 8, marginTop: 12 }}>
            <div style={{ fontSize: 11, color: GRAY_500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Description</div>
            <div style={{ fontSize: 13, color: GRAY_700, lineHeight: 1.5 }}>{project.description}</div>
          </div>
        )}
      </div>

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
