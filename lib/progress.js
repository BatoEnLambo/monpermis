// Calcul unifié de la progression d'un projet PermisClair.
//
// Source unique de vérité pour les 3 endroits qui affichent ou déclenchent
// une action sur la progression :
//   - app/admin/page.jsx           (badge % + détail sections côté admin)
//   - app/projet/[reference]/page.jsx (barre de progression côté client,
//                                      persistée dans project_details.completion_percentage)
//   - app/api/reminders/route.js   (seuils J+1 / J+3 / J+7 du cron de relance)
//
// Avant ce module, les 3 endroits avaient chacun leur propre formule qui
// divergeait (20/50/20/10 vs 8/28 non pondéré vs 30/50/20 sans photos).
// La pondération retenue ici est celle de l'admin, la plus granulaire.

import { computeOuvrageProgress } from '../src/config/ouvrageTypes'

/**
 * Calcule la progression par section. Utile pour afficher des badges
 * détaillés et la liste des éléments manquants.
 *
 * @param {object|null} details     Ligne project_details
 * @param {Array|null}  ouvrages    Lignes project_ouvrages
 * @param {number}      photoCount  Nombre de photos terrain (cappé à 5)
 * @returns {{
 *   coordonnees: {filled:number,total:number,ratio:number},
 *   ouvrages:    {filled:number,total:number,ratio:number,count:number},
 *   terrain:     {filled:number,total:number,ratio:number},
 *   photos:      {filled:number,total:number,ratio:number},
 * }}
 */
export function computeProjectSections(details, ouvrages, photoCount) {
  const d = details || {}
  const list = Array.isArray(ouvrages) ? ouvrages : []

  // Coordonnées (8 champs CERFA)
  const coordFields = [
    d.client_civilite, d.client_nom, d.client_prenom,
    d.client_date_naissance, d.client_commune_naissance,
    d.client_departement_naissance, d.client_telephone, d.client_email,
  ]
  const coordFilled = coordFields.filter(Boolean).length
  const coordRatio = coordFilled / 8

  // Ouvrages (somme pondérée des progressions individuelles)
  let ouvFilled = 0
  let ouvTotal = 0
  for (const o of list) {
    const { filled, total } = computeOuvrageProgress({
      name: o.name, type: o.type, subtype: o.subtype, data: o.data || {},
    })
    ouvFilled += filled
    ouvTotal += total
  }
  const ouvRatio = ouvTotal > 0 ? ouvFilled / ouvTotal : 0

  // Terrain (5 éléments)
  let terrainFilled = 0
  if (d.parcelle_nsp || d.parcelle_section || d.parcelle_numero) terrainFilled++
  if (d.constructions_existantes === false) {
    terrainFilled++
  } else if (d.constructions_existantes === true) {
    try {
      const liste = JSON.parse(d.constructions_existantes_liste || '[]')
      if (Array.isArray(liste) && liste.some(it => it.nom)) terrainFilled++
    } catch {
      if (d.constructions_existantes_liste) terrainFilled++
    }
  }
  if (d.implantation_description) terrainFilled++
  if (d.assainissement) terrainFilled++
  if (
    d.raccordement_eau ||
    d.raccordement_electricite ||
    d.raccordement_gaz ||
    d.raccordement_fibre ||
    d.raccordement_aucun
  ) {
    terrainFilled++
  }
  const terrainRatio = terrainFilled / 5

  // Photos (0-5 cappé)
  const photos = Math.max(0, Math.min(photoCount || 0, 5))
  const photosRatio = photos / 5

  return {
    coordonnees: { filled: coordFilled,   total: 8,        ratio: coordRatio },
    ouvrages:    { filled: ouvFilled,     total: ouvTotal, ratio: ouvRatio, count: list.length },
    terrain:     { filled: terrainFilled, total: 5,        ratio: terrainRatio },
    photos:      { filled: photos,        total: 5,        ratio: photosRatio },
  }
}

/**
 * Pourcentage global (entier 0-100) avec la pondération :
 *   20% coordonnées + 50% ouvrages + 20% terrain + 10% photos
 *
 * @param {object|null} details
 * @param {Array|null}  ouvrages
 * @param {number}      photoCount
 * @returns {number}  Entier entre 0 et 100
 */
export function computeProjectProgress(details, ouvrages, photoCount) {
  const s = computeProjectSections(details, ouvrages, photoCount)
  const weighted =
    0.20 * s.coordonnees.ratio +
    0.50 * s.ouvrages.ratio +
    0.20 * s.terrain.ratio +
    0.10 * s.photos.ratio
  return Math.round(weighted * 100)
}
