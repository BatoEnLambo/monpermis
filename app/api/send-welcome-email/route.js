import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, firstName, reference, token, projectType, price, options = [] } = body

    if (!email || !reference || !token) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const clientUrl = `https://www.permisclair.fr/projet/${reference}?token=${token}`

    const { data, error } = await resend.emails.send({
      from: 'PermisClair <contact@permisclair.fr>',
      to: email,
      subject: `Paiement confirmé — votre dossier ${reference} est lancé`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1c1c1a;">
          <div style="padding: 32px 0; border-bottom: 1px solid #e8e7e4;">
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="width:32px;height:32px;border-radius:8px;background:#1a5c3a;color:#ffffff;font-weight:700;font-size:14px;text-align:center;line-height:32px;font-family:Arial,sans-serif;">PC</td>
              <td style="padding-left:10px;font-size:18px;font-weight:700;color:#1c1c1a;font-family:Arial,sans-serif;">PermisClair</td>
            </tr></table>
          </div>

          <div style="padding: 32px 0;">
            <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.02em;">
              Merci ${firstName || ''} ! Votre dossier est lancé.
            </h1>
            <p style="font-size: 15px; color: #666; margin: 0 0 24px; line-height: 1.6;">
              Nous avons bien reçu votre paiement de <strong>${price} €</strong> pour votre projet <strong>${projectType}</strong>. Votre référence est <strong>${reference}</strong>.${options.includes('SECOND_DOSSIER') ? '<br><br>Votre commande inclut un <strong>2e dossier sur la même parcelle</strong>.' : ''}
            </p>

            <div style="background: #e8f5ee; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <div style="font-size: 14px; font-weight: 700; color: #1a5c3a; margin-bottom: 4px;">Prochaines étapes</div>
              <ol style="font-size: 14px; color: #333; margin: 8px 0 0; padding-left: 20px; line-height: 1.8;">
                <li>Nous analysons votre projet et le PLU de votre commune</li>
                <li>Nous réalisons vos plans sur mesure</li>
                <li>Vous recevez votre dossier complet dans votre espace client</li>
              </ol>
            </div>

            <div style="margin-bottom: 24px;">
              <div style="font-size: 14px; color: #666; margin-bottom: 12px;">Accédez à votre espace client pour suivre l'avancement et déposer vos documents :</div>
              <a href="${clientUrl}" style="display: inline-block; padding: 14px 28px; background: #1a5c3a; color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600;">
                Accéder à mon espace client →
              </a>
            </div>

            <div style="background: #f5f4f2; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <div style="font-size: 13px; color: #888; margin-bottom: 8px;">Conservez ce lien — il vous permet de retrouver votre espace à tout moment :</div>
              <a href="${clientUrl}" style="font-size: 13px; color: #1a5c3a; word-break: break-all;">${clientUrl}</a>
            </div>

            <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 0;">
              Une question ? Répondez directement à cet email ou écrivez-nous à <a href="mailto:contact@permisclair.fr" style="color: #1a5c3a;">contact@permisclair.fr</a>.
            </p>
          </div>

          <div style="padding: 20px 0; border-top: 1px solid #e8e7e4; font-size: 12px; color: #888; line-height: 1.5;">
            PermisClair — Plans et permis de construire, clé en main.<br>
            Vendée, France<br>
            <a href="https://www.permisclair.fr" style="color: #888;">permisclair.fr</a>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Notification à Baptiste
    try {
      await resend.emails.send({
        from: 'PermisClair <contact@permisclair.fr>',
        to: 'baptistedubreil0@gmail.com',
        subject: `💰 Nouveau paiement — ${reference} — ${price}€`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; color: #1c1c1a;">
            <h2 style="font-size: 18px; margin: 0 0 16px;">Nouveau paiement reçu !</h2>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #888;">Référence</td><td style="padding: 6px 0; font-weight: 600;">${reference}</td></tr>
              <tr><td style="padding: 6px 0; color: #888;">Client</td><td style="padding: 6px 0;">${firstName || ''} (${email})</td></tr>
              <tr><td style="padding: 6px 0; color: #888;">Projet</td><td style="padding: 6px 0;">${projectType}</td></tr>
              <tr><td style="padding: 6px 0; color: #888;">Montant</td><td style="padding: 6px 0; font-weight: 700; color: #1a5c3a;">${price} €</td></tr>${options.length > 0 ? `<tr><td style="padding: 6px 0; color: #888;">Options</td><td style="padding: 6px 0;">${options.includes('RE2020') ? 'RE2020' : ''}${options.includes('RE2020') && options.includes('SECOND_DOSSIER') ? ', ' : ''}${options.includes('SECOND_DOSSIER') ? '2e dossier' : ''}</td></tr>` : ''}
            </table>
            <div style="margin-top: 20px;">
              <a href="https://www.permisclair.fr/admin" style="display: inline-block; padding: 12px 24px; background: #1a5c3a; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Voir dans l'admin →</a>
            </div>
          </div>
        `,
      })
    } catch (adminErr) {
      console.error('Admin notification error:', adminErr)
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
