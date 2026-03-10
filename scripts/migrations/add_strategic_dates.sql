-- Migration: Add Strategic Dates to Contacts Table
-- Description: Adds birthday and anniversary_date columns to support Donna's micro-agent planning.

ALTER TABLE IF EXISTS contacts 
ADD COLUMN IF NOT EXISTS birthday TIMESTAMP WITH TIME ZONE;

ALTER TABLE IF EXISTS contacts 
ADD COLUMN IF NOT EXISTS anniversary_date TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN contacts.birthday IS 'Personal birthday of the primary contact person.';
COMMENT ON COLUMN contacts.anniversary_date IS 'Business anniversary or foundation date for specialized missions.';
