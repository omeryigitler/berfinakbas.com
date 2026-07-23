-- The project currently has a single therapist and site owner.
-- Keep the persisted practitioner identity aligned with the public site identity.
UPDATE "practitioners"
SET
  "display_name" = 'Berfin Akbaş',
  "updated_at" = CURRENT_TIMESTAMP
WHERE
  "status" = 'ACTIVE'
  AND "display_name" <> 'Berfin Akbaş';
