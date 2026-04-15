-- Migration: Création de la table project_details
-- Date: 2026-03-31
-- Description: Stocke les informations techniques des projets maison neuve

-- 1. Créer la table project_details
CREATE TABLE project_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,

  -- Bloc Construction
  dimensions_longueur DECIMAL,
  dimensions_largeur DECIMAL,
  fondation TEXT,                        -- 'dalle' | 'vide_sanitaire' | 'pilotis' | 'sous_sol' | 'ne_sait_pas'
  hauteur_faitage DECIMAL,
  hauteur_faitage_nsp BOOLEAN DEFAULT false,
  hauteur_egout DECIMAL,
  hauteur_egout_nsp BOOLEAN DEFAULT false,
  pente_toiture DECIMAL,
  pente_toiture_nsp BOOLEAN DEFAULT false,
  debord_toit DECIMAL,
  debord_toit_nsp BOOLEAN DEFAULT false,
  materiau_facade TEXT,                  -- 'enduit' | 'bardage_bois' | 'pierre' | 'mixte' | 'autre'
  materiau_facade_detail TEXT,
  materiau_couverture TEXT,              -- 'tuile_canal' | 'tuile_plate' | 'ardoise' | 'bac_acier' | 'zinc' | 'autre'
  menuiserie_materiau TEXT,              -- 'pvc' | 'aluminium' | 'bois'
  menuiserie_couleur TEXT,

  -- Bloc Terrain
  constructions_existantes BOOLEAN,
  constructions_existantes_detail TEXT,
  implantation_description TEXT,
  assainissement TEXT,                   -- 'tout_egout' | 'fosse_septique' | 'ne_sait_pas'
  raccordement_eau BOOLEAN DEFAULT false,
  raccordement_electricite BOOLEAN DEFAULT false,
  raccordement_gaz BOOLEAN DEFAULT false,

  -- Métadonnées
  completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Pas de RLS — même pattern que les tables projects, documents et messages.
--    L'accès est contrôlé côté application via le token projet (anon key + filtrage applicatif).

-- 3. Corriger le type du projet PC-MNENOXS5 (Robert Sangely)
UPDATE projects
SET project_type = 'Maison neuve'
WHERE reference = 'PC-MNENOXS5';

-- 4. Insérer les détails techniques pour ce projet
INSERT INTO project_details (
  project_id,
  dimensions_longueur,
  dimensions_largeur,
  fondation,
  materiau_facade,
  materiau_couverture,
  menuiserie_materiau,
  menuiserie_couleur
)
SELECT
  id,
  10,
  8,
  'pilotis',
  'bardage_bois',
  'tuile_canal',
  'aluminium',
  'RAL 3004'
FROM projects
WHERE reference = 'PC-MNENOXS5';
