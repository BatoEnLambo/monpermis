import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '../../../../../lib/supabaseAdmin'

// Vérifie que le token dans l'URL correspond bien au project identifié par reference.
// Retourne { project } si OK, ou { error, status } sinon.
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

export async function GET(request, { params }) {
  const { reference } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  const access = await verifyAccess(reference, token)
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status })

  const { data, error } = await supabase
    .from('project_ouvrages')
    .select('*')
    .eq('project_id', access.project.id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ouvrages: data || [] })
}

export async function POST(request, { params }) {
  const { reference } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  const access = await verifyAccess(reference, token)
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status })

  const body = await request.json().catch(() => ({}))
  const { name, type, subtype, description_libre, photo_urls, data } = body

  if (!name || !type) {
    return NextResponse.json({ error: 'Nom et type requis' }, { status: 400 })
  }

  // Déterminer la position (à la fin de la liste existante)
  const { data: existing } = await supabase
    .from('project_ouvrages')
    .select('position')
    .eq('project_id', access.project.id)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = existing && existing[0] ? (existing[0].position || 0) + 1 : 0

  const { data: created, error } = await supabase
    .from('project_ouvrages')
    .insert({
      project_id: access.project.id,
      position: nextPosition,
      name,
      type,
      subtype: subtype || null,
      data: data || {},
      description_libre: description_libre || null,
      photo_urls: photo_urls || [],
    })
    .select()
    .single()

  if (error) {
    console.error('Ouvrage create error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ouvrage: created })
}
