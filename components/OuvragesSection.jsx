'use client'

import { useState, useRef } from 'react'
import { OUVRAGE_TYPES, getOuvrageType, formatOuvrageType, computeOuvrageProgress } from '../src/config/ouvrageTypes'
import { supabase } from '../lib/supabase'
import { validateUploadFile, UPLOAD_HELP_TEXT, UPLOAD_ACCEPT_ATTR } from '../lib/storage'
import OuvrageDetailsFields from './OuvrageDetailsFields'

const ACCENT = '#1a5c3a'
const ACCENT_LIGHT = '#e8f5ee'
const GRAY_100 = '#f5f4f2'
const GRAY_200 = '#e8e7e4'
const GRAY_300 = '#d4d3d0'
const GRAY_500 = '#8a8985'
const GRAY_700 = '#44433f'
const GRAY_900 = '#1c1c1a'
const WHITE = '#ffffff'

const emptyDraft = () => ({
  type: null,
  subtype: null,
  name: '',
  description_libre: '',
  photo_urls: [],
  data: {},
})

/**
 * Section 2 de l'espace client — liste des ouvrages du projet.
 * Le client ajoute autant d'ouvrages que nécessaire en choisissant
 * parmi 8 types (maison, piscine, garage, etc.) et un sous-type.
 */
export default function OuvragesSection({ reference, token, projectId, ouvrages, onChange }) {
  const [mode, setMode] = useState('list') // 'list' | 'add' | 'edit'
  const [step, setStep] = useState('type') // 'type' | 'subtype' | 'details'
  const [draft, setDraft] = useState(emptyDraft())
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  const startAdd = () => {
    setMode('add')
    setStep('type')
    setDraft(emptyDraft())
    setEditingId(null)
  }

  const startEdit = (o) => {
    setMode('edit')
    setStep('details')
    setEditingId(o.id)
    setDraft({
      type: o.type,
      subtype: o.subtype,
      name: o.name || '',
      description_libre: o.description_libre || '',
      photo_urls: o.photo_urls || [],
      data: o.data || {},
    })
  }

  const cancelEdit = () => {
    setMode('list')
    setStep('type')
    setDraft(emptyDraft())
    setEditingId(null)
  }

  const pickType = (typeId) => {
    const type = getOuvrageType(typeId)
    setDraft(d => ({ ...d, type: typeId, subtype: null }))
    if (type?.subtypes) {
      setStep('subtype')
    } else {
      setStep('details')
    }
  }

  const pickSubtype = (subtypeId) => {
    setDraft(d => ({ ...d, subtype: subtypeId }))
    setStep('details')
  }

  const saveOuvrage = async () => {
    if (!draft.name.trim() || !draft.type) return
    setSaving(true)
    const body = {
      name: draft.name.trim(),
      type: draft.type,
      subtype: draft.subtype,
      description_libre: draft.description_libre || null,
      photo_urls: draft.photo_urls || [],
      data: draft.data || {},
    }
    try {
      const url = editingId
        ? `/api/projet/${reference}/ouvrages/${editingId}?token=${token}`
        : `/api/projet/${reference}/ouvrages?token=${token}`
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert('Erreur : ' + (err.error || res.statusText))
        setSaving(false)
        return
      }
      await onChange()
      cancelEdit()
    } catch (err) {
      alert("Erreur lors de l'enregistrement : " + err.message)
    }
    setSaving(false)
  }

  const deleteOuvrage = async (id) => {
    if (!confirm('Supprimer cet ouvrage ? Cette action est irréversible.')) return
    try {
      const res = await fetch(`/api/projet/${reference}/ouvrages/${id}?token=${token}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert('Erreur : ' + (err.error || res.statusText))
        return
      }
      await onChange()
    } catch (err) {
      alert('Erreur lors de la suppression : ' + err.message)
    }
  }

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !projectId) return
    setUploadError(null)

    // Valider tous les fichiers avant de lancer l'upload
    try {
      for (const file of files) validateUploadFile(file)
    } catch (err) {
      setUploadError(err.message)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    const newUrls = []
    const errors = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${projectId}/ouvrages/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error } = await supabase.storage.from('documents').upload(path, file)
      if (error) {
        errors.push(`${file.name} : ${error.message}`)
      } else {
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
        newUrls.push(urlData.publicUrl)
      }
    }
    setDraft(d => ({ ...d, photo_urls: [...(d.photo_urls || []), ...newUrls] }))
    setUploading(false)
    if (errors.length) setUploadError(errors.join(' — '))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePhoto = (url) => {
    // L'URL est retirée du draft local. Le cleanup réel en storage se fera
    // côté serveur dans le PATCH (diff entre ancien et nouveau photo_urls).
    setDraft(d => ({ ...d, photo_urls: (d.photo_urls || []).filter(u => u !== url) }))
  }

  const sortedOuvrages = [...(ouvrages || [])].sort((a, b) => (a.position || 0) - (b.position || 0))

  // ────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a472a', color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>2</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: GRAY_900, margin: 0, letterSpacing: '-0.02em' }}>Vos ouvrages</h3>
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: GRAY_500 }}>
          {sortedOuvrages.length} ouvrage{sortedOuvrages.length > 1 ? 's' : ''}
        </span>
      </div>

      <p style={{ fontSize: 13, color: GRAY_500, margin: '0 0 20px', lineHeight: 1.5 }}>
        Ajoutez chaque ouvrage de votre projet. Vous pouvez en ajouter autant que nécessaire — par exemple : maison + garage + piscine = 3 ouvrages.
      </p>

      {/* LISTE DES OUVRAGES */}
      {mode === 'list' && (
        <>
          {sortedOuvrages.length === 0 ? (
            <div style={{ background: GRAY_100, borderRadius: 10, padding: 24, textAlign: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: GRAY_500, margin: 0 }}>
                Aucun ouvrage pour le moment. Cliquez sur le bouton ci-dessous pour commencer.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {sortedOuvrages.map(o => {
                const type = getOuvrageType(o.type)
                const expanded = expandedId === o.id
                return (
                  <div key={o.id} style={{ border: `1px solid ${GRAY_200}`, borderRadius: 10, background: WHITE, overflow: 'hidden' }}>
                    <div
                      onClick={() => setExpandedId(expanded ? null : o.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: 22 }}>{type?.icon || '📦'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: GRAY_900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.name}
                        </div>
                        <div style={{ fontSize: 12, color: GRAY_500, marginTop: 2 }}>
                          {formatOuvrageType(o.type, o.subtype)}
                        </div>
                      </div>
                      <span style={{ fontSize: 13, color: GRAY_500 }}>{expanded ? '▴' : '▾'}</span>
                    </div>
                    {expanded && (
                      <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${GRAY_200}` }}>
                        {o.description_libre && (
                          <div style={{ fontSize: 13, color: GRAY_700, margin: '12px 0', whiteSpace: 'pre-wrap' }}>
                            {o.description_libre}
                          </div>
                        )}
                        {(o.photo_urls || []).length > 0 && (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
                            {o.photo_urls.map(url => (
                              <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt="Photo ouvrage" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: `1px solid ${GRAY_200}` }} />
                              </a>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); startEdit(o) }}
                            style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${GRAY_300}`, background: WHITE, color: GRAY_700, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                          >
                            Modifier
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteOuvrage(o.id) }}
                            style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid #f5c6c6`, background: '#fdecec', color: '#b00020', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <button
            onClick={startAdd}
            style={{ width: '100%', padding: '14px', borderRadius: 10, border: `2px dashed ${ACCENT}`, background: ACCENT_LIGHT, color: ACCENT, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            + Ajouter un ouvrage
          </button>
        </>
      )}

      {/* FORMULAIRE D'AJOUT / MODIFICATION */}
      {(mode === 'add' || mode === 'edit') && (
        <div style={{ background: GRAY_100, borderRadius: 10, padding: 20, marginBottom: 8 }}>
          {/* Étape A : choix du type */}
          {step === 'type' && (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: GRAY_900, marginBottom: 16 }}>
                Quel type d'ouvrage souhaitez-vous ajouter ?
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {OUVRAGE_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => pickType(t.id)}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      border: `1px solid ${GRAY_200}`,
                      background: WHITE,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      transition: 'all 0.15s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = ACCENT_LIGHT }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = GRAY_200; e.currentTarget.style.background = WHITE }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 22 }}>{t.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: GRAY_900 }}>{t.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: GRAY_500, lineHeight: 1.4 }}>{t.description}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={cancelEdit}
                style={{ marginTop: 16, padding: '10px 16px', borderRadius: 8, border: `1px solid ${GRAY_300}`, background: WHITE, color: GRAY_700, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                Annuler
              </button>
            </>
          )}

          {/* Étape B : choix du sous-type */}
          {step === 'subtype' && (() => {
            const type = getOuvrageType(draft.type)
            if (!type) return null
            return (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: GRAY_900, marginBottom: 4 }}>
                  {type.icon} {type.label}
                </div>
                <div style={{ fontSize: 13, color: GRAY_500, marginBottom: 16 }}>
                  Précisez le type exact :
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {type.subtypes.map(s => (
                    <label
                      key={s.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: 12,
                        borderRadius: 8,
                        border: `1px solid ${GRAY_200}`,
                        background: WHITE,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="subtype"
                        value={s.id}
                        checked={draft.subtype === s.id}
                        onChange={() => pickSubtype(s.id)}
                        style={{ accentColor: ACCENT }}
                      />
                      <span style={{ fontSize: 14, color: GRAY_900 }}>{s.label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button
                    onClick={() => setStep('type')}
                    style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${GRAY_300}`, background: WHITE, color: GRAY_700, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${GRAY_300}`, background: WHITE, color: GRAY_700, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                  >
                    Annuler
                  </button>
                </div>
              </>
            )
          })()}

          {/* Étape C : champs communs + blocs conditionnels */}
          {step === 'details' && (() => {
            const type = getOuvrageType(draft.type)
            const isAutre = draft.type === 'autre'
            const { filled, total } = computeOuvrageProgress({
              name: draft.name,
              type: draft.type,
              subtype: draft.subtype,
              data: draft.data || {},
            })
            const pct = total > 0 ? Math.round((filled / total) * 100) : 0
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: GRAY_900 }}>
                    {type?.icon} {formatOuvrageType(draft.type, draft.subtype)}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: pct === 100 ? ACCENT : GRAY_500 }}>
                    {pct}% complet
                  </div>
                </div>
                <div style={{ fontSize: 13, color: GRAY_500, marginBottom: 16 }}>
                  {editingId ? 'Modifiez les informations de cet ouvrage.' : 'Remplissez les champs techniques de votre ouvrage. Tous les champs sont optionnels.'}
                </div>

                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 6 }}>
                  Nom de l'ouvrage *
                </label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                  placeholder="Ex : Garage, Piscine arrière, Maison principale"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: `1px solid ${GRAY_300}`,
                    fontSize: 14,
                    marginBottom: 16,
                    boxSizing: 'border-box',
                  }}
                />

                {/* Blocs conditionnels selon type+sous-type (bâti, serre, raccord, ouvertures, commentaire…) */}
                <OuvrageDetailsFields
                  draft={draft}
                  setDraft={setDraft}
                  projectId={projectId}
                />

                {isAutre && (
                  <div style={{ background: GRAY_100, border: `1px solid ${GRAY_200}`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: GRAY_900, marginBottom: 12, letterSpacing: '-0.01em' }}>
                      📷 Photos ou croquis (facultatif)
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      {(draft.photo_urls || []).map(url => (
                        <div key={url} style={{ position: 'relative' }}>
                          <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: `1px solid ${GRAY_200}` }} />
                          <button
                            onClick={() => removePhoto(url)}
                            style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', border: 'none', background: '#b00020', color: WHITE, fontSize: 12, cursor: 'pointer', lineHeight: 1 }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={UPLOAD_ACCEPT_ATTR}
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                      style={{ fontSize: 13 }}
                    />
                    <div style={{ fontSize: 11, color: GRAY_500, marginTop: 6 }}>
                      {UPLOAD_HELP_TEXT}
                    </div>
                    {uploading && <div style={{ fontSize: 12, color: GRAY_500, marginTop: 6 }}>Envoi en cours...</div>}
                    {uploadError && (
                      <div style={{ fontSize: 12, color: '#b00020', marginTop: 6 }}>
                        {uploadError}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {!editingId && (
                    <button
                      onClick={() => setStep(type?.subtypes ? 'subtype' : 'type')}
                      style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${GRAY_300}`, background: WHITE, color: GRAY_700, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                    >
                      ← Retour
                    </button>
                  )}
                  <button
                    onClick={saveOuvrage}
                    disabled={!draft.name.trim() || saving}
                    style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: 'none', background: draft.name.trim() && !saving ? ACCENT : GRAY_300, color: WHITE, fontSize: 14, fontWeight: 600, cursor: draft.name.trim() && !saving ? 'pointer' : 'default' }}
                  >
                    {saving ? 'Enregistrement...' : editingId ? 'Enregistrer les modifications' : "Enregistrer l'ouvrage"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${GRAY_300}`, background: WHITE, color: GRAY_700, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                  >
                    Annuler
                  </button>
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
