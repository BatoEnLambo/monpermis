'use client'

import { useState, useEffect } from 'react'
import JSZip from 'jszip'
import { supabase } from '../../lib/supabase'
import { uploadFile, getDocuments, deleteDocument } from '../../lib/storage'
import { getMessages, sendMessage, markAsRead } from '../../lib/messages'
import AdminNav from '../../components/AdminNav'

const ADMIN_PASSWORD = 'permisclair2026'

const STATUS_LABELS = {
  pending: '🟡 En attente de paiement',
  paid: '🟢 Payé',
  in_progress: '🔵 En cours',
  review: '🟣 En relecture',
  delivered: '📦 Livré',
}

const STATUS_OPTIONS = ['pending', 'paid', 'in_progress', 'review', 'delivered']

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [projectDocs, setProjectDocs] = useState({})
  const [adminUploading, setAdminUploading] = useState(null)
  const [projectMessages, setProjectMessages] = useState({})
  const [adminReply, setAdminReply] = useState({})
  const [projectDetails, setProjectDetails] = useState({})
  const [projectPhotos, setProjectPhotos] = useState({})
  const [projectCroquis, setProjectCroquis] = useState({})
  const [zipping, setZipping] = useState(null)

  const login = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      fetchProjects()
    } else {
      alert('Mot de passe incorrect')
    }
  }

  const fetchAllMessages = async (projectsList) => {
    const allMsgs = {}
    for (const p of projectsList) {
      try {
        const msgs = await getMessages(p.id)
        allMsgs[p.id] = msgs
      } catch (err) {
        allMsgs[p.id] = []
      }
    }
    setProjectMessages(allMsgs)
  }

  const fetchProjects = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) {
      setProjects(data)
      fetchAllMessages(data)
    }
    setLoading(false)
  }

  const updateStatus = async (id, newStatus) => {
    await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', id)
    fetchProjects()
  }

  const getUnreadCount = (project) => {
    const msgs = projectMessages[project.id] || []
    const clientMsgs = msgs.filter(m => m.sender === 'client')
    if (!project.last_read_at) return clientMsgs.length
    return clientMsgs.filter(m => new Date(m.created_at) > new Date(project.last_read_at)).length
  }

  const totalUnread = projects.reduce((sum, p) => sum + getUnreadCount(p), 0)

  const handleSelectProject = async (projectId) => {
    if (selected === projectId) {
      setSelected(null)
      return
    }
    setSelected(projectId)
    markAsRead(projectId)
    setProjects(prev => prev.map(proj => proj.id === projectId ? { ...proj, last_read_at: new Date().toISOString() } : proj))
    if (!projectDocs[projectId]) {
      try {
        const docs = await getDocuments(projectId)
        setProjectDocs(prev => ({ ...prev, [projectId]: docs }))
      } catch (err) {
        console.error('Error loading docs:', err)
      }
    }
    if (!projectMessages[projectId]) {
      try {
        const msgs = await getMessages(projectId)
        setProjectMessages(prev => ({ ...prev, [projectId]: msgs }))
      } catch (err) {
        console.error('Error loading messages:', err)
      }
    }
    // Fetch project_details for Maison neuve
    const proj = projects.find(pr => pr.id === projectId)
    if (proj?.project_type?.startsWith('Maison neuve')) {
      fetchProjectDetails(projectId)
    }
  }

  const handleAdminUpload = async (e, projectId) => {
    e.stopPropagation()
    const files = Array.from(e.target.files)
    if (!files.length) return
    setAdminUploading(projectId)
    try {
      for (const file of files) {
        await uploadFile(file, projectId, 'admin')
      }
      const docs = await getDocuments(projectId)
      setProjectDocs(prev => ({ ...prev, [projectId]: docs }))
    } catch (err) {
      console.error('Upload error:', err)
      alert('Erreur lors de l\'upload.')
    }
    setAdminUploading(null)
    e.target.value = ''
  }

  const LABELS = {
    dalle: 'Dalle béton', vide_sanitaire: 'Vide sanitaire', pilotis: 'Pilotis', sous_sol: 'Sous-sol',
    enduit: 'Enduit', bardage_bois: 'Bardage bois', pierre: 'Pierre', mixte: 'Mixte', autre: 'Autre',
    tuile_canal: 'Tuile canal', tuile_plate: 'Tuile plate', ardoise: 'Ardoise', bac_acier: 'Bac acier', zinc: 'Zinc',
    pvc: 'PVC', aluminium: 'Aluminium', bois: 'Bois',
    tout_egout: 'Tout-à-l\'égout', fosse_septique: 'Fosse septique / ANC',
    ne_sait_pas: 'Ne sait pas',
    pac_air_eau: 'PAC air/eau', pac_air_air: 'PAC air/air', poele_bois: 'Poêle à bois / granulés',
    chaudiere_gaz: 'Chaudière gaz', electrique: 'Électrique',
    thermodynamique: 'Ballon thermodynamique', solaire: 'Chauffe-eau solaire', lie_chauffage: 'Liée au chauffage',
    ite: 'ITE (extérieur)', iti: 'ITI (intérieur)', mixte: 'Mixte (ITE + ITI)',
    fenetre_oscillo_battante: 'Fenêtre oscillo-battante', fenetre_coulissante: 'Fenêtre coulissante',
    baie_vitree_coulissante: 'Baie vitrée coulissante', baie_vitree_galandage: 'Baie vitrée à galandage',
    porte_fenetre: 'Porte-fenêtre', porte_entree: "Porte d'entrée",
  }
  const label = (v) => LABELS[v] || v || '-'

  const computeSectionStatus = (d, photos, croquisFiles) => {
    if (!d) return { progress: 0, sections: [] }

    // Coordonnées (8)
    let coordCount = 0
    if (d.client_civilite) coordCount++
    if (d.client_nom) coordCount++
    if (d.client_prenom) coordCount++
    if (d.client_date_naissance) coordCount++
    if (d.client_commune_naissance) coordCount++
    if (d.client_departement_naissance) coordCount++
    if (d.client_telephone) coordCount++
    if (d.client_email) coordCount++

    // Construction (10)
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

    // Pièces
    let piecesStatus = 'empty'
    try {
      const ouv = JSON.parse(d.ouvertures_description || '[]')
      if (Array.isArray(ouv) && ouv.length > 0) {
        const hasComplete = ouv.some(p => p.piece && p.longueur && p.largeur && p.ouvertures?.length > 0)
        const hasPartial = ouv.some(p => p.piece)
        piecesStatus = hasComplete ? 'complete' : hasPartial ? 'partial' : 'empty'
      }
    } catch { if (d.ouvertures_description) piecesStatus = 'partial' }

    // Croquis
    const croquisCount = (croquisFiles || []).length
    let croquisStatus = 'empty'
    if (croquisCount > 0) {
      let checklistOk = false
      try {
        const cl = JSON.parse(d.croquis_checklist || '{}')
        checklistOk = cl.murs && cl.pieces && cl.ouvertures && cl.dimensions_batiment
      } catch {}
      croquisStatus = checklistOk ? 'complete' : 'partial'
    }

    // Chauffage (3)
    let chauffCount = 0
    if (d.chauffage_principal) chauffCount++
    if (d.eau_chaude) chauffCount++
    if (d.isolation_type) chauffCount++

    // Terrain (5)
    let terrainCount = 0
    if (d.parcelle_nsp || d.parcelle_section || d.parcelle_numero) terrainCount++
    if (d.constructions_existantes === false) {
      terrainCount++
    } else if (d.constructions_existantes === true) {
      try {
        const liste = JSON.parse(d.constructions_existantes_liste || '[]')
        if (Array.isArray(liste) && liste.some(item => item.nom)) terrainCount++
      } catch { if (d.constructions_existantes_liste) terrainCount++ }
    }
    if (d.implantation_description) terrainCount++
    if (d.assainissement) terrainCount++
    if (d.raccordement_eau || d.raccordement_electricite || d.raccordement_gaz || d.raccordement_fibre || d.raccordement_aucun) terrainCount++

    // Photos (5 max)
    const photoCount = (photos || []).length

    // Calcul progression globale
    let total = coordCount + constrCount + chauffCount + terrainCount + photoCount
    if (piecesStatus === 'complete' || (piecesStatus === 'partial' && (() => { try { const o = JSON.parse(d.ouvertures_description || '[]'); return Array.isArray(o) && o.some(p => p.piece && p.longueur && p.largeur) } catch { return !!d.ouvertures_description } })())) total++
    else if (piecesStatus === 'partial') { /* partial but no dimensions = 0 */ }
    if (croquisCount > 0) total++
    const progress = Math.round((total / 33) * 100)

    const status = (filled, max) => filled === max ? 'complete' : filled > 0 ? 'partial' : 'empty'

    const sections = [
      { name: 'Coordonnées', status: status(coordCount, 8), filled: coordCount, max: 8, reason: 'nécessaire pour le CERFA' },
      { name: 'Construction', status: status(constrCount, 10), filled: constrCount, max: 10, reason: 'nécessaire pour les plans' },
      { name: 'Pièces', status: piecesStatus, reason: 'dimensions + ouvertures nécessaires pour les plans' },
      { name: 'Croquis', status: croquisStatus, detail: croquisCount > 0 ? `${croquisCount} fichier${croquisCount > 1 ? 's' : ''}` : null, reason: 'bloquant pour démarrer les plans' },
      { name: 'Chauffage', status: status(chauffCount, 3), filled: chauffCount, max: 3, reason: 'nécessaire pour l\'étude RE2020' },
      { name: 'Terrain', status: status(terrainCount, 5), filled: terrainCount, max: 5, reason: 'nécessaire pour le plan de masse' },
      { name: 'Photos terrain', status: status(photoCount, 5), filled: photoCount, max: 5, reason: 'nécessaires pour l\'insertion paysagère' },
    ]

    return { progress, sections }
  }

  const computeDetailsProgress = (d, photos, croquisFiles) => {
    return computeSectionStatus(d, photos, croquisFiles).progress
  }

  const fetchProjectDetails = async (projectId) => {
    if (projectDetails[projectId] !== undefined) return
    const { data } = await supabase
      .from('project_details')
      .select('*')
      .eq('project_id', projectId)
      .single()
    setProjectDetails(prev => ({ ...prev, [projectId]: data || null }))
    // Fetch terrain photos
    const { data: files } = await supabase.storage.from('documents').list(`${projectId}/photos-terrain`)
    const photos = (files || []).filter(f => f.name && f.name !== '.emptyFolderPlaceholder').map(f => {
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(`${projectId}/photos-terrain/${f.name}`)
      return { name: f.name.replace(/\.[^.]+$/, '').replace(/-/g, ' '), url: urlData.publicUrl }
    })
    setProjectPhotos(prev => ({ ...prev, [projectId]: photos }))
    // Fetch croquis files
    const { data: croquisFiles } = await supabase.storage.from('documents').list(`${projectId}/croquis`)
    const croquis = (croquisFiles || []).filter(f => f.name && f.name !== '.emptyFolderPlaceholder').map(f => {
      const { data: cUrlData } = supabase.storage.from('documents').getPublicUrl(`${projectId}/croquis/${f.name}`)
      return { name: f.name, url: cUrlData.publicUrl }
    })
    setProjectCroquis(prev => ({ ...prev, [projectId]: croquis }))
  }

  const handleDownloadAll = async (project) => {
    setZipping(project.id)
    try {
      const zip = new JSZip()

      // Client documents
      const docs = (projectDocs[project.id] || []).filter(d => d.uploaded_by === 'client')
      for (const doc of docs) {
        try {
          const resp = await fetch(doc.file_url)
          if (resp.ok) {
            const blob = await resp.blob()
            zip.file(`documents/${doc.file_name}`, blob)
          }
        } catch (e) { console.error('Fetch doc error:', e) }
      }

      // Terrain photos
      const { data: photoFiles } = await supabase.storage.from('documents').list(`${project.id}/photos-terrain`)
      const validPhotos = (photoFiles || []).filter(f => f.name && f.name !== '.emptyFolderPlaceholder')
      for (const f of validPhotos) {
        try {
          const { data: urlData } = supabase.storage.from('documents').getPublicUrl(`${project.id}/photos-terrain/${f.name}`)
          const resp = await fetch(urlData.publicUrl)
          if (resp.ok) {
            const blob = await resp.blob()
            zip.file(`photos-terrain/${f.name}`, blob)
          }
        } catch (e) { console.error('Fetch photo error:', e) }
      }

      const content = await zip.generateAsync({ type: 'blob' })
      const clientName = `${project.first_name || ''}_${project.last_name || ''}`.toUpperCase().replace(/\s+/g, '_')
      const fileName = `${project.reference}_${clientName}.zip`
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      console.error('ZIP error:', err)
      alert('Erreur lors de la création du ZIP.')
    }
    setZipping(null)
  }

  if (!authed) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Admin PermisClair</h1>
        <form onSubmit={login}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe"
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 16, marginBottom: 12, boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: '#1a5c3a', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Connexion
          </button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
      <AdminNav onRefresh={fetchProjects} onLogout={() => setAuthed(false)} />

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ padding: '8px 14px', background: '#e8f5ee', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
          Total : {projects.length}
        </div>
        <div style={{ padding: '8px 14px', background: '#e8f5ee', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#1a5c3a' }}>
          Payés : {projects.filter(p => p.status !== 'pending').length}
        </div>
        <div style={{ padding: '8px 14px', background: '#fff3e0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#e65100' }}>
          En attente : {projects.filter(p => p.status === 'pending').length}
        </div>
        {totalUnread > 0 && (
          <div style={{ padding: '8px 14px', background: '#fff3e0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#e65100' }}>
            💬 {totalUnread} message{totalUnread > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Messages non lus */}
      {totalUnread > 0 && (
        <div style={{ background: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: '#e65100', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{totalUnread}</span>
            message{totalUnread > 1 ? 's' : ''} non lu{totalUnread > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {projects.filter(p => getUnreadCount(p) > 0).map(p => {
              const unread = getUnreadCount(p)
              const lastMsg = (projectMessages[p.id] || []).filter(m => m.sender === 'client').slice(-1)[0]
              return (
                <div key={p.id}
                  onClick={() => {
                    handleSelectProject(p.id)
                    document.getElementById(`project-${p.id}`)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fff', borderRadius: 10, cursor: 'pointer', border: '1px solid #ffe0b2', transition: 'background 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#fff8f0'}
                  onMouseOut={e => e.currentTarget.style.background = '#fff'}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{p.first_name} {p.last_name} <span style={{ color: '#888', fontWeight: 400 }}>({p.reference})</span></div>
                    {lastMsg && <div style={{ fontSize: 13, color: '#666', marginTop: 2, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastMsg.content}</div>}
                  </div>
                  <span style={{ background: '#e65100', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{unread}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loading ? (
        <p>Chargement...</p>
      ) : projects.length === 0 ? (
        <p style={{ color: '#888' }}>Aucun projet pour le moment.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {projects.map(p => (
            <div key={p.id} id={`project-${p.id}`} style={{ border: '1px solid #e8e7e4', borderRadius: 10, padding: 16, background: '#fff', cursor: 'pointer' }}
              onClick={() => handleSelectProject(p.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{p.reference}</span>
                  <span style={{ color: '#888', fontSize: 13, marginLeft: 8 }}>{p.first_name} {p.last_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{p.price ? p.price + ' €' : 'Sur devis'}</span>
                  {p.options && p.options.includes('RE2020') && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 6, background: '#e8f5ee', color: '#1a5c3a' }}>RE2020</span>
                  )}
                  <span style={{ fontSize: 12 }}>{STATUS_LABELS[p.status] || p.status}</span>
                  {p.project_type?.startsWith('Maison neuve') && projectDetails[p.id] && (() => {
                    const pct = computeDetailsProgress(projectDetails[p.id], projectPhotos[p.id] || [], projectCroquis[p.id] || [])
                    const cfg = pct === 100 ? { bg: '#e8f5ee', color: '#1a5c3a', text: 'Complet' }
                      : pct >= 70 ? { bg: '#fff3e0', color: '#e65100', text: 'Quasi complet' }
                      : pct > 0 ? { bg: '#fce4ec', color: '#c62828', text: 'Incomplet' }
                      : { bg: '#f5f4f2', color: '#888', text: 'Vide' }
                    return <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: cfg.bg, color: cfg.color }}>{pct}% — {cfg.text}</span>
                  })()}
                  {getUnreadCount(p) > 0 && (
                    <span style={{ background: '#e65100', color: '#fff', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginLeft: 8 }}>
                      {getUnreadCount(p)} msg
                    </span>
                  )}
                </div>
              </div>

              {selected === p.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0', fontSize: 14 }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                    <div><strong>Type :</strong> {p.project_type}</div>
                    <div><strong>Adresse :</strong> {p.address}, {p.postal_code} {p.city}</div>
                    <div><strong>Surface :</strong> {p.surface} m²</div>
                    <div><strong>Niveaux :</strong> {p.floors}</div>
                    <div><strong>Chambres :</strong> {p.rooms}</div>
                    <div><strong>Toiture :</strong> {p.roof_type || '-'}</div>
                    <div><strong>Style :</strong> {p.style || '-'}</div>
                    <div><strong>Email :</strong> {p.email}</div>
                    <div><strong>Téléphone :</strong> {p.phone || '-'}</div>
                    <div><strong>Créé le :</strong> {new Date(p.created_at).toLocaleDateString('fr-FR')}</div>
                    {p.paid_at && <div><strong>Payé le :</strong> {new Date(p.paid_at).toLocaleDateString('fr-FR')}</div>}
                    {p.paid_at && <div><strong>Relances :</strong> J+1 {p.reminder_j1_sent ? '✓' : '—'} · J+3 {p.reminder_j3_sent ? '✓' : '—'} · J+7 {p.reminder_j7_sent ? '✓' : '—'}</div>}
                  </div>
                  {p.description && (
                    <div style={{ marginTop: 12 }}><strong>Description :</strong> {p.description}</div>
                  )}

                  {/* Lien magique */}
                  {p.token && (
                    <div style={{ marginTop: 16, padding: 12, background: '#f5f4f2', borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Lien client :</div>
                      <a href={`/projet/${p.reference}?token=${p.token}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, color: '#1a5c3a', wordBreak: 'break-all' }}>
                        /projet/{p.reference}?token={p.token}
                      </a>
                    </div>
                  )}

                  {/* Changement de statut */}
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Changer le statut :</span>
                    <select
                      value={p.status}
                      onChange={(e) => { e.stopPropagation(); updateStatus(p.id, e.target.value) }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fiche technique client (Maison neuve) */}
                  {p.project_type?.startsWith('Maison neuve') && projectDetails[p.id] && (() => {
                    const d = projectDetails[p.id]
                    const photos = projectPhotos[p.id] || []
                    const croquis = projectCroquis[p.id] || []
                    const { progress, sections } = computeSectionStatus(d, photos, croquis)
                    const nspOrVal = (val, nsp, unit) => nsp ? 'À proposer' : val ? `${val} ${unit}` : '-'
                    const raccordements = d.raccordement_aucun ? ['Aucun'] : [d.raccordement_eau && 'Eau', d.raccordement_electricite && 'Électricité', d.raccordement_gaz && 'Gaz', d.raccordement_fibre && 'Fibre'].filter(Boolean)
                    const missing = sections.filter(s => s.status !== 'complete')
                    const statusIcon = { complete: '✅', partial: '🟡', empty: '⚪' }
                    const statusBg = { complete: '#e8f5ee', partial: '#fff3e0', empty: '#f5f4f2' }
                    const statusColor = { complete: '#1a5c3a', partial: '#e65100', empty: '#888' }
                    return (
                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>

                        {/* État du dossier */}
                        <div style={{ background: '#fafaf9', border: '1px solid #e8e7e4', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>État du dossier</div>
                            <span style={{ fontSize: 13, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: progress === 100 ? '#e8f5ee' : '#fff3e0', color: progress === 100 ? '#1a5c3a' : '#e65100' }}>
                              {progress}%
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: missing.length > 0 ? 12 : 0 }}>
                            {sections.map(s => (
                              <span key={s.name} style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6, background: statusBg[s.status], color: statusColor[s.status], whiteSpace: 'nowrap' }}>
                                {statusIcon[s.status]} {s.name}{s.filled !== undefined ? ` ${s.filled}/${s.max}` : ''}
                              </span>
                            ))}
                          </div>
                          {progress === 100 ? (
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a5c3a' }}>✅ Dossier complet — prêt à démarrer</div>
                          ) : missing.length > 0 && (
                            <div style={{ fontSize: 12, color: '#444', lineHeight: 1.6 }}>
                              <div style={{ fontWeight: 600, marginBottom: 4, color: '#e65100' }}>⚠ Éléments manquants :</div>
                              {missing.map(s => (
                                <div key={s.name}>• <strong>{s.name}</strong> : {s.status === 'empty' ? (s.name === 'Croquis' ? 'aucun fichier uploadé' : s.name === 'Pièces' ? 'aucune pièce renseignée' : `aucun champ rempli`) : s.filled !== undefined ? `${s.filled}/${s.max} remplis` : s.detail || 'partiel'} <span style={{ color: '#888' }}>({s.reason})</span></div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Groupe 1 — Informations client */}
                        <div style={{ background: '#fff', border: '1px solid #e8e7e4', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a472a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>1</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a5c3a' }}>Informations client</div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: 13 }}>
                            <div><strong>Identité :</strong> {[d.client_civilite === 'M' ? 'M.' : d.client_civilite, d.client_nom, d.client_prenom].filter(Boolean).join(' ') || '-'}</div>
                            <div><strong>Date de naissance :</strong> {d.client_date_naissance || '-'}</div>
                            <div><strong>Commune de naissance :</strong> {d.client_commune_naissance || '-'}</div>
                            <div><strong>Département :</strong> {d.client_departement_naissance || '-'}</div>
                            <div><strong>Téléphone :</strong> {d.client_telephone || '-'}</div>
                            <div><strong>Email :</strong> {d.client_email || '-'}</div>
                            {d.client_adresse_differente && <div style={{ gridColumn: '1 / -1' }}><strong>Adresse postale :</strong> {d.client_adresse || '-'}</div>}
                            <div><strong>Réponse mairie par email :</strong> {d.client_reponse_mairie_email === false ? 'Non' : 'Oui'}</div>
                          </div>
                        </div>

                        {/* Groupe 2 — Construction */}
                        <div style={{ background: '#fff', border: '1px solid #e8e7e4', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a472a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>2</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a5c3a' }}>Construction</div>
                          </div>

                          {/* Dimensions et matériaux */}
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a5c3a', marginBottom: 6 }}>Dimensions et matériaux</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: 13 }}>
                            <div><strong>Dimensions :</strong> {d.dimensions_longueur && d.dimensions_largeur ? `${d.dimensions_longueur} × ${d.dimensions_largeur} m` : '-'}</div>
                            <div><strong>Fondation :</strong> {label(d.fondation)}</div>
                            <div><strong>Hauteur faîtage :</strong> {nspOrVal(d.hauteur_faitage, d.hauteur_faitage_nsp, 'm')}</div>
                            <div><strong>Hauteur égout :</strong> {nspOrVal(d.hauteur_egout, d.hauteur_egout_nsp, 'm')}</div>
                            <div><strong>Type toiture :</strong> {d.roof_type ? (d.roof_type === 'autre' ? `Autre${d.roof_type_other ? ` (${d.roof_type_other})` : ''}` : label(d.roof_type)) : '-'}</div>
                            {d.roof_type !== 'plat' && <div><strong>Pente toiture :</strong> {nspOrVal(d.pente_toiture, d.pente_toiture_nsp, '°')}</div>}
                            <div><strong>Débord toit :</strong> {nspOrVal(d.debord_toit, d.debord_toit_nsp, 'cm')}</div>
                            <div><strong>Façade :</strong> {label(d.materiau_facade)}{d.materiau_facade_detail ? ` (${d.materiau_facade_detail})` : ''}</div>
                            <div><strong>Couverture :</strong> {label(d.materiau_couverture)}</div>
                            <div><strong>Menuiseries :</strong> {label(d.menuiserie_materiau)}{d.menuiserie_couleur ? ` — ${d.menuiserie_couleur}` : ''}</div>
                          </div>

                          {/* Pièces & Ouvertures */}
                          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a5c3a', marginBottom: 6 }}>Pièces & Ouvertures</div>
                          {(() => {
                            let ouvPieces = []
                            try { ouvPieces = JSON.parse(d.ouvertures_description || '[]') } catch {}
                            if (!Array.isArray(ouvPieces) || ouvPieces.length === 0) return <div style={{ fontSize: 13, color: '#888' }}>Aucune pièce renseignée</div>
                            return (
                              <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                                {ouvPieces.map((piece, i) => (
                                  <div key={i} style={{ marginBottom: i < ouvPieces.length - 1 ? 8 : 0 }}>
                                    <strong>{piece.piece || 'Pièce sans nom'}</strong>{piece.longueur && piece.largeur ? ` — ${piece.longueur} × ${piece.largeur} m` : ''}
                                    {(piece.ouvertures || []).map((o, j) => (
                                      <div key={j} style={{ paddingLeft: 16, color: '#44433f' }}>
                                        {o.largeur && o.hauteur ? `${o.largeur} × ${o.hauteur} cm` : '—'} — {label(o.type)}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            )
                          })()}

                          {/* Croquis */}
                          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />
                          {(() => {
                            const cl = (() => { try { return JSON.parse(d.croquis_checklist || '{}') } catch { return {} } })()
                            const checkItems = [
                              { key: 'murs', label: 'Murs ext. et int.' },
                              { key: 'pieces', label: 'Pièces nommées et dimensionnées' },
                              { key: 'ouvertures', label: 'Ouvertures placées avec dimensions' },
                              { key: 'dimensions_batiment', label: 'Dimensions extérieures' },
                            ]
                            const allChecked = checkItems.every(c => cl[c.key])
                            return (
                              <>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#1a5c3a', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                                  Croquis ({croquis.length} fichier{croquis.length !== 1 ? 's' : ''})
                                  {croquis.length > 0 && !allChecked && (
                                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: '#fff3e0', color: '#e65100' }}>Potentiellement incomplet</span>
                                  )}
                                </div>
                                {croquis.length > 0 ? (
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                                    {croquis.map((c, i) => (
                                      <a key={i} href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#1a5c3a', fontWeight: 600, textDecoration: 'none' }}>
                                        {c.name.toLowerCase().endsWith('.pdf') ? '📄' : '🖼️'} {c.name}
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>Aucun croquis uploadé</div>
                                )}
                                <div style={{ fontSize: 12, color: '#666' }}>
                                  {checkItems.map(c => (
                                    <span key={c.key} style={{ marginRight: 12 }}>{cl[c.key] ? '✓' : '✗'} {c.label}</span>
                                  ))}
                                </div>
                              </>
                            )
                          })()}

                          {/* Chauffage et énergie */}
                          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a5c3a', marginBottom: 6 }}>Chauffage et énergie</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: 13 }}>
                            <div><strong>Chauffage principal :</strong> {label(d.chauffage_principal)}</div>
                            <div><strong>Eau chaude :</strong> {label(d.eau_chaude)}</div>
                            <div><strong>Isolation :</strong> {label(d.isolation_type)}</div>
                            {d.chauffage_appoint && <div><strong>Appoint :</strong> {d.chauffage_appoint}</div>}
                            {d.energie_commentaire && <div style={{ gridColumn: '1 / -1' }}><strong>Commentaire :</strong> {d.energie_commentaire}</div>}
                          </div>
                        </div>

                        {/* Groupe 3 — Terrain */}
                        <div style={{ background: '#fff', border: '1px solid #e8e7e4', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a472a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>3</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a5c3a' }}>Terrain</div>
                          </div>

                          {/* Parcelle */}
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a5c3a', marginBottom: 6 }}>Parcelle</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: 13 }}>
                            {d.parcelle_nsp ? (
                              <div style={{ gridColumn: '1 / -1' }}><strong>Parcelle :</strong> Non renseigné par le client</div>
                            ) : (d.parcelle_section || d.parcelle_numero || d.parcelle_surface) ? (
                              <div style={{ gridColumn: '1 / -1' }}><strong>Parcelle :</strong> {[d.parcelle_section ? `Section ${d.parcelle_section}` : null, d.parcelle_numero ? `n° ${d.parcelle_numero}` : null].filter(Boolean).join(', ')}{d.parcelle_surface ? ` — ${d.parcelle_surface}` : ''}</div>
                            ) : null}
                          </div>

                          {/* Constructions existantes */}
                          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a5c3a', marginBottom: 6 }}>Constructions existantes</div>
                          <div style={{ fontSize: 13 }}>
                            <strong>Constructions existantes :</strong>{' '}
                            {d.constructions_existantes === true ? (() => {
                              let liste = []
                              try { liste = JSON.parse(d.constructions_existantes_liste || '[]') } catch {}
                              if (Array.isArray(liste) && liste.length > 0) {
                                return <div style={{ marginTop: 4 }}>{liste.map((c, i) => (
                                  <div key={i} style={{ background: '#fafaf9', border: '1px solid #e8e7e4', borderRadius: 6, padding: '6px 10px', marginTop: 4, fontSize: 12 }}>
                                    <strong>{c.nom || '(sans nom)'}</strong>
                                    {c.surface ? ` — ${c.surface} m²` : ''}
                                    {c.annee ? ` — ${c.annee}` : ''}
                                    {c.cadastree === true ? ' — Cadastrée' : c.cadastree === false ? ' — Non cadastrée' : ''}
                                    {c.notes ? ` — ${c.notes}` : ''}
                                  </div>
                                ))}</div>
                              }
                              return d.constructions_existantes_detail ? `Oui — ${d.constructions_existantes_detail}` : 'Oui (aucune listée)'
                            })() : d.constructions_existantes === false ? 'Non' : '-'}
                          </div>

                          {/* Implantation, assainissement, raccordements */}
                          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a5c3a', marginBottom: 6 }}>Emplacement et raccordements</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: 13 }}>
                            <div><strong>Assainissement :</strong> {label(d.assainissement)}</div>
                            <div><strong>Raccordements :</strong> {raccordements.length > 0 ? raccordements.join(', ') : '-'}</div>
                            <div style={{ gridColumn: '1 / -1' }}><strong>Implantation :</strong> {d.implantation_description || '-'}</div>
                          </div>

                          {/* Photos terrain */}
                          {photos.length > 0 && (
                            <>
                              <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#1a5c3a', marginBottom: 6 }}>Photos terrain ({photos.length}/5)</div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {photos.map((photo, i) => (
                                  <a key={i} href={photo.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: 80, height: 60, borderRadius: 6, overflow: 'hidden', border: '1px solid #e8e7e4' }}>
                                    <img src={photo.url} alt={photo.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                  </a>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Documents client */}
                  {projectDocs[p.id] && (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>Documents client</div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownloadAll(p) }}
                          disabled={zipping === p.id}
                          style={{
                            padding: '6px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff',
                            fontSize: 13, fontWeight: 600, cursor: zipping === p.id ? 'default' : 'pointer',
                            opacity: zipping === p.id ? 0.6 : 1, color: '#1a5c3a',
                          }}
                        >
                          {zipping === p.id ? 'Téléchargement...' : '📥 Télécharger tout (.zip)'}
                        </button>
                      </div>
                      {projectDocs[p.id].filter(d => d.uploaded_by === 'client').length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {projectDocs[p.id].filter(d => d.uploaded_by === 'client').map(doc => (
                            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11 }}>📄</span>
                                <span style={{ fontSize: 13 }}>{doc.file_name}</span>
                                <span style={{ fontSize: 11, color: '#888' }}>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                              </div>
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: 12, color: '#1a5c3a', fontWeight: 600, textDecoration: 'none' }}>
                                Télécharger
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Aucun document client pour le moment.</p>
                      )}
                    </div>
                  )}

                  {/* Documents admin (dossier livré) */}
                  {projectDocs[p.id] && (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Dossier livré</div>
                      {projectDocs[p.id].filter(d => d.uploaded_by === 'admin').length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                          {projectDocs[p.id].filter(d => d.uploaded_by === 'admin').map(doc => (
                            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11 }}>📦</span>
                                <span style={{ fontSize: 13 }}>{doc.file_name}</span>
                                <span style={{ fontSize: 11, color: '#888' }}>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: 12, color: '#1a5c3a', fontWeight: 600, textDecoration: 'none' }}>
                                  Voir
                                </a>
                                <span onClick={async (e) => {
                                  e.stopPropagation()
                                  await deleteDocument(doc.id, doc.file_url)
                                  const docs = await getDocuments(p.id)
                                  setProjectDocs(prev => ({ ...prev, [p.id]: docs }))
                                }} style={{ color: '#c0392b', cursor: 'pointer', fontSize: 13, marginLeft: 12 }}>
                                  Supprimer
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <label style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                        background: '#1a5c3a', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: adminUploading === p.id ? 'default' : 'pointer', opacity: adminUploading === p.id ? 0.6 : 1,
                      }}>
                        {adminUploading === p.id ? 'Envoi en cours...' : '📤 Uploader le dossier final'}
                        <input type="file" multiple style={{ display: 'none' }}
                          onChange={(e) => handleAdminUpload(e, p.id)}
                          disabled={adminUploading === p.id} />
                      </label>
                    </div>
                  )}

                  {/* Messagerie client */}
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Messagerie client</div>
                    <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(!projectMessages[p.id] || projectMessages[p.id].length === 0) ? (
                        <div style={{ fontSize: 13, color: '#888' }}>Aucun message</div>
                      ) : (
                        projectMessages[p.id].map(msg => (
                          <div key={msg.id} style={{
                            alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                          }}>
                            <div style={{
                              padding: '8px 12px', borderRadius: 10, fontSize: 13, lineHeight: 1.4,
                              background: msg.sender === 'admin' ? '#1a5c3a' : '#f5f4f2',
                              color: msg.sender === 'admin' ? '#fff' : '#1c1c1a',
                            }}>
                              {msg.content}
                            </div>
                            <div style={{ fontSize: 10, color: '#888', marginTop: 2, textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>
                              {msg.sender === 'admin' ? 'Vous' : p.first_name} · {new Date(msg.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={adminReply[p.id] || ''}
                        onChange={e => setAdminReply(prev => ({ ...prev, [p.id]: e.target.value }))}
                        onKeyDown={async e => {
                          if (e.key === 'Enter' && adminReply[p.id]?.trim()) {
                            e.stopPropagation()
                            await sendMessage(p.id, 'admin', adminReply[p.id].trim())
                            setAdminReply(prev => ({ ...prev, [p.id]: '' }))
                            const msgs = await getMessages(p.id)
                            setProjectMessages(prev => ({ ...prev, [p.id]: msgs }))
                          }
                        }}
                        onClick={e => e.stopPropagation()}
                        placeholder="Répondre au client..."
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, outline: 'none' }}
                      />
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (!adminReply[p.id]?.trim()) return
                          await sendMessage(p.id, 'admin', adminReply[p.id].trim())
                          setAdminReply(prev => ({ ...prev, [p.id]: '' }))
                          const msgs = await getMessages(p.id)
                          setProjectMessages(prev => ({ ...prev, [p.id]: msgs }))
                        }}
                        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1a5c3a', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Envoyer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
