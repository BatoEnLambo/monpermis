'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
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

const UPLOAD_KEY = "documents"

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
  const [uploads, setUploads] = useState({})
  const [dragOver, setDragOver] = useState(false)

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

    // Charge les uploads depuis localStorage
    const savedUploads = localStorage.getItem('monpermis_uploads')
    if (savedUploads) setUploads(JSON.parse(savedUploads))
  }, [params.reference, searchParams])

  useEffect(() => {
    if (Object.keys(uploads).length > 0) {
      localStorage.setItem("monpermis_uploads", JSON.stringify(uploads))
    }
  }, [uploads])

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
  const files = uploads[UPLOAD_KEY] || []
  const totalFiles = files.length

  const addFiles = (categoryId, newFileList) => {
    const newFiles = Array.from(newFileList).map(f => {
      const reader = new FileReader()
      reader.readAsDataURL(f)
      const fileData = { name: f.name, size: f.size, type: f.type, addedAt: new Date().toISOString() }
      reader.onload = () => {
        const stored = JSON.parse(localStorage.getItem("monpermis_files_data") || "{}")
        if (!stored[categoryId]) stored[categoryId] = []
        stored[categoryId].push({ ...fileData, data: reader.result })
        localStorage.setItem("monpermis_files_data", JSON.stringify(stored))
      }
      return fileData
    })
    setUploads(prev => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] || []), ...newFiles],
    }))
  }

  const removeFile = (categoryId, idx) => {
    setUploads(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].filter((_, i) => i !== idx),
    }))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) addFiles(UPLOAD_KEY, e.dataTransfer.files)
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " o"
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " Ko"
    return (bytes / (1024 * 1024)).toFixed(1) + " Mo"
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

      {/* 3. Checklist documents + zone upload */}
      {totalFiles < 3 && (
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
          <div style={{ fontSize: 13, color: GRAY_500, marginTop: 10 }}>Déposez vos fichiers ci-dessous. Pas de panique si vous n'avez pas tout — on vous guidera via la messagerie.</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#B8860B", marginTop: 8 }}>{totalFiles}/3 documents minimum déposés</div>
        </div>
      )}

      <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="drop-zone"
          style={{
            padding: "32px 24px", textAlign: "center", cursor: "pointer",
            border: `2px dashed ${dragOver ? ACCENT : GRAY_300}`,
            background: dragOver ? ACCENT_LIGHT : GRAY_50,
            margin: 16, borderRadius: 12, transition: "all 0.15s",
          }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: GRAY_900, marginBottom: 4 }}>
            <span style={{ color: ACCENT }}>Cliquez</span> ou glissez-déposez vos fichiers
          </div>
          <div style={{ fontSize: 13, color: GRAY_500 }}>Photos, plans, croquis, PDF...</div>
          <input ref={inputRef} type="file" multiple style={{ display: "none" }}
            onChange={e => { addFiles(UPLOAD_KEY, e.target.files); e.target.value = "" }} />
        </div>

        {files.length > 0 && (
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${GRAY_100}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: GRAY_900 }}>Fichiers ajoutés</span>
            <span style={{ background: ACCENT_LIGHT, color: ACCENT, fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 10 }}>
              {files.length} fichier{files.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {files.length > 0 && (
          <div style={{ padding: "4px 20px 12px" }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < files.length - 1 ? `1px solid ${GRAY_100}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: GRAY_500 }}>📄</span>
                  <span style={{ fontSize: 13, color: GRAY_700 }}>{f.name}</span>
                  <span style={{ fontSize: 11, color: GRAY_500 }}>{formatSize(f.size)}</span>
                </div>
                <button onClick={() => removeFile(UPLOAD_KEY, i)}
                  style={{ background: "none", border: "none", color: GRAY_500, cursor: "pointer", fontSize: 16, padding: "2px 6px", borderRadius: 4 }}
                  onMouseOver={e => e.target.style.color = "#c0392b"}
                  onMouseOut={e => e.target.style.color = GRAY_500}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Récapitulatif du projet */}
      <div className="dash-recap" style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginTop: 20 }}>
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

      {/* 5. Contact */}
      <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginTop: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px", color: GRAY_900 }}>Une question ?</h3>
        <p style={{ fontSize: 14, color: GRAY_500, margin: 0, lineHeight: 1.6 }}>
          Contactez-nous à <a href="mailto:contact@permisclair.fr" style={{ color: ACCENT, fontWeight: 600 }}>contact@permisclair.fr</a> en précisant votre référence {project.reference}.
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
