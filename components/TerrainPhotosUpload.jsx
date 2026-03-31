'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const GRAY_200 = "#e8e7e4"
const GRAY_300 = "#d4d3d0"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"

const SLOTS = [
  { key: 'vue-nord', label: 'Vue Nord' },
  { key: 'vue-sud', label: 'Vue Sud' },
  { key: 'vue-est', label: 'Vue Est' },
  { key: 'vue-ouest', label: 'Vue Ouest' },
  { key: 'vue-rue', label: 'Vue depuis la rue / chemin d\'accès' },
]

const ACCEPTED = '.jpg,.jpeg,.png,.webp'
const BUCKET = 'documents'

function getExt(filename) {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : 'jpg'
}

export default function TerrainPhotosUpload({ projectId, token, onPhotoCountChange }) {
  const [photos, setPhotos] = useState({})
  const [uploading, setUploading] = useState({})
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
    setUploading(prev => ({ ...prev, [slotKey]: true }))

    try {
      const ext = getExt(file.name)
      const filePath = `${projectId}/photos-terrain/${slotKey}.${ext}`

      // Remove existing file for this slot if any
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
    <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: GRAY_900, margin: 0, letterSpacing: '-0.02em' }}>
          Photos du terrain
        </h3>
        <span style={{ fontSize: 12, fontWeight: 500, color: GRAY_500 }}>
          {photoCount}/5 photos
        </span>
      </div>

      <div className="terrain-photos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {SLOTS.map(slot => {
          const photo = photos[slot.key]
          const isUploading = uploading[slot.key]

          return (
            <div key={slot.key} style={{ position: 'relative' }}>
              <input
                ref={el => inputRefs.current[slot.key] = el}
                type="file"
                accept={ACCEPTED}
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files[0]) handleUpload(slot.key, e.target.files[0])
                }}
              />

              {photo ? (
                <div style={{
                  position: 'relative',
                  borderRadius: 10,
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
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(0,0,0,0.5)',
                      color: WHITE,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,57,43,0.8)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                    title="Supprimer"
                  >
                    🗑
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => !isUploading && inputRefs.current[slot.key]?.click()}
                  style={{
                    borderRadius: 10,
                    border: `2px dashed ${GRAY_300}`,
                    aspectRatio: '4/3',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: isUploading ? 'wait' : 'pointer',
                    background: isUploading ? ACCENT_LIGHT : WHITE,
                    transition: 'all 0.15s',
                    opacity: isUploading ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { if (!isUploading) e.currentTarget.style.borderColor = ACCENT }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = GRAY_300 }}
                >
                  <span style={{ fontSize: 24, color: GRAY_300 }}>📷</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: GRAY_500, textAlign: 'center', padding: '0 8px' }}>
                    {isUploading ? 'Upload...' : slot.label}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
