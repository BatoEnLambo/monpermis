//
// Supabase admin client (service_role key).
//
// ⚠️  INTERDIT D'IMPORTER DEPUIS UN FICHIER CLIENT ⚠️
//
// Ce client bypass les Row-Level Security policies grâce à la clé
// service_role. Il ne doit JAMAIS être importé depuis :
//   - un composant React côté client (components/**)
//   - une page marquée 'use client' (app/**/page.jsx)
//   - un script qui finit dans le bundle envoyé au navigateur
//
// Usage exclusif :
//   - Routes API serveur (app/api/**)
//   - Fonctions server-side (route handlers, server actions, RSC si
//     c'est vraiment nécessaire)
//
// La clé SUPABASE_SERVICE_ROLE_KEY doit être définie dans les variables
// d'environnement Vercel (Production + Preview + Development) et localement
// dans .env.local. Elle se récupère sur :
//   Supabase Dashboard → Project Settings → API → Project API keys →
//   service_role (secret — never expose).
//
// Fait partie de la phase 0 du durcissement RLS — les routes API passent
// désormais toutes par ce client pour que la phase 3 (bascule des policies
// en deny-by-default) ne casse rien côté serveur.
//

import { createClient } from '@supabase/supabase-js'

// Initialisation paresseuse : le client n'est créé qu'au premier accès (à
// l'exécution d'une requête), pas au chargement du module. Cela permet au
// build Next.js ("Collecting page data") de passer même si les variables
// d'environnement ne sont pas définies — ce qui est normal : la clé
// service_role ne devrait jamais être nécessaire au build.
// Le "fail fast" reste actif : dès qu'une route API tente une opération,
// le Proxy appelle getClient() et throw avec un message explicite si la
// variable manque.
let _client = null

function getClient() {
  if (_client) return _client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL missing — cannot initialize supabaseAdmin client.'
    )
  }

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY missing — phase 0 of RLS hardening incomplete. ' +
        "Ajoute la variable dans Vercel (Production + Preview + Development) et dans .env.local. " +
        'Elle se récupère sur Supabase Dashboard → Settings → API → service_role.'
    )
  }

  _client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Pas de session utilisateur à persister côté serveur ; le client est
      // utilisé uniquement pour des opérations DB/Storage privilégiées.
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return _client
}

// Proxy qui forward tout accès vers le vrai client, initialisé à la
// demande. Les routes API consomment `supabaseAdmin.from(...)`, `.storage`,
// etc. exactement comme avant.
export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getClient()
      const value = client[prop]
      return typeof value === 'function' ? value.bind(client) : value
    },
  }
)

export default supabaseAdmin
