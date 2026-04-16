'use client'

import { useState, useEffect } from 'react'
import JSZip from 'jszip'
import { supabase } from '../../lib/supabase'
import { uploadFile, getDocuments, deleteDocument } from '../../lib/storage'
import { getMessages, sendMessage, markAsRead } from '../../lib/messages'
import AdminNav from '../../components/AdminNav'
import { formatOuvrageType, getOuvrageType, computeOuvrageProgress } from '../../src/config/ouvrageTypes'
import { ui } from '../../lib/ui'

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

  const computeSectionStatus = (d, photos, ouvrages) => {
    if (!d) return { progress: 0, sections: [] }

    // Coordonnées (8 champs CERFA)
    let coordCount = 0
    if (d.client_civilite) coordCount++
    if (d.client_nom) coordCount++
    if (d.client_prenom) coordCount++
    if (d.client_date_naissance) coordCount++
    if (d.client_commune_naissance) coordCount++
    if (d.client_departement_naissance) coordCount++
    if (d.client_telephone) coordCount++
    if (d.client_email) coordCount++

    // Ouvrages (calculé depuis la liste d'ouvrages répétables)
    const ouvragesList = Array.isArray(ouvrages) ? ouvrages : []
    let ouvragesFilled = 0
    let ouvragesTotal = 0
    for (const o of ouvragesList) {
      const { filled, total } = computeOuvrageProgress(o)
      ouvragesFilled += filled
      ouvragesTotal += total
    }
    const ouvragesPct = ouvragesTotal > 0 ? Math.round((ouvragesFilled / ouvragesTotal) * 100) : 0
    const ouvragesStatus = ouvragesList.length === 0 ? 'empty' : ouvragesPct === 100 ? 'complete' : 'partial'

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

    // Photos terrain (5 max)
    const photoCount = Math.min((photos || []).length, 5)

    // Progression globale pondérée :
    //   Coordonnées 20% + Ouvrages 50% + Terrain 20% + Photos 10%
    const coordPct = coordCount / 8
    const terrainPct = terrainCount / 5
    const photoPct = photoCount / 5
    const ouvragesRatio = ouvragesTotal > 0 ? ouvragesFilled / ouvragesTotal : 0
    const progress = Math.round((0.2 * coordPct + 0.5 * ouvragesRatio + 0.2 * terrainPct + 0.1 * photoPct) * 100)

    const status = (filled, max) => filled === max ? 'complete' : filled > 0 ? 'partial' : 'empty'

    const sections = [
      { name: 'Coordonnées', status: status(coordCount, 8), filled: coordCount, max: 8, reason: 'nécessaire pour le CERFA' },
      { name: `Ouvrages ${ouvragesList.length}`, status: ouvragesStatus, detail: `${ouvragesPct}%`, reason: 'dimensions, matériaux et croquis nécessaires pour démarrer les plans' },
      { name: 'Terrain', status: status(terrainCount, 5), filled: terrainCount, max: 5, reason: 'nécessaire pour le plan de masse' },
      { name: 'Photos terrain', status: status(photoCount, 5), filled: photoCount, max: 5, reason: 'nécessaires pour l\'insertion paysagère' },
    ]

    return { progress, sections }
  }

  const computeDetailsProgress = (d, photos, ouvrages) => {
    return computeSectionStatus(d, photos, ouvrages).progress
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
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px', fontFamily: ui.font.sans, color: ui.color.text }}>
      <AdminNav onRefresh={fetchProjects} />

      <div style={{ display: 'flex', gap: ui.space.md, marginBottom: ui.space.xl, flexWrap: 'wrap' }}>
        <div style={{ padding: `${ui.space.sm}px 14px`, background: ui.color.bgSuccess, borderRadius: ui.radius.md, fontSize: ui.size.sm, fontWeight: ui.weight.semibold }}>
          Total : {projects.length}
        </div>
        <div style={{ padding: `${ui.space.sm}px 14px`, background: ui.color.bgSuccess, borderRadius: ui.radius.md, fontSize: ui.size.sm, fontWeight: ui.weight.semibold, color: ui.color.primary }}>
          Payés : {projects.filter(p => p.status !== 'pending').length}
        </div>
        <div style={{ padding: `${ui.space.sm}px 14px`, background: ui.color.bgWarning, borderRadius: ui.radius.md, fontSize: ui.size.sm, fontWeight: ui.weight.semibold, color: ui.color.textWarning }}>
          En attente : {projects.filter(p => p.status === 'pending').length}
        </div>
        {totalUnread > 0 && (
          <div style={{ padding: `${ui.space.sm}px 14px`, background: ui.color.bgWarning, borderRadius: ui.radius.md, fontSize: ui.size.sm, fontWeight: ui.weight.semibold, color: ui.color.textWarning }}>
            💬 {totalUnread} message{totalUnread > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Messages non lus */}
      {totalUnread > 0 && (
        <div style={{ background: ui.color.bgWarning, border: '1px solid #ffe0b2', borderRadius: ui.radius.xl, padding: ui.space.xl, marginBottom: ui.space.xxl }}>
          <div style={{ fontSize: ui.size.lg, fontWeight: ui.weight.bold, marginBottom: ui.space.md, display: 'flex', alignItems: 'center', gap: ui.space.sm }}>
            <span style={{ background: ui.color.textWarning, color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: ui.size.sm, fontWeight: ui.weight.bold }}>{totalUnread}</span>
            message{totalUnread > 1 ? 's' : ''} non lu{totalUnread > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: ui.space.sm }}>
            {projects.filter(p => getUnreadCount(p) > 0).map(p => {
              const unread = getUnreadCount(p)
              const lastMsg = (projectMessages[p.id] || []).filter(m => m.sender === 'client').slice(-1)[0]
              return (
                <div key={p.id}
                  onClick={() => {
                    handleSelectProject(p.id)
                    document.getElementById(`project-${p.id}`)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${ui.space.md}px ${ui.space.lg}px`, background: '#fff', borderRadius: ui.radius.lg, cursor: 'pointer', border: '1px solid #ffe0b2', transition: 'background 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#fff8f0'}
                  onMouseOut={e => e.currentTarget.style.background = '#fff'}
                >
                  <div>
                    <div style={{ fontSize: ui.size.base, fontWeight: ui.weight.semibold }}>{p.first_name} {p.last_name} <span style={{ color: ui.color.textLight, fontWeight: ui.weight.regular }}>({p.reference})</span></div>
                    {lastMsg && <div style={{ fontSize: ui.size.sm, color: ui.color.textLight, marginTop: 2, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastMsg.content}</div>}
                  </div>
                  <span style={{ background: ui.color.textWarning, color: '#fff', borderRadius: ui.radius.xl, padding: '2px 10px', fontSize: ui.size.xs, fontWeight: ui.weight.bold }}>{unread}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loading ? (
        <p>Chargement...</p>
      ) : projects.length === 0 ? (
        <p style={{ color: ui.color.textLight }}>Aucun projet pour le moment.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: ui.space.sm }}>
          {projects.map(p => (
            <div key={p.id} id={`project-${p.id}`} style={{ border: `1px solid ${ui.color.border}`, borderRadius: ui.radius.lg, padding: ui.space.lg, background: '#fff', cursor: 'pointer' }}
              onClick={() => handleSelectProject(p.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: ui.space.sm }}>
                <div>
                  <span style={{ fontWeight: ui.weight.bold, fontSize: ui.size.md }}>{p.reference}</span>
                  <span style={{ color: ui.color.textLight, fontSize: ui.size.sm, marginLeft: ui.space.sm }}>{p.first_name} {p.last_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: ui.space.md }}>
                  <span style={{ fontSize: ui.size.md, fontWeight: ui.weight.semibold }}>{p.price ? p.price + ' €' : 'Sur devis'}</span>
                  {p.options && p.options.includes('RE2020') && (
                    <span style={{ fontSize: 10, fontWeight: ui.weight.semibold, padding: '2px 6px', borderRadius: ui.radius.sm, background: ui.color.bgSuccess, color: ui.color.primary }}>RE2020</span>
                  )}
                  <span style={{ fontSize: ui.size.xs }}>{STATUS_LABELS[p.status] || p.status}</span>
                  {p.status !== 'pending' && projectDetails[p.id] && (() => {
                    const pct = computeDetailsProgress(projectDetails[p.id], projectPhotos[p.id] || [], projectOuvrages[p.id] || [])
                    const cfg = pct === 100 ? { bg: ui.color.bgSuccess, color: ui.color.textSuccess, text: 'Complet' }
                      : pct >= 70 ? { bg: ui.color.bgWarning, color: ui.color.textWarning, text: 'Quasi complet' }
                      : pct > 0 ? { bg: '#fce4ec', color: ui.color.textError, text: 'Incomplet' }
                      : { bg: ui.color.bgMuted, color: ui.color.textLight, text: 'Vide' }
                    return <span style={{ fontSize: 11, fontWeight: ui.weight.semibold, padding: '2px 8px', borderRadius: ui.radius.md, background: cfg.bg, color: cfg.color }}>{pct}% — {cfg.text}</span>
                  })()}
                  {getUnreadCount(p) > 0 && (
                    <span style={{ background: ui.color.textWarning, color: '#fff', borderRadius: ui.radius.lg, padding: '2px 8px', fontSize: 11, fontWeight: ui.weight.bold, marginLeft: ui.space.sm }}>
                      {getUnreadCount(p)} msg
                    </span>
                  )}
                </div>
              </div>

              {selected === p.id && (
                <div style={{ marginTop: ui.space.lg, paddingTop: ui.space.lg, borderTop: `1px solid ${ui.color.border}`, fontSize: ui.size.base }} onClick={e => e.stopPropagation()}>
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
                    <div style={{ marginTop: ui.space.lg, padding: ui.space.md, background: ui.color.bgMuted, borderRadius: ui.radius.md }}>
                      <div style={{ fontSize: ui.size.xs, color: ui.color.textLight, marginBottom: ui.space.xs }}>Lien client :</div>
                      <a href={`/projet/${p.reference}?token=${p.token}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: ui.size.sm, color: ui.color.primary, wordBreak: 'break-all' }}>
                        /projet/{p.reference}?token={p.token}
                      </a>
                    </div>
                  )}

                  {/* Changement de statut */}
                  <div style={{ marginTop: ui.space.lg, display: 'flex', alignItems: 'center', gap: ui.space.sm }}>
                    <span style={{ fontSize: ui.size.sm, fontWeight: ui.weight.semibold }}>Changer le statut :</span>
                    <select
                      value={p.status}
                      onChange={(e) => { e.stopPropagation(); updateStatus(p.id, e.target.value) }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ padding: '6px 10px', borderRadius: ui.radius.sm, border: `1px solid ${ui.color.border}`, fontSize: ui.size.base }}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ouvrages déclarés par le client */}
                  {(() => {
                    const list = projectOuvrages[p.id] || []
                    const vUnit = (val, unit) => (val == null || val === '') ? '—' : `${val} ${unit}`
                    const vNsp = (val, unknown, unit) => unknown ? 'NSP' : vUnit(val, unit)
                    const matVal = (val, autre) => (val === 'Autre' && autre) ? autre : (val || '—')

                    // Style aligné sur les Groupes 1 (Informations client) et 3 (Terrain) :
                    // grille 2 colonnes serrées, sous-titres vert, séparateurs <hr>.
                    const GROW = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: 13 }
                    const GHDR = { fontSize: 12, fontWeight: 600, color: ui.color.primary, marginBottom: 6 }
                    const GHR = <hr style={{ border: 'none', borderTop: `1px solid ${ui.color.border}`, margin: '12px 0' }} />

                    const exportJson = (o) => {
                      const blob = new Blob([JSON.stringify({ name: o.name, type: o.type, subtype: o.subtype, data: o.data }, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `ouvrage-${(o.name || 'export').replace(/[^a-zA-Z0-9àâéèêëïîôùûüç _-]/gi, '_')}.json`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }

                    return (
                      <div style={{ marginTop: ui.space.lg }}>
                        <div style={{ fontSize: ui.size.base, fontWeight: ui.weight.bold, marginBottom: ui.space.md, color: ui.color.text }}>
                          Ouvrages ({list.length})
                        </div>
                        {list.length === 0 ? (
                          <div style={{ fontSize: ui.size.sm, color: ui.color.textLight }}>Aucun ouvrage déclaré.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: ui.space.md }}>
                            {list.map(o => {
                              const type = getOuvrageType(o.type)
                              const data = o.data || {}
                              const dims = data.dimensions || {}
                              const mat = data.materiaux || {}
                              const ouvs = data.ouvertures || []
                              const raccord = data.raccord_existant || {}
                              const serre = data.serre || {}
                              const bassin = data.bassin || {}
                              const carac = data.caracteristiques || {}
                              const securite = data.securite || {}
                              const abri = data.abri || {}
                              const terrasse = data.terrasse || {}
                              const matTer = data.materiaux_terrasse || {}
                              const access = data.accessibilite || {}
                              const dimMur = data.dimensions_mur || {}
                              const matMur = data.materiaux_mur || {}
                              const portail = data.portail || {}
                              const modifOuvs = data.modifications_ouvertures || []
                              const ravalement = data.ravalement || {}
                              const changMenuis = data.changement_menuiseries || []
                              const changCouv = data.changement_couverture || {}
                              const ite = data.ite || {}
                              const solaires = data.panneaux_solaires || {}
                              const dimApprox = data.dimensions_approx || {}
                              const matPrinc = data.materiaux_principaux
                              const { filled, total } = computeOuvrageProgress(o)
                              const pct = total > 0 ? Math.round((filled / total) * 100) : 0
                              const croquisUrls = Array.isArray(data?.croquis?.photo_urls) ? data.croquis.photo_urls : []
                              const isPdf = (u) => (u || '').toLowerCase().endsWith('.pdf')

                              // Déterminer quelles sections sont affichées pour gérer les séparateurs.
                              const hasDims = dims.longueur_m || dims.largeur_m || dims.type_toiture || dims.hauteur_faitage_m || dims.hauteur_faitage_unknown
                              const hasMat = mat.materiau_facade || mat.materiau_couverture || mat.materiau_menuiseries
                              const hasOuvs = ouvs.length > 0
                              const hasRaccord = raccord.description_existant || raccord.mode_raccord
                              const hasSerre = serre.longueur_m || serre.type_serre
                              const hasBassin = bassin.forme || bassin.longueur_m || bassin.diametre_m
                              const hasCarac = carac.type_construction || carac.revetement || carac.local_technique || carac.chauffage
                              const hasHorsSol = carac.type_hors_sol || carac.hauteur_bassin_m != null || carac.habillage
                              const hasSpa = carac.nombre_places != null || carac.type_encastrement || carac.abri_spa
                              const hasSecurite = Array.isArray(securite.dispositifs) && securite.dispositifs.length > 0
                              const hasAbri = abri.type_abri || abri.longueur_m != null
                              const hasTerDims = terrasse.longueur_m || terrasse.largeur_m || terrasse.hauteur_au_dessus_sol_m != null || terrasse.hauteur_au_dessus_sol_unknown
                              const hasTerMat = matTer.materiau_revetement || matTer.structure_portante
                              const hasTerAcc = access.acces || access.garde_corps
                              const hasMurDims = dimMur.longueur_m != null || dimMur.hauteur_m != null || dimMur.hauteur_variable
                              const hasMurMat = matMur.materiau || matMur.type_cloture
                              const hasPortail = portail.type_ouverture || portail.materiau || portail.largeur_m != null
                              const hasModifOuvs = modifOuvs.length > 0
                              const hasRaval = ravalement.materiau_actuel || ravalement.materiau_futur || ravalement.surface_totale_m2 != null
                              const hasMenuis = changMenuis.length > 0
                              const hasCouv = changCouv.materiau_actuel || changCouv.materiau_futur || changCouv.surface_totale_m2 != null
                              const hasIte = ite.materiau_isolant || ite.surface_totale_m2 != null
                              const hasSolaires = solaires.type || solaires.nombre_panneaux != null
                              const hasDimApprox = dimApprox.surface_au_sol_m2 != null || dimApprox.hauteur_m != null || dimApprox.longueur_m != null || dimApprox.largeur_m != null
                              const hasMatPrinc = matPrinc && typeof matPrinc === 'string' && matPrinc.trim()
                              const hasCroquis = croquisUrls.length > 0
                              const hasPhotos = (o.photo_urls || []).length > 0

                              // Permet d'insérer un <hr> entre blocs actifs consécutifs
                              // (pas avant le premier bloc — il est collé au header/croquis).
                              let firstShown = true
                              const maybeHr = (cond) => {
                                if (!cond) return null
                                if (firstShown) { firstShown = false; return null }
                                return GHR
                              }

                              return (
                                <div key={o.id} style={{ background: '#fff', border: `1px solid ${ui.color.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>

                                  {/* ── HEADER : icône + nom + type + % + bouton ── */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                    <span style={{ fontSize: 20 }}>{type?.icon || '📦'}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 14, fontWeight: 700, color: ui.color.text }}>{o.name}</div>
                                      <div style={{ fontSize: 12, color: ui.color.textLight, marginTop: 2 }}>{formatOuvrageType(o.type, o.subtype)}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: pct === 100 ? ui.color.bgSuccess : ui.color.bgWarning, color: pct === 100 ? ui.color.textSuccess : ui.color.textWarning }}>{pct}%</span>
                                      <button onClick={(e) => { e.stopPropagation(); exportJson(o) }} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${ui.color.border}`, background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: ui.color.primary }}>
                                        📋 Exporter JSON
                                      </button>
                                    </div>
                                  </div>

                                  {/* ── CROQUIS DU CLIENT (grand format, conservé) ── */}
                                  {hasCroquis && (
                                    <>
                                      {GHR}
                                      <div style={GHDR}>Croquis du client</div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {croquisUrls.map(url => isPdf(url) ? (
                                          <a key={url} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: ui.color.primary, textDecoration: 'none' }}>
                                            📄 Ouvrir le PDF
                                          </a>
                                        ) : (
                                          <a key={url} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                                            <img src={url} alt="croquis" style={{ maxWidth: 600, width: '100%', objectFit: 'contain', borderRadius: 8, border: `1px solid ${ui.color.border}` }} />
                                          </a>
                                        ))}
                                      </div>
                                    </>
                                  )}

                                  {/* ── Photos ouvrage ── */}
                                  {hasPhotos && (
                                    <>
                                      {GHR}
                                      <div style={GHDR}>Photos</div>
                                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {o.photo_urls.map(url => (
                                          <a key={url} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                                            <img src={url} alt="" style={{ maxWidth: 280, maxHeight: 200, objectFit: 'contain', borderRadius: 8, border: `1px solid ${ui.color.border}` }} />
                                          </a>
                                        ))}
                                      </div>
                                    </>
                                  )}

                                  {/* ── DIMENSIONS (bâti) ── */}
                                  {hasDims && (<>
                                    {maybeHr(hasDims)}
                                    <div style={GHDR}>Dimensions</div>
                                    <div style={GROW}>
                                      {dims.longueur_m != null && <div><strong>Longueur :</strong> {dims.longueur_m} m</div>}
                                      {dims.largeur_m != null && <div><strong>Largeur :</strong> {dims.largeur_m} m</div>}
                                      {(dims.hauteur_faitage_m != null || dims.hauteur_faitage_unknown) && <div><strong>Hauteur faîtage :</strong> {vNsp(dims.hauteur_faitage_m, dims.hauteur_faitage_unknown, 'm')}</div>}
                                      {(dims.hauteur_egout_m != null || dims.hauteur_egout_unknown) && <div><strong>Hauteur égout :</strong> {vNsp(dims.hauteur_egout_m, dims.hauteur_egout_unknown, 'm')}</div>}
                                      {dims.type_toiture && dims.type_toiture !== 'Toit plat' && (dims.pente_toiture_deg != null || dims.pente_toiture_unknown) && <div><strong>Pente toiture :</strong> {vNsp(dims.pente_toiture_deg, dims.pente_toiture_unknown, '°')}</div>}
                                      {(dims.debords_cm != null || dims.debords_unknown) && <div><strong>Débords :</strong> {vNsp(dims.debords_cm, dims.debords_unknown, 'cm')}</div>}
                                      {dims.type_toiture && <div><strong>Type toiture :</strong> {dims.type_toiture}</div>}
                                    </div>
                                  </>)}

                                  {/* ── MATÉRIAUX ── */}
                                  {hasMat && (<>
                                    {maybeHr(hasMat)}
                                    <div style={GHDR}>Matériaux</div>
                                    <div style={GROW}>
                                      {mat.materiau_facade && <div><strong>Façade :</strong> {matVal(mat.materiau_facade, mat.materiau_facade_autre)}{mat.couleur_facade_ral ? ` — ${mat.couleur_facade_ral}` : ''}</div>}
                                      {mat.materiau_couverture && <div><strong>Couverture :</strong> {matVal(mat.materiau_couverture, mat.materiau_couverture_autre)}{mat.couleur_couverture ? ` — ${mat.couleur_couverture}` : ''}</div>}
                                      {mat.materiau_menuiseries && <div><strong>Menuiseries :</strong> {matVal(mat.materiau_menuiseries, mat.materiau_menuiseries_autre)}{mat.couleur_menuiseries_ral ? ` — ${mat.couleur_menuiseries_ral}` : ''}</div>}
                                    </div>
                                  </>)}

                                  {/* ── OUVERTURES : liste simple, une ligne par ouverture ── */}
                                  {hasOuvs && (<>
                                    {maybeHr(hasOuvs)}
                                    <div style={GHDR}>Ouvertures ({ouvs.length})</div>
                                    <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                                      {ouvs.map((ou, i) => (
                                        <div key={i}>
                                          {ou.nombre && ou.nombre > 1 ? `${ou.nombre}× ` : ''}{ou.type || '—'}
                                          {(ou.largeur_cm && ou.hauteur_cm) ? ` — ${ou.largeur_cm} × ${ou.hauteur_cm} cm` : ''}
                                          {ou.facade ? ` (${ou.facade})` : ''}
                                        </div>
                                      ))}
                                    </div>
                                  </>)}

                                  {/* ── RACCORD À L'EXISTANT ── */}
                                  {hasRaccord && (<>
                                    {maybeHr(hasRaccord)}
                                    <div style={GHDR}>Raccord à l'existant</div>
                                    <div style={GROW}>
                                      {raccord.mode_raccord && <div><strong>Mode :</strong> {matVal(raccord.mode_raccord, raccord.mode_raccord_autre)}</div>}
                                      {raccord.hauteur_ajoutee_m != null && <div><strong>Hauteur ajoutée :</strong> {raccord.hauteur_ajoutee_m} m</div>}
                                      {raccord.emprise_conservee && <div><strong>Emprise conservée :</strong> {raccord.emprise_conservee}</div>}
                                    </div>
                                    {raccord.description_existant && (
                                      <div style={{ marginTop: 8, fontSize: 13 }}>
                                        <strong>Existant :</strong> <span style={{ whiteSpace: 'pre-wrap' }}>{raccord.description_existant}</span>
                                      </div>
                                    )}
                                  </>)}

                                  {/* ── SERRE ── */}
                                  {hasSerre && (<>
                                    {maybeHr(hasSerre)}
                                    <div style={GHDR}>Serre</div>
                                    <div style={GROW}>
                                      {serre.longueur_m && <div><strong>Longueur :</strong> {serre.longueur_m} m</div>}
                                      {serre.largeur_m && <div><strong>Largeur :</strong> {serre.largeur_m} m</div>}
                                      {serre.hauteur_faitiere_m && <div><strong>Hauteur faîtière :</strong> {serre.hauteur_faitiere_m} m</div>}
                                      {serre.type_serre && <div><strong>Type :</strong> {serre.type_serre}</div>}
                                      {serre.materiau_couverture_serre && <div><strong>Couverture :</strong> {serre.materiau_couverture_serre}</div>}
                                    </div>
                                  </>)}

                                  {/* ── PISCINE — BASSIN ── */}
                                  {hasBassin && (<>
                                    {maybeHr(hasBassin)}
                                    <div style={GHDR}>Bassin</div>
                                    <div style={GROW}>
                                      {bassin.forme && <div><strong>Forme :</strong> {bassin.forme}</div>}
                                      {bassin.forme === 'Ronde' && bassin.diametre_m != null && <div><strong>Diamètre :</strong> {bassin.diametre_m} m</div>}
                                      {bassin.forme !== 'Ronde' && bassin.longueur_m != null && <div><strong>Longueur :</strong> {bassin.longueur_m} m</div>}
                                      {bassin.forme !== 'Ronde' && bassin.largeur_m != null && <div><strong>Largeur :</strong> {bassin.largeur_m} m</div>}
                                      {bassin.profondeur_min_m != null && <div><strong>Profondeur min :</strong> {bassin.profondeur_min_m} m</div>}
                                      {bassin.profondeur_max_m != null && <div><strong>Profondeur max :</strong> {bassin.profondeur_max_m} m</div>}
                                    </div>
                                  </>)}

                                  {/* ── PISCINE — CARACTÉRISTIQUES ── */}
                                  {hasCarac && (<>
                                    {maybeHr(hasCarac)}
                                    <div style={GHDR}>Caractéristiques piscine</div>
                                    <div style={GROW}>
                                      {carac.type_construction && <div><strong>Construction :</strong> {matVal(carac.type_construction, carac.type_construction_autre)}</div>}
                                      {carac.revetement && <div><strong>Revêtement :</strong> {matVal(carac.revetement, carac.revetement_autre)}</div>}
                                      {carac.local_technique && <div><strong>Local technique :</strong> {carac.local_technique}</div>}
                                      {carac.chauffage && <div><strong>Chauffage :</strong> {carac.chauffage}</div>}
                                    </div>
                                  </>)}

                                  {/* ── PISCINE — HORS-SOL ── */}
                                  {hasHorsSol && (<>
                                    {maybeHr(hasHorsSol)}
                                    <div style={GHDR}>Hors-sol</div>
                                    <div style={GROW}>
                                      {carac.type_hors_sol && <div><strong>Type :</strong> {carac.type_hors_sol}</div>}
                                      {carac.hauteur_bassin_m != null && <div><strong>Hauteur bassin :</strong> {carac.hauteur_bassin_m} m</div>}
                                      {carac.habillage && <div><strong>Habillage :</strong> {carac.habillage}</div>}
                                    </div>
                                  </>)}

                                  {/* ── PISCINE — SPA ── */}
                                  {hasSpa && (<>
                                    {maybeHr(hasSpa)}
                                    <div style={GHDR}>Spa</div>
                                    <div style={GROW}>
                                      {carac.nombre_places != null && <div><strong>Places :</strong> {carac.nombre_places}</div>}
                                      {carac.type_encastrement && <div><strong>Encastrement :</strong> {carac.type_encastrement}</div>}
                                      {carac.abri_spa && <div><strong>Abri :</strong> {carac.abri_spa}</div>}
                                    </div>
                                  </>)}

                                  {/* ── PISCINE — SÉCURITÉ ── */}
                                  {hasSecurite && (<>
                                    {maybeHr(hasSecurite)}
                                    <div style={GHDR}>Sécurité</div>
                                    <div style={{ fontSize: 13 }}><strong>Dispositifs :</strong> {securite.dispositifs.join(', ')}</div>
                                  </>)}

                                  {/* ── ABRI DE PISCINE ── */}
                                  {hasAbri && (<>
                                    {maybeHr(hasAbri)}
                                    <div style={GHDR}>Abri piscine</div>
                                    <div style={GROW}>
                                      {abri.type_abri && <div><strong>Type :</strong> {abri.type_abri}</div>}
                                      {abri.mobile && <div><strong>Mobile :</strong> {abri.mobile}</div>}
                                      {abri.materiau_structure && <div><strong>Structure :</strong> {abri.materiau_structure}</div>}
                                      {abri.materiau_parois && <div><strong>Parois :</strong> {abri.materiau_parois}</div>}
                                      {(abri.longueur_m || abri.largeur_m) && <div><strong>Dimensions :</strong> {vUnit(abri.longueur_m, 'm')} × {vUnit(abri.largeur_m, 'm')}</div>}
                                    </div>
                                  </>)}

                                  {/* ── TERRASSE — DIMENSIONS ── */}
                                  {hasTerDims && (<>
                                    {maybeHr(hasTerDims)}
                                    <div style={GHDR}>Terrasse — dimensions</div>
                                    <div style={GROW}>
                                      {terrasse.longueur_m && <div><strong>Longueur :</strong> {terrasse.longueur_m} m</div>}
                                      {terrasse.largeur_m && <div><strong>Largeur :</strong> {terrasse.largeur_m} m</div>}
                                      {(terrasse.hauteur_au_dessus_sol_m != null || terrasse.hauteur_au_dessus_sol_unknown) && <div><strong>Hauteur / sol :</strong> {vNsp(terrasse.hauteur_au_dessus_sol_m, terrasse.hauteur_au_dessus_sol_unknown, 'm')}</div>}
                                    </div>
                                  </>)}

                                  {/* ── TERRASSE — MATÉRIAUX ── */}
                                  {hasTerMat && (<>
                                    {maybeHr(hasTerMat)}
                                    <div style={GHDR}>Terrasse — matériaux</div>
                                    <div style={GROW}>
                                      {matTer.materiau_revetement && <div><strong>Revêtement :</strong> {matVal(matTer.materiau_revetement, matTer.materiau_revetement_autre)}</div>}
                                      {matTer.structure_portante && <div><strong>Structure portante :</strong> {matTer.structure_portante}</div>}
                                      {matTer.essence_bois && <div><strong>Essence bois :</strong> {matTer.essence_bois}</div>}
                                      {matTer.sens_pose && <div><strong>Sens de pose :</strong> {matTer.sens_pose}</div>}
                                    </div>
                                  </>)}

                                  {/* ── TERRASSE — ACCESSIBILITÉ ── */}
                                  {hasTerAcc && (<>
                                    {maybeHr(hasTerAcc)}
                                    <div style={GHDR}>Terrasse — accessibilité</div>
                                    <div style={GROW}>
                                      {access.acces && <div><strong>Accès :</strong> {access.acces}</div>}
                                      {access.garde_corps && <div><strong>Garde-corps :</strong> {access.garde_corps}{access.hauteur_garde_corps_m != null ? ` (${access.hauteur_garde_corps_m} m)` : ''}</div>}
                                    </div>
                                  </>)}

                                  {/* ── MUR / CLÔTURE — DIMENSIONS ── */}
                                  {hasMurDims && (<>
                                    {maybeHr(hasMurDims)}
                                    <div style={GHDR}>Mur / clôture — dimensions</div>
                                    <div style={GROW}>
                                      {dimMur.longueur_m != null && <div><strong>Longueur :</strong> {dimMur.longueur_m} m</div>}
                                      {dimMur.hauteur_variable
                                        ? <div><strong>Hauteur :</strong> {vUnit(dimMur.hauteur_min_m, 'm')} → {vUnit(dimMur.hauteur_max_m, 'm')}</div>
                                        : dimMur.hauteur_m != null && <div><strong>Hauteur :</strong> {dimMur.hauteur_m} m</div>}
                                    </div>
                                  </>)}

                                  {/* ── MUR / CLÔTURE — MATÉRIAUX ── */}
                                  {hasMurMat && (<>
                                    {maybeHr(hasMurMat)}
                                    <div style={GHDR}>Mur / clôture — matériaux</div>
                                    <div style={GROW}>
                                      {matMur.materiau && <div><strong>Matériau :</strong> {matVal(matMur.materiau, matMur.materiau_autre)}</div>}
                                      {matMur.parement && <div><strong>Parement :</strong> {matMur.parement}</div>}
                                      {matMur.type_cloture && <div><strong>Type clôture :</strong> {matVal(matMur.type_cloture, matMur.type_cloture_autre)}</div>}
                                      {matMur.soubassement && <div><strong>Soubassement :</strong> {matMur.soubassement}</div>}
                                      {matMur.occultation && <div><strong>Occultation :</strong> {matMur.occultation}</div>}
                                    </div>
                                  </>)}

                                  {/* ── PORTAIL ── */}
                                  {hasPortail && (<>
                                    {maybeHr(hasPortail)}
                                    <div style={GHDR}>Portail</div>
                                    <div style={GROW}>
                                      {portail.type_ouverture && <div><strong>Ouverture :</strong> {portail.type_ouverture}</div>}
                                      {(portail.largeur_m != null || portail.hauteur_m != null) && <div><strong>Dimensions :</strong> {vUnit(portail.largeur_m, 'm')} × {vUnit(portail.hauteur_m, 'm')}</div>}
                                      {portail.materiau && <div><strong>Matériau :</strong> {matVal(portail.materiau, portail.materiau_autre)}</div>}
                                      {portail.motorisation && <div><strong>Motorisation :</strong> {portail.motorisation}</div>}
                                      {portail.avec_piliers && <div><strong>Piliers :</strong> {portail.materiau_piliers || '—'}{portail.chapeaux_piliers && portail.chapeaux_piliers !== 'Aucun' ? ` — chapeaux ${portail.chapeaux_piliers}` : ''}{portail.hauteur_piliers_m != null ? ` — H ${portail.hauteur_piliers_m} m` : ''}</div>}
                                    </div>
                                  </>)}

                                  {/* ── MODIFICATIONS OUVERTURES : liste simple ── */}
                                  {hasModifOuvs && (<>
                                    {maybeHr(hasModifOuvs)}
                                    <div style={GHDR}>Modifications ouvertures ({modifOuvs.length})</div>
                                    <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                                      {modifOuvs.map((m, i) => (
                                        <div key={i}>
                                          <strong>{m.action || '—'}</strong> {m.type_ouverture || '—'}
                                          {(m.largeur_cm && m.hauteur_cm) ? ` — ${m.largeur_cm} × ${m.hauteur_cm} cm` : ''}
                                          {[m.facade, m.materiau_menuiserie, m.couleur_ral].filter(Boolean).length > 0 && ` (${[m.facade, m.materiau_menuiserie, m.couleur_ral].filter(Boolean).join(' — ')})`}
                                        </div>
                                      ))}
                                    </div>
                                  </>)}

                                  {/* ── RAVALEMENT ── */}
                                  {hasRaval && (<>
                                    {maybeHr(hasRaval)}
                                    <div style={GHDR}>Ravalement</div>
                                    <div style={GROW}>
                                      {ravalement.surface_totale_m2 != null && <div><strong>Surface :</strong> {ravalement.surface_totale_m2} m²</div>}
                                      {Array.isArray(ravalement.facades_concernees) && ravalement.facades_concernees.length > 0 && <div><strong>Façades :</strong> {ravalement.facades_concernees.join(', ')}</div>}
                                      {(ravalement.materiau_actuel || ravalement.materiau_futur) && <div><strong>Matériau :</strong> {ravalement.materiau_actuel || '—'} → {ravalement.materiau_futur || '—'}</div>}
                                      {(ravalement.couleur_actuelle || ravalement.couleur_future_ral) && <div><strong>Couleur :</strong> {ravalement.couleur_actuelle || '—'} → {ravalement.couleur_future_ral || '—'}</div>}
                                      {ravalement.changement_aspect && <div><strong>Change aspect :</strong> Oui</div>}
                                    </div>
                                  </>)}

                                  {/* ── CHANGEMENT MENUISERIES : liste simple ── */}
                                  {hasMenuis && (<>
                                    {maybeHr(hasMenuis)}
                                    <div style={GHDR}>Changement menuiseries ({changMenuis.length})</div>
                                    <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                                      {changMenuis.map((m, i) => (
                                        <div key={i}>
                                          {m.nombre && m.nombre > 1 ? `${m.nombre}× ` : ''}<strong>{m.type || '—'}</strong>
                                          {m.dimensions_standard ? ` (${m.dimensions_standard})` : (m.largeur_cm || m.hauteur_cm) ? ` (${m.largeur_cm || '—'} × ${m.hauteur_cm || '—'} cm)` : ''}
                                          {(m.materiau_actuel || m.materiau_futur) ? ` — ${m.materiau_actuel || '—'} → ${m.materiau_futur || '—'}` : ''}
                                          {[m.vitrage, m.couleur_future_ral].filter(Boolean).length > 0 && ` — ${[m.vitrage, m.couleur_future_ral].filter(Boolean).join(' — ')}`}
                                        </div>
                                      ))}
                                    </div>
                                  </>)}

                                  {/* ── CHANGEMENT COUVERTURE ── */}
                                  {hasCouv && (<>
                                    {maybeHr(hasCouv)}
                                    <div style={GHDR}>Changement couverture</div>
                                    <div style={GROW}>
                                      {changCouv.surface_totale_m2 != null && <div><strong>Surface :</strong> {changCouv.surface_totale_m2} m²</div>}
                                      {(changCouv.materiau_actuel || changCouv.materiau_futur) && <div><strong>Matériau :</strong> {changCouv.materiau_actuel || '—'} → {changCouv.materiau_futur || '—'}</div>}
                                      {(changCouv.couleur_actuelle || changCouv.couleur_future) && <div><strong>Couleur :</strong> {changCouv.couleur_actuelle || '—'} → {changCouv.couleur_future || '—'}</div>}
                                      {changCouv.changement_pente && <div><strong>Pente :</strong> {changCouv.pente_avant_deg ?? '—'}° → {changCouv.pente_apres_deg ?? '—'}°</div>}
                                      {changCouv.isolation_sous_toiture && <div><strong>Isolation sous-toiture :</strong> Oui</div>}
                                    </div>
                                  </>)}

                                  {/* ── ITE ── */}
                                  {hasIte && (<>
                                    {maybeHr(hasIte)}
                                    <div style={GHDR}>Isolation thermique extérieure</div>
                                    <div style={GROW}>
                                      {ite.surface_totale_m2 != null && <div><strong>Surface :</strong> {ite.surface_totale_m2} m²</div>}
                                      {Array.isArray(ite.facades_concernees) && ite.facades_concernees.length > 0 && <div><strong>Façades :</strong> {ite.facades_concernees.join(', ')}</div>}
                                      {ite.materiau_isolant && <div><strong>Isolant :</strong> {ite.materiau_isolant}</div>}
                                      {ite.epaisseur_cm != null && <div><strong>Épaisseur :</strong> {ite.epaisseur_cm} cm</div>}
                                      {ite.parement_final && <div><strong>Parement final :</strong> {ite.parement_final}</div>}
                                      {ite.couleur_finale_ral && <div><strong>Couleur :</strong> {ite.couleur_finale_ral}</div>}
                                      {ite.surepaisseur_cm != null && <div><strong>Surépaisseur :</strong> {ite.surepaisseur_cm} cm</div>}
                                    </div>
                                  </>)}

                                  {/* ── PANNEAUX SOLAIRES ── */}
                                  {hasSolaires && (<>
                                    {maybeHr(hasSolaires)}
                                    <div style={GHDR}>Panneaux solaires</div>
                                    <div style={GROW}>
                                      {solaires.type && <div><strong>Type :</strong> {solaires.type}</div>}
                                      {solaires.nombre_panneaux != null && <div><strong>Nombre :</strong> {solaires.nombre_panneaux}</div>}
                                      {solaires.surface_totale_m2 != null && <div><strong>Surface :</strong> {solaires.surface_totale_m2} m²</div>}
                                      {solaires.puissance_kwc != null && <div><strong>Puissance :</strong> {solaires.puissance_kwc} kWc</div>}
                                      {solaires.implantation && <div><strong>Implantation :</strong> {solaires.implantation}</div>}
                                      {solaires.pan_toiture && <div><strong>Pan de toiture :</strong> {solaires.pan_toiture}</div>}
                                      {(solaires.orientation_deg != null || solaires.inclinaison_deg != null) && <div><strong>Orientation / Incl. :</strong> {solaires.orientation_deg ?? '—'}° / {solaires.inclinaison_deg ?? '—'}°</div>}
                                      {solaires.couleur_panneaux && <div><strong>Couleur :</strong> {solaires.couleur_panneaux}</div>}
                                      {solaires.raccordement && <div><strong>Raccordement :</strong> {solaires.raccordement}</div>}
                                    </div>
                                  </>)}

                                  {/* ── AUTRE — DIMENSIONS APPROX ── */}
                                  {hasDimApprox && (<>
                                    {maybeHr(hasDimApprox)}
                                    <div style={GHDR}>Dimensions approximatives</div>
                                    <div style={GROW}>
                                      {dimApprox.surface_au_sol_m2 != null && <div><strong>Surface au sol :</strong> {dimApprox.surface_au_sol_m2} m²</div>}
                                      {dimApprox.longueur_m != null && <div><strong>Longueur :</strong> {dimApprox.longueur_m} m</div>}
                                      {dimApprox.largeur_m != null && <div><strong>Largeur :</strong> {dimApprox.largeur_m} m</div>}
                                      {dimApprox.hauteur_m != null && <div><strong>Hauteur :</strong> {dimApprox.hauteur_m} m</div>}
                                    </div>
                                  </>)}

                                  {/* ── AUTRE — MATÉRIAUX PRINCIPAUX ── */}
                                  {hasMatPrinc && (<>
                                    {maybeHr(hasMatPrinc)}
                                    <div style={GHDR}>Matériaux principaux</div>
                                    <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{matPrinc}</div>
                                  </>)}

                                  {/* ── COMMENTAIRE DU CLIENT : plus discret (13px, pas d'italique) ── */}
                                  {data.commentaire && (
                                    <div style={{ marginTop: 12, padding: '8px 10px', background: ui.color.bgSuccess, borderRadius: 6, fontSize: 13, color: ui.color.textSuccess, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                      💬 {data.commentaire}
                                    </div>
                                  )}

                                  {/* Ancienne description_libre (type autre) */}
                                  {o.description_libre && (
                                    <div style={{ marginTop: 8, fontSize: 13, color: ui.color.textMuted, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{o.description_libre}</div>
                                  )}
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
                    const { progress, sections } = computeSectionStatus(d, photos, projectOuvrages[p.id] || [])
                    const nspOrVal = (val, nsp, unit) => nsp ? 'À proposer' : val ? `${val} ${unit}` : '-'
                    const raccordements = d.raccordement_aucun ? ['Aucun'] : [d.raccordement_eau && 'Eau', d.raccordement_electricite && 'Électricité', d.raccordement_gaz && 'Gaz', d.raccordement_fibre && 'Fibre'].filter(Boolean)
                    const missing = sections.filter(s => s.status !== 'complete')
                    const statusIcon = { complete: '✅', partial: '🟡', empty: '⚪' }
                    const statusBg = { complete: ui.color.bgSuccess, partial: ui.color.bgWarning, empty: ui.color.bgMuted }
                    const statusColor = { complete: ui.color.textSuccess, partial: ui.color.textWarning, empty: ui.color.textLight }
                    return (
                      <div style={{ marginTop: ui.space.xl, paddingTop: ui.space.lg, borderTop: `1px solid ${ui.color.border}` }}>

                        {/* État du dossier */}
                        <div style={{ background: ui.color.bgSoft, border: `1px solid ${ui.color.border}`, borderRadius: ui.radius.lg, padding: ui.space.lg, marginBottom: ui.space.lg }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: ui.space.md }}>
                            <div style={{ fontSize: ui.size.lg, fontWeight: ui.weight.semibold }}>État du dossier</div>
                            <span style={{ fontSize: ui.size.sm, fontWeight: ui.weight.bold, padding: '2px 10px', borderRadius: ui.radius.lg, background: progress === 100 ? ui.color.bgSuccess : ui.color.bgWarning, color: progress === 100 ? ui.color.textSuccess : ui.color.textWarning }}>
                              {progress}%
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: missing.length > 0 ? ui.space.md : 0 }}>
                            {sections.map(s => (
                              <span key={s.name} style={{ fontSize: 11, fontWeight: ui.weight.medium, padding: '3px 8px', borderRadius: ui.radius.sm, background: statusBg[s.status], color: statusColor[s.status], whiteSpace: 'nowrap' }}>
                                {statusIcon[s.status]} {s.name}{s.filled !== undefined ? ` ${s.filled}/${s.max}` : ''}
                              </span>
                            ))}
                          </div>
                          {progress === 100 ? (
                            <div style={{ fontSize: ui.size.sm, fontWeight: ui.weight.semibold, color: ui.color.textSuccess }}>✅ Dossier complet — prêt à démarrer</div>
                          ) : missing.length > 0 && (
                            <div style={{ fontSize: ui.size.xs, color: ui.color.textMuted, lineHeight: 1.6 }}>
                              <div style={{ fontWeight: ui.weight.semibold, marginBottom: ui.space.xs, color: ui.color.textWarning }}>⚠ Éléments manquants :</div>
                              {missing.map(s => (
                                <div key={s.name}>• <strong>{s.name}</strong> : {s.status === 'empty' ? (s.name === 'Croquis' ? 'aucun fichier uploadé' : s.name === 'Pièces' ? 'aucune pièce renseignée' : `aucun champ rempli`) : s.filled !== undefined ? `${s.filled}/${s.max} remplis` : s.detail || 'partiel'} <span style={{ color: ui.color.textLight }}>({s.reason})</span></div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Groupe 1 — Informations client */}
                        <div style={{ background: '#fff', border: `1px solid ${ui.color.border}`, borderRadius: ui.radius.lg, padding: ui.space.lg, marginBottom: ui.space.md }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: ui.color.primaryDark, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: ui.size.sm, fontWeight: ui.weight.bold, flexShrink: 0 }}>1</div>
                            <div style={{ fontSize: ui.size.lg, fontWeight: ui.weight.semibold, color: ui.color.primary }}>Informations client</div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: ui.size.sm }}>
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
                        <div style={{ background: '#fff', border: `1px solid ${ui.color.border}`, borderRadius: ui.radius.lg, padding: ui.space.lg, marginBottom: ui.space.md }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: ui.color.primaryDark, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: ui.size.sm, fontWeight: ui.weight.bold, flexShrink: 0 }}>3</div>
                            <div style={{ fontSize: ui.size.lg, fontWeight: ui.weight.semibold, color: ui.color.primary }}>Terrain</div>
                          </div>

                          {/* Parcelle */}
                          <div style={{ fontSize: ui.size.xs, fontWeight: ui.weight.semibold, color: ui.color.primary, marginBottom: 6 }}>Parcelle</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: ui.size.sm }}>
                            {d.parcelle_nsp ? (
                              <div style={{ gridColumn: '1 / -1' }}><strong>Parcelle :</strong> Non renseigné par le client</div>
                            ) : (d.parcelle_section || d.parcelle_numero || d.parcelle_surface) ? (
                              <div style={{ gridColumn: '1 / -1' }}><strong>Parcelle :</strong> {[d.parcelle_section ? `Section ${d.parcelle_section}` : null, d.parcelle_numero ? `n° ${d.parcelle_numero}` : null].filter(Boolean).join(', ')}{d.parcelle_surface ? ` — ${d.parcelle_surface}` : ''}</div>
                            ) : null}
                          </div>

                          {/* Constructions existantes */}
                          <hr style={{ border: 'none', borderTop: `1px solid ${ui.color.border}`, margin: '12px 0' }} />
                          <div style={{ fontSize: ui.size.xs, fontWeight: ui.weight.semibold, color: ui.color.primary, marginBottom: 6 }}>Constructions existantes</div>
                          <div style={{ fontSize: ui.size.sm }}>
                            <strong>Constructions existantes :</strong>{' '}
                            {d.constructions_existantes === true ? (() => {
                              let liste = []
                              try { liste = JSON.parse(d.constructions_existantes_liste || '[]') } catch {}
                              if (Array.isArray(liste) && liste.length > 0) {
                                return <div style={{ marginTop: 4 }}>{liste.map((c, i) => (
                                  <div key={i} style={{ background: ui.color.bgSoft, border: `1px solid ${ui.color.border}`, borderRadius: ui.radius.sm, padding: '6px 10px', marginTop: 4, fontSize: ui.size.xs }}>
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
                          <hr style={{ border: 'none', borderTop: `1px solid ${ui.color.border}`, margin: '12px 0' }} />
                          <div style={{ fontSize: ui.size.xs, fontWeight: ui.weight.semibold, color: ui.color.primary, marginBottom: 6 }}>Emplacement et raccordements</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: ui.size.sm }}>
                            <div><strong>Assainissement :</strong> {label(d.assainissement)}</div>
                            <div><strong>Raccordements :</strong> {raccordements.length > 0 ? raccordements.join(', ') : '-'}</div>
                            <div style={{ gridColumn: '1 / -1' }}><strong>Implantation :</strong> {d.implantation_description || '-'}</div>
                          </div>

                          {/* Photos terrain */}
                          {photos.length > 0 && (
                            <>
                              <hr style={{ border: 'none', borderTop: `1px solid ${ui.color.border}`, margin: '12px 0' }} />
                              <div style={{ fontSize: ui.size.xs, fontWeight: ui.weight.semibold, color: ui.color.primary, marginBottom: 6 }}>Photos terrain ({photos.length}/5)</div>
                              <div style={{ display: 'flex', gap: ui.space.sm, flexWrap: 'wrap' }}>
                                {photos.map((photo, i) => (
                                  <a key={i} href={photo.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: 80, height: 60, borderRadius: ui.radius.sm, overflow: 'hidden', border: `1px solid ${ui.color.border}` }}>
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
                    <div style={{ marginTop: ui.space.xl }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: ui.space.sm }}>
                        <div style={{ fontSize: ui.size.lg, fontWeight: ui.weight.semibold }}>Documents client</div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownloadAll(p) }}
                          disabled={zipping === p.id}
                          style={{
                            padding: '10px 18px', borderRadius: ui.radius.md, border: `1px solid ${ui.color.border}`, background: '#fff',
                            fontSize: ui.size.sm, fontWeight: ui.weight.semibold, cursor: zipping === p.id ? 'default' : 'pointer',
                            opacity: zipping === p.id ? 0.6 : 1, color: ui.color.primary,
                          }}
                        >
                          {zipping === p.id ? 'Téléchargement...' : '📥 Télécharger tout (.zip)'}
                        </button>
                      </div>
                      {projectDocs[p.id].filter(d => d.uploaded_by === 'client').length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: ui.space.xs }}>
                          {projectDocs[p.id].filter(d => d.uploaded_by === 'client').map(doc => (
                            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${ui.color.border}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: ui.space.sm }}>
                                <span style={{ fontSize: 11 }}>📄</span>
                                <span style={{ fontSize: ui.size.sm }}>{doc.file_name}</span>
                                <span style={{ fontSize: ui.size.xs, color: ui.color.textLight }}>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                              </div>
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: ui.size.xs, color: ui.color.primary, fontWeight: ui.weight.semibold, textDecoration: 'none' }}>
                                Télécharger
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: ui.size.sm, color: ui.color.textLight, margin: 0 }}>Aucun document client pour le moment.</p>
                      )}
                    </div>
                  )}

                  {/* Documents admin (dossier livré) */}
                  {projectDocs[p.id] && (
                    <div style={{ marginTop: ui.space.xl }}>
                      <div style={{ fontSize: ui.size.lg, fontWeight: ui.weight.semibold, marginBottom: ui.space.sm }}>Dossier livré</div>
                      {projectDocs[p.id].filter(d => d.uploaded_by === 'admin').length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: ui.space.xs, marginBottom: ui.space.md }}>
                          {projectDocs[p.id].filter(d => d.uploaded_by === 'admin').map(doc => (
                            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${ui.color.border}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: ui.space.sm }}>
                                <span style={{ fontSize: 11 }}>📦</span>
                                <span style={{ fontSize: ui.size.sm }}>{doc.file_name}</span>
                                <span style={{ fontSize: ui.size.xs, color: ui.color.textLight }}>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: ui.size.xs, color: ui.color.primary, fontWeight: ui.weight.semibold, textDecoration: 'none' }}>
                                  Voir
                                </a>
                                <span onClick={async (e) => {
                                  e.stopPropagation()
                                  await deleteDocument(doc.id, doc.file_url)
                                  const docs = await getDocuments(p.id)
                                  setProjectDocs(prev => ({ ...prev, [p.id]: docs }))
                                }} style={{ color: ui.color.textError, cursor: 'pointer', fontSize: ui.size.sm, marginLeft: ui.space.md }}>
                                  Supprimer
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <label style={{
                        display: 'inline-flex', alignItems: 'center', gap: ui.space.sm, padding: '10px 18px',
                        background: ui.color.primary, color: '#fff', borderRadius: ui.radius.md, fontSize: ui.size.sm, fontWeight: ui.weight.semibold,
                        cursor: adminUploading === p.id ? 'default' : 'pointer', opacity: adminUploading === p.id ? 0.6 : 1, border: 'none',
                      }}>
                        {adminUploading === p.id ? 'Envoi en cours...' : '📤 Uploader le dossier final'}
                        <input type="file" multiple style={{ display: 'none' }}
                          onChange={(e) => handleAdminUpload(e, p.id)}
                          disabled={adminUploading === p.id} />
                      </label>
                    </div>
                  )}

                  {/* Messagerie client */}
                  <div style={{ marginTop: ui.space.xl, paddingTop: ui.space.lg, borderTop: `1px solid ${ui.color.border}` }}>
                    <div style={{ fontSize: ui.size.lg, fontWeight: ui.weight.semibold, marginBottom: ui.space.md }}>Messagerie client</div>
                    <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: ui.space.md, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(!projectMessages[p.id] || projectMessages[p.id].length === 0) ? (
                        <div style={{ fontSize: ui.size.sm, color: ui.color.textLight }}>Aucun message</div>
                      ) : (
                        projectMessages[p.id].map(msg => (
                          <div key={msg.id} style={{
                            alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                          }}>
                            <div style={{
                              padding: '8px 12px', borderRadius: ui.radius.lg, fontSize: ui.size.sm, lineHeight: 1.4,
                              background: msg.sender === 'admin' ? ui.color.primary : ui.color.bgMuted,
                              color: msg.sender === 'admin' ? '#fff' : ui.color.text,
                            }}>
                              {msg.content}
                            </div>
                            <div style={{ fontSize: 10, color: ui.color.textLight, marginTop: 2, textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>
                              {msg.sender === 'admin' ? 'Vous' : p.first_name} · {new Date(msg.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: ui.space.sm }}>
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
                        style={{ flex: 1, padding: '8px 12px', borderRadius: ui.radius.md, border: `1px solid ${ui.color.border}`, fontSize: ui.size.base, outline: 'none' }}
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
                        style={{ padding: '10px 18px', borderRadius: ui.radius.md, border: 'none', background: ui.color.primary, color: '#fff', fontSize: ui.size.sm, fontWeight: ui.weight.semibold, cursor: 'pointer' }}
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
