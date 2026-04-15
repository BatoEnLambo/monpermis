-- Migration 003 : projects.title + restauration du type d'Alexis
--
-- Appliquée en prod via le Supabase MCP le 2026-04-15
-- (apply_migration "add_title_to_projects_and_restore_alexis_type"),
-- rapatriée ici pour la parité du dossier supabase/migrations/.
--
-- Contexte :
--
-- 1. Restaurer le project_type de PC-MO096PIV (Alexis). Son project
--    venait du tunnel self-service avec le vrai type "Extension /
--    Agrandissement". Il avait été passé à 'custom' à la main en
--    workaround d'un bug de gate sur le formulaire fiche technique
--    (les project_type autres que Maison neuve / custom étaient
--    exclus). Le bug a été corrigé en commit 1778d56 (gate sur
--    status, plus sur project_type), donc on peut restaurer le
--    vrai type sans reperdre l'accès au formulaire.
--
-- 2. Ajouter projects.title (text, nullable). Jusqu'ici les projects
--    issus d'un devis custom n'avaient comme "titre" affichable que
--    project_type='custom' — ce qui produisait un header cassé
--    ("custom" + ", · m²"). Le titre du devis source (quote.project_title)
--    n'était stocké nulle part sur le project. On ajoute donc une
--    colonne dédiée, set par le webhook Stripe à la création du project,
--    figée au moment du paiement.
--
-- 3. Backfill pour les projects déjà créés depuis un devis : récupérer
--    quote.project_title via la FK quotes.project_id → projects.id.

-- Step 1 : restauration
UPDATE projects
SET project_type = 'Extension / Agrandissement'
WHERE reference = 'PC-MO096PIV' AND project_type = 'custom';

-- Step 2 : colonne
ALTER TABLE projects ADD COLUMN title text;

-- Step 3 : backfill
UPDATE projects p
SET title = q.project_title
FROM quotes q
WHERE q.project_id = p.id AND p.title IS NULL;
