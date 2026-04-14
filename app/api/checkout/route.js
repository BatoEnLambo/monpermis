import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { computePrice } from '../../../src/config/pricing'
import { supabase } from '../../../lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  try {
    const formData = await request.formData()
    const projectId = formData.get('projectId')
    const reference = formData.get('reference')
    const category = formData.get('category')
    const options = JSON.parse(formData.get('options') || '[]').filter(o => o !== 'SECOND_DOSSIER')
    const label = formData.get('label')
    const email = formData.get('email')

    if (!projectId || !category) {
      console.error('Missing data:', { projectId, category })
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Recalculer le prix côté serveur (source de vérité)
    let price
    try {
      price = computePrice({ category, options })
    } catch (err) {
      console.error('INVALID PRICING:', { category, options, error: err.message })
      return NextResponse.json({ error: 'Catégorie de prix invalide' }, { status: 400 })
    }

    // Mettre à jour le prix et les options dans Supabase (options choisies sur /paiement)
    const { error: updateError } = await supabase
      .from('projects')
      .update({ price, options })
      .eq('id', projectId)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return NextResponse.json({ error: 'Erreur de mise à jour du projet' }, { status: 500 })
    }

    // Vérification de cohérence : relire et recomparer
    const { data: project, error: dbError } = await supabase
      .from('projects')
      .select('price, options')
      .eq('id', projectId)
      .single()

    if (dbError) {
      console.error('Supabase lookup error:', dbError)
      return NextResponse.json({ error: 'Projet introuvable' }, { status: 400 })
    }

    if (project.price !== price) {
      console.error('PRICE MISMATCH ATTEMPT:', {
        projectId,
        reference,
        supabasePrice: project.price,
        computedPrice: price,
        category,
        options,
        email,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Le prix ne correspond pas. Veuillez recommencer.' }, { status: 400 })
    }

    console.log('Checkout request:', { projectId, reference, price, category, options, label, email })

    const origin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/[^/]*$/, '') || 'https://www.permisclair.fr'

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
