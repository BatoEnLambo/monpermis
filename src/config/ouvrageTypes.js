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

// ─── Piscine ────────────────────────────────────────────────────────
export function isPiscine(typeId) {
  return typeId === 'piscine'
}
export function isPiscineBassin(typeId, subtypeId) {
  // Tous les sous-types de piscine sauf "abri"
  return typeId === 'piscine' && subtypeId && subtypeId !== 'abri'
}
export function isPiscineEnterree(typeId, subtypeId) {
  return typeId === 'piscine' && (subtypeId === 'enterree' || subtypeId === 'semi_enterree')
}
export function isPiscineHorsSol(typeId, subtypeId) {
  return typeId === 'piscine' && subtypeId === 'hors_sol'
}
export function isPiscineSpa(typeId, subtypeId) {
  return typeId === 'piscine' && subtypeId === 'spa'
}
export function isPiscineAbri(typeId, subtypeId) {
  return typeId === 'piscine' && subtypeId === 'abri'
}
// Sécurité obligatoire pour enterrée / semi / hors-sol (pas spa, pas abri)
export function needsPiscineSecurite(typeId, subtypeId) {
  return typeId === 'piscine' && (subtypeId === 'enterree' || subtypeId === 'semi_enterree' || subtypeId === 'hors_sol')
}

// ─── Terrasse ───────────────────────────────────────────────────────
export function isTerrasse(typeId) {
  return typeId === 'terrasse'
}
export function isTerrasseDeckBois(typeId, subtypeId) {
  return typeId === 'terrasse' && subtypeId === 'deck_bois'
}

// ─── Mur / Clôture / Portail ────────────────────────────────────────
export function isMurCloture(typeId) {
  return typeId === 'mur_cloture'
}
export function isMurSoutenement(typeId, subtypeId) {
  return typeId === 'mur_cloture' && subtypeId === 'mur_soutenement'
}
export function isMurClotureMur(typeId, subtypeId) {
  return typeId === 'mur_cloture' && subtypeId === 'mur_cloture'
}
export function isCloture(typeId, subtypeId) {
  return typeId === 'mur_cloture' && subtypeId === 'cloture'
}
export function isPortail(typeId, subtypeId) {
  return typeId === 'mur_cloture' && subtypeId === 'portail'
}
// Tout sous-type mur/clôture qui a des dimensions + matériaux classiques (pas portail)
export function isMurLineaire(typeId, subtypeId) {
  return typeId === 'mur_cloture' && subtypeId && subtypeId !== 'portail'
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

// ─── Piscine ────────────────────────────────────────────────────────
export const FORME_PISCINE_OPTIONS = [
  'Rectangulaire',
  'Carrée',
  'Ovale',
  'Ronde',
  'Libre / haricot',
  'Autre',
]

export const TYPE_CONSTRUCTION_PISCINE_OPTIONS = [
  'Béton banché',
  'Béton projeté (gunite)',
  'Coque polyester',
  'Bloc polystyrène',
  'Panneaux métalliques',
  'Autre',
]

export const REVETEMENT_PISCINE_OPTIONS = [
  'Liner',
  'Polyester / gelcoat',
  'Carrelage',
  'Enduit / mosaïque',
  'Membrane armée',
  'Autre',
]

export const LOCAL_TECHNIQUE_OPTIONS = [
  'Aucun',
  'Coffre enterré',
  'Local technique maçonné',
  'Pool house',
  'Dans un bâtiment existant',
  'Autre',
]

export const CHAUFFAGE_PISCINE_OPTIONS = [
  'Aucun',
  'Pompe à chaleur',
  'Solaire',
  'Échangeur chaudière',
  'Autre',
]

export const TYPE_HORS_SOL_OPTIONS = [
  'Acier',
  'Bois',
  'Résine / composite',
  'Autre',
]

export const HABILLAGE_HORS_SOL_OPTIONS = [
  'Aucun',
  'Bois',
  'Composite',
  'Enduit',
  'Autre',
]

export const TYPE_ENCASTREMENT_SPA_OPTIONS = [
  'Hors sol',
  'Semi-encastré',
  'Encastré',
]

export const ABRI_SPA_OPTIONS = [
  'Aucun',
  'Couverture rigide',
  'Pergola',
  'Local fermé',
]

export const DISPOSITIFS_SECURITE_OPTIONS = [
  'Barrière de sécurité',
  'Alarme immergée',
  'Couverture de sécurité',
  'Abri de piscine',
  'Volet roulant de sécurité',
]

// ─── Abri de piscine ────────────────────────────────────────────────
export const TYPE_ABRI_OPTIONS = [
  'Bas (< 1.20 m)',
  'Mi-haut',
  'Haut (> 1.80 m)',
  'Télescopique',
  'Fixe',
  'Autre',
]

export const MOBILE_ABRI_OPTIONS = [
  'Fixe',
  'Mobile / coulissant',
]

export const MATERIAU_STRUCTURE_ABRI_OPTIONS = [
  'Aluminium',
  'Acier',
  'Bois',
  'Autre',
]

export const MATERIAU_PAROIS_ABRI_OPTIONS = [
  'Polycarbonate',
  'Verre',
  'Plexiglas',
  'Autre',
]

// ─── Terrasse ───────────────────────────────────────────────────────
export const MATERIAU_REVETEMENT_TERRASSE_OPTIONS = [
  'Carrelage',
  'Pierre naturelle',
  'Dalles béton',
  'Bois',
  'Composite',
  'Béton désactivé',
  'Autre',
]

export const STRUCTURE_PORTANTE_OPTIONS = [
  'Dalle béton',
  'Plots béton',
  'Pilotis bois',
  'Pilotis métal',
  'Structure bois sur sol',
  'Autre',
]

export const ESSENCE_BOIS_OPTIONS = [
  'Pin traité',
  'Douglas',
  'Mélèze',
  'Chêne',
  'Ipé',
  'Teck',
  'Cumaru',
  'Autre',
]

export const SENS_POSE_OPTIONS = [
  'Parallèle à la maison',
  'Perpendiculaire',
  'Diagonal',
]

export const ACCES_TERRASSE_OPTIONS = [
  'De plain-pied',
  'Escalier',
  'Rampe',
  'Via baie vitrée',
  'Autre',
]

export const GARDE_CORPS_OPTIONS = [
  'Aucun',
  'Bois',
  'Métal',
  'Verre',
  'Câbles inox',
  'Autre',
]

// ─── Mur / Clôture / Portail ────────────────────────────────────────
export const MATERIAU_MUR_SOUTENEMENT_OPTIONS = [
  'Béton banché',
  'Blocs béton',
  'Pierre maçonnée',
  'Gabions',
  'Enrochement',
  'Autre',
]

export const PAREMENT_MUR_SOUTENEMENT_OPTIONS = [
  'Brut / aucun',
  'Enduit',
  'Pierre de parement',
  'Bardage',
  'Autre',
]

export const MATERIAU_MUR_CLOTURE_OPTIONS = [
  'Parpaing enduit',
  'Béton banché',
  'Pierre',
  'Brique',
  'Moellons',
  'Autre',
]

export const PAREMENT_MUR_CLOTURE_OPTIONS = [
  'Enduit',
  'Pierre de parement',
  'Brique apparente',
  'Brut',
  'Autre',
]

export const TYPE_CLOTURE_OPTIONS = [
  'Grillage souple',
  'Grillage rigide (panneaux)',
  'Palissade bois',
  'Palissade composite',
  'Ganivelles',
  'Brise-vue / haie artificielle',
  'Barreaudage métallique',
  'Autre',
]

export const SOUBASSEMENT_CLOTURE_OPTIONS = [
  'Aucun',
  'Plaque béton',
  'Muret maçonné',
  'Autre',
]

export const OCCULTATION_CLOTURE_OPTIONS = [
  'Aucune',
  'Lames occultantes',
  'Brise-vue tissu / canisse',
  'Végétation',
  'Autre',
]

export const TYPE_OUVERTURE_PORTAIL_OPTIONS = [
  'Battant',
  'Coulissant',
  'Autoportant',
]

export const MATERIAU_PORTAIL_OPTIONS = [
  'Aluminium',
  'Acier',
  'Bois',
  'PVC',
  'Fer forgé',
  'Autre',
]

export const MOTORISATION_PORTAIL_OPTIONS = [
  'Aucune (manuel)',
  'Motorisé à bras',
  'Motorisé à vérins',
  'Motorisé enterré',
  'Motorisé coulissant',
]

export const MATERIAU_PILIERS_OPTIONS = [
  'Parpaing enduit',
  'Pierre',
  'Brique',
  'Béton',
  'Métal',
  'Autre',
]

export const CHAPEAUX_PILIERS_OPTIONS = [
  'Aucun',
  'Pierre',
  'Béton',
  'Métal',
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

  // ─── Piscine bassin (enterrée / semi / hors-sol / spa) ────────────
  if (isPiscineBassin(o.type, o.subtype)) {
    const b = d.bassin || {}
    const isRonde = b.forme === 'Ronde'
    // forme + dimensions (2 si pas rond, 1 si rond) + profondeur_min + profondeur_max
    total += 4 + (isRonde ? 0 : 1)
    if (b.forme) filled++
    if (isRonde) {
      if (b.diametre_m != null && b.diametre_m !== '') filled++
    } else {
      if (b.longueur_m != null && b.longueur_m !== '') filled++
      if (b.largeur_m != null && b.largeur_m !== '') filled++
    }
    if (b.profondeur_min_m != null && b.profondeur_min_m !== '') filled++
    if (b.profondeur_max_m != null && b.profondeur_max_m !== '') filled++

    // Caractéristiques — variant selon sous-type
    if (isPiscineEnterree(o.type, o.subtype)) {
      const c = d.caracteristiques || {}
      total += 4
      if (c.type_construction) filled++
      if (c.revetement) filled++
      if (c.local_technique) filled++
      if (c.chauffage) filled++
    } else if (isPiscineHorsSol(o.type, o.subtype)) {
      const c = d.caracteristiques || {}
      total += 3
      if (c.type_hors_sol) filled++
      if (c.hauteur_bassin_m != null && c.hauteur_bassin_m !== '') filled++
      if (c.habillage) filled++
    } else if (isPiscineSpa(o.type, o.subtype)) {
      const c = d.caracteristiques || {}
      total += 3
      if (c.nombre_places != null && c.nombre_places !== '') filled++
      if (c.type_encastrement) filled++
      if (c.abri_spa) filled++
    }

    // Sécurité obligatoire — ≥1 dispositif
    if (needsPiscineSecurite(o.type, o.subtype)) {
      total += 1
      const dispos = d.securite?.dispositifs || []
      if (Array.isArray(dispos) && dispos.length > 0) filled++
    }
  }

  // ─── Abri de piscine ──────────────────────────────────────────────
  if (isPiscineAbri(o.type, o.subtype)) {
    const a = d.abri || {}
    total += 6
    if (a.type_abri) filled++
    if (a.mobile) filled++
    if (a.materiau_structure) filled++
    if (a.materiau_parois) filled++
    if (a.longueur_m != null && a.longueur_m !== '') filled++
    if (a.largeur_m != null && a.largeur_m !== '') filled++
  }

  // ─── Terrasse ─────────────────────────────────────────────────────
  if (isTerrasse(o.type)) {
    const t = d.terrasse || {}
    // dimensions : longueur + largeur + hauteur_au_dessus_sol (+ unknown compte comme rempli)
    total += 3
    if (t.longueur_m != null && t.longueur_m !== '') filled++
    if (t.largeur_m != null && t.largeur_m !== '') filled++
    if ((t.hauteur_au_dessus_sol_m != null && t.hauteur_au_dessus_sol_m !== '') || t.hauteur_au_dessus_sol_unknown) filled++

    // matériaux : revêtement + structure portante
    const m = d.materiaux_terrasse || {}
    total += 2
    if (m.materiau_revetement) filled++
    if (m.structure_portante) filled++
    // si deck_bois : essence + sens_pose
    if (isTerrasseDeckBois(o.type, o.subtype)) {
      total += 2
      if (m.essence_bois) filled++
      if (m.sens_pose) filled++
    }

    // accessibilité : acces + garde_corps
    const acc = d.accessibilite || {}
    total += 2
    if (acc.acces) filled++
    if (acc.garde_corps) filled++
  }

  // ─── Mur / Clôture linéaire (pas portail) ─────────────────────────
  if (isMurLineaire(o.type, o.subtype)) {
    const dm = d.dimensions_mur || {}
    // longueur + hauteur (soit hauteur_m soit min+max si variable)
    total += 2
    if (dm.longueur_m != null && dm.longueur_m !== '') filled++
    if (dm.hauteur_variable) {
      if ((dm.hauteur_min_m != null && dm.hauteur_min_m !== '') && (dm.hauteur_max_m != null && dm.hauteur_max_m !== '')) filled++
    } else {
      if (dm.hauteur_m != null && dm.hauteur_m !== '') filled++
    }

    // Matériaux — 3 variantes
    const mm = d.materiaux_mur || {}
    if (isMurSoutenement(o.type, o.subtype)) {
      total += 2
      if (mm.materiau) filled++
      if (mm.parement) filled++
    } else if (isMurClotureMur(o.type, o.subtype)) {
      total += 2
      if (mm.materiau) filled++
      if (mm.parement) filled++
    } else if (isCloture(o.type, o.subtype)) {
      total += 3
      if (mm.type_cloture) filled++
      if (mm.soubassement) filled++
      if (mm.occultation) filled++
    }
  }

  // ─── Portail ──────────────────────────────────────────────────────
  if (isPortail(o.type, o.subtype)) {
    const p = d.portail || {}
    // type_ouverture + largeur + hauteur + materiau + motorisation
    total += 5
    if (p.type_ouverture) filled++
    if (p.largeur_m != null && p.largeur_m !== '') filled++
    if (p.hauteur_m != null && p.hauteur_m !== '') filled++
    if (p.materiau) filled++
    if (p.motorisation) filled++
    // Piliers optionnels : si inclus → matériau piliers + chapeaux + hauteur
    if (p.avec_piliers) {
      total += 3
      if (p.materiau_piliers) filled++
      if (p.chapeaux_piliers) filled++
      if (p.hauteur_piliers_m != null && p.hauteur_piliers_m !== '') filled++
    }
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
