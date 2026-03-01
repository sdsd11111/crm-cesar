-- =============================================================================
-- MIGRATION 022: Enable RLS on Donna Tables (Security Fix)
-- Resolves Supabase lint errors: rls_disabled_in_public
-- =============================================================================

-- Enable RLS on both tables
ALTER TABLE donna_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE donna_session_telemetry ENABLE ROW LEVEL SECURITY;

-- Policy: Only the service role (backend/server) can read/write
-- The app never exposes these tables directly to end users
CREATE POLICY "service_role_full_access_donna_instructions"
  ON donna_instructions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_full_access_donna_session_telemetry"
  ON donna_session_telemetry
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
