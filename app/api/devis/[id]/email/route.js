import { NextResponse } from 'next/server'
import { supabase } from '../../../../../lib/supabase'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function PATCH(request, { params }) {
  try {
    const { email } = await request.json()

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    const { id } = await params

    const { data: quote, error: fetchErr } = await supabase
      .from('quotes')
      .select('id, status, client_email')
      .eq('id', id)
      .single()

    if (fetchErr || !quote) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    }

    if (quote.status === 'paid') {
      return NextResponse.json({ error: 'Ce devis a déjà été réglé' }, { status: 400 })
    }

    const incoming = email.trim().toLowerCase()
    const existing = (quote.client_email || '').trim().toLowerCase()

    // Cas 1 : email déjà renseigné et identique au nouveau → idempotent, no-op
    if (existing && existing === incoming) {
      return NextResponse.json({ ok: true, unchanged: true })
    }

    // Cas 2 : email déjà renseigné mais différent → refus
    if (existing && existing !== incoming) {
      console.warn('[security] email override attempt on quote', id, {
        existing: quote.client_email,
        attempted: email.trim(),
      })
      return NextResponse.json(
        {
          error:
            "L'email de ce devis est déjà renseigné et ne peut pas être modifié. Contactez le support.",
        },
        { status: 403 }
      )
    }

    // Cas 3 : email null → première saisie autorisée
    const { error: updateErr } = await supabase
      .from('quotes')
      .update({ client_email: email.trim() })
      .eq('id', id)
      .is('client_email', null) // garde-fou atomique contre la race si deux PATCH concurrents

    if (updateErr) {
      console.error('Email update error:', updateErr)
      return NextResponse.json({ error: 'Erreur de mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Devis email error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
