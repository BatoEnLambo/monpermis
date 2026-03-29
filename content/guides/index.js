import { extensionMaison } from './extension-maison'
import { planDeMasse } from './plan-de-masse'

export const guides = [extensionMaison, planDeMasse]

export function getGuideBySlug(slug) {
  return guides.find((guide) => guide.slug === slug) || null
}

export function getAllGuides() {
  return guides.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
}
