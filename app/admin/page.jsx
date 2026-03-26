'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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

  const login = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      fetchProjects()
    } else {
      alert('Mot de passe incorrect')
    }
  }

  const fetchProjects = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setProjects(data)
    setLoading(false)
  }

  const updateStatus = async (id, newStatus) => {
    await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', id)
    fetchProjects()
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
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : projects.length === 0 ? (
        <p style={{ color: '#888' }}>Aucun projet pour le moment.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {projects.map(p => (
            <div key={p.id} style={{ border: '1px solid #e8e7e4', borderRadius: 10, padding: 16, background: '#fff', cursor: 'pointer' }}
              onClick={() => setSelected(selected === p.id ? null : p.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{p.reference}</span>
                  <span style={{ color: '#888', fontSize: 13, marginLeft: 8 }}>{p.first_name} {p.last_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{p.price ? p.price + ' €' : 'Sur devis'}</span>
                  <span style={{ fontSize: 12 }}>{STATUS_LABELS[p.status] || p.status}</span>
                </div>
              </div>

              {selected === p.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0', fontSize: 14 }}>
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
