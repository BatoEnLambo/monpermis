'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { validateUploadFile, UPLOAD_HELP_TEXT, UPLOAD_ACCEPT_ATTR } from '../lib/storage'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const GRAY_200 = "#e8e7e4"
const GRAY_300 = "#d4d3d0"
const GRAY_500 = "#8a8985"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"

const SLOTS = [
  { key: 'vue-nord', label: 'Vue Nord' },
  { key: 'vue-sud', label: 'Vue Sud' },
  { key: 'vue-est', label: 'Vue Est' },
  { key: 'vue-ouest', label: 'Vue Ouest' },
  { key: 'vue-rue', label: 'Vue depuis la rue / chemin d\'accès' },
]

const BUCKET = 'documents'

function getExt(filename) {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : 'jpg'
}

export default function TerrainPhotosUpload({ projectId, token, onPhotoCountChange }) {
  const [photos, setPhotos] = useState({})
  const [uploading, setUploading] = useState({})
  const [uploadError, setUploadError] = useState(null)
  const inputRefs = useRef({})

  useEffect(() => {
    if (!projectId) return
    loadExisting()
  }, [projectId])

  useEffect(() => {
    if (onPhotoCountChange) {
      onPhotoCountChange(Object.keys(photos).length)
    }
  }, [photos])

  async function loadExisting() {
    const prefix = `${projectId}/photos-terrain/`
    const { data, error } = await supabase.storage.from(BUCKET).list(`${projectId}/photos-terrain`)
    if (error || !data) return

    const found = {}
    for (const file of data) {
      if (!file.name || file.name === '.emptyFolderPlaceholder') continue
      const slotKey = file.name.replace(/\.[^.]+$/, '')
      const slot = SLOTS.find(s => s.key === slotKey)
      if (slot) {
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(`${prefix}${file.name}`)
        found[slotKey] = { url: urlData.publicUrl, fileName: file.name }
      }
    }
    setPhotos(found)
  }

  async function handleUpload(slotKey, file) {
    if (!file) return
    setUploadError(null)

    try {
      validateUploadFile(file)
    } catch (err) {
      setUploadError(err.message)
      if (inputRefs.current[slotKey]) inputRefs.current[slotKey].value = ''
      return
    }

    setUploading(prev => ({ ...prev, [slotKey]: true }))

    try {
      const ext = getExt(file.name)
      const filePath = `${projectId}/photos-terrain/${slotKey}.${ext}`

      if (photos[slotKey]) {
        const oldPath = `${projectId}/photos-terrain/${photos[slotKey].fileName}`
        await supabase.storage.from(BUCKET).remove([oldPath])
      }

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
      setPhotos(prev => ({ ...prev, [slotKey]: { url: urlData.publicUrl + '?t=' + Date.now(), fileName: `${slotKey}.${ext}` } }))
    } catch (err) {
      console.error('Upload error:', err)
      setUploadError(err.message || 'Erreur lors de l\'upload')
    } finally {
      setUploading(prev => ({ ...prev, [slotKey]: false }))
      if (inputRefs.current[slotKey]) inputRefs.current[slotKey].value = ''
    }
  }

  async function handleDelete(slotKey) {
    if (!photos[slotKey]) return
    const filePath = `${projectId}/photos-terrain/${photos[slotKey].fileName}`

    try {
      await supabase.storage.from(BUCKET).remove([filePath])
      setPhotos(prev => {
        const next = { ...prev }
        delete next[slotKey]
        return next
      })
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const photoCount = Object.keys(photos).length

  return (
    <div>
      <div className="terrain-photos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {SLOTS.map(slot => {
          const photo = photos[slot.key]
          const isUploading = uploading[slot.key]

          return (
            <div key={slot.key} style={{ position: 'relative' }}>
              <input
                ref={el => inputRefs.current[slot.key] = el}
                type="file"
                accept={UPLOAD_ACCEPT_ATTR}
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files[0]) handleUpload(slot.key, e.target.files[0])
                }}
              />

              {photo ? (
                <div style={{
                  position: 'relative',
                  borderRadius: 8,
                  border: `1px solid ${GRAY_200}`,
                  overflow: 'hidden',
                  aspectRatio: '4/3',
                }}>
                  <img
                    src={photo.url}
                    alt={slot.label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '6px 10px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                    color: WHITE,
                    fontSize: 12,
                    fontWeight: 500,
                  }}>
                    {slot.label}
                  </div>
                  <button
                    onClick={() => handleDelete(slot.key)}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(0,0,0,0.5)',
                      color: WHITE,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.15s',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,57,43,0.8)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => !isUploading && inputRefs.current[slot.key]?.click()}
                  style={{
                    borderRadius: 8,
                    border: `2px dashed ${GRAY_300}`,
                    aspectRatio: '4/3',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: isUploading ? 'wait' : 'pointer',
                    background: isUploading ? ACCENT_LIGHT : WHITE,
                    transition: 'all 0.15s',
                    opacity: isUploading ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { if (!isUploading) e.currentTarget.style.borderColor = ACCENT }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = GRAY_300 }}
                >
                  <span style={{ fontSize: 22, color: GRAY_300 }}>+</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: GRAY_500, textAlign: 'center', padding: '0 8px', lineHeight: 1.3 }}>
                    {isUploading ? 'Upload...' : slot.label}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: 11, color: GRAY_500, marginTop: 8 }}>
        {UPLOAD_HELP_TEXT}
      </div>
      {uploadError && (
        <div style={{ fontSize: 12, color: '#b00020', marginTop: 6 }}>
          {uploadError}
        </div>
      )}
    </div>
  )
}
