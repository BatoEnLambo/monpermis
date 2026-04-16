import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin'
import { computeProjectProgress } from '../../../lib/progress'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Baptiste de PermisClair <contact@permisclair.fr>'
const REPLY_TO = 'contact@permisclair.fr'
const BASE_URL = 'https://www.permisclair.fr'

// Statuts pour lesquels on n'envoie PAS de relance
const SKIP_STATUSES = ['delivered', 'deposited', 'accepted']

function emailHeader() {
  return `
    <div style="padding: 32px 0; border-bottom: 1px solid #e8e7e4;">
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="width:32px;height:32px;border-radius:8px;background:#1a5c3a;color:#ffffff;font-weight:700;font-size:14px;text-align:center;line-height:32px;font-family:Arial,sans-serif;">PC</td>
        <td style="padding-left:10px;font-size:18px;font-weight:700;color:#1c1c1a;font-family:Arial,sans-serif;">PermisClair</td>
      </tr></table>
    </div>`
}

function emailFooter() {
  return `
    <div style="padding: 20px 0; border-top: 1px solid #e8e7e4; font-size: 12px; color: #888; line-height: 1.5;">
      PermisClair — Plans et permis de construire, cl\u00e9 en main.<br>
      Vend\u00e9e, France<br>
      <a href="${BASE_URL}" style="color: #888;">permisclair.fr</a>
    </div>`
}

function greenButton(text, url) {
  return `<a href="${url}" style="display: inline-block; padding: 14px 28px; background: #1a5c3a; color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600;">${text}</a>`
}

function wrapEmail(content) {
  return `<div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1c1c1a;">${emailHeader()}<div style="padding: 32px 0;">${content}</div>${emailFooter()}</div>`
}

function templateJ1(prenom, clientUrl) {
  return wrapEmail(`
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.02em;">
      Votre espace projet est pr\u00eat !
    </h1>
    <p style="font-size: 15px; color: #666; margin: 0 0 24px; line-height: 1.6;">
      Bonjour ${prenom},<br><br>
      Pour que nous puissions d\u00e9marrer la r\u00e9alisation de vos plans, nous avons besoin de quelques informations.
    </p>
    <p style="font-size: 15px; color: #666; margin: 0 0 24px; line-height: 1.6;">
      Remplissez votre fiche technique ici — \u00e7a ne prend que quelques minutes :
    </p>
    <div style="margin-bottom: 24px;">
      ${greenButton('Compl\u00e9ter ma fiche technique \u2192', clientUrl)}
    </div>
    <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 0;">
      Vous pouvez remplir ce que vous savez et revenir compl\u00e9ter plus tard. Pour ce que vous ne savez pas, cochez simplement \u00ab\u00a0Je ne sais pas\u00a0\u00bb.
    </p>
    <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 16px 0 0;">
      \u00c0 tr\u00e8s vite,<br>Baptiste — PermisClair
    </p>
  `)
}

function templateJ3(prenom, pourcentage, clientUrl) {
  return wrapEmail(`
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.02em;">
      Il nous manque quelques infos
    </h1>
    <p style="font-size: 15px; color: #666; margin: 0 0 24px; line-height: 1.6;">
      Bonjour ${prenom},<br><br>
      Votre fiche technique est \u00e0 <strong>${pourcentage}\u00a0%</strong> — il nous manque encore quelques infos pour lancer la production de vos plans.
    </p>
    <p style="font-size: 15px; color: #444; margin: 0 0 4px; line-height: 1.6; font-weight: 600;">
      Les \u00e9l\u00e9ments les plus importants pour avancer :
    </p>
    <ul style="font-size: 14px; color: #666; line-height: 1.8; margin: 0 0 24px; padding-left: 20px;">
      <li>Votre croquis (m\u00eame \u00e0 main lev\u00e9e, une photo suffit)</li>
      <li>Les dimensions de vos pi\u00e8ces</li>
      <li>Les photos du terrain</li>
    </ul>
    <div style="margin-bottom: 24px;">
      ${greenButton('Compl\u00e9ter ma fiche technique \u2192', clientUrl)}
    </div>
    <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 0;">
      Si vous avez des questions, r\u00e9pondez simplement \u00e0 cet email.
    </p>
    <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 16px 0 0;">
      Baptiste — PermisClair
    </p>
  `)
}

function templateJ7(prenom, typeProjet, clientUrl) {
  return wrapEmail(`
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.02em;">
      On peut vous aider ?
    </h1>
    <p style="font-size: 15px; color: #666; margin: 0 0 24px; line-height: 1.6;">
      Bonjour ${prenom},<br><br>
      Votre dossier <strong>${typeProjet}</strong> est en attente de vos informations depuis une semaine. On ne peut pas d\u00e9marrer vos plans sans votre fiche technique compl\u00e9t\u00e9e.
    </p>
    <p style="font-size: 15px; color: #666; margin: 0 0 24px; line-height: 1.6;">
      Besoin d\u2019aide pour la remplir ? R\u00e9pondez \u00e0 cet email ou appelez-moi, je vous guide.
    </p>
    <div style="margin-bottom: 24px;">
      ${greenButton('Reprendre ma fiche technique \u2192', clientUrl)}
    </div>
    <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 0;">
      Baptiste — PermisClair
    </p>
  `)
}

// Le calcul de progression est centralisé dans lib/progress.js
// (partagé avec /admin et /projet/[reference]).
// Pondération : 20% coordonnées + 50% ouvrages + 20% terrain + 10% photos.

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (!key || key !== process.env.REMINDER_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results = { checked: 0, sent: [], skipped: [], errors: [] }

  try {
    // Récupérer les projets payés, pas encore livrés, avec au moins un flag non envoyé
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('id, reference, token, email, first_name, project_type, paid_at, status, reminder_j1_sent, reminder_j3_sent, reminder_j7_sent')
      .not('paid_at', 'is', null)
      .not('status', 'in', `(${SKIP_STATUSES.join(',')})`)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({ ...results, message: 'Aucun projet éligible' })
    }

    for (const p of projects) {
      results.checked++
      const paidAt = new Date(p.paid_at)
      const hoursSincePaid = (now - paidAt) / (1000 * 60 * 60)

      // Récupérer les détails pour calculer la progression
      const { data: details } = await supabase
        .from('project_details')
        .select('*')
        .eq('project_id', p.id)
        .single()

      // Récupérer les ouvrages pour inclure leur progression
      const { data: ouvrages } = await supabase
        .from('project_ouvrages')
        .select('name, type, subtype, data')
        .eq('project_id', p.id)

      // Compter les photos terrain uploadées dans Storage
      // (documents/{project_id}/photos-terrain/). Le cron ne les comptait
      // pas avant la refactorisation ; maintenant que lib/progress pèse les
      // photos pour 10%, il faut les inclure pour rester aligné avec l'UI.
      const { data: photoFiles } = await supabase.storage
        .from('documents')
        .list(`${p.id}/photos-terrain`)
      const photoCount = (photoFiles || [])
        .filter(f => f.name && f.name !== '.emptyFolderPlaceholder')
        .length

      const percentage = computeProjectProgress(details, ouvrages || [], photoCount)
      const clientUrl = `${BASE_URL}/projet/${p.reference}?token=${p.token}`
      const prenom = details?.client_prenom || p.first_name || ''
      // On évite d'injecter "custom" dans le mail client — c'est une valeur
      // technique interne qui apparaîtrait sous la forme "Votre dossier custom
      // est en attente…". Pour les projects issus de devis, le type est
      // remplacé par un libellé neutre ("projet"). Les self-service gardent
      // leur type réel (maison neuve, piscine, extension…).
      const typeProjet =
        p.project_type && p.project_type !== 'custom'
          ? p.project_type.toLowerCase()
          : 'projet'

      // Un seul email par exécution par projet
      let sentThisRun = false

      // J+7 (vérifié en premier pour éviter d'envoyer J+1 et J+7 le même jour si très en retard)
      if (!sentThisRun && !p.reminder_j7_sent && hoursSincePaid >= 168 && percentage < 100) {
        try {
          await resend.emails.send({
            from: FROM,
            replyTo: REPLY_TO,
            to: p.email,
            subject: 'On peut vous aider ? Votre dossier PermisClair attend vos infos',
            html: templateJ7(prenom, typeProjet, clientUrl),
          })
          await supabase.from('projects').update({ reminder_j7_sent: true }).eq('id', p.id)
          results.sent.push({ reference: p.reference, type: 'J+7', percentage })
          sentThisRun = true
        } catch (err) {
          results.errors.push({ reference: p.reference, type: 'J+7', error: err.message })
        }
      }

      // J+3
      if (!sentThisRun && !p.reminder_j3_sent && hoursSincePaid >= 72 && percentage < 70) {
        try {
          await resend.emails.send({
            from: FROM,
            replyTo: REPLY_TO,
            to: p.email,
            subject: 'Il nous manque quelques infos pour d\u00e9marrer vos plans',
            html: templateJ3(prenom, percentage, clientUrl),
          })
          await supabase.from('projects').update({ reminder_j3_sent: true }).eq('id', p.id)
          results.sent.push({ reference: p.reference, type: 'J+3', percentage })
          sentThisRun = true
        } catch (err) {
          results.errors.push({ reference: p.reference, type: 'J+3', error: err.message })
        }
      }

      // J+1
      if (!sentThisRun && !p.reminder_j1_sent && hoursSincePaid >= 24 && percentage < 30) {
        try {
          await resend.emails.send({
            from: FROM,
            replyTo: REPLY_TO,
            to: p.email,
            subject: 'Votre espace projet PermisClair est pr\u00eat',
            html: templateJ1(prenom, clientUrl),
          })
          await supabase.from('projects').update({ reminder_j1_sent: true }).eq('id', p.id)
          results.sent.push({ reference: p.reference, type: 'J+1', percentage })
          sentThisRun = true
        } catch (err) {
          results.errors.push({ reference: p.reference, type: 'J+1', error: err.message })
        }
      }

      if (!sentThisRun) {
        results.skipped.push({ reference: p.reference, percentage, hoursSincePaid: Math.round(hoursSincePaid) })
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
