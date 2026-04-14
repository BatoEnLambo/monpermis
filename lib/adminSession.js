import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

// Durée de session admin : 8 heures
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60
export const ADMIN_COOKIE_NAME = 'admin_session'

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'ADMIN_SESSION_SECRET manquant ou trop court (min 32 chars). ' +
        'Génère-le avec : node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }
  return secret
}

function base64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function sign(payload) {
  return base64url(createHmac('sha256', getSecret()).update(payload).digest())
}

/**
 * Crée un token de session admin signé HMAC.
 * Format : base64url(JSON payload).base64url(HMAC-SHA256)
 * Payload : { iat: issued_at_seconds, exp: expires_at_seconds, nonce }
 */
export function createAdminSessionToken() {
  const nowSec = Math.floor(Date.now() / 1000)
  const payload = {
    iat: nowSec,
    exp: nowSec + ADMIN_SESSION_MAX_AGE_SECONDS,
    nonce: randomBytes(8).toString('hex'),
  }
  const encodedPayload = base64url(JSON.stringify(payload))
  const signature = sign(encodedPayload)
  return `${encodedPayload}.${signature}`
}

/**
 * Vérifie un token de session admin.
 * Retourne { valid: true, payload } ou { valid: false, reason }.
 * Comparaison de signature en temps constant pour éviter les timing attacks.
 */
export function verifyAdminSessionToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'missing' }
  }
  const parts = token.split('.')
  if (parts.length !== 2) {
    return { valid: false, reason: 'malformed' }
  }
  const [encodedPayload, providedSig] = parts
  let expectedSig
  try {
    expectedSig = sign(encodedPayload)
  } catch (err) {
    return { valid: false, reason: 'secret_missing' }
  }

  const a = Buffer.from(providedSig)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, reason: 'bad_signature' }
  }

  let payload
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
  } catch {
    return { valid: false, reason: 'bad_payload' }
  }

  const nowSec = Math.floor(Date.now() / 1000)
  if (!payload.exp || payload.exp < nowSec) {
    return { valid: false, reason: 'expired' }
  }

  return { valid: true, payload }
}

/**
 * Helper pour renvoyer un cookie admin_session fraichement signé.
 * Retourne la string Set-Cookie à attacher à la réponse.
 */
export function buildAdminSessionCookie(token) {
  const attrs = [
    `${ADMIN_COOKIE_NAME}=${token}`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${ADMIN_SESSION_MAX_AGE_SECONDS}`,
  ]
  return attrs.join('; ')
}

export function buildAdminClearCookie() {
  return [
    `${ADMIN_COOKIE_NAME}=`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/',
    'Max-Age=0',
  ].join('; ')
}
