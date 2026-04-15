import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import {
  verifyAdminSessionToken,
  ADMIN_COOKIE_NAME,
} from '../../../../lib/adminSession'

/**
 * PATCH /api/devis/[id]
 *
 * Édition admin d'un devis custom (aujourd'hui : champ `details` uniquement).
 * Protégé par la session admin (cookie signé). Refuse toute modification
 * une fois le devis payé, comme le PATCH email.
 */
export async function PATCH(request, { params }) {
  try {
    // ─── Auth admin (cookie signé) ─────────────────────────────────
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
    const authResult = verifyAdminSessionToken(token)
    if (!authResult.valid) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))

    // Seuls les champs explicitement autorisés sont patchables ici.
    // (name/email/amount/status restent gérés ailleurs ou en direct supabase.)
    const updates = {}
    if (Object.prototype.hasOwnProperty.call(body, 'details')) {
      // null ou chaîne vide → on stocke null en base (cohérent avec le fallback)
      const raw = body.details
      if (raw === null || (typeof raw === 'string' && raw.trim() === '')) {
        updates.details = null
      } else if (typeof raw === 'string') {
        updates.details = raw
      } else {
        return NextResponse.json({ error: 'details doit être une chaîne' }, { status: 400 })
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    // ─── Vérification du statut (paid → figé) ───────────────────────
    const { data: quote, error: fetchErr } = await supabase
      .from('quotes')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchErr || !quote) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    }

    if (quote.status === 'paid') {
      return NextResponse.json(
        { error: 'Ce devis a déjà été réglé et ne peut plus être modifié.' },
        { status: 400 }
      )
    }

    // ─── Update ─────────────────────────────────────────────────────
    const { data: updated, error: updateErr } = await supabase
      .from('quotes')
      .update(updates)
      .eq('id', id)
      .neq('status', 'paid') // garde-fou atomique contre la race si paid entre-temps
      .select()
      .single()

    if (updateErr) {
      console.error('Devis PATCH error:', updateErr)
      return NextResponse.json({ error: 'Erreur de mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, quote: updated })
  } catch (err) {
    console.error('Devis PATCH exception:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
