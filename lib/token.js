/**
 * Génère un token d'accès cryptographiquement sûr.
 * 24 bytes random via Web Crypto API → 32 caractères base64url (a-zA-Z0-9-_).
 *
 * Fonctionne à la fois côté serveur (Node 20+) et côté client (browser),
 * contrairement à l'ancienne version basée sur Math.random() qui utilisait
 * un PRNG prédictible.
 *
 * Utilisé pour les URLs /projet/[reference]?token=...
 */
export function generateAccessToken() {
  const bytes = new Uint8Array(24)
  globalThis.crypto.getRandomValues(bytes)

  // Encode base64url (compatible Node + browser)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  const base64 =
    typeof btoa !== 'undefined'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64')
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Alias rétrocompatible pour les imports existants (app/formulaire/page.jsx).
// Les tokens existants en base continuent de fonctionner, seuls les NOUVEAUX
// sont désormais crypto-sûrs.
export const generateToken = generateAccessToken
