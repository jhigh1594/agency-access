-- Rename subscription tiers to align with marketing terminology
-- Migration: AGENCY → GROWTH, PRO → AGENCY, remove ENTERPRISE

-- Update existing tier values
UPDATE "Subscription"
SET "tier" = 'GROWTH'
WHERE "tier" = 'AGENCY';

UPDATE "Subscription"
SET "tier" = 'AGENCY'
WHERE "tier" = 'PRO';

-- Remove any legacy ENTERPRISE tier records (or convert to AGENCY)
UPDATE "Subscription"
SET "tier" = 'AGENCY'
WHERE "tier" = 'ENTERPRISE';
