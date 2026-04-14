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
        await handleQuotePayment(session, quoteId)
      } catch (err) {
        console.error('Quote webhook handler error:', err)
        // Return 200 anyway to prevent Stripe retries on logic errors
        // The error is logged for manual investigation
      }
    }

    // ── Mode self-service ──
    const projectId = session.metadata?.project_id
    if (projectId) {
      try {
        await handleSelfServicePayment(session, projectId)
      } catch (err) {
        console.error('Self-service webhook handler error:', err)
      }
    }
  }

  // Always return 200 quickly
  return NextResponse.json({ received: true })
}

async function handleQuotePayment(session, quoteId) {
  // Fetch quote
  const { data: quote, error: qErr } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single()

  if (qErr || !quote) {
    console.error('Webhook: quote not found', quoteId, qErr)
    return
  }

  // Idempotence: skip if already paid
  if (quote.status === 'paid') {
    console.log('Webhook: quote already paid, skipping', quoteId)
    return
  }

  // Use Stripe email if missing from quote
  const clientEmail = quote.client_email || session.customer_details?.email || null

  // Create project
  const reference = 'PC-' + Date.now().toString(36).toUpperCase()
  const token = generateAccessToken()
  const nameParts = (quote.client_name || '').split(' ')
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
      price: quote.amount,
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (pErr || !project) {
    console.error('Webhook: project creation failed', pErr)
    return
  }

  // Update quote: paid + link to project + fill email if was missing
  const quoteUpdate = {
    status: 'paid',
    paid_at: new Date().toISOString(),
    stripe_session_id: session.id,
    project_id: project.id,
  }
  if (!quote.client_email && clientEmail) {
    quoteUpdate.client_email = clientEmail
  }

  await supabase
    .from('quotes')
    .update(quoteUpdate)
    .eq('id', quoteId)

  console.log('Webhook: quote paid, project created', { quoteId, projectId: project.id, reference })

  // Send welcome email (fire-and-forget, don't block webhook response)
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
        projectType: quote.project_title,
        price: quote.amount,
        options: [],
      }),
    })
  } catch (emailErr) {
    console.error('Webhook: welcome email failed (non-blocking)', emailErr)
  }
}

async function handleSelfServicePayment(session, projectId) {
  // Fetch project
  const { data: project, error: pErr } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (pErr || !project) {
    console.error('Webhook: project not found', projectId, pErr)
    return
  }

  // Idempotence: skip if already paid
  if (project.status === 'paid' || project.paid_at) {
    console.log('Webhook: project already paid, skipping', projectId)
    return
  }

  // Update project status
  await supabase
    .from('projects')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', projectId)

  console.log('Webhook: self-service project paid', { projectId, reference: project.reference })

  // Send welcome email
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.permisclair.fr'
    await fetch(`${baseUrl}/api/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: project.email,
        firstName: project.first_name,
        reference: project.reference,
        token: project.token,
        projectType: project.project_type,
        price: project.price,
        options: project.options || [],
      }),
    })
  } catch (emailErr) {
    console.error('Webhook: welcome email failed (non-blocking)', emailErr)
  }
}
