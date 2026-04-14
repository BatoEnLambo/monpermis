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
