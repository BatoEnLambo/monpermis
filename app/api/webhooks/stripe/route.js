import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '../../../../lib/supabase'
import { generateAccessToken } from '../../../../lib/token'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Disable body parsing — Stripe needs raw body for signature verification
export const config = {
  api: { bodyParser: false },
}

// Postgres unique_violation
const PG_UNIQUE_VIOLATION = '23505'

export async function POST(request) {
  let event

  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  } catch (err) {
    console.error('Webhook body read error:', err.message)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    // ── Mode devis ──
    const quoteId = session.metadata?.quote_id
    if (quoteId) {
      try {
        const result = await handleQuotePayment(session, quoteId)
        if (result?.alreadyProcessed) {
          return NextResponse.json({ received: true, already_processed: true })
        }
      } catch (err) {
        console.error('Quote webhook handler error:', err)
        // Return 200 anyway to prevent Stripe retries on logic errors.
        // L'erreur est loggée pour investigation manuelle.
      }
    }

    // ── Mode self-service ──
    const projectId = session.metadata?.project_id
    if (projectId) {
      try {
        const result = await handleSelfServicePayment(session, projectId)
        if (result?.alreadyProcessed) {
          return NextResponse.json({ received: true, already_processed: true })
        }
      } catch (err) {
        console.error('Self-service webhook handler error:', err)
      }
    }
  }

  // Always return 200 quickly
  return NextResponse.json({ received: true })
}

async function handleQuotePayment(session, quoteId) {
  // ─── Étape 1 : CLAIM atomique ───
  // UPDATE ... WHERE id=? AND status != 'paid' : si le retry arrive, 0 row affectée.
  // La contrainte UNIQUE sur stripe_session_id est un second garde-fou côté DB.
  const nowIso = new Date().toISOString()

  let claimed
  try {
    const { data, error } = await supabase
      .from('quotes')
      .update({
        status: 'paid',
        paid_at: nowIso,
        stripe_session_id: session.id,
      })
      .eq('id', quoteId)
      .neq('status', 'paid')
      .select()
      .maybeSingle()

    if (error) {
      // Violation unique → un autre handler a déjà claim avec cette session → retry Stripe
      if (error.code === PG_UNIQUE_VIOLATION) {
        console.log('Webhook: quote already processed (unique violation)', quoteId)
        return { alreadyProcessed: true }
      }
      console.error('Webhook: quote claim error', quoteId, error)
      return
    }

    claimed = data
  } catch (err) {
    console.error('Webhook: quote claim exception', quoteId, err)
    return
  }

  // 0 row affectée → status était déjà 'paid' → retry Stripe, déjà traité
  if (!claimed) {
    console.log('Webhook: quote already paid, skipping', quoteId)
    return { alreadyProcessed: true }
  }

  // ─── Étape 2 : création du projet ───
  const clientEmail = claimed.client_email || session.customer_details?.email || null
  const reference = 'PC-' + Date.now().toString(36).toUpperCase()
  const token = generateAccessToken()
  const nameParts = (claimed.client_name || '').split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  const { data: project, error: pErr } = await supabase
    .from('projects')
    .insert({
      reference,
      token,
      project_type: 'custom',
      first_name: firstName,
      last_name: lastName,
      email: clientEmail,
      price: claimed.amount,
      status: 'paid',
      paid_at: nowIso,
      stripe_session_id: session.id,
    })
    .select()
    .single()

  if (pErr) {
    // Second garde-fou : si un projet avec ce session.id existe déjà, c'est un retry
    if (pErr.code === PG_UNIQUE_VIOLATION) {
      console.log('Webhook: project already created for this session', quoteId, session.id)
      return { alreadyProcessed: true }
    }
    console.error('Webhook: project creation failed', pErr)
    return
  }

  // ─── Étape 3 : lier le projet au devis + renseigner email si manquait ───
  const quotePatch = { project_id: project.id }
  if (!claimed.client_email && clientEmail) {
    quotePatch.client_email = clientEmail
  }
  await supabase.from('quotes').update(quotePatch).eq('id', quoteId)

  console.log('Webhook: quote paid, project created', {
    quoteId,
    projectId: project.id,
    reference,
  })

  // ─── Étape 4 : welcome email (fire-and-forget) ───
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.permisclair.fr'
    await fetch(`${baseUrl}/api/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: clientEmail,
        firstName,
        reference,
        token,
        projectType: claimed.project_title,
        price: claimed.amount,
        options: [],
      }),
    })
  } catch (emailErr) {
    console.error('Webhook: welcome email failed (non-blocking)', emailErr)
  }
}

async function handleSelfServicePayment(session, projectId) {
  // ─── CLAIM atomique ───
  // UPDATE ... WHERE id=? AND status != 'paid' : 0 row affectée si retry.
  const nowIso = new Date().toISOString()

  let claimed
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        status: 'paid',
        paid_at: nowIso,
        stripe_session_id: session.id,
      })
      .eq('id', projectId)
      .neq('status', 'paid')
      .select()
      .maybeSingle()

    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) {
        console.log('Webhook: self-service already processed (unique violation)', projectId)
        return { alreadyProcessed: true }
      }
      console.error('Webhook: self-service claim error', projectId, error)
      return
    }

    claimed = data
  } catch (err) {
    console.error('Webhook: self-service claim exception', projectId, err)
    return
  }

  if (!claimed) {
    console.log('Webhook: project already paid, skipping', projectId)
    return { alreadyProcessed: true }
  }

  console.log('Webhook: self-service project paid', {
    projectId,
    reference: claimed.reference,
  })

  // ─── Welcome email ───
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.permisclair.fr'
    await fetch(`${baseUrl}/api/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: claimed.email,
        firstName: claimed.first_name,
        reference: claimed.reference,
        token: claimed.token,
        projectType: claimed.project_type,
        price: claimed.price,
        options: claimed.options || [],
      }),
    })
  } catch (emailErr) {
    console.error('Webhook: welcome email failed (non-blocking)', emailErr)
  }
}
