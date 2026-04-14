import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import {
  createAdminSessionToken,
  buildAdminSessionCookie,
} from '../../../../lib/adminSession'

// Rate limiting en mémoire (simple, par instance Vercel).
// Pour une protection robuste multi-instances, utiliser Upstash/Redis.
const attempts = new Map() // ip -> { count, firstAt }
const MAX_ATTEMPTS = 5
const WINDOW_MS = 10 * 60 * 1000 // 10 minutes

function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function checkRateLimit(ip) {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now })
    return { ok: true }
  }
  entry.count++
  if (entry.count > MAX_ATTEMPTS) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((WINDOW_MS - (now - entry.firstAt)) / 1000),
    }
  }
  return { ok: true }
}

function clearRateLimit(ip) {
  attempts.delete(ip)
}

export async function POST(request) {
  const ip = getClientIp(request)

  const rl = checkRateLimit(ip)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Trop de tentatives. Réessaie dans ${Math.ceil(rl.retryAfterSec / 60)} min.` },
      { status: 429 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const provided = typeof body?.password === 'string' ? body.password : ''
  const expected = process.env.ADMIN_PASSWORD

  if (!expected) {
    console.error('[admin/login] ADMIN_PASSWORD not configured')
    return NextResponse.json(
      { error: 'Serveur mal configuré (ADMIN_PASSWORD manquant)' },
      { status: 500 }
    )
  }

  // Comparaison en temps constant pour éviter les timing attacks
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  const matches = a.length === b.length && timingSafeEqual(a, b)

  if (!matches) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  // Success: reset rate limit for this IP and emit signed cookie
  clearRateLimit(ip)

  let token
  try {
    token = createAdminSessionToken()
  } catch (err) {
    console.error('[admin/login] session token error:', err.message)
    return NextResponse.json(
      { error: 'Serveur mal configuré (ADMIN_SESSION_SECRET manquant)' },
      { status: 500 }
    )
  }

  const response = NextResponse.json({ ok: true })
  response.headers.set('Set-Cookie', buildAdminSessionCookie(token))
  return response
}
