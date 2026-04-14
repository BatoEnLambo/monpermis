// Source de vérité unique pour tous les prix PermisClair
// Importé par : formulaire, paiement, checkout (serveur)

export const PRICING = {
  DP: { id: 'dp', label: 'Déclaration préalable', basePrice: 350 },
  EXTENSION: { id: 'extension', label: 'Extension / Surélévation', basePrice: 590 },
  MAISON_NEUVE: { id: 'maison_neuve', label: 'Maison neuve / Construction', basePrice: 590 },
};

export const OPTIONS = {
  RE2020: { id: 're2020', label: 'Attestation RE2020', price: 200 },
};

const PC_INCLUDES = [
  "Plans complets (PCMI1 à PCMI8)",
  "Notice descriptive",
  "CERFA rempli",
  "Insertion paysagère",
  "Dossier assemblé prêt à déposer",
  "Corrections illimitées jusqu'à acceptation",
];

const DP_INCLUDES = [
  "Plans complets (DP1 à DP8)",
  "Notice descriptive",
  "CERFA rempli",
  "Document graphique",
  "Dossier assemblé prêt à déposer",
  "Corrections illimitées jusqu'à acceptation",
];

const PROJECT_LABELS = {
  "Piscine": "Déclaration préalable — Piscine",
  "Garage / Carport": "Déclaration préalable — Garage / Carport",
  "Terrasse / Pergola": "Déclaration préalable — Terrasse / Pergola",
  "Extension / Agrandissement": "Permis de construire — Extension",
  "Surélévation": "Permis de construire — Surélévation",
  "Maison neuve": "Permis de construire — Maison neuve",
  "Autre": "Projet sur mesure",
};

export function getProjectCategory(projectType) {
  switch (projectType) {
    case "Piscine":
    case "Garage / Carport":
    case "Terrasse / Pergola":
      return 'DP';
    case "Extension / Agrandissement":
    case "Surélévation":
      return 'EXTENSION';
    case "Maison neuve":
      return 'MAISON_NEUVE';
    case "Autre":
    default:
      return 'MAISON_NEUVE';
  }
}

export function computePrice({ category, options = [] }) {
  const base = PRICING[category]?.basePrice;
  if (!base) throw new Error('Invalid category: ' + category);
  const optionsTotal = options.reduce((sum, opt) => sum + (OPTIONS[opt]?.price || 0), 0);
  return base + optionsTotal;
}

// Retourne l'objet complet pour l'affichage UI (formulaire + paiement)
export function getProjectPricing(projectType) {
  const category = getProjectCategory(projectType);
  const config = PRICING[category];
  const isDP = category === 'DP';

  return {
    category,
    price: config.basePrice,
    label: PROJECT_LABELS[projectType] || "Projet sur mesure",
    delay: isDP ? "3 jours ouvrés" : "5 jours ouvrés",
    includes: isDP ? DP_INCLUDES : PC_INCLUDES,
  };
}
