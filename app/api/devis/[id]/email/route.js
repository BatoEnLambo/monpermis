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
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchErr || !quote) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    }

    if (quote.status === 'paid') {
      return NextResponse.json({ error: 'Ce devis a déjà été réglé' }, { status: 400 })
    }

    const { error: updateErr } = await supabase
      .from('quotes')
      .update({ client_email: email.trim() })
      .eq('id', id)

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
