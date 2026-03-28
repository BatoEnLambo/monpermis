# PermisClair — Guide de référence pour Claude & Claude Code

> Ce document est le contexte de référence pour tout développement sur PermisClair. Consulte-le AVANT de modifier quoi que ce soit.

---

## RÈGLES ABSOLUES

1. **Ne jamais casser le responsive mobile** — breakpoint unique à 768px. Toujours tester.
2. **Styles desktop = inline dans les composants JSX**. Styles mobile = dans les fichiers CSS avec `!important`.
3. **Palette de couleurs stricte** — ne jamais inventer de nouvelles couleurs. Utiliser les constantes.
4. **Font unique : DM Sans** — poids 400, 500, 600, 700, 800.
5. **Max-width du contenu : 720px** — défini dans layout.jsx, ne pas dépasser.
6. **Prix synchronisés** — les prix existent dans 3 fichiers (PricingCards.jsx, formulaire/page.jsx, paiement/page.jsx). Modifier les 3 à chaque changement.

---

## STRUCTURE DU PROJET

```
monpermis/
├── app/                          # Pages (Next.js App Router)
│   ├── layout.jsx                # Layout racine (Header + Footer + meta)
│   ├── globals.css               # Reset CSS global
│   ├── page.jsx                  # Landing page
│   ├── formulaire/page.jsx       # Formulaire multi-étapes (4 steps)
│   ├── paiement/page.jsx         # Page paiement (récap + Stripe)
│   ├── paiement/succes/page.jsx  # Confirmation post-paiement
│   ├── projet/[reference]/page.jsx # Dashboard client (auth par token)
│   ├── admin/page.jsx            # Panel admin (mdp: permisclair2026)
│   ├── mentions-legales/page.jsx # Mentions légales + CGV
│   └── api/
│       ├── checkout/route.js     # API Stripe Checkout (POST)
│       └── send-welcome-email/route.js # API Resend email (POST)
├── components/                   # Composants React
│   ├── Header.jsx                # Nav sticky 56px
│   ├── Footer.jsx                # Footer dark #111
│   ├── ConditionalFooter.jsx     # Masque footer sur /formulaire et /paiement
│   ├── HeroSection.jsx           # Hero (H1 + badge + CTA)
│   ├── HowItWorks.jsx            # 3 étapes
│   ├── ProofSection.jsx          # Permis accepté (photo)
│   ├── FounderSection.jsx        # Baptiste + photo + badges
│   ├── PricingCards.jsx          # 4 cartes tarifs (2x2)
│   ├── GuaranteeSection.jsx      # Garantie acceptation
│   ├── FaqSection.jsx            # FAQ accordéon (5 questions)
│   ├── ContactBanner.jsx         # Bandeau email
│   └── FinalCta.jsx              # CTA final
├── lib/                          # Logique métier
│   ├── supabase.js               # Client Supabase
│   ├── token.js                  # Tokens 32 chars
│   ├── storage.js                # Upload/download fichiers
│   └── messages.js               # Chat client/admin
├── styles/                       # CSS (responsive mobile uniquement)
│   ├── layout.css                # Header + Footer
│   ├── landing.css               # Landing page
│   ├── form.css                  # Formulaire
│   ├── payment.css               # Paiement
│   └── dashboard.css             # Dashboard client
└── public/images/                # Assets statiques
    ├── baptiste.png              # Photo fondateur
    └── dossier-accepte.png       # Photo permis accepté
```

---

## STACK TECHNIQUE

| Composant | Techno | Détail |
|-----------|--------|--------|
| Frontend | Next.js 16 (App Router) | React 18, pas de Tailwind |
| Hébergement | Vercel | Auto-deploy depuis GitHub main |
| Base de données | Supabase (PostgreSQL) | 3 tables : projects, documents, messages |
| Paiement | Stripe Checkout | Mode test (à switcher en live) |
| Emails | Resend | Email bienvenue + notif admin |
| Domaine | Ionos | permisclair.fr |
| Font | Google Fonts | DM Sans (400-800) |

### Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY
```

---

## DESIGN SYSTEM

### Palette de couleurs

```
ACCENT :          #1a5c3a   (vert foncé — boutons, liens, éléments actifs)
ACCENT_LIGHT :    #e8f5ee   (vert pâle — badges, fond garantie)
ACCENT_HOVER :    #14482e   (vert très foncé — hover boutons)

GRAY_50 :         #fafaf9   (fond très léger)
GRAY_100 :        #f5f4f2   (fond beige/crème des sections)
GRAY_200 :        #e8e7e4   (bordures, séparateurs)
GRAY_300 :        #d4d3d0   (bordures inputs)
GRAY_500 :        #8a8985   (texte secondaire, descriptions)
GRAY_700 :        #44433f   (texte moyen)
GRAY_900 :        #1c1c1a   (texte principal, titres)

WHITE :           #ffffff
FOOTER_BG :       #111111
```

### Typographie

| Élément | Taille | Poids | Couleur |
|---------|--------|-------|---------|
| H1 (hero) | 40px | 800 | GRAY_900 |
| H2 (section) | 28px | 700 | GRAY_900 |
| H3 (sous-titre) | 15-16px | 600 | GRAY_900 |
| Paragraphe | 14-16px | 400 | GRAY_500 ou GRAY_700 |
| Badge | 12-13px | 600 | ACCENT |
| Label form | 13px | 500 | GRAY_700 |
| Bouton CTA | 16px | 600 | WHITE |

Tous les titres : `letter-spacing: -0.02em`

### Formes et espacements

| Élément | Valeur |
|---------|--------|
| Border-radius cartes/sections | 14-16px |
| Border-radius boutons | 10px |
| Border-radius badges | 8px ou 20px (pills) |
| Padding section avec fond | `48px 24px` |
| Margin entre sections | `56px` (marginTop) |
| Gap grilles | 12-20px |
| Max-width contenu | 720px |

### Les 2 types de sections

| Type | Background | Bordure | Exemples |
|------|-----------|---------|----------|
| Fond beige | `#f5f4f2` | Aucune | HowItWorks, Vidéo, FAQ, FinalCta |
| Fond blanc | `#ffffff` | `1px solid #e8e7e4` | Cards, timeline, formulaire |
| Fond accent | `#e8f5ee` | `1px solid #1a5c3a44` | Garantie, badges |

### Boutons

```
CTA principal :
  background: #1a5c3a
  color: #ffffff
  padding: 14px 32px
  border-radius: 10px
  font-weight: 600
  font-size: 16px
  box-shadow: 0 1px 3px rgba(0,0,0,0.1)
  hover → background: #14482e

CTA secondaire :
  background: #ffffff
  border: 1px solid #d4d3d0
  color: #44433f

CTA carte populaire inversé :
  background: #ffffff
  color: #1a5c3a
```

### Responsive

Breakpoint unique : `@media (max-width: 768px)`

Règles mobile :
- Les sections réduisent padding et margin
- Les grilles passent à 1 colonne (sauf pricing qui reste 2x2)
- Les boutons CTA → `width: 100%`
- Les tailles de police réduites de ~15-20%
- Le chat popup → `width: calc(100vw - 32px)`

---

## PATTERN POUR CRÉER UNE NOUVELLE SECTION

```jsx
// 1. Créer components/MaSection.jsx
import '../styles/landing.css'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const GRAY_100 = "#f5f4f2"
const GRAY_200 = "#e8e7e4"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"

export default function MaSection() {
  return (
    <div className="ma-section" style={{
      background: GRAY_100,    // ou WHITE selon le type
      borderRadius: 16,
      padding: '48px 24px',
      marginTop: 56,
      textAlign: 'center'      // ou 'left'
    }}>
      <h2 className="section-title" style={{
        fontSize: 28,
        fontWeight: 700,
        margin: '0 0 32px',
        letterSpacing: '-0.02em',
        color: GRAY_900
      }}>
        Titre de la section
      </h2>
      {/* contenu */}
    </div>
  )
}

// 2. Importer dans app/page.jsx à la bonne position
// 3. Ajouter les styles mobile dans styles/landing.css :
//    @media (max-width: 768px) {
//      .ma-section { padding: 2rem 1rem !important; margin-top: 2rem !important; }
//      .ma-section h2 { font-size: 1.4rem !important; }
//    }
```

---

## ORDRE DES SECTIONS (Landing page)

```
HeroSection          → Titre + CTA
VideoSection         → YouTube embed (inline dans page.jsx)
HowItWorks           → 3 étapes
ProofSection         → Photo permis accepté
FounderSection       → Baptiste + bio + badges
PricingCards         → 4 cartes tarifs
GuaranteeSection     → Garantie acceptation
FaqSection           → 5 questions
ContactBanner        → Email contact
FinalCta             → Dernier CTA
```

---

## PARCOURS UTILISATEUR

```
permisclair.fr (LP)
  → Clic "Décrire mon projet"
  → /formulaire (4 étapes : projet → détails → coordonnées → récap)
  → Validation → projet enregistré dans Supabase (status: pending)
  → Redirect /paiement (récap offre + prix + Stripe)
  → Clic "Payer X€" → Stripe Checkout
  → Paiement OK → redirect /paiement/succes
  → Status → "paid" + email bienvenue envoyé (Resend)
  → Client reçoit lien magique → /projet/PC-XXXXX?token=xxx
  → Dashboard client : timeline, upload docs, chat, téléchargement dossier
```

---

## BASE DE DONNÉES (Supabase)

### Table projects

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID unique |
| reference | TEXT | Référence visible (PC-xxx) |
| token | TEXT | Token accès 32 chars |
| project_type | TEXT | Type de projet |
| address, city, postal_code | TEXT | Adresse terrain |
| surface | INTEGER | Surface m² (max 150) |
| floors, rooms | TEXT/INTEGER | Niveaux, chambres |
| roof_type, style, description | TEXT (nullable) | Détails archi |
| first_name, last_name, email, phone | TEXT | Coordonnées |
| price | INTEGER (nullable) | Prix en euros |
| status | TEXT | pending → paid → in_progress → review → delivered → deposited → accepted |
| created_at, paid_at, last_read_at | TIMESTAMPTZ | Dates |

### Table documents

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID unique |
| project_id | UUID (FK) | Lien vers projects |
| file_name | TEXT | Nom fichier original |
| file_url | TEXT | URL publique Supabase Storage |
| file_type | TEXT | MIME type |
| uploaded_by | TEXT | 'client' ou 'admin' |
| created_at | TIMESTAMPTZ | Date upload |

### Table messages

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | ID unique |
| project_id | UUID (FK) | Lien vers projects |
| sender | TEXT | 'client' ou 'admin' |
| content | TEXT | Contenu du message |
| created_at | TIMESTAMPTZ | Date envoi |

---

## GRILLE TARIFAIRE (à synchroniser dans 3 fichiers)

| Projet | Type | Prix | Fichiers concernés |
|--------|------|------|-------------------|
| Piscine / Garage | DP | 390€ | PricingCards.jsx, formulaire/page.jsx, paiement/page.jsx |
| Extension | PC | 790€ | idem |
| Maison plain-pied | PC | 990€ | idem |
| Maison R+1 / complexe | PC | 1 190€ | idem |

---

## FLUX STRIPE

```
Client clique "Payer X€"
  → POST /api/checkout { projectId, reference, price, label, email }
  → Stripe crée Checkout Session (price en centimes : price * 100)
  → Client redirigé vers Stripe
  → Paiement OK → redirect /paiement/succes?project_id=xxx
  → Page met à jour status = 'paid' + paid_at
  → POST /api/send-welcome-email
  → Email client (lien magique) + email admin (notification)
```

## SYSTÈME DE TOKENS

```
1. generateToken() → 32 chars alphanumériques (lib/token.js)
2. Stocké dans projects.token
3. URL accès : /projet/{reference}?token={token}
4. Vérification : URL d'abord, puis cookie si absent
5. Cookie : pc_{reference}={token}, durée 1 an
6. Distribué dans l'email de bienvenue
```

---

## DÉPLOIEMENT

```bash
npm run dev          # Dev local
npm run build        # Build production
git push origin HEAD:main  # Auto-deploy Vercel (~30s)
```

URL prod : https://permisclair.fr
GitHub : github.com/BatoEnLambo/monpermis (branche main)
