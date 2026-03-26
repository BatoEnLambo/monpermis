'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { uploadFile, getDocuments, deleteDocument } from '../../lib/storage'
import { getMessages, sendMessage, markAsRead } from '../../lib/messages'

const ADMIN_PASSWORD = 'permisclair2026'

const STATUS_LABELS = {
  pending: '🟡 En attente de paiement',
  paid: '🟢 Payé',
  in_progress: '🔵 En cours',
  review: '🟣 En relecture',
  delivered: '📦 Livré',
  deposited: '📬 Déposé en mairie',
  accepted: '✅ Accepté',
}

const STATUS_OPTIONS = ['pending', 'paid', 'in_progress', 'review', 'delivered', 'deposited', 'accepted']

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Projets clients</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchProjects} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
            ↻ Rafraîchir
          </button>
          <button onClick={() => setAuthed(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
            Déconnexion
          </button>
        </div>
      </div>

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
                  <span style={{ fontSize: 12 }}>{STATUS_LABELS[p.status] || p.status}</span>
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

                  {/* Documents client */}
                  {projectDocs[p.id] && (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Documents client</div>
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
