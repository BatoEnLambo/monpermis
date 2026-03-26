import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  try {
    const body = await request.json()
    const { projectId, reference, price, label, email } = body

    if (!price || !projectId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: label || 'Dossier PermisClair',
              description: `Référence : ${reference}`,
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/paiement/succes?session_id={CHECKOUT_SESSION_ID}&project_id=${projectId}`,
      cancel_url: `${request.headers.get('origin')}/paiement?cancelled=true`,
      metadata: {
        project_id: projectId,
        reference: reference,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
