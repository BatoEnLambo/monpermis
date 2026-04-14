import { NextResponse } from 'next/server'
import { supabase } from '../../../../../../lib/supabase'
import { extractStorageKeyFromUrl } from '../../../../../../lib/storage'

async function verifyAccess(reference, token) {
  if (!token) {
    return { error: 'Token manquant', status: 401 }
  }
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, token')
    .eq('reference', reference)
    .single()
  if (error || !project) {
    return { error: 'Projet introuvable', status: 404 }
  }
  if (project.token !== token) {
    return { error: 'Token invalide', status: 403 }
  }
  return { project }
}

/**
 * Supprime des fichiers du bucket Supabase Storage à partir d'une liste d'URLs.
 * Les erreurs sont logguées mais non-bloquantes (best-effort).
 */
async function removeStorageUrls(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return
  const keys = urls.map(extractStorageKeyFromUrl).filter(Boolean)
  if (keys.length === 0) return
  try {
    const { error } = await supabase.storage.from('documents').remove(keys)
    if (error) {
      console.warn('Ouvrage: storage cleanup warning', { keys, error: error.message })
    }
  } catch (err) {
    console.warn('Ouvrage: storage cleanup exception', { keys, error: err?.message })
  }
}

export async function PATCH(request, { params }) {
  const { reference, ouvrageId } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  const access = await verifyAccess(reference, token)
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status })

  // Vérifier que l'ouvrage appartient bien à ce project, et récupérer les photos existantes pour diff
  const { data: ouvrage, error: oErr } = await supabase
    .from('project_ouvrages')
    .select('id, project_id, photo_urls')
    .eq('id', ouvrageId)
    .single()

  if (oErr || !ouvrage || ouvrage.project_id !== access.project.id) {
    return NextResponse.json({ error: 'Ouvrage introuvable' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const updates = {}
  if (typeof body.name === 'string') updates.name = body.name
  if (typeof body.type === 'string') updates.type = body.type
  if ('subtype' in body) updates.subtype = body.subtype || null
  if ('description_libre' in body) updates.description_libre = body.description_libre || null
  if (Array.isArray(body.photo_urls)) updates.photo_urls = body.photo_urls
  if (body.data && typeof body.data === 'object') updates.data = body.data
  if (typeof body.position === 'number') updates.position = body.position
  updates.updated_at = new Date().toISOString()

  const { data: updated, error } = await supabase
    .from('project_ouvrages')
    .update(updates)
    .eq('id', ouvrageId)
    .select()
    .single()

  if (error) {
    console.error('Ouvrage update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Cleanup des photos retirées (diff ancien → nouveau)
  if (Array.isArray(body.photo_urls)) {
    const oldUrls = Array.isArray(ouvrage.photo_urls) ? ouvrage.photo_urls : []
    const newUrls = body.photo_urls
    const removed = oldUrls.filter(u => !newUrls.includes(u))
    if (removed.length > 0) {
      await removeStorageUrls(removed)
    }
  }

  return NextResponse.json({ ouvrage: updated })
}

export async function DELETE(request, { params }) {
  const { reference, ouvrageId } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  const access = await verifyAccess(reference, token)
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status })

  // Vérifier que l'ouvrage appartient bien à ce project, et récupérer les photos pour cleanup
  const { data: ouvrage, error: oErr } = await supabase
    .from('project_ouvrages')
    .select('id, project_id, photo_urls')
    .eq('id', ouvrageId)
    .single()

  if (oErr || !ouvrage || ouvrage.project_id !== access.project.id) {
    return NextResponse.json({ error: 'Ouvrage introuvable' }, { status: 404 })
  }

  // Cleanup Storage AVANT la suppression DB (best-effort : non bloquant en cas d'erreur)
  if (Array.isArray(ouvrage.photo_urls) && ouvrage.photo_urls.length > 0) {
    await removeStorageUrls(ouvrage.photo_urls)
  }

  const { error } = await supabase
    .from('project_ouvrages')
    .delete()
    .eq('id', ouvrageId)

  if (error) {
    console.error('Ouvrage delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
