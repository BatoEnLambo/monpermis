'use client'

import { useState, useEffect } from 'react'
import JSZip from 'jszip'
import { supabase } from '../../lib/supabase'
import { uploadFile, getDocuments, deleteDocument } from '../../lib/storage'
import { getMessages, sendMessage, markAsRead } from '../../lib/messages'
import AdminNav from '../../components/AdminNav'
import { formatOuvrageType, getOuvrageType, computeOuvrageProgress } from '../../src/config/ouvrageTypes'

const STATUS_LABELS = {
  pending: '🟡 En attente de paiement',
  paid: '🟢 Payé',
  in_progress: '🔵 En cours',
  review: '🟣 En relecture',
  delivered: '📦 Livré',
}

const STATUS_OPTIONS = ['pending', 'paid', 'in_progress', 'review', 'delivered']

export default function AdminPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [projectDocs, setProjectDocs] = useState({})
  const [adminUploading, setAdminUploading] = useState(null)
  const [projectMessages, setProjectMessages] = useState({})
  const [adminReply, setAdminReply] = useState({})
  const [projectDetails, setProjectDetails] = useState({})
  const [projectOuvrages, setProjectOuvrages] = useState({})
  const [projectPhotos, setProjectPhotos] = useState({})
  const [projectCroquis, setProjectCroquis] = useState({})
  const [zipping, setZipping] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [])

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
    // Fetch project_details dès que le project est payé, quel que soit project_type
    // (le système d'ouvrages est universel).
    const proj = projects.find(pr => pr.id === projectId)
    if (proj && proj.status !== 'pending') {
      fetchProjectDetails(projectId)
    }
    // Fetch ouvrages (tous les projets sont susceptibles d'en avoir)
    if (!projectOuvrages[projectId]) {
      try {
        const { data: ouvragesData } = await supabase
          .from('project_ouvrages')
          .select('*')
          .eq('project_id', projectId)
          .order('position', { ascending: true })
        setProjectOuvrages(prev => ({ ...prev, [projectId]: ouvragesData || [] }))
      } catch (err) {
        console.error('Error loading ouvrages:', err)
      }
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

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
      <AdminNav onRefresh={fetchProjects} />

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
                  {p.status !== 'pending' && projectDetails[p.id] && (() => {
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
                    {p.title && (
                      <div style={{ gridColumn: '1 / -1' }}><strong>Titre :</strong> {p.title}</div>
                    )}
                    <div><strong>Type :</strong> {p.project_type === 'custom' ? 'Devis custom' : (p.project_type || '-')}</div>
                    <div><strong>Adresse :</strong> {p.address ? `${p.address}, ${p.postal_code || ''} ${p.city || ''}`.trim() : 'À compléter'}</div>
                    <div><strong>Surface :</strong> {p.surface ? `${p.surface} m²` : '-'}</div>
                    <div><strong>Niveaux :</strong> {p.floors || '-'}</div>
                    <div><strong>Chambres :</strong> {p.rooms || '-'}</div>
                    <div><strong>Toiture :</strong> {p.roof_type || '-'}</div>
                    <div><strong>Style :</strong> {p.style || '-'}</div>
                    <div><strong>Email :</strong> {p.email || '-'}</div>
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

                  {/* Ouvrages déclarés par le client */}
                  {(() => {
                    const list = projectOuvrages[p.id] || []
                    const fmtDim = (v, unit) => v == null || v === '' ? '—' : `${v} ${unit}`
                    const fmtNsp = (v, unknown, unit) => unknown ? 'NSP' : (v == null || v === '' ? '—' : `${v} ${unit}`)
                    return (
                      <div style={{ marginTop: 16, padding: 12, background: '#fafaf9', borderRadius: 10, border: '1px solid #e8e7e4' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#1c1c1a' }}>
                          Ouvrages ({list.length})
                        </div>
                        {list.length === 0 ? (
                          <div style={{ fontSize: 12, color: '#888' }}>Aucun ouvrage déclaré.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {list.map(o => {
                              const type = getOuvrageType(o.type)
                              const data = o.data || {}
                              const dims = data.dimensions || {}
                              const mat = data.materiaux || {}
                              const ouvs = data.ouvertures || []
                              const raccord = data.raccord_existant || {}
                              const serre = data.serre || {}
                              // Piscine
                              const bassin = data.bassin || {}
                              const carac = data.caracteristiques || {}
                              const securite = data.securite || {}
                              const abri = data.abri || {}
                              // Terrasse
                              const terrasse = data.terrasse || {}
                              const matTer = data.materiaux_terrasse || {}
                              const access = data.accessibilite || {}
                              // Mur / Clôture / Portail
                              const dimMur = data.dimensions_mur || {}
                              const matMur = data.materiaux_mur || {}
                              const portail = data.portail || {}
                              // Modification extérieure
                              const modifOuvs = data.modifications_ouvertures || []
                              const ravalement = data.ravalement || {}
                              const changMenuis = data.changement_menuiseries || []
                              const changCouv = data.changement_couverture || {}
                              const ite = data.ite || {}
                              const solaires = data.panneaux_solaires || {}
                              // Autre
                              const dimApprox = data.dimensions_approx || {}
                              const matPrinc = data.materiaux_principaux
                              const { filled, total } = computeOuvrageProgress(o)
                              const pct = total > 0 ? Math.round((filled / total) * 100) : 0
                              return (
                                <div key={o.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: '#fff', borderRadius: 8, border: '1px solid #eee' }}>
                                  <span style={{ fontSize: 20 }}>{type?.icon || '📦'}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1a' }}>{o.name}</div>
                                      <div style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 10, background: pct === 100 ? '#e8f5ee' : '#fff3e0', color: pct === 100 ? '#1a5c3a' : '#e65100' }}>{pct}%</div>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{formatOuvrageType(o.type, o.subtype)}</div>

                                    {/* Dimensions bâti */}
                                    {(dims.longueur_m || dims.largeur_m || dims.type_toiture || dims.hauteur_faitage_m || dims.hauteur_faitage_unknown) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 6, lineHeight: 1.5 }}>
                                        <strong>Dim.</strong> {fmtDim(dims.longueur_m, 'm')} × {fmtDim(dims.largeur_m, 'm')}
                                        {dims.type_toiture && ` · Toit ${dims.type_toiture}`}
                                        {(dims.hauteur_faitage_m != null || dims.hauteur_faitage_unknown) && ` · Faîtage ${fmtNsp(dims.hauteur_faitage_m, dims.hauteur_faitage_unknown, 'm')}`}
                                        {(dims.hauteur_egout_m != null || dims.hauteur_egout_unknown) && ` · Égout ${fmtNsp(dims.hauteur_egout_m, dims.hauteur_egout_unknown, 'm')}`}
                                        {(dims.pente_toiture_deg != null || dims.pente_toiture_unknown) && dims.type_toiture !== 'Toit plat' && ` · Pente ${fmtNsp(dims.pente_toiture_deg, dims.pente_toiture_unknown, '°')}`}
                                        {(dims.debords_cm != null || dims.debords_unknown) && ` · Débords ${fmtNsp(dims.debords_cm, dims.debords_unknown, 'cm')}`}
                                      </div>
                                    )}

                                    {/* Matériaux */}
                                    {(mat.materiau_facade || mat.materiau_couverture || mat.materiau_menuiseries) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 4, lineHeight: 1.5 }}>
                                        <strong>Matériaux.</strong>
                                        {mat.materiau_facade && ` Façade ${mat.materiau_facade === 'Autre' && mat.materiau_facade_autre ? mat.materiau_facade_autre : mat.materiau_facade}${mat.couleur_facade_ral ? ` (${mat.couleur_facade_ral})` : ''}`}
                                        {mat.materiau_couverture && ` · Couv. ${mat.materiau_couverture === 'Autre' && mat.materiau_couverture_autre ? mat.materiau_couverture_autre : mat.materiau_couverture}${mat.couleur_couverture ? ` (${mat.couleur_couverture})` : ''}`}
                                        {mat.materiau_menuiseries && ` · Menuis. ${mat.materiau_menuiseries === 'Autre' && mat.materiau_menuiseries_autre ? mat.materiau_menuiseries_autre : mat.materiau_menuiseries}${mat.couleur_menuiseries_ral ? ` (${mat.couleur_menuiseries_ral})` : ''}`}
                                      </div>
                                    )}

                                    {/* Ouvertures */}
                                    {ouvs.length > 0 && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 4, lineHeight: 1.5 }}>
                                        <strong>Ouvertures ({ouvs.length}).</strong> {ouvs.map((ou, i) => `${ou.nombre || 1}× ${ou.type || '?'} ${ou.largeur_cm || '?'}×${ou.hauteur_cm || '?'}cm${ou.facade ? ` (${ou.facade})` : ''}`).join(' · ')}
                                      </div>
                                    )}

                                    {/* Raccord existant */}
                                    {(raccord.description_existant || raccord.mode_raccord) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 4, lineHeight: 1.5 }}>
                                        <strong>Raccord.</strong>
                                        {raccord.mode_raccord && ` ${raccord.mode_raccord === 'Autre' && raccord.mode_raccord_autre ? raccord.mode_raccord_autre : raccord.mode_raccord}`}
                                        {raccord.hauteur_ajoutee_m != null && ` · +${raccord.hauteur_ajoutee_m}m`}
                                        {raccord.emprise_conservee && ` · ${raccord.emprise_conservee}`}
                                        {raccord.description_existant && <div style={{ fontStyle: 'italic', color: '#666', marginTop: 2, whiteSpace: 'pre-wrap' }}>{raccord.description_existant}</div>}
                                      </div>
                                    )}

                                    {/* Serre */}
                                    {(serre.longueur_m || serre.type_serre) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 4, lineHeight: 1.5 }}>
                                        <strong>Serre.</strong> {fmtDim(serre.longueur_m, 'm')} × {fmtDim(serre.largeur_m, 'm')}, faîtière {fmtDim(serre.hauteur_faitiere_m, 'm')}
                                        {serre.type_serre && ` · ${serre.type_serre}`}
                                        {serre.materiau_couverture_serre && ` · ${serre.materiau_couverture_serre}`}
                                      </div>
                                    )}

                                    {/* Piscine — bassin */}
                                    {(bassin.forme || bassin.longueur_m || bassin.diametre_m) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 4, lineHeight: 1.5 }}>
                                        <strong>Bassin.</strong>
                                        {bassin.forme && ` ${bassin.forme}`}
                                        {bassin.forme === 'Ronde'
                                          ? bassin.diametre_m != null && ` · Ø ${bassin.diametre_m}m`
                                          : (bassin.longueur_m || bassin.largeur_m) && ` · ${fmtDim(bassin.longueur_m, 'm')} × ${fmtDim(bassin.largeur_m, 'm')}`}
                                        {(bassin.profondeur_min_m != null || bassin.profondeur_max_m != null) && ` · Prof. ${fmtDim(bassin.profondeur_min_m, 'm')}→${fmtDim(bassin.profondeur_max_m, 'm')}`}
                                      </div>
                                    )}

                                    {/* Piscine — caractéristiques enterrée/semi */}
                                    {(carac.type_construction || carac.revetement || carac.local_technique || carac.chauffage) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 4, lineHeight: 1.5 }}>
                                        <strong>Caract.</strong>
                                        {carac.type_construction && ` ${carac.type_construction === 'Autre' && carac.type_construction_autre ? carac.type_construction_autre : carac.type_construction}`}
                                        {carac.revetement && ` · Rev. ${carac.revetement === 'Autre' && carac.revetement_autre ? carac.revetement_autre : carac.revetement}`}
                                        {carac.local_technique && ` · Local ${carac.local_technique}`}
                                        {carac.chauffage && ` · Chauff. ${carac.chauffage}`}
                                      </div>
                                    )}

                                    {/* Piscine — caractéristiques hors-sol */}
                                    {(carac.type_hors_sol || carac.hauteur_bassin_m != null || carac.habillage) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 4, lineHeight: 1.5 }}>
                                        <strong>Hors-sol.</strong>
                                        {carac.type_hors_sol && ` ${carac.type_hors_sol}`}
                                        {carac.hauteur_bassin_m != null && ` · H ${carac.hauteur_bassin_m}m`}
                                        {carac.habillage && ` · Habillage ${carac.habillage}`}
                                      </div>
                                    )}

                                    {/* Piscine — spa */}
                                    {(carac.nombre_places != null || carac.type_encastrement || carac.abri_spa) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 4, lineHeight: 1.5 }}>
                                        <strong>Spa.</strong>
                                        {carac.nombre_places != null && ` ${carac.nombre_places} places`}
                                        {carac.type_encastrement && ` · ${carac.type_encastrement}`}
                                        {carac.abri_spa && ` · Abri ${carac.abri_spa}`}
                                      </div>
                                    )}

                                    {/* Piscine — sécurité */}
                                    {Array.isArray(securite.dispositifs) && securite.dispositifs.length > 0 && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 4, lineHeight: 1.5 }}>
                                        <strong>Sécurité.</strong> {securite.dispositifs.join(', ')}
                                      </div>
                                    )}

                                    {/* Abri de piscine */}
                                    {(abri.type_abri || abri.longueur_m != null) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 4, lineHeight: 1.5 }}>
                                        <strong>Abri.</strong>
                                        {abri.type_abri && ` ${abri.type_abri}`}
                                        {abri.mobile && ` · ${abri.mobile}`}
                                        {abri.materiau_structure && ` · Struct. ${abri.materiau_structure}`}
                                        {abri.materiau_parois && ` · Parois ${abri.materiau_parois}`}
                                        {(abri.longueur_m || abri.largeur_m) && ` · ${fmtDim(abri.longueur_m, 'm')} × ${fmtDim(abri.largeur_m, 'm')}`}
                                      </div>
                                    )}

                                    {/* Terrasse — dimensions */}
                                    {(terrasse.longueur_m || terrasse.largeur_m || terrasse.hauteur_au_dessus_sol_m != null || terrasse.hauteur_au_dessus_sol_unknown) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 6, lineHeight: 1.5 }}>
                                        <strong>Dim.</strong> {fmtDim(terrasse.longueur_m, 'm')} × {fmtDim(terrasse.largeur_m, 'm')}
                                        {(terrasse.hauteur_au_dessus_sol_m != null || terrasse.hauteur_au_dessus_sol_unknown) && ` · H/sol ${fmtNsp(terrasse.hauteur_au_dessus_sol_m, terrasse.hauteur_au_dessus_sol_unknown, 'm')}`}
                                      </div>
                                    )}

                                    {/* Terrasse — matériaux */}
                                    {(matTer.materiau_revetement || matTer.structure_portante) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 4, lineHeight: 1.5 }}>
                                        <strong>Matériaux.</strong>
                                        {matTer.materiau_revetement && ` ${matTer.materiau_revetement === 'Autre' && matTer.materiau_revetement_autre ? matTer.materiau_revetement_autre : matTer.materiau_revetement}`}
                                        {matTer.structure_portante && ` · Struct. ${matTer.structure_portante}`}
                                        {matTer.essence_bois && ` · ${matTer.essence_bois}`}
                                        {matTer.sens_pose && ` · Pose ${matTer.sens_pose}`}
                                      </div>
                                    )}

                                    {/* Terrasse — accessibilité */}
                                    {(access.acces || access.garde_corps) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 4, lineHeight: 1.5 }}>
                                        <strong>Accès.</strong>
                                        {access.acces && ` ${access.acces}`}
                                        {access.garde_corps && ` · Garde-corps ${access.garde_corps}${access.hauteur_garde_corps_m != null ? ` (${access.hauteur_garde_corps_m}m)` : ''}`}
                                      </div>
                                    )}

                                    {/* Mur / Clôture — dimensions */}
                                    {(dimMur.longueur_m != null || dimMur.hauteur_m != null || dimMur.hauteur_variable) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 6, lineHeight: 1.5 }}>
                                        <strong>Dim.</strong> L {fmtDim(dimMur.longueur_m, 'm')}
                                        {dimMur.hauteur_variable
                                          ? ` · H ${fmtDim(dimMur.hauteur_min_m, 'm')}→${fmtDim(dimMur.hauteur_max_m, 'm')}`
                                          : dimMur.hauteur_m != null && ` · H ${dimMur.hauteur_m}m`}
                                      </div>
                                    )}

                                    {/* Mur / Clôture — matériaux */}
                                    {(matMur.materiau || matMur.type_cloture) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 4, lineHeight: 1.5 }}>
                                        <strong>Matériaux.</strong>
                                        {matMur.materiau && ` ${matMur.materiau === 'Autre' && matMur.materiau_autre ? matMur.materiau_autre : matMur.materiau}`}
                                        {matMur.parement && ` · ${matMur.parement}`}
                                        {matMur.type_cloture && ` ${matMur.type_cloture === 'Autre' && matMur.type_cloture_autre ? matMur.type_cloture_autre : matMur.type_cloture}`}
                                        {matMur.soubassement && ` · Soub. ${matMur.soubassement}`}
                                        {matMur.occultation && ` · Occ. ${matMur.occultation}`}
                                      </div>
                                    )}

                                    {/* Portail */}
                                    {(portail.type_ouverture || portail.materiau || portail.largeur_m != null) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 4, lineHeight: 1.5 }}>
                                        <strong>Portail.</strong>
                                        {portail.type_ouverture && ` ${portail.type_ouverture}`}
                                        {(portail.largeur_m != null || portail.hauteur_m != null) && ` · ${fmtDim(portail.largeur_m, 'm')} × ${fmtDim(portail.hauteur_m, 'm')}`}
                                        {portail.materiau && ` · ${portail.materiau === 'Autre' && portail.materiau_autre ? portail.materiau_autre : portail.materiau}`}
                                        {portail.motorisation && ` · ${portail.motorisation}`}
                                        {portail.avec_piliers && (
                                          <> · Piliers {portail.materiau_piliers || '?'}{portail.chapeaux_piliers && portail.chapeaux_piliers !== 'Aucun' ? ` (chapeaux ${portail.chapeaux_piliers})` : ''}{portail.hauteur_piliers_m != null ? ` H ${portail.hauteur_piliers_m}m` : ''}</>
                                        )}
                                      </div>
                                    )}

                                    {/* Modification extérieure : ouvertures */}
                                    {modifOuvs.length > 0 && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 6, lineHeight: 1.5 }}>
                                        <strong>Modifs ouvertures ({modifOuvs.length}).</strong>
                                        <div style={{ marginLeft: 8, marginTop: 2 }}>
                                          {modifOuvs.map((m, i) => (
                                            <div key={i} style={{ fontSize: 11, color: '#666' }}>
                                              • {m.action || '?'} {m.type_ouverture || '?'} {m.largeur_cm || '?'}×{m.hauteur_cm || '?'}cm {m.facade ? `(${m.facade})` : ''}
                                              {m.dimensions_avant && ` · avant ${m.dimensions_avant}`}
                                              {m.materiau_menuiserie && ` · ${m.materiau_menuiserie}`}
                                              {m.couleur_ral && ` ${m.couleur_ral}`}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Ravalement */}
                                    {(ravalement.materiau_actuel || ravalement.materiau_futur || ravalement.surface_totale_m2 != null) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 6, lineHeight: 1.5 }}>
                                        <strong>Ravalement.</strong>
                                        {ravalement.surface_totale_m2 != null && ` ${ravalement.surface_totale_m2}m²`}
                                        {Array.isArray(ravalement.facades_concernees) && ravalement.facades_concernees.length > 0 && ` · ${ravalement.facades_concernees.join('/')}`}
                                        {(ravalement.materiau_actuel || ravalement.materiau_futur) && ` · ${ravalement.materiau_actuel || '?'} → ${ravalement.materiau_futur || '?'}`}
                                        {(ravalement.couleur_actuelle || ravalement.couleur_future_ral) && ` · ${ravalement.couleur_actuelle || '?'} → ${ravalement.couleur_future_ral || '?'}`}
                                        {ravalement.changement_aspect && ' · ✓ change aspect'}
                                      </div>
                                    )}

                                    {/* Changement menuiseries */}
                                    {changMenuis.length > 0 && (() => {
                                      const totalUnits = changMenuis.reduce((s, m) => s + (parseInt(m.nombre, 10) || 0), 0)
                                      return (
                                        <div style={{ fontSize: 11, color: '#44433f', marginTop: 6, lineHeight: 1.5 }}>
                                          <strong>Menuiseries ({changMenuis.length} type{changMenuis.length > 1 ? 's' : ''}, {totalUnits} unité{totalUnits > 1 ? 's' : ''}).</strong>
                                          <div style={{ marginLeft: 8, marginTop: 2 }}>
                                            {changMenuis.map((m, i) => (
                                              <div key={i} style={{ fontSize: 11, color: '#666' }}>
                                                • {m.nombre || 1}× {m.type || '?'}
                                                {m.dimensions_standard && ` · ${m.dimensions_standard}`}
                                                {(m.largeur_cm || m.hauteur_cm) && ` (${m.largeur_cm || '?'}×${m.hauteur_cm || '?'}cm)`}
                                                {(m.materiau_actuel || m.materiau_futur) && ` · ${m.materiau_actuel || '?'} → ${m.materiau_futur || '?'}`}
                                                {m.vitrage && ` · ${m.vitrage}`}
                                                {m.couleur_future_ral && ` · ${m.couleur_future_ral}`}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )
                                    })()}

                                    {/* Changement couverture */}
                                    {(changCouv.materiau_actuel || changCouv.materiau_futur || changCouv.surface_totale_m2 != null) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 6, lineHeight: 1.5 }}>
                                        <strong>Couverture.</strong>
                                        {changCouv.surface_totale_m2 != null && ` ${changCouv.surface_totale_m2}m²`}
                                        {(changCouv.materiau_actuel || changCouv.materiau_futur) && ` · ${changCouv.materiau_actuel || '?'} → ${changCouv.materiau_futur || '?'}`}
                                        {(changCouv.couleur_actuelle || changCouv.couleur_future) && ` · ${changCouv.couleur_actuelle || '?'} → ${changCouv.couleur_future || '?'}`}
                                        {changCouv.changement_pente && ` · Pente ${changCouv.pente_avant_deg ?? '?'}° → ${changCouv.pente_apres_deg ?? '?'}°`}
                                        {changCouv.isolation_sous_toiture && ' · + isolation sous-toiture'}
                                      </div>
                                    )}

                                    {/* ITE */}
                                    {(ite.materiau_isolant || ite.surface_totale_m2 != null) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 6, lineHeight: 1.5 }}>
                                        <strong>ITE.</strong>
                                        {ite.surface_totale_m2 != null && ` ${ite.surface_totale_m2}m²`}
                                        {Array.isArray(ite.facades_concernees) && ite.facades_concernees.length > 0 && ` · ${ite.facades_concernees.join('/')}`}
                                        {ite.materiau_isolant && ` · ${ite.materiau_isolant}`}
                                        {ite.epaisseur_cm != null && ` ${ite.epaisseur_cm}cm`}
                                        {ite.parement_final && ` · ${ite.parement_final}`}
                                        {ite.couleur_finale_ral && ` · ${ite.couleur_finale_ral}`}
                                        {ite.surepaisseur_cm != null && ` · surép. ${ite.surepaisseur_cm}cm`}
                                      </div>
                                    )}

                                    {/* Panneaux solaires */}
                                    {(solaires.type || solaires.nombre_panneaux != null) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 6, lineHeight: 1.5 }}>
                                        <strong>Solaires.</strong>
                                        {solaires.type && ` ${solaires.type}`}
                                        {solaires.nombre_panneaux != null && ` · ${solaires.nombre_panneaux} panneaux`}
                                        {solaires.surface_totale_m2 != null && ` · ${solaires.surface_totale_m2}m²`}
                                        {solaires.puissance_kwc != null && ` · ${solaires.puissance_kwc}kWc`}
                                        {solaires.implantation && ` · ${solaires.implantation}`}
                                        {solaires.pan_toiture && ` · ${solaires.pan_toiture}`}
                                        {(solaires.orientation_deg != null || solaires.inclinaison_deg != null) && ` · Orient. ${solaires.orientation_deg ?? '?'}°/Incl. ${solaires.inclinaison_deg ?? '?'}°`}
                                        {solaires.couleur_panneaux && ` · ${solaires.couleur_panneaux}`}
                                        {solaires.raccordement && ` · ${solaires.raccordement}`}
                                      </div>
                                    )}

                                    {/* Autre — dimensions approximatives */}
                                    {(dimApprox.surface_au_sol_m2 != null || dimApprox.hauteur_m != null || dimApprox.longueur_m != null || dimApprox.largeur_m != null) && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 6, lineHeight: 1.5 }}>
                                        <strong>Dim. approx.</strong>
                                        {dimApprox.surface_au_sol_m2 != null && ` ${dimApprox.surface_au_sol_m2}m²`}
                                        {(dimApprox.longueur_m != null || dimApprox.largeur_m != null) && ` · ${fmtDim(dimApprox.longueur_m, 'm')} × ${fmtDim(dimApprox.largeur_m, 'm')}`}
                                        {dimApprox.hauteur_m != null && ` · H ${dimApprox.hauteur_m}m`}
                                      </div>
                                    )}

                                    {/* Autre — matériaux principaux */}
                                    {matPrinc && typeof matPrinc === 'string' && matPrinc.trim() && (
                                      <div style={{ fontSize: 11, color: '#44433f', marginTop: 4, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                        <strong>Matériaux.</strong> {matPrinc}
                                      </div>
                                    )}

                                    {/* Commentaire libre du client */}
                                    {data.commentaire && (
                                      <div style={{ fontSize: 11, color: '#1a5c3a', marginTop: 6, padding: '6px 8px', background: '#e8f5ee', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                                        💬 {data.commentaire}
                                      </div>
                                    )}

                                    {/* Ancienne description_libre (type autre) */}
                                    {o.description_libre && (
                                      <div style={{ fontSize: 12, color: '#44433f', marginTop: 4, whiteSpace: 'pre-wrap' }}>{o.description_libre}</div>
                                    )}
                                    {(o.photo_urls || []).length > 0 && (
                                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                                        {o.photo_urls.map(url => (
                                          <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                                            <img src={url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} />
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                    {/* Croquis de l'ouvrage (data.croquis.photo_urls) */}
                                    {(() => {
                                      const croquisUrls = Array.isArray(data?.croquis?.photo_urls) ? data.croquis.photo_urls : []
                                      if (croquisUrls.length === 0) return null
                                      const isPdf = (u) => (u || '').toLowerCase().endsWith('.pdf')
                                      return (
                                        <div style={{ marginTop: 8 }}>
                                          <div style={{ fontSize: 11, fontWeight: 600, color: '#1a5c3a', marginBottom: 4 }}>
                                            Croquis ({croquisUrls.length})
                                          </div>
                                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {croquisUrls.map(url => (
                                              <a key={url} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
                                                {isPdf(url) ? (
                                                  <div style={{ width: 48, height: 48, borderRadius: 4, border: '1px solid #eee', background: '#fafaf9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#44433f' }}>
                                                    PDF
                                                  </div>
                                                ) : (
                                                  <img src={url} alt="croquis" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} />
                                                )}
                                              </a>
                                            ))}
                                          </div>
                                        </div>
                                      )
                                    })()}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* Fiche technique client (tous types, dès que le project est payé) */}
                  {p.status !== 'pending' && projectDetails[p.id] && (() => {
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
