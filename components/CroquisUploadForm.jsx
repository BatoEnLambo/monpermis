'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const GRAY_50 = "#fafaf9"
const GRAY_200 = "#e8e7e4"
const GRAY_300 = "#d4d3d0"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"

const BUCKET = 'documents'
const ACCEPTED = '.jpg,.jpeg,.png,.webp,.pdf'

function getExt(filename) {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : 'jpg'
}

function parseChecklist(raw) {
  if (!raw) return { murs: false, dimensions: false, ouvertures_placees: false, ouvertures_dimensions: false }
  try {
    const parsed = JSON.parse(raw)
    return {
      murs: !!parsed.murs,
      dimensions: !!parsed.dimensions,
      ouvertures_placees: !!parsed.ouvertures_placees,
      ouvertures_dimensions: !!parsed.ouvertures_dimensions,
    }
  } catch {
    return { murs: false, dimensions: false, ouvertures_placees: false, ouvertures_dimensions: false }
  }
}

function CheckboxStyled({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', userSelect: 'none', padding: '4px 0' }}>
      <div
        onClick={(e) => { e.preventDefault(); onChange(!checked) }}
        style={{
          width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
          border: checked ? `2px solid ${ACCENT}` : `2px solid ${GRAY_300}`,
          background: checked ? ACCENT : WHITE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s', cursor: 'pointer',
        }}
      >
        {checked && <span style={{ color: WHITE, fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ fontSize: 13, color: GRAY_700, lineHeight: 1.4 }}>{label}</span>
    </label>
  )
}

export default function CroquisUploadForm({ projectId, details, onFieldUpdate, onCroquisCountChange }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const checklist = parseChecklist(details?.croquis_checklist)

  useEffect(() => {
    if (!projectId) return
    loadFiles()
  }, [projectId])

  useEffect(() => {
    if (onCroquisCountChange) {
      onCroquisCountChange(files.length)
    }
  }, [files])

  async function loadFiles() {
    const { data, error } = await supabase.storage.from(BUCKET).list(`${projectId}/croquis`)
    if (error || !data) return

    const loaded = []
    for (const file of data) {
      if (!file.name || file.name === '.emptyFolderPlaceholder') continue
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(`${projectId}/croquis/${file.name}`)
      loaded.push({
        name: file.name,
        url: urlData.publicUrl,
        createdAt: file.created_at,
      })
    }
    setFiles(loaded)
  }

  async function handleUpload(fileList) {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    try {
      for (const file of fileList) {
        const ext = getExt(file.name)
        const timestamp = Date.now()
        const filePath = `${projectId}/croquis/croquis-${timestamp}.${ext}`
        const { error } = await supabase.storage.from(BUCKET).upload(filePath, file)
        if (error) console.error('Upload error:', error)
      }
      await loadFiles()
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(fileName) {
    try {
      await supabase.storage.from(BUCKET).remove([`${projectId}/croquis/${fileName}`])
      setFiles(prev => prev.filter(f => f.name !== fileName))
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const updateChecklist = useCallback((key, value) => {
    const updated = { ...checklist, [key]: value }
    onFieldUpdate('croquis_checklist', JSON.stringify(updated))
  }, [checklist, onFieldUpdate])

  const checkedCount = [checklist.murs, checklist.dimensions, checklist.ouvertures_placees, checklist.ouvertures_dimensions].filter(Boolean).length
  const isPdf = (name) => name.toLowerCase().endsWith('.pdf')

  return (
    <div>
      {/* Instructions */}
      <div style={{ background: ACCENT_LIGHT, border: `1px solid ${ACCENT}44`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: GRAY_900, marginBottom: 8 }}>Comment faire un bon croquis ?</div>
        <p style={{ fontSize: 13, color: GRAY_700, lineHeight: 1.6, margin: '0 0 12px' }}>
          Un simple dessin à main levée sur une feuille blanche suffit. Pas besoin d'être à l'échelle ni de faire joli — on s'occupe de tout mettre au propre.
        </p>
        <p style={{ fontSize: 13, color: GRAY_700, lineHeight: 1.6, margin: '0 0 10px' }}>Votre croquis doit montrer :</p>
        <div style={{ fontSize: 13, color: GRAY_700, lineHeight: 1.8 }}>
          <div>✓ Les murs extérieurs (la forme générale de la construction)</div>
          <div>✓ Les dimensions principales en mètres (longueur, largeur)</div>
          <div>✓ L'emplacement des fenêtres, portes et baies vitrées sur chaque mur</div>
          <div>✓ Les dimensions de chaque ouverture (largeur × hauteur en cm)</div>
          <div>✓ Si 2 étages : un croquis par étage</div>
        </div>
        <p style={{ fontSize: 13, color: GRAY_700, lineHeight: 1.6, margin: '12px 0 0' }}>
          Prenez une photo de votre dessin et uploadez-la ci-dessous. Vous pouvez envoyer plusieurs photos si nécessaire (un par étage, un pour chaque façade, etc.).
        </p>
      </div>

      {/* Upload zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          handleUpload(Array.from(e.dataTransfer.files))
        }}
        style={{
          padding: '24px 20px', textAlign: 'center', cursor: uploading ? 'default' : 'pointer',
          border: `2px dashed ${dragOver ? ACCENT : GRAY_300}`,
          background: dragOver ? ACCENT_LIGHT : GRAY_50,
          borderRadius: 12, transition: 'all 0.15s',
          marginBottom: files.length > 0 ? 16 : 0,
          opacity: uploading ? 0.6 : 1,
        }}
      >
        {uploading ? (
          <div style={{ fontSize: 14, color: GRAY_500 }}>Envoi en cours...</div>
        ) : (
          <>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📐</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: GRAY_900, marginBottom: 4 }}>
              <span style={{ color: ACCENT }}>Cliquez</span> ou glissez-déposez votre croquis
            </div>
            <div style={{ fontSize: 13, color: GRAY_500 }}>Photo, scan ou PDF</div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          style={{ display: 'none' }}
          onChange={e => handleUpload(Array.from(e.target.files))}
          disabled={uploading}
        />
      </div>

      {/* Files list */}
      {files.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {files.map((file) => (
            <div key={file.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: `1px solid ${GRAY_200}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                {isPdf(file.name) ? (
                  <div style={{ width: 48, height: 48, borderRadius: 6, background: GRAY_50, border: `1px solid ${GRAY_200}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    📄
                  </div>
                ) : (
                  <img src={file.url} alt={file.name} style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', border: `1px solid ${GRAY_200}`, flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: GRAY_900, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                  {file.createdAt && (
                    <div style={{ fontSize: 11, color: GRAY_500 }}>{new Date(file.createdAt).toLocaleDateString('fr-FR')}</div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>
                  Voir
                </a>
                <span
                  onClick={(e) => { e.stopPropagation(); handleDelete(file.name) }}
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

      {/* Checklist de validation */}
      {files.length > 0 && (
        <div style={{ background: GRAY_50, border: `1px solid ${GRAY_200}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: GRAY_900, marginBottom: 10 }}>Vérification rapide</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <CheckboxStyled
              checked={checklist.murs}
              onChange={v => updateChecklist('murs', v)}
              label="Mon croquis montre les murs extérieurs"
            />
            <CheckboxStyled
              checked={checklist.dimensions}
              onChange={v => updateChecklist('dimensions', v)}
              label="Les dimensions principales sont notées (en mètres)"
            />
            <CheckboxStyled
              checked={checklist.ouvertures_placees}
              onChange={v => updateChecklist('ouvertures_placees', v)}
              label="Les fenêtres et portes sont placées"
            />
            <CheckboxStyled
              checked={checklist.ouvertures_dimensions}
              onChange={v => updateChecklist('ouvertures_dimensions', v)}
              label="Les dimensions des ouvertures sont notées (largeur × hauteur en cm)"
            />
          </div>
          {checkedCount === 4 && (
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
              ✓ Parfait, votre croquis est complet !
            </div>
          )}
          {checkedCount < 4 && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#e65100' }}>
              Il manque peut-être des éléments — vérifiez les points ci-dessus.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
