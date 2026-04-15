# ARCHITECTURE — PermisClair

Document factuel de l'architecture réelle du projet (HEAD `be41d09`). Chaque affirmation pointe vers un fichier existant. Stack : **Next.js 16 App Router** (JSX, sans TypeScript) + **Supabase** (PostgreSQL + Storage) + **Stripe Checkout** + **Resend** (email) + **Vercel** (hébergement + cron).

Dépendances clés ([package.json](package.json)) : `next@^16.2.1`, `react@^18.2.0`, `@supabase/supabase-js@^2.100.1`, `stripe@^21`, `@stripe/stripe-js@^9`, `resend@^6.9.4`, `jszip@^3.10.1`.

---

## 1. Structure des dossiers

```
monpermis/
├── app/                     # Next.js App Router (pages + API)
│   ├── layout.jsx           # Shell racine (Header + ConditionalFooter + WhatsApp float + gtag)
│   ├── page.jsx             # Landing publique (Hero, Pricing, Guides, FAQ…)
│   ├── sitemap.js           # Sitemap dynamique (statique + guides)
│   ├── globals.css
│   ├── formulaire/          # Parcours self-service (formulaire projet)
│   ├── paiement/            # Récap + redirection Stripe
│   │   └── succes/          # Polling Supabase post-paiement
│   ├── projet/[reference]/  # Espace client (auth token)
│   ├── devis/[id]/          # Page devis public (parcours custom)
│   ├── dashboard/           # Ancien dashboard localStorage (legacy, voir §2)
│   ├── guides/              # Guides SEO (liste + détail [slug])
│   ├── mentions-legales/
│   ├── login/               # Stub (3 lignes)
│   ├── admin/               # Back-office protégé
│   │   ├── layout.jsx       # Wrap AdminAuthProvider
│   │   ├── AdminAuthContext.jsx
│   │   ├── page.jsx         # Dashboard projets (1243 lignes)
│   │   └── devis/           # CRUD devis (new, list, [id])
│   └── api/                 # Routes serveur
│       ├── checkout/        # POST → Stripe Checkout Session
│       ├── webhooks/stripe/ # POST (signature) → paiement confirmé
│       ├── reminders/       # GET (cron) → emails J+1/J+3/J+7
│       ├── send-welcome-email/
│       ├── admin/           # login, logout, me (session HMAC)
│       ├── devis/[id]/email/# PATCH email client sur devis
│       └── projet/[reference]/ouvrages/  # CRUD ouvrages (+[ouvrageId])
│
├── components/              # Composants React partagés
│   ├── Header.jsx, Footer.jsx, ConditionalFooter.jsx
│   ├── HeroSection, HowItWorks, ProofSection, FounderSection,
│   │   PricingCards, GuaranteeSection, GuidesSection, FaqSection,
│   │   ContactBanner, FinalCta, GuideCTA   (sections landing)
│   ├── AdminNav.jsx         # Onglets admin (Projets / Devis)
│   ├── CoordonneesCerfaForm.jsx       (§ 6)
│   ├── OuvragesSection.jsx            (§ 6)
│   ├── OuvrageDetailsFields.jsx       (§ 6, 2692 l.)
│   ├── OuvrageCroquisField.jsx        (§ 6)
│   ├── TerrainDetailsForm.jsx, TerrainPhotosUpload.jsx
│   ├── ChauffageEnergieForm.jsx, ConstructionDetailsForm.jsx,
│   │   OuverturesForm.jsx, CroquisUploadForm.jsx
│   └── TableOfContents.jsx
│
├── lib/                     # Helpers serveur / client
│   ├── supabase.js          # Client Supabase partagé (anon key)
│   ├── token.js             # generateAccessToken() base64url (24 bytes)
│   ├── storage.js           # upload/delete/validate + extractStorageKeyFromUrl
│   ├── adminSession.js      # Cookie HMAC-SHA256 signé (8h TTL)
│   └── messages.js          # getMessages / sendMessage / markAsRead
│
├── src/config/
│   ├── pricing.js           # Source de vérité prix (DP/Extension/Maison + RE2020)
│   └── ouvrageTypes.js      # Catalogue 8 types + computeOuvrageProgress (1038 l.)
│
├── content/guides/          # Contenu SEO des guides (17 fichiers + index.js = 18)
├── public/                  # Assets statiques (images, vidéos)
├── styles/                  # CSS additionnels (dashboard.css, guide.css)
├── next.config.js           # Redirect permisclair.fr → www.permisclair.fr
├── vercel.json              # Cron /api/reminders (voir §7)
└── package.json
```

Notes :
- **Pas de dossier `src/` pour le code React** — tout est à la racine (`app/`, `components/`, `lib/`). Seul `src/config/` existe pour héberger `pricing.js` et `ouvrageTypes.js`.
- Le projet est en **JavaScript pur (.jsx/.js)**, pas de TypeScript.

---

## 2. Routes principales

### Routes publiques (marketing / SEO)
| Route | Fichier | Rôle |
|---|---|---|
| `/` | [app/page.jsx](app/page.jsx) | Landing page (Hero, vidéo Baptiste, HowItWorks, ProofSection, PricingCards, Guides, FAQ, FinalCta) |
| `/guides` | [app/guides/page.jsx](app/guides/page.jsx) | Liste des guides regroupés par section (`SECTION_ORDER`) |
| `/guides/[slug]` | [app/guides/[slug]/page.jsx](app/guides/[slug]/page.jsx) | Détail d'un guide (contenu statique `content/guides/*.js`) |
| `/mentions-legales` | [app/mentions-legales/page.jsx](app/mentions-legales/page.jsx) | Mentions légales |
| `/sitemap.xml` | [app/sitemap.js](app/sitemap.js) | Sitemap dynamique (pages statiques + `getAllGuides()`) |
| `/login` | [app/login/page.jsx](app/login/page.jsx) | Stub (3 lignes, non fonctionnel actuellement) |

### Parcours self-service (client anonyme)
| Route | Fichier | Rôle |
|---|---|---|
| `/formulaire` | [app/formulaire/page.jsx](app/formulaire/page.jsx) | Formulaire 4 étapes. À la soumission, crée une ligne `projects` (status=`pending`) avec `reference + token` générés côté client, stocke dans `localStorage.projectData`, puis `router.push('/paiement')` (cf. [app/formulaire/page.jsx:166](app/formulaire/page.jsx:166)). |
| `/paiement` | [app/paiement/page.jsx](app/paiement/page.jsx) | Lit `localStorage.projectData`, affiche l'offre (`getProjectPricing`), option RE2020, puis POST vers `/api/checkout`. |
| `/paiement/succes` | [app/paiement/succes/page.jsx](app/paiement/succes/page.jsx) | Polling Supabase (2 s, 20 tentatives) jusqu'à `project.status='paid'` ou `quote.status='paid' && project_id`, puis bouton vers `/projet/{reference}?token={token}`. |

### Parcours sur-devis (custom)
| Route | Fichier | Rôle |
|---|---|---|
| `/devis/[id]` | [app/devis/[id]/page.jsx](app/devis/[id]/page.jsx) | Page devis publique (lien partagé par WhatsApp). Charge le devis Supabase, saisie email (verrouillé si déjà présent), PATCH `/api/devis/{id}/email` puis POST `/api/checkout` avec `quote_id`. |

### Espace client (authentifié par token)
| Route | Fichier | Rôle |
|---|---|---|
| `/projet/[reference]` | [app/projet/[reference]/page.jsx](app/projet/[reference]/page.jsx) (643 l.) | Dashboard client : timeline 5 étapes (paid → in_progress → review → delivered), 3 formulaires (Coordonnées CERFA, Ouvrages, Terrain), progression pondérée, chat flottant, téléchargement des documents livrés. Auth via param `?token=` ou cookie `pc_{reference}` (max-age 1 an). |

### Dashboard legacy
- [app/dashboard/page.jsx](app/dashboard/page.jsx) lit `localStorage.monpermis_project` et uploads en DataURL dans `localStorage.monpermis_uploads` / `monpermis_files_data`. **Ne touche pas Supabase** — c'est un vestige MVP, le vrai espace client est `/projet/[reference]`.

### Back-office admin
| Route | Fichier | Rôle |
|---|---|---|
| `/admin` | [app/admin/page.jsx](app/admin/page.jsx) (1243 l.) | Dashboard projets : liste + tri par status, détails étendus (docs, messages, ouvrages, photos, croquis), upload admin vers `documents`, export ZIP (via `JSZip`), changement de statut. |
| `/admin/devis` | [app/admin/devis/page.jsx](app/admin/devis/page.jsx) | Liste devis filtrée (Total / Brouillons / Envoyés / Payés). |
| `/admin/devis/new` | [app/admin/devis/new/page.jsx](app/admin/devis/new/page.jsx) | Formulaire création devis (`client_name`, `client_email` optionnel, `project_title`, `amount`). |
| `/admin/devis/[id]` | [app/admin/devis/[id]/page.jsx](app/admin/devis/[id]/page.jsx) | Détail devis, bouton "Copier le lien" → `permisclair.fr/devis/{id}`, "Marquer comme envoyé", affiche `stripe_session_id` et lien projet si payé. |

Protection : [app/admin/layout.jsx](app/admin/layout.jsx) wrap avec `AdminAuthProvider` ([app/admin/AdminAuthContext.jsx](app/admin/AdminAuthContext.jsx)) qui interroge `/api/admin/me` au chargement et affiche un form mot de passe si `status='out'`.

### Routes API
| Route | Fichier | Verb | Rôle |
|---|---|---|---|
| `/api/checkout` | [app/api/checkout/route.js](app/api/checkout/route.js) | POST (formData) | Crée une Stripe Checkout Session. Deux modes selon présence de `quote_id` ou `projectId`. |
| `/api/webhooks/stripe` | [app/api/webhooks/stripe/route.js](app/api/webhooks/stripe/route.js) | POST | Reçoit `checkout.session.completed`, idempotent, crée/verrouille le projet, envoie welcome email. |
| `/api/reminders` | [app/api/reminders/route.js](app/api/reminders/route.js) | GET (`?key=`) | Cron quotidien — relances J+1/J+3/J+7. |
| `/api/send-welcome-email` | [app/api/send-welcome-email/route.js](app/api/send-welcome-email/route.js) | POST | Envoie l'email de bienvenue (Resend) + notif admin. |
| `/api/admin/login` | [app/api/admin/login/route.js](app/api/admin/login/route.js) | POST | Vérifie `ADMIN_PASSWORD` (`timingSafeEqual`), pose cookie session HMAC. Rate-limit 5/10 min par IP **en mémoire** (`const attempts = new Map()`, [route.js:10](app/api/admin/login/route.js:10)) — donc local à chaque instance serverless Vercel, **pas global**. Pour une protection multi-instances → Upstash/Redis. |
| `/api/admin/logout` | [app/api/admin/logout/route.js](app/api/admin/logout/route.js) | POST | Clear cookie. |
| `/api/admin/me` | [app/api/admin/me/route.js](app/api/admin/me/route.js) | GET | Vérifie le cookie `admin_session`. |
| `/api/devis/[id]/email` | [app/api/devis/[id]/email/route.js](app/api/devis/[id]/email/route.js) | PATCH | Saisie email devis — idempotent si identique, refuse override (log `[security]`), update atomique `.is('client_email', null)`. |
| `/api/projet/[reference]/ouvrages` | [app/api/projet/[reference]/ouvrages/route.js](app/api/projet/[reference]/ouvrages/route.js) | GET / POST | Liste et crée un ouvrage après `verifyAccess(reference, token)`. |
| `/api/projet/[reference]/ouvrages/[ouvrageId]` | [app/api/projet/[reference]/ouvrages/[ouvrageId]/route.js](app/api/projet/[reference]/ouvrages/[ouvrageId]/route.js) | PATCH / DELETE | Met à jour (nettoyage storage via `extractStorageKeyFromUrl`) ou supprime. |

---

## 3. Flux critiques

### 3.A — Parcours B : self-service (formulaire → paiement)

1. **Formulaire** ([app/formulaire/page.jsx:166](app/formulaire/page.jsx:166) `submitProject`)
   - Génère `reference = 'PC-' + Date.now().toString(36).toUpperCase()`
   - Génère `token` via `generateToken()` ([lib/token.js:28](lib/token.js:28)) — **alias rétrocompat** de `generateAccessToken()` (cf. [lib/token.js:11](lib/token.js:11)) utilisé par le webhook devis. Même fonction, même format (24 bytes random → base64url 32 chars), juste un nom différent pour les imports historiques.
   - Calcule `price` via `computePrice({ category, options })` ([src/config/pricing.js:59](src/config/pricing.js:59))
   - `supabase.from('projects').insert({ reference, token, project_type, …, price, status: 'pending' }).select().single()`
   - Stocke dans `localStorage.projectData` et `router.push('/paiement')`

2. **Page paiement** ([app/paiement/page.jsx](app/paiement/page.jsx))
   - Lit `localStorage.projectData`
   - Affiche `getProjectPricing(projectType)` + option RE2020
   - Hidden form POST → `/api/checkout` avec `projectId`, `reference`, `category`, `options` (JSON), `label`, `email`

3. **API checkout** ([app/api/checkout/route.js](app/api/checkout/route.js))
   - Recalcule `computePrice({ category, options })` **côté serveur** (source de vérité) + re-lecture pour détecter un `PRICE MISMATCH ATTEMPT` (log sécurité)
   - Update `projects.price` + `options` ([route.js:87-90](app/api/checkout/route.js:87)) — **seuls ces deux champs sont écrits en DB**. Le `label` reçu en formData est utilisé directement comme `product_data.name` dans la session Stripe ([route.js:133](app/api/checkout/route.js:133)) mais n'est **jamais persisté dans `projects.label`** (cf. §4 note sur les colonnes orphelines).
   - Crée `stripe.checkout.sessions.create({ customer_email, line_items, metadata: { project_id, reference }, success_url: '/paiement/succes?session_id={CHECKOUT_SESSION_ID}&project_id=…', cancel_url: '/paiement?cancelled=true' })`
   - `NextResponse.redirect(session.url, 303)`

4. **Webhook Stripe** ([app/api/webhooks/stripe/route.js](app/api/webhooks/stripe/route.js), `handleSelfServicePayment`)
   - Vérifie `stripe.webhooks.constructEvent` (signature)
   - Écrit atomiquement : `UPDATE projects SET status='paid', paid_at=now(), stripe_session_id=… WHERE id=projectId AND status != 'paid'`
   - Si 0 ligne affectée **ou** erreur Postgres `23505` (unique violation sur `stripe_session_id`) → `alreadyProcessed` (idempotence)
   - Sinon : `await fetch('/api/send-welcome-email', …)` enveloppé dans un try/catch ([route.js:232-249](app/api/webhooks/stripe/route.js:232)). **Pas réellement fire-and-forget** : le webhook attend la réponse du endpoint email avant de répondre 200 à Stripe — une route email lente allonge donc le temps de réponse au webhook. Les erreurs sont silencieusement avalées (« non-blocking » au sens des erreurs, pas du timing).

5. **Page succès** ([app/paiement/succes/page.jsx](app/paiement/succes/page.jsx))
   - Polling Supabase toutes les 2 s (max 20 = 40 s) jusqu'à `project.status='paid'`
   - Bouton → `/projet/{reference}?token={token}`

### 3.B — Parcours A : devis custom (admin → WhatsApp → paiement → welcome)

1. **Admin crée le devis** ([app/admin/devis/new/page.jsx](app/admin/devis/new/page.jsx))
   - INSERT `quotes { client_name, client_email?, project_title, amount }` ([new/page.jsx:32-37](app/admin/devis/new/page.jsx:32))
   - **`status` n'est pas envoyé à l'INSERT** : la valeur `'draft'` provient probablement d'un `DEFAULT` côté DB. Hypothèse non vérifiable depuis le repo (pas de migration). À confirmer côté Supabase si on touche au cycle de vie du devis.
   - Redirige vers `/admin/devis/{id}`

2. **Admin récupère le lien partageable** ([app/admin/devis/[id]/page.jsx](app/admin/devis/[id]/page.jsx))
   - Bouton "Copier le lien" → `https://permisclair.fr/devis/{id}`
   - Bouton "Marquer comme envoyé" → `status='sent'`
   - Le lien est envoyé au client via WhatsApp manuellement

3. **Client ouvre le devis** ([app/devis/[id]/page.jsx](app/devis/[id]/page.jsx))
   - SELECT quote — affiche 404 si absent, "Ce devis a déjà été réglé" si `status='paid'`
   - Saisie email (verrouillée si `client_email` déjà présent)
   - PATCH `/api/devis/{id}/email` ([app/api/devis/[id]/email/route.js](app/api/devis/[id]/email/route.js)) avec 3 cas :
     - **Cas 1** : email identique → idempotent
     - **Cas 2** : override refusé → log `[security] email override attempt`
     - **Cas 3** : update atomique `.is('client_email', null)` (race guard)
   - POST hidden form → `/api/checkout` avec `quote_id`

4. **API checkout — mode quote** ([app/api/checkout/route.js](app/api/checkout/route.js))
   - Lookup quote, vérifie `status != 'paid'` et `client_email` présent
   - `stripe.checkout.sessions.create({ customer_email, unit_amount: amount*100, metadata: { quote_id }, success_url: '/paiement/succes?session_id=…&quote_id=…', cancel_url: '/devis/{id}?cancelled=true' })`

5. **Webhook Stripe — `handleQuotePayment`** ([app/api/webhooks/stripe/route.js](app/api/webhooks/stripe/route.js))
   - UPDATE atomique : `quotes SET status='paid', paid_at, stripe_session_id WHERE id=quoteId AND status != 'paid'`
   - Si 0 ligne ou `23505` → alreadyProcessed
   - Sinon :
     - Crée un projet : `reference = 'PC-' + Date.now().toString(36).toUpperCase()` ([route.js:120](app/api/webhooks/stripe/route.js:120) — utilise `Date.now()`, **pas l'id du devis**), `token = generateAccessToken()`
     - INSERT `projects { reference, token, project_type: 'custom', first_name, last_name, email: clientEmail, price: amount, status: 'paid', paid_at, stripe_session_id }` ([route.js:126-141](app/api/webhooks/stripe/route.js:126))
       - **`project_type` est codé en dur à `'custom'`** — le `project_title` du devis n'alimente PAS cette colonne (il ne sert qu'à composer le mail de bienvenue).
       - **`first_name` / `last_name` sont splittés** depuis `claimed.client_name` : `nameParts = client_name.split(' ')`, `first_name = nameParts[0]`, `last_name = nameParts.slice(1).join(' ')`. Un nom composé (« Marie-Claire Dupont du Châtelet ») peut donc être mal découpé.
     - `UPDATE quotes SET project_id = newProject.id WHERE id = quoteId` (et renseigne `client_email` si manquait)
     - Welcome email via `await fetch('/api/send-welcome-email', …)` enveloppé dans un try/catch — voir §3.D pour la nuance « non bloquant mais bien `await`-é ».

6. **Email de bienvenue** ([app/api/send-welcome-email/route.js](app/api/send-welcome-email/route.js))
   - `resend.emails.send({ from: 'PermisClair <contact@permisclair.fr>', to, subject, html })` ([route.js:18](app/api/send-welcome-email/route.js:18)) avec lien `https://www.permisclair.fr/projet/{reference}?token={token}`
   - **Attention** : le label « Baptiste de PermisClair » est utilisé par les templates de relance dans [/api/reminders](app/api/reminders/route.js:12), **pas** par le welcome email. Les deux routes ont des `from:` différents.
   - Envoie une notif parallèle à `baptistedubreil0@gmail.com`

### 3.C — Espace client : auth token + ouvrages répétables + croquis

**Auth** ([app/projet/[reference]/page.jsx](app/projet/[reference]/page.jsx))
- Token résolu depuis `?token=` (URL) ou depuis cookie `pc_{reference}` (SameSite=Lax, Max-Age 1 an)
- Lookup : `SELECT * FROM projects WHERE reference = :ref AND token = :token`
- Si trouvé : pose le cookie `pc_{reference}` pour les visites suivantes

**⚠️ Affichage conditionnel de la fiche technique** ([page.jsx:171](app/projet/[reference]/page.jsx:171))

Les Sections 1/2/3 ci-dessous **ne sont PAS affichées pour tous les projets**. Le flag est :
```js
showFicheTechnique = project.project_type?.startsWith('Maison neuve')
                  || project.project_type === 'custom'
                  || !project.project_type
```
Donc :
- **Affichée** : « Maison neuve », projets devis (`project_type='custom'` posé par `handleQuotePayment`), et projets sans type
- **Masquée** : « Piscine », « Garage / Carport », « Terrasse / Pergola », « Extension / Agrandissement », « Surélévation », « Autre »

Pour les projets sans fiche technique, l'espace client n'expose que la timeline, le chat et le téléchargement des documents livrés. Un projet « Extension » payé n'a donc aucun moyen pour le client de fournir des informations via l'interface — c'est une omission probable du parcours self-service.

**Section 1 — Coordonnées CERFA** ([components/CoordonneesCerfaForm.jsx](components/CoordonneesCerfaForm.jsx))
- 8 champs (civilité, nom, prénom, date/commune/département naissance, téléphone, email)
- Sauvegarde dans `project_details`

**Section 2 — Ouvrages répétables** ([components/OuvragesSection.jsx](components/OuvragesSection.jsx))
- Le client ajoute N ouvrages. Chaque ouvrage :
  1. Choix d'un **type** parmi 8 (maison, piscine, garage_abri, terrasse, mur_cloture, modification_exterieure, agricole, autre) — cf. [src/config/ouvrageTypes.js:5](src/config/ouvrageTypes.js:5) `OUVRAGE_TYPES`
  2. Choix d'un **sous-type** (sauf `autre`)
  3. Remplissage des détails via `OuvrageDetailsFields` (2692 l., champs spécifiques par type)
  4. Upload de **croquis** via `OuvrageCroquisField` (photos + checklist murs/pièces/ouvertures/dimensions)
- CRUD via l'API `/api/projet/[reference]/ouvrages` :
  - GET liste `project_ouvrages` ordre `position, created_at`
  - POST ([route.js:66](app/api/projet/[reference]/ouvrages/route.js:66)) : `nextPosition = existing[0] ? (existing[0].position || 0) + 1 : 0`. **Le tout premier ouvrage d'un projet a `position = 0`**, pas 1. Champs `{ name, type, subtype, data, description_libre, photo_urls }`.
  - PATCH applique un diff sur le tableau top-level `photo_urls` + `removeStorageUrls(removed)` ([route.js:84-91](app/api/projet/[reference]/ouvrages/[ouvrageId]/route.js:84))
  - DELETE nettoie `ouvrage.photo_urls` (best-effort) puis supprime la ligne ([route.js:116-118](app/api/projet/[reference]/ouvrages/[ouvrageId]/route.js:116))
  - **⚠️ Orphans non nettoyés** : le diff PATCH et le cleanup DELETE ne traitent QUE le tableau top-level `photo_urls`. Les photos rangées dans `data.croquis.photo_urls` (uploadées via `OuvrageCroquisField`) **ne sont jamais supprimées du bucket** — ni à l'édition, ni à la suppression de l'ouvrage. Risque réel d'orphans dans Storage à corriger.
- **Upload croquis en mode création** ([components/OuvragesSection.jsx:45](components/OuvragesSection.jsx:45)) : les fichiers sont retenus dans `pendingCroquisFiles` tant que l'ouvrage n'existe pas en base, puis uploadés après la création et référencés dans `data.croquis.photo_urls`.

**Section 3 — Terrain** ([components/TerrainDetailsForm.jsx](components/TerrainDetailsForm.jsx) + [components/TerrainPhotosUpload.jsx](components/TerrainPhotosUpload.jsx))
- 5 champs parcelle / constructions existantes / implantation / assainissement / raccordements
- Upload photos terrain vers `documents/{project_id}/photos-terrain/`

**⚠️ Progression : DEUX calculs DIVERGENTS pour le même projet**

Le pourcentage de complétion est calculé à **deux endroits différents avec des formules différentes**. Une future session qui modifie l'un sans toucher l'autre introduit une régression silencieuse — c'est un piège à corriger.

1. **Côté client** (affichage temps réel + sauvegarde DB) — [app/projet/[reference]/page.jsx:217-249](app/projet/[reference]/page.jsx:217), fonction `computeProgress` :
   - **Points absolus, non pondérés** : 8 (CERFA) + ratio_ouvrages × 10 + 5 (items terrain) + min(photoCount, 5) → divisé par **28**
   - Utilise `computeOuvragesGlobalProgress` ([src/config/ouvrageTypes.js:1030](src/config/ouvrageTypes.js:1030))
   - Sauvegardé dans `project_details.completion_percentage` avec debounce 2 s ([page.jsx:252-265](app/projet/[reference]/page.jsx:252))

2. **Côté cron de relances** — [app/api/reminders/route.js:198-204](app/api/reminders/route.js:198), fonction `computeProgress(details, ouvrages)` :
   - **Pondération 30/50/20** : `0.3 × s1 + 0.5 × s2 + 0.2 × s3` où `s1` = ratio CERFA (8 champs), `s2` = ratio ouvrages (`computeOuvragesRatio` réimplémenté localement aux lignes [179-193](app/api/reminders/route.js:179)), `s3` = ratio terrain (5 items, **sans les photos**)
   - **Ne lit PAS** `project_details.completion_percentage` — recalcule à chaque run
   - Cette valeur est utilisée pour les seuils des templates J+1 (`< 30 %`), J+3 (`< 70 %`), J+7 (`< 100 %`)

**Conséquence** : pour un projet où le client a uploadé 5 photos terrain mais peu de coordonnées, l'UI peut afficher 70 % alors que le cron calcule 40 % → relance J+1 envoyée à un client qui se croit bien avancé. Inversement le cron peut considérer un dossier complet alors que le client voit < 100 %. À unifier.

**Chat flottant**
- Polling `getMessages(projectId)` toutes les 10 s ([lib/messages.js](lib/messages.js))
- Envoi `sendMessage(projectId, 'client', content)`
- `markAsRead` met à jour `projects.last_read_at`

### 3.D — Webhook Stripe : idempotence

Trois couches défensives dans [app/api/webhooks/stripe/route.js](app/api/webhooks/stripe/route.js) :

1. **Vérification signature** : `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)` — 400 si invalide.
2. **UPDATE atomique** : `.update({ status: 'paid', stripe_session_id, paid_at }).eq('id', id).neq('status', 'paid').select()` — si 0 ligne renvoyée, le paiement est déjà enregistré.
3. **Contrainte PG unique** sur `stripe_session_id` — si deux webhooks arrivent en parallèle, le second lève `23505` (duplicate key), traité comme `alreadyProcessed` (pas une erreur).

Le welcome email est `await`-é à l'intérieur d'un try/catch ([route.js:167-184](app/api/webhooks/stripe/route.js:167) pour quote, [:231-249](app/api/webhooks/stripe/route.js:231) pour self-service). Les erreurs sont avalées → un email qui échoue **ne déclenche pas** de retry du webhook ; en revanche le webhook **attend la réponse** du endpoint email avant de répondre 200 à Stripe. Si `/api/send-welcome-email` devient lent, le webhook répond lent (et Stripe peut décider de retry sur timeout).

---

## 4. Modèles de données Supabase

Inférés à partir du code (pas de fichier de migration dans le repo). Client : [lib/supabase.js](lib/supabase.js).

### Table `projects`
Créée via [app/formulaire/page.jsx:178](app/formulaire/page.jsx:178) ou par le webhook en mode devis.

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `reference` | text unique | `PC-{base36}` |
| `token` | text | 24 bytes base64url, généré par `generateAccessToken` |
| `project_type` | text | "Maison neuve", "Piscine", etc. via le formulaire self-service. **Mode devis** : codé en dur à `'custom'` par le webhook ([webhooks/stripe/route.js:131](app/api/webhooks/stripe/route.js:131)) — le `project_title` du devis n'alimente PAS cette colonne. |
| `address`, `city`, `postal_code` | text | Renseignés par le formulaire self-service uniquement. **null** pour les projets devis. |
| `surface` | int | m². null pour les projets devis. |
| `floors`, `rooms`, `roof_type`, `style`, `description` | text | **⚠️ Colonnes orphelines** : écrites uniquement à l'INSERT initial du formulaire self-service ([formulaire/page.jsx:188-192](app/formulaire/page.jsx:188)), **jamais relues nulle part** dans le code. Ne pas s'appuyer dessus pour bâtir une feature sans vérifier au préalable. null pour les projets devis. |
| `first_name`, `last_name`, `email`, `phone` | text | Self-service : depuis le formulaire. Devis : `first_name`/`last_name` splittés depuis `quotes.client_name` (`split(' ')`), `phone` à null. |
| `price` | int | € |
| `options` | jsonb / text[] | ex. `['RE2020']` |
| `label` | text | **⚠️ Jamais écrit en DB** : la doc précédente disait « renseigné par `/api/checkout` » — c'est faux. Le `label` reçu en formData par `/api/checkout` sert directement de `product_data.name` Stripe et n'est jamais persisté dans cette colonne (cf. §3.A step 3). Considérer comme orpheline. |
| `status` | text | `pending` → `paid` → `in_progress` → `review` → `delivered` (voir [app/admin/page.jsx:11](app/admin/page.jsx:11) `STATUS_LABELS`). La route `/api/reminders` filtre aussi `deposited`, `accepted` (statuts existant en DB mais sans UI dans `STATUS_OPTIONS`). |
| `paid_at` | timestamptz | |
| `stripe_session_id` | text **unique** *(inféré)* | Contrainte UNIQUE **inférée du code** : la gestion d'erreur Postgres `23505` ([webhooks/stripe/route.js:15,98,145](app/api/webhooks/stripe/route.js:15)) suppose qu'une contrainte unique existe sur cette colonne. **Aucune migration dans le repo ne le confirme** — à vérifier dans le dashboard Supabase si on touche au flux idempotence. |
| `reminder_j1_sent`, `reminder_j3_sent`, `reminder_j7_sent` | bool | |
| `last_read_at` | timestamptz | Mis à jour **uniquement par l'admin** via `markAsRead` ([lib/messages.js:29](lib/messages.js:29)), appelé exclusivement depuis [app/admin/page.jsx](app/admin/page.jsx). Pas de notion de « lu côté client ». |
| `created_at` | timestamptz | |

### Table `quotes`
Utilisée par le parcours devis custom. Créée via [app/admin/devis/new/page.jsx](app/admin/devis/new/page.jsx).

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `client_name` | text | |
| `client_email` | text nullable | Race-guarded avec `.is('client_email', null)` |
| `project_title` | text | |
| `amount` | int | € |
| `status` | text | `draft` / `sent` / `paid`. **L'INSERT côté code n'envoie pas `status`** ([new/page.jsx:32](app/admin/devis/new/page.jsx:32)) — la valeur initiale `'draft'` provient probablement d'un `DEFAULT` DB. Hypothèse non vérifiable depuis le repo. |
| `paid_at` | timestamptz | |
| `stripe_session_id` | text **unique** *(inféré)* | Même idempotence webhook que `projects.stripe_session_id` — contrainte UNIQUE inférée du code (gestion `23505`), non confirmée par une migration dans le repo. |
| `project_id` | uuid FK → projects | Renseigné par le webhook après création du projet |
| `created_at` | timestamptz | |

### Table `project_details`
1-1 avec `projects`. Lu/créé par [app/projet/[reference]/page.jsx](app/projet/[reference]/page.jsx).

| Colonne | Type | Notes |
|---|---|---|
| `project_id` | uuid FK/PK | |
| `client_civilite`, `client_nom`, `client_prenom`, `client_date_naissance`, `client_commune_naissance`, `client_departement_naissance`, `client_telephone`, `client_email` | text / date | Les 8 champs CERFA de la Section 1 |
| `parcelle_nsp`, `parcelle_section`, `parcelle_numero` | text | |
| `constructions_existantes` | bool | |
| `constructions_existantes_liste` | text | JSON stringifié |
| `implantation_description`, `assainissement` | text | |
| `raccordement_eau`, `raccordement_electricite`, `raccordement_gaz`, `raccordement_fibre`, `raccordement_aucun` | bool | |
| `completion_percentage` | numeric | Sauvegardé par [app/projet/[reference]/page.jsx:252-265](app/projet/[reference]/page.jsx:252) avec debounce 2 s, **selon le calcul non pondéré côté client (28 points)**. ⚠️ N'est PAS la même valeur que celle calculée par `/api/reminders` (formule pondérée 30/50/20). Voir §3.C « Progression : DEUX calculs DIVERGENTS ». |
| `updated_at` | timestamptz | |

### Table `project_ouvrages`
N par projet. CRUD via [app/api/projet/[reference]/ouvrages](app/api/projet/[reference]/ouvrages/route.js).

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `project_id` | uuid FK | |
| `position` | int | `max+1` à la création |
| `name` | text | Nom libre du client |
| `type` | text | un des 8 IDs de `OUVRAGE_TYPES` |
| `subtype` | text nullable | |
| `data` | jsonb | Payload spécifique au type (cf. `OuvrageDetailsFields`), contient notamment `croquis.photo_urls` et `croquis.checklist` |
| `description_libre` | text | Pour le type `autre` |
| `photo_urls` | text[] | Photos générales de l'ouvrage |
| `created_at`, `updated_at` | timestamptz | |

### Table `messages`
Chat client ↔ admin. [lib/messages.js](lib/messages.js).

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `project_id` | uuid FK | |
| `sender` | text | `'client'` ou `'admin'` |
| `content` | text | |
| `created_at` | timestamptz | |

### Table `documents`
Métadonnées fichiers (l'emplacement réel est dans le bucket Storage `documents`). Utilisée par [lib/storage.js](lib/storage.js) via `getDocuments`.

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `project_id` | uuid FK | |
| `file_name`, `file_url`, `file_type` | text | URL publique Supabase Storage |
| `uploaded_by` | text | `'client'` ou `'admin'` |
| `created_at` | timestamptz | |

**⚠️ Dualité table `documents` vs bucket `documents` — source de bugs typique**

Tous les fichiers du projet vivent dans le **bucket** Storage `documents`, mais seuls certains uploads créent une **ligne** dans la **table** `documents`. Le code emprunte deux chemins distincts :

| Chemin d'upload | Bucket | Table `documents` |
|---|---|---|
| `uploadFile()` ([lib/storage.js:72](lib/storage.js:72)) — utilisé par les uploads doc admin + client (préfixe `{project_id}/`) | ✅ | ✅ INSERT |
| Photos terrain ([components/TerrainPhotosUpload.jsx](components/TerrainPhotosUpload.jsx) → `{project_id}/photos-terrain/`) | ✅ | ❌ pas de ligne |
| Croquis terrain ([components/CroquisUploadForm.jsx](components/CroquisUploadForm.jsx) → `{project_id}/croquis/`) | ✅ | ❌ pas de ligne |
| Photos d'ouvrages ([components/OuvrageCroquisField.jsx](components/OuvrageCroquisField.jsx)) — URLs stockées dans `project_ouvrages.data.croquis.photo_urls` ou `project_ouvrages.photo_urls` | ✅ | ❌ pas de ligne |

Conséquences :
- `getDocuments(project_id)` ne renvoie **que** les fichiers passés par `uploadFile()`. L'admin liste les photos terrain et croquis directement via `supabase.storage.from('documents').list(...)` ([app/admin/page.jsx:271,278](app/admin/page.jsx:271)).
- `deleteDocument()` ne fonctionne que sur les lignes de la table. Les photos terrain/croquis/ouvrages sont nettoyées en best-effort côté Storage uniquement (cf. §3.C orphans).
- Avant d'écrire une feature qui « liste tous les fichiers d'un projet », vérifier qu'on agrège les **deux** sources.

### Bucket Storage `documents`
Organisé en préfixes :
- `{project_id}/` — documents généraux uploadés via `uploadFile()` (lignes en table)
- `{project_id}/photos-terrain/` — photos terrain (cf. [app/admin/page.jsx:271](app/admin/page.jsx:271)), pas de ligne en table
- `{project_id}/croquis/` — croquis terrain (cf. [app/admin/page.jsx:278](app/admin/page.jsx:278)), pas de ligne en table
- Les photos d'ouvrages (section ouvrages) sont stockées ailleurs dans ce même bucket, référencées par URL publique dans `project_ouvrages.data.croquis.photo_urls` ou `photo_urls`. Nettoyage via `extractStorageKeyFromUrl` ([lib/storage.js](lib/storage.js)) — voir §3.C pour le risque d'orphans côté `data.croquis.photo_urls`.

---

## 5. Variables d'environnement

Variables détectées par grep sur `process.env` dans le code :

| Variable | Usage | Fichiers |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projet Supabase (client + serveur) | [lib/supabase.js](lib/supabase.js) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon Supabase | [lib/supabase.js](lib/supabase.js) |
| `NEXT_PUBLIC_SITE_URL` | URL base (défaut : `https://www.permisclair.fr`) — utilisée pour `success_url`/`cancel_url` Stripe et le lien du welcome email | [app/api/checkout/route.js](app/api/checkout/route.js), [app/api/send-welcome-email/route.js](app/api/send-welcome-email/route.js) |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (SDK serveur) | [app/api/checkout/route.js](app/api/checkout/route.js), [app/api/webhooks/stripe/route.js](app/api/webhooks/stripe/route.js) |
| `STRIPE_WEBHOOK_SECRET` | Secret de signature webhook | [app/api/webhooks/stripe/route.js](app/api/webhooks/stripe/route.js) |
| `RESEND_API_KEY` | Clé API Resend | [app/api/send-welcome-email/route.js](app/api/send-welcome-email/route.js), [app/api/reminders/route.js](app/api/reminders/route.js) |
| `ADMIN_PASSWORD` | Mot de passe admin (comparé avec `crypto.timingSafeEqual`) | [app/api/admin/login/route.js](app/api/admin/login/route.js) |
| `ADMIN_SESSION_SECRET` | Secret HMAC-SHA256 pour le cookie admin (minimum 32 caractères, vérifié au boot) | [lib/adminSession.js](lib/adminSession.js) |
| `REMINDER_CRON_SECRET` | Jeton partagé `?key=` entre le cron Vercel et `/api/reminders` | [vercel.json](vercel.json), [app/api/reminders/route.js](app/api/reminders/route.js) |

---

## 6. Composants React réutilisables clés

### [components/OuvragesSection.jsx](components/OuvragesSection.jsx) (674 l.)
Section 2 de l'espace client.
- Machine d'états : `mode` ∈ `list | add | edit`, `step` ∈ `type | subtype | details`
- Brouillon local `draft` avec `{ type, subtype, name, description_libre, photo_urls, data }`
- Gère l'upload croquis pré-création dans `pendingCroquisFiles` (uploadés après INSERT)
- Statut de sauvegarde visible : `savingStatus` ∈ `create | upload-croquis | patch`
- Utilise `computeOuvrageProgress` pour afficher l'avancement par ouvrage

### [components/OuvrageDetailsFields.jsx](components/OuvrageDetailsFields.jsx) (2692 l.)
Gros composant qui, selon `type + subtype`, affiche les champs spécifiques pour :
- Maison (neuve / extension / surélévation)
- Piscine (enterrée / semi / hors-sol / spa / abri)
- Garage, carport, abri jardin, pool house, atelier
- Terrasse (3 variantes)
- Mur / clôture / portail (4 variantes)
- Modifications extérieures (6 variantes : ouvertures, ravalement, menuiseries, couverture, ITE, panneaux solaires)
- Bâtiments agricoles (6 variantes)
- Type `autre` (texte libre)

Chaque variante a son propre set de champs (dimensions, matériaux, couleurs, toiture, pente, etc.) — la logique de progression correspondante est dans [src/config/ouvrageTypes.js:751](src/config/ouvrageTypes.js:751) `computeOuvrageProgress`.

### [components/OuvrageCroquisField.jsx](components/OuvrageCroquisField.jsx) (556 l.)
Composant réutilisable pour uploader les croquis d'un ouvrage.
- Accepte multi-fichiers (validation via `validateUploadFile` de [lib/storage.js](lib/storage.js))
- Checklist associée : `murs`, `pieces`, `ouvertures`, `dimensions_batiment` (normalisée par `normalizeChecklist`)
- Upload direct vers `supabase.storage.from('documents')`
- Suppression via `extractStorageKeyFromUrl` + `storage.remove`
- Les URLs publiques + checklist sont stockées dans `project_ouvrages.data.croquis`

### [components/CoordonneesCerfaForm.jsx](components/CoordonneesCerfaForm.jsx)
Section 1 de l'espace client — 8 champs CERFA. Auto-save vers `project_details`.

### [components/TerrainDetailsForm.jsx](components/TerrainDetailsForm.jsx) & [components/TerrainPhotosUpload.jsx](components/TerrainPhotosUpload.jsx)
Section 3 — détails parcelle/raccordements + upload photos vers `documents/{project_id}/photos-terrain/`.

### [components/AdminNav.jsx](components/AdminNav.jsx)
Barre de navigation admin (Projets / Devis) + bouton Rafraîchir + Déconnexion. Consomme `useAdminAuth()`.

### Composants landing
[components/HeroSection.jsx](components/HeroSection.jsx), [HowItWorks.jsx](components/HowItWorks.jsx), [ProofSection.jsx](components/ProofSection.jsx), [FounderSection.jsx](components/FounderSection.jsx), [PricingCards.jsx](components/PricingCards.jsx), [GuaranteeSection.jsx](components/GuaranteeSection.jsx), [GuidesSection.jsx](components/GuidesSection.jsx), [FaqSection.jsx](components/FaqSection.jsx), [ContactBanner.jsx](components/ContactBanner.jsx), [FinalCta.jsx](components/FinalCta.jsx) — composants présentation uniquement, composés par [app/page.jsx](app/page.jsx).

### [components/ConditionalFooter.jsx](components/ConditionalFooter.jsx)
Footer affiché partout **sauf** sur `/formulaire` et `/paiement` (cf. commits récents `0f5cf41` / `264de06`).

---

## 7. Jobs cron Vercel

### [vercel.json](vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/reminders?key=${REMINDER_CRON_SECRET}",
      "schedule": "0 7 * * *"
    }
  ]
}
```

**Une seule tâche cron** : `/api/reminders` tous les jours à 07:00 UTC (cf. [app/api/reminders/route.js](app/api/reminders/route.js)).

Détails de la route :
- Vérifie `?key=` contre `REMINDER_CRON_SECRET` — 401 si invalide
- Récupère tous les projets `paid_at IS NOT NULL AND status NOT IN ('delivered', 'deposited', 'accepted')`
- Pour chaque projet, calcule la progression pondérée :
  - `score1` = 8 champs CERFA (`project_details.client_*`)
  - `score2` = `computeOuvragesGlobalProgress(ouvrages)`
  - `score3` = 5 items terrain
  - `percentage = 0.3 * score1 + 0.5 * score2 + 0.2 * score3`
- Règles de relance (un email max par run, priorité J+7 → J+3 → J+1) :
  - **J+7** : `hoursSincePaid >= 168 && percentage < 100` → set `reminder_j7_sent=true`
  - **J+3** : `hoursSincePaid >= 72 && percentage < 70` → set `reminder_j3_sent=true`
  - **J+1** : `hoursSincePaid >= 24 && percentage < 30` → set `reminder_j1_sent=true`
- Templates `templateJ1` / `templateJ3` / `templateJ7` (HTML) via Resend, expéditeur `Baptiste de PermisClair <contact@permisclair.fr>`

**Aucun autre cron** (pas de tâche d'archivage, de nettoyage, d'export, etc. au niveau Vercel).

---

## Annexe — Ce qui n'existe PAS (pièges à éviter)

- ❌ Pas de TypeScript
- ❌ Pas de middleware Next.js (`middleware.js`) — la protection admin passe par chaque route API qui lit le cookie
- ❌ Pas de RLS Supabase actif documenté dans le code — la sécurité repose sur la clé anon côté client + `verifyAccess(reference, token)` côté serveur pour les routes sensibles
- ❌ Pas de service role key dans le code — toutes les opérations serveur utilisent la clé anon
- ❌ Pas de queue / worker externe : les emails partent en fire-and-forget depuis le webhook
- ❌ Pas de tests automatisés dans le repo
- ❌ Pas de dossier `src/` pour le code React — tout est à la racine (seul `src/config/` existe)
