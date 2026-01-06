-- Enable RLS on contact_channels
ALTER TABLE contact_channels ENABLE ROW LEVEL SECURITY;

-- Policy: Allow full access to authenticated users (Dashboard users)
-- Adjust 'authenticated' to whatever role your Supabase/Auth system uses for admin staff
CREATE POLICY "Enable all access for authenticated users" ON "contact_channels"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow service role (API) full access
CREATE POLICY "Enable all access for service role" ON "contact_channels"
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
