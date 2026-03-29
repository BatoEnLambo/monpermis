import { extensionMaison } from './extension-maison'
import { planDeMasse } from './plan-de-masse'
import { declarationPrealableTravaux } from './declaration-prealable-travaux'
import { planDeSituation } from './plan-de-situation'

export const guides = [extensionMaison, planDeMasse, declarationPrealableTravaux, planDeSituation]

export function getGuideBySlug(slug) {
  return guides.find((guide) => guide.slug === slug) || null
}

export function getAllGuides() {
  return guides.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
}
