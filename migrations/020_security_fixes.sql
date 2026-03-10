-- Migration: 020_security_fixes
-- Description: Fix security warnings regarding mutable search_path and permissive RLS policies.

-- 1. Fix function_search_path_mutable
-- This fixes the security warning by explicitly setting the search_path to 'public'.
ALTER FUNCTION update_updated_at_column() SET search_path = public;

-- 2. Fix rls_policy_always_true
-- Hardening the RLS policy for leads_capturar_clientes. 
-- Instead of WITH CHECK (true), we add a basic validation check.
DROP POLICY IF EXISTS "Enable insert for all" ON leads_capturar_clientes;

CREATE POLICY "Enable insert for all" ON leads_capturar_clientes
    FOR INSERT WITH CHECK (
        full_name IS NOT NULL AND 
        LENGTH(full_name) > 0 AND
        phone IS NOT NULL AND
        LENGTH(phone) > 0
    );
