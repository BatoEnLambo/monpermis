// Catalogue des types d'ouvrage pour la section "Vos ouvrages" de l'espace client.
// Chaque ouvrage d'un projet appartient à un type parmi ces 8 catégories.
// Les sous-types sont optionnels (le type "autre" n'en a pas).

export const OUVRAGE_TYPES = [
  {
    id: 'maison',
    label: 'Maison',
    icon: '🏠',
    description: 'Construction neuve, extension ou surélévation',
    subtypes: [
      { id: 'neuve', label: 'Construction neuve' },
      { id: 'extension', label: "Extension d'une maison existante" },
      { id: 'surelevation', label: 'Surélévation' },
    ],
  },
  {
    id: 'piscine',
    label: 'Piscine',
    icon: '🌊',
    description: 'Piscine, spa ou abri de piscine',
    subtypes: [
      { id: 'enterree', label: 'Piscine enterrée' },
      { id: 'semi_enterree', label: 'Piscine semi-enterrée' },
      { id: 'hors_sol', label: 'Piscine hors-sol fixe' },
      { id: 'spa', label: 'Spa / jacuzzi encastré' },
      { id: 'abri', label: 'Abri de piscine' },
    ],
  },
  {
    id: 'garage_abri',
    label: 'Garage / Abri / Dépendance',
    icon: '🏚️',
    description: 'Garage, carport, abri de jardin, pool house, atelier',
    subtypes: [
      { id: 'garage', label: 'Garage fermé' },
      { id: 'carport', label: 'Carport (abri ouvert)' },
      { id: 'abri_jardin', label: 'Abri de jardin / cabanon' },
      { id: 'pool_house', label: 'Pool house / local technique piscine' },
      { id: 'atelier', label: 'Atelier / local de stockage' },
    ],
  },
  {
    id: 'terrasse',
    label: 'Terrasse',
    icon: '⬜',
    description: 'Terrasse surélevée, deck, plage de piscine',
    subtypes: [
      { id: 'surelevee', label: 'Terrasse surélevée' },
      { id: 'deck_bois', label: 'Deck bois' },
      { id: 'plage_piscine', label: 'Plage de piscine' },
    ],
  },
  {
    id: 'mur_cloture',
    label: 'Mur / Clôture / Portail',
    icon: '🧱',
    description: 'Mur de soutènement, clôture, portail',
    subtypes: [
      { id: 'mur_soutenement', label: 'Mur de soutènement' },
      { id: 'mur_cloture', label: 'Mur de clôture' },
      { id: 'cloture', label: 'Clôture (grillage, palissade)' },
      { id: 'portail', label: 'Portail avec piliers' },
    ],
  },
  {
    id: 'modification_exterieure',
    label: 'Modification extérieure',
    icon: '🎨',
    description: 'Ouvertures, ravalement, couverture, isolation, panneaux solaires',
    subtypes: [
      { id: 'ouverture', label: "Création ou modification d'ouverture (fenêtre, porte, baie)" },
      { id: 'ravalement', label: 'Ravalement de façade' },
      { id: 'menuiseries', label: 'Changement de menuiseries' },
      { id: 'couverture', label: 'Changement de couverture' },
      { id: 'ite', label: "Isolation thermique par l'extérieur" },
      { id: 'solaires', label: 'Panneaux solaires en toiture' },
    ],
  },
  {
    id: 'agricole',
    label: 'Bâtiment agricole',
    icon: '🚜',
    description: 'Écurie, grange, hangar, stockage, serre',
    subtypes: [
      { id: 'ecurie', label: 'Écurie / box chevaux' },
      { id: 'grange', label: 'Grange' },
      { id: 'hangar', label: 'Hangar agricole' },
      { id: 'elevage', label: "Bâtiment d'élevage (vaches, poulailler, etc.)" },
      { id: 'stockage', label: 'Stockage de récoltes / matériel' },
      { id: 'serre', label: 'Serre agricole' },
    ],
  },
  {
    id: 'autre',
    label: 'Autre',
    icon: '✨',
    description: 'Projet atypique : décrivez-le librement',
    subtypes: null,
  },
]

export function getOuvrageType(id) {
  return OUVRAGE_TYPES.find(t => t.id === id) || null
}

export function getSubtype(typeId, subtypeId) {
  const type = getOuvrageType(typeId)
  if (!type || !type.subtypes) return null
  return type.subtypes.find(s => s.id === subtypeId) || null
}

export function formatOuvrageType(typeId, subtypeId) {
  const type = getOuvrageType(typeId)
  if (!type) return typeId || ''
  const sub = getSubtype(typeId, subtypeId)
  if (sub) return `${type.label} — ${sub.label}`
  return type.label
}

// ─────────────────────────────────────────────────────────────────────
// Helpers de classification des ouvrages (pour le formulaire détails)
// ─────────────────────────────────────────────────────────────────────

export function isBati(typeId) {
  return typeId === 'maison' || typeId === 'garage_abri' || typeId === 'agricole'
}

export function isSerre(typeId, subtypeId) {
  return typeId === 'agricole' && subtypeId === 'serre'
}

export function needsDimensionsBati(typeId, subtypeId) {
  return isBati(typeId) && !isSerre(typeId, subtypeId)
}

export function needsMateriauxBati(typeId, subtypeId) {
  return isBati(typeId) && !isSerre(typeId, subtypeId)
}

export function needsOuvertures(typeId, subtypeId) {
  if (!isBati(typeId)) return false
  if (isSerre(typeId, subtypeId)) return false
  if (typeId === 'garage_abri' && subtypeId === 'carport') return false
  return true
}

export function needsRaccord(typeId, subtypeId) {
  return typeId === 'maison' && (subtypeId === 'extension' || subtypeId === 'surelevation')
}

// ─────────────────────────────────────────────────────────────────────
// Listes de choix pour les selects (partagées avec le composant fields)
// ─────────────────────────────────────────────────────────────────────

export const TYPE_TOITURE_OPTIONS = [
  'Toit plat',
  '2 pans',
  '4 pans',
  'Monopente',
  'En L',
  'Complexe / autre',
]

export const MATERIAU_FACADE_OPTIONS = [
  'Enduit',
  'Bardage bois',
  'Bardage métallique',
  'Pierre',
  'Brique apparente',
  'Béton apparent',
  'Autre',
]

export const MATERIAU_COUVERTURE_OPTIONS = [
  'Tuiles terre cuite',
  'Tuiles béton',
  'Ardoise',
  'Zinc',
  'Bac acier',
  'Membrane EPDM (toit plat)',
  'Autre',
]

export const MATERIAU_MENUISERIES_OPTIONS = [
  'PVC',
  'Aluminium',
  'Bois',
  'Mixte bois-alu',
  'Autre',
]

export const OUVERTURE_TYPE_OPTIONS = [
  'Fenêtre',
  'Baie vitrée',
  "Porte d'entrée",
  'Porte de garage',
  'Porte intérieure donnant sur extérieur',
  'Velux / fenêtre de toit',
  'Oculus / hublot',
]

export const FACADE_OPTIONS = ['Nord', 'Sud', 'Est', 'Ouest', 'Non déterminée']

export const MODE_RACCORD_OPTIONS = [
  'Accolé sur un pignon',
  'Accolé sur un mur de façade principale',
  'En surélévation totale',
  'En surélévation partielle',
  'Autre',
]

export const EMPRISE_CONSERVEE_OPTIONS = [
  'Oui, sur toute la surface existante',
  'Non, uniquement sur une partie',
]

export const TYPE_SERRE_OPTIONS = [
  'Tunnel plastique',
  'Multichapelle',
  'Chapelle verre',
  'Autre',
]

export const MATERIAU_COUVERTURE_SERRE_OPTIONS = [
  'Film polyéthylène',
  'Polycarbonate',
  'Verre horticole',
  'Autre',
]

// ─────────────────────────────────────────────────────────────────────
// Calcul de la progression d'un ouvrage individuel
// Retourne { filled, total } — le caller fait le ratio.
// ─────────────────────────────────────────────────────────────────────

export function computeOuvrageProgress(o) {
  if (!o) return { filled: 0, total: 1 }
  const d = o.data || {}
  let filled = 0
  let total = 1 // le nom
  if (o.name && o.name.trim()) filled++

  if (needsDimensionsBati(o.type, o.subtype)) {
    const dims = d.dimensions || {}
    const isFlat = dims.type_toiture === 'Toit plat'
    // longueur, largeur, hauteur_faitage, hauteur_egout, type_toiture, debords (+ pente si pas plat)
    total += 6 + (isFlat ? 0 : 1)
    if (dims.longueur_m != null && dims.longueur_m !== '') filled++
    if (dims.largeur_m != null && dims.largeur_m !== '') filled++
    if ((dims.hauteur_faitage_m != null && dims.hauteur_faitage_m !== '') || dims.hauteur_faitage_unknown) filled++
    if ((dims.hauteur_egout_m != null && dims.hauteur_egout_m !== '') || dims.hauteur_egout_unknown) filled++
    if (dims.type_toiture) filled++
    if (!isFlat && ((dims.pente_toiture_deg != null && dims.pente_toiture_deg !== '') || dims.pente_toiture_unknown)) filled++
    if ((dims.debords_cm != null && dims.debords_cm !== '') || dims.debords_unknown) filled++
  }

  if (needsMateriauxBati(o.type, o.subtype)) {
    const mat = d.materiaux || {}
    total += 6
    if (mat.materiau_facade) filled++
    if (mat.couleur_facade_ral && mat.couleur_facade_ral.trim()) filled++
    if (mat.materiau_couverture) filled++
    if (mat.couleur_couverture && mat.couleur_couverture.trim()) filled++
    if (mat.materiau_menuiseries) filled++
    if (mat.couleur_menuiseries_ral && mat.couleur_menuiseries_ral.trim()) filled++
  }

  if (needsOuvertures(o.type, o.subtype)) {
    total += 1
    if (Array.isArray(d.ouvertures) && d.ouvertures.length > 0) filled++
  }

  if (needsRaccord(o.type, o.subtype)) {
    const r = d.raccord_existant || {}
    total += 2
    if (r.description_existant && r.description_existant.trim()) filled++
    if (r.mode_raccord) filled++
    if (o.subtype === 'surelevation') {
      total += 2
      if (r.hauteur_ajoutee_m != null && r.hauteur_ajoutee_m !== '') filled++
      if (r.emprise_conservee) filled++
    }
  }

  if (isSerre(o.type, o.subtype)) {
    const s = d.serre || {}
    total += 5
    if (s.longueur_m != null && s.longueur_m !== '') filled++
    if (s.largeur_m != null && s.largeur_m !== '') filled++
    if (s.hauteur_faitiere_m != null && s.hauteur_faitiere_m !== '') filled++
    if (s.type_serre) filled++
    if (s.materiau_couverture_serre) filled++
  }

  // Types non-bâti non encore spécifiés : complétion = nom seulement (placeholder).
  return { filled, total }
}

// Moyenne pondérée : chaque ouvrage contribue proportionnellement à son ratio.
export function computeOuvragesGlobalProgress(ouvrages) {
  if (!ouvrages || ouvrages.length === 0) return 0
  const ratios = ouvrages.map(o => {
    const { filled, total } = computeOuvrageProgress(o)
    return total > 0 ? filled / total : 0
  })
  const avg = ratios.reduce((s, r) => s + r, 0) / ratios.length
  return Math.round(avg * 100) / 100 // 0..1 avec 2 décimales
}
