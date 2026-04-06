export const planGarage = {
  slug: "plan-garage",
  title: "Plan de garage : ce qu'il faut pour la mairie (DP ou permis, guide 2026)",
  description: "Garage 2026 : DP ou permis ? Plans à fournir, piège de l'emprise au sol, carport, construction en limite. Guide complet + dossier dès 350€.",
  publishedAt: "2026-03-30",
  updatedAt: "2026-03-30",
  category: "Garage",
  readingTime: "11 min",
  image: null,
  relatedArticles: ["declaration-prealable-travaux", "plan-de-masse", "emprise-au-sol-surface-de-plancher"],
  content: `
<p>Construire un garage est l'un des projets les plus courants — et l'un des plus piégeux administrativement. Le garage ne crée <strong>pas</strong> de surface de plancher (ce n'est pas un espace habitable), mais il crée de l'<strong>emprise au sol</strong> — et c'est l'emprise qui détermine si vous avez besoin d'une déclaration préalable ou d'un permis de construire. Ajoutez les débords de toiture qui gonflent l'emprise sans qu'on s'en rende compte, et vous avez la recette d'un dossier qui part en mauvaise direction.</p>

<p>Ce guide détaille les autorisations nécessaires, les plans à fournir pièce par pièce, les pièges à éviter, et comment obtenir votre dossier complet.</p>

<h2>DP, PC ou rien ? Le tableau pour les garages</h2>

<p>La réponse dépend de la surface d'emprise au sol de votre garage et de la zone dans laquelle se trouve votre terrain.</p>

<div style="overflow-x:auto;margin:24px 0">
<table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6">
<thead>
<tr style="background:#f5f4f2">
<th style="padding:12px 14px;text-align:left;border-bottom:2px solid #e8e7e4;font-weight:600;color:#1c1c1a">Type</th>
<th style="padding:12px 14px;text-align:left;border-bottom:2px solid #e8e7e4;font-weight:600;color:#1c1c1a">Emprise au sol</th>
<th style="padding:12px 14px;text-align:left;border-bottom:2px solid #e8e7e4;font-weight:600;color:#1c1c1a">Zone PLU</th>
<th style="padding:12px 14px;text-align:left;border-bottom:2px solid #e8e7e4;font-weight:600;color:#1c1c1a">Zone hors PLU</th>
<th style="padding:12px 14px;text-align:left;border-bottom:2px solid #e8e7e4;font-weight:600;color:#1c1c1a">Remarque</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Garage fermé ou carport</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">≤ 5 m²</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">Rien</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">Rien</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Quasi impossible pour un vrai garage</td>
</tr>
<tr style="background:#fafaf9">
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Garage fermé ou carport</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">5 à 20 m²</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">DP</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">DP</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Cas le plus fréquent pour un garage simple</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Garage fermé ou carport</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">20 à 40 m²</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">DP</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">PC</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Le seuil 40 m² ne s'applique qu'en zone PLU</td>
</tr>
<tr style="background:#fafaf9">
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Garage fermé ou carport</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">> 40 m²</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">PC</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">PC</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Garage double ou grand carport</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Tout garage</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Toute surface</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">—</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">—</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Si maison + garage > 150 m² de SDP → architecte obligatoire (mais le garage seul ne crée pas de SDP)</td>
</tr>
</tbody>
</table>
</div>

<p>Le CERFA à utiliser est le <strong>13703*15</strong> si le garage est sur le terrain d'une maison individuelle — que le garage soit accolé ou indépendant. Utilisez la nomenclature DPC (DPC1 à DPC8) pour les pièces jointes.</p>

<p><strong>Point important :</strong> le garage ne crée pas de surface de plancher parce qu'il est affecté au stationnement. Mais il crée de l'emprise au sol. C'est l'emprise au sol qui déclenche le seuil DP/PC. Et c'est là que le piège se cache.</p>

<h2>Le piège de l'emprise au sol — les débords de toiture</h2>

<p>L'emprise au sol ne se mesure pas aux murs extérieurs. Elle se mesure à l'aplomb extérieur de la construction, <strong>débords de toiture inclus</strong>.</p>

<p>Prenons un exemple concret :</p>

<ul>
<li>Garage de <strong>5 × 4 m</strong> (murs extérieurs) = <strong>20 m²</strong> → une DP suffit</li>
<li>Avec des <strong>débords de toiture de 40 cm</strong> tout autour : (5 + 0,8) × (4 + 0,8) = 5,8 × 4,8 = <strong>27,84 m² d'emprise au sol</strong></li>
<li>Sur un terrain <strong>hors PLU</strong> : 27,84 m² > 20 m² → <strong>permis de construire</strong> au lieu d'une simple DP</li>
</ul>

<p>40 cm de débord, et vous basculez de DP à PC. Vérifiez <strong>avant</strong> de déposer votre dossier.</p>

<p>C'est le piège le plus courant sur les dossiers de garage. Les débords de toiture sont une protection utile pour les murs, mais ils augmentent l'emprise au sol sans qu'on y pense. Mesurez toujours depuis l'aplomb extérieur du toit, pas depuis les murs.</p>

<p>Pour comprendre la différence entre emprise au sol et surface de plancher en détail, consultez notre <a href="/guides/emprise-au-sol-surface-de-plancher">guide emprise au sol et surface de plancher</a>.</p>

<h2>Garage, carport, abri voiture — les différences</h2>

<p>Tous ces ouvrages protègent une voiture, mais ils ne sont pas traités de la même façon par l'urbanisme.</p>

<div style="overflow-x:auto;margin:24px 0">
<table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6">
<thead>
<tr style="background:#f5f4f2">
<th style="padding:12px 14px;text-align:left;border-bottom:2px solid #e8e7e4;font-weight:600;color:#1c1c1a">Type</th>
<th style="padding:12px 14px;text-align:left;border-bottom:2px solid #e8e7e4;font-weight:600;color:#1c1c1a">Murs ?</th>
<th style="padding:12px 14px;text-align:left;border-bottom:2px solid #e8e7e4;font-weight:600;color:#1c1c1a">Emprise au sol ?</th>
<th style="padding:12px 14px;text-align:left;border-bottom:2px solid #e8e7e4;font-weight:600;color:#1c1c1a">Surface de plancher ?</th>
<th style="padding:12px 14px;text-align:left;border-bottom:2px solid #e8e7e4;font-weight:600;color:#1c1c1a">Autorisation</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">Garage fermé</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Oui (4 murs + porte)</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Oui</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Non (stationnement)</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Selon emprise</td>
</tr>
<tr style="background:#fafaf9">
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">Carport (poteaux + toit, ouvert)</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Non (poteaux seulement)</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Oui (les poteaux créent de l'emprise)</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Non (pas clos)</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Selon emprise</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">Auvent accolé à la maison (sans poteaux au sol)</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Non</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Non (pas d'appui au sol)</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Non</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Souvent rien</td>
</tr>
<tr style="background:#fafaf9">
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">Abri voiture démontable</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Non</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Dépend de la durée d'installation</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Non</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Même logique que les structures temporaires</td>
</tr>
</tbody>
</table>
</div>

<p>Le carport est le cas qui surprend le plus : il crée de l'emprise au sol <strong>même s'il n'a pas de murs</strong>. Un carport de 6 × 3 m = 18 m² d'emprise. Avec des débords de toiture, ça peut dépasser 20 m² très vite.</p>

<p>Autre subtilité : certains PLU interdisent les carports en façade sur rue pour des raisons esthétiques. Vérifiez le règlement de votre zone avant de vous lancer.</p>

<h2>Les plans à fournir pour un garage</h2>

<p>Voici les pièces du dossier et ce qui est spécifique à un projet de garage pour chacune d'entre elles.</p>

<div style="overflow-x:auto;margin:24px 0">
<table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6">
<thead>
<tr style="background:#f5f4f2">
<th style="padding:12px 14px;text-align:left;border-bottom:2px solid #e8e7e4;font-weight:600;color:#1c1c1a">Pièce</th>
<th style="padding:12px 14px;text-align:left;border-bottom:2px solid #e8e7e4;font-weight:600;color:#1c1c1a">Ce qu'il faut montrer pour un garage</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">DPC1 — Plan de situation</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Standard — localisation du terrain dans la commune. Rien de spécifique au garage.</td>
</tr>
<tr style="background:#fafaf9">
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">DPC2 — Plan de masse</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Le garage (accolé ou indépendant) avec ses distances aux limites séparatives et à la voie publique. Si accolé, montrer le raccord avec la maison. Indiquer l'emprise au sol complète (y compris débords de toiture).</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">DPC3 — Plan de coupe</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">La hauteur du garage, la pente du toit, le niveau du sol fini. Si garage accolé : le raccord de toiture avec la maison existante (faîtage, gouttière).</td>
</tr>
<tr style="background:#fafaf9">
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">DPC4 — Façades</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Toutes les façades du garage. Si accolé : la façade de la maison modifiée (porte de garage, raccord mur/toiture). Matériaux et couleurs.</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">DPC5 — Insertion paysagère</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Photomontage du garage intégré dans le jardin ou la cour. Particulièrement important si le garage est visible depuis la rue.</td>
</tr>
<tr style="background:#fafaf9">
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">DPC7-8 — Photos</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Photos de l'emplacement actuel (DPC7 — environnement proche) et de l'environnement plus large (DPC8 — depuis la rue).</td>
</tr>
</tbody>
</table>
</div>

<p>Le plan de masse (DPC2) est la pièce la plus critique pour un garage. C'est là que l'instructeur vérifie les distances aux limites, l'emprise au sol, et la conformité avec le PLU. Un plan de masse imprécis est la première cause de demande de pièces complémentaires.</p>

<p>Pour aller plus loin sur chaque pièce : <a href="/guides/plan-de-masse">plan de masse</a>, <a href="/guides/plan-de-coupe">plan de coupe</a>, <a href="/guides/plan-de-situation">plan de situation</a>.</p>

<div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:10px;padding:20px 24px;margin:28px 0">
<div style="font-size:15px;font-weight:700;color:#1c1c1a;margin-bottom:6px">Votre dossier de garage complet</div>
<p style="font-size:14px;color:#44433f;line-height:1.6;margin:0 0 14px">Plans + CERFA + toutes les pièces. Conforme aux exigences de votre mairie. Livré en 5 jours ouvrés.</p>
<a href="/formulaire" style="display:inline-block;background:#1a5c3a;color:#ffffff;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">Commencer mon dossier — Dès 350 €</a>
</div>

<h2>Construire un garage en limite de propriété</h2>

<p>Oui, c'est souvent possible — mais c'est le PLU de votre commune qui décide, pas le Code de l'urbanisme seul.</p>

<p>La plupart des PLU autorisent la construction en limite séparative à condition que le mur soit <strong>aveugle</strong> (aucune ouverture — pas de fenêtre, pas de jour, pas d'aération donnant sur le voisin). C'est logique pour un garage, qui n'a généralement pas besoin de fenêtres latérales.</p>

<p>Quelques règles fréquentes dans les PLU :</p>

<ul>
<li><strong>Hauteur en limite</strong> souvent plafonnée à 3 m (ou à l'égout du toit)</li>
<li><strong>Mur aveugle obligatoire</strong> côté limite — aucune ouverture</li>
<li>Si vous n'êtes pas en limite, un <strong>recul minimum</strong> s'applique (souvent H/2, soit la moitié de la hauteur, avec un minimum de 3 m)</li>
<li>Le mur construit en limite peut devenir <strong>mitoyen</strong> — avec des conséquences en droit civil (entretien partagé, impossibilité de démolir sans accord)</li>
</ul>

<p>Le conseil pratique : lisez le règlement de votre zone dans le PLU <strong>et</strong> parlez à votre voisin avant de commencer. Un garage en limite qui respecte le PLU mais surprend le voisin, c'est un recours gracieux assuré.</p>

<h2>Transformer un garage en pièce habitable</h2>

<p>C'est un <strong>changement de destination</strong> : vous passez de "stationnement" à "habitation". Les règles changent.</p>

<ul>
<li>Si la surface créée est inférieure à 20 m² (ou 40 m² en zone PLU) : <strong>déclaration préalable</strong></li>
<li>Au-delà : <strong>permis de construire</strong></li>
<li>La transformation <strong>crée de la surface de plancher</strong> — le garage n'en créait pas, la chambre ou le bureau si</li>
<li><strong>Piège fréquent :</strong> la surface de plancher créée peut faire passer l'ensemble de votre maison au-dessus du seuil de 150 m² → recours à un <strong>architecte obligatoire</strong></li>
<li>Certains PLU imposent de <strong>recréer une place de stationnement</strong> en compensation (sur le terrain ou à proximité)</li>
</ul>

<p>Avant de transformer, vérifiez votre surface de plancher totale actuelle. Le calcul est détaillé dans notre <a href="/guides/emprise-au-sol-surface-de-plancher">guide emprise au sol et surface de plancher</a>. Pour le CERFA à utiliser, consultez notre <a href="/guides/declaration-prealable-travaux">guide déclaration préalable</a>.</p>

<h2>Combien coûte le dossier pour un garage ?</h2>

<p>Un garage est un projet simple. Le dossier aussi — à condition de maîtriser le piège de l'emprise au sol et les exigences du PLU.</p>

<div style="overflow-x:auto;margin:24px 0">
<table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6">
<thead>
<tr style="background:#f5f4f2">
<th style="padding:12px 14px;text-align:left;border-bottom:2px solid #e8e7e4;font-weight:600;color:#1c1c1a">Option</th>
<th style="padding:12px 14px;text-align:left;border-bottom:2px solid #e8e7e4;font-weight:600;color:#1c1c1a">Prix</th>
<th style="padding:12px 14px;text-align:left;border-bottom:2px solid #e8e7e4;font-weight:600;color:#1c1c1a">Délai</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Faire soi-même</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">0 €</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Variable (et risque de demande de pièces complémentaires)</td>
</tr>
<tr style="background:#fafaf9">
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">PermisClair</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">350 €</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#1c1c1a;font-weight:600">5 jours</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Dessinateur indépendant</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">450 – 900 €</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">2 à 4 semaines</td>
</tr>
<tr style="background:#fafaf9">
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">Architecte</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">1 500 €+</td>
<td style="padding:10px 14px;border-bottom:1px solid #e8e7e4;color:#44433f">4 à 8 semaines</td>
</tr>
</tbody>
</table>
</div>

<p>Le dossier de garage est l'un des plus accessibles : peu de pièces, pas de calcul thermique, pas d'attestation RE2020 (le garage n'est pas habitable). Ce qui fait la différence entre un dossier accepté du premier coup et une demande de pièces complémentaires, c'est la précision du plan de masse et le calcul correct de l'emprise au sol.</p>

<div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:10px;padding:20px 24px;margin:28px 0">
<div style="font-size:15px;font-weight:700;color:#1c1c1a;margin-bottom:6px">Dossier garage complet</div>
<p style="font-size:14px;color:#44433f;line-height:1.6;margin:0 0 14px">Plans conformes, CERFA pré-rempli, toutes les pièces pour votre mairie. Livré en 5 jours ouvrés.</p>
<a href="/formulaire" style="display:inline-block;background:#1a5c3a;color:#ffffff;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">Commencer mon dossier — Dès 350 €</a>
</div>
`
}
