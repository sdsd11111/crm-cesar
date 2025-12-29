ALTER TABLE discovery_leads ADD COLUMN IF NOT EXISTS investigacion TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS investigacion TEXT;
