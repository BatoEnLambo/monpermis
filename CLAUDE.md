# MonPermis — Contexte projet

## Qui je suis
Baptiste, basé en Vendée (Talmont-Saint-Hilaire). Je construis ma propre maison en ossature bois (permis obtenu). Je ne suis pas développeur — je suis un artisan-entrepreneur autodidacte qui apprend progressivement. Parle-moi en français.

## Le produit
**MonPermis** est un service/SaaS qui aide les particuliers français à obtenir leur permis de construire. On fait les plans, le dossier complet (PCMI1 à PCMI8, CERFA), et on accompagne jusqu'à l'acceptation en mairie.

### Proposition de valeur
- Dossier livré en 5 jours (vs 3-6 semaines chez un archi)
- Prix entre 390€ et 1190€ selon le projet (vs 1500-4000€ chez un archi)
- Garanti jusqu'à acceptation — corrections incluses
- Expérience digitale fluide — formulaire, dashboard, suivi

### Cible
Particuliers français qui construisent ou rénovent (surface < 150 m²), qui n'ont pas besoin d'architecte obligatoire.

### Marché
- 132 819 maisons individuelles autorisées en 2025
- ~180 000 à 200 000 dossiers/an (PC + DP)
- Concurrence fragmentée : Permeasy (330-810€), dessinateurs indépendants, aucun leader tech
- Zéro acteur IA sérieux sur ce marché en France

## Stack technique
- **Frontend** : React + Vite
- **Hébergement** : Vercel (auto-deploy depuis GitHub)
- **Repo** : github.com/BatoEnLambo/monpermis
- **Structure** : tous les fichiers sont à la racine (pas de dossier src/)
  - `App.jsx` — composant principal (landing + formulaire + paiement + dashboard + uploads)
  - `main.jsx` — point d'entrée React
  - `index.css` — CSS reset
  - `index.html` — HTML racine
  - `vite.config.js` — config Vite
  - `package.json` — dépendances

## Workflow de déploiement
1. Modifier les fichiers localement
2. `git add . && git commit -m "description" && git push`
3. Vercel redéploie automatiquement en ~30 secondes
4. Live sur monpermis.vercel.app

## Vision produit
Phase 1 (maintenant) : service manuel — Baptiste fait les plans SketchUp, l'IA aide sur la notice, l'assemblage, le suivi.
Phase 2 (mois 2-3) : SaaS avec automatisation — agent IA par client, génération auto de la notice, vérification PLU, assemblage dossier.
Phase 3 (mois 6+) : full plateforme — bibliothèque de templates, sous-traitance plans, scaling.

## Priorité absolue
Faire rentrer de l'argent dès maintenant. Baptiste n'a pas de revenu — objectif 2000€/mois minimum. Chaque décision doit être évaluée par : "est-ce que ça rapproche du premier client payant ?"

## Style de code
- Tout est dans App.jsx pour l'instant (monolithique, c'est OK pour le MVP)
- Design : vert foncé (#1a5c3a) comme accent, clean, pro, pas de fioritures
- Police : DM Sans
- Approche : aller à l'essentiel, pas de over-engineering

## Ce qu'il ne faut PAS faire
- Ne pas complexifier la stack (pas de backend, pas de base de données pour l'instant)
- Ne pas ajouter de features non essentielles
- Ne pas passer du temps sur des détails cosmétiques quand il y a des trucs plus importants
