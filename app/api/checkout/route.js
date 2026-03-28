import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  try {
    const formData = await request.formData()
    const projectId = formData.get('projectId')
    const reference = formData.get('reference')
    const price = Number(formData.get('price'))
    const label = formData.get('label')
    const email = formData.get('email')

    console.log('Checkout request:', { projectId, reference, price, label, email })

    if (!price || !projectId) {
      console.error('Missing data:', { price, projectId })
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const origin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/[^/]*$/, '') || 'https://permisclair.fr'

    console.log('Using origin:', origin)

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
      success_url: `${origin}/paiement/succes?session_id={CHECKOUT_SESSION_ID}&project_id=${projectId}`,
      cancel_url: `${origin}/paiement?cancelled=true`,
      metadata: {
        project_id: projectId,
        reference: reference,
      },
    })

    return NextResponse.redirect(session.url, 303)
  } catch (error) {
    console.error('Stripe error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
