import { supabase } from './supabase'

// ─── Validation des uploads ───
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'application/pdf',
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export const UPLOAD_HELP_TEXT =
  'Formats acceptés : JPG, PNG, WEBP, HEIC, PDF. Taille max : 10 MB par fichier.'

export const UPLOAD_ACCEPT_ATTR =
  '.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.pdf,image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,application/pdf'

export class UploadValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UploadValidationError'
  }
}

/**
 * Valide un fichier avant upload. Jette une UploadValidationError si invalide.
 * Vérifie le type MIME et la taille maximum.
 */
export function validateUploadFile(file) {
  if (!file) {
    throw new UploadValidationError('Aucun fichier fourni.')
  }

  const type = (file.type || '').toLowerCase()
  if (!ALLOWED_MIME_TYPES.includes(type)) {
    throw new UploadValidationError(
      `Format non supporté (${file.type || 'type inconnu'}). ${UPLOAD_HELP_TEXT}`
    )
  }

  if (typeof file.size === 'number' && file.size > MAX_FILE_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
    throw new UploadValidationError(
      `Fichier trop volumineux (${sizeMb} MB). Taille max : 10 MB.`
    )
  }
}

/**
 * Extrait la clé de stockage Supabase ("projectId/xxx.jpg") depuis une URL publique.
 * Retourne null si l'URL n'est pas une URL Supabase Storage publique valide.
 */
export function extractStorageKeyFromUrl(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return null
  try {
    const url = new URL(fileUrl)
    const marker = '/storage/v1/object/public/documents/'
    const idx = url.pathname.indexOf(marker)
    if (idx === -1) return null
    const key = url.pathname.slice(idx + marker.length)
    if (!key) return null
    return decodeURIComponent(key)
  } catch {
    return null
  }
}

export async function uploadFile(file, projectId, uploadedBy) {
  validateUploadFile(file)

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${projectId}/${timestamp}_${safeName}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath)

  const { data: docData, error: docError } = await supabase
    .from('documents')
    .insert({
      project_id: projectId,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      uploaded_by: uploadedBy,
    })
    .select()
    .single()

  if (docError) throw docError
  return docData
}

export async function getDocuments(projectId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function deleteDocument(docId, fileUrl) {
  const key = extractStorageKeyFromUrl(fileUrl)

  if (key) {
    await supabase.storage.from('documents').remove([key])
  }

  const { error } = await supabase.from('documents').delete().eq('id', docId)
  if (error) throw error
}
