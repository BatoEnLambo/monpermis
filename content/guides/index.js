import { extensionMaison } from './extension-maison'
import { planDeMasse } from './plan-de-masse'
import { declarationPrealableTravaux } from './declaration-prealable-travaux'
import { planDeSituation } from './plan-de-situation'
import { cerfaDeclarationPrealable } from './cerfa-declaration-prealable'
import { planDeCoupe } from './plan-de-coupe'
import { extensionMaisonPrix } from './extension-maison-prix'
import { empriseAuSolSurfaceDePlancher } from './emprise-au-sol-surface-de-plancher'
import { faireSesPlans } from './faire-ses-plans-maison'
import { piscineDeclarationPrealable } from './piscine-declaration-prealable'
import { planExtensionMaison } from './plan-extension-maison'
import { planGarage } from './plan-garage'

export const guides = [extensionMaison, planDeMasse, declarationPrealableTravaux, planDeSituation, cerfaDeclarationPrealable, planDeCoupe, extensionMaisonPrix, empriseAuSolSurfaceDePlancher, faireSesPlans, piscineDeclarationPrealable, planExtensionMaison, planGarage]

export function getGuideBySlug(slug) {
  return guides.find((guide) => guide.slug === slug) || null
}

export function getAllGuides() {
  return guides.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
}
