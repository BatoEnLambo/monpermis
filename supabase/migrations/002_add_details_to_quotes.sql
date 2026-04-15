-- Add a free-form "details" column to quotes so admin can describe what's
-- included in a custom quote. Displayed on the public /devis/[id] page in
-- place of the hardcoded INCLUDES list when non-null.
--
-- Applied remotely via Supabase MCP on 2026-04-15 (migration
-- `add_details_to_quotes`). This file rapatriates the DDL for parity.

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS details text;
