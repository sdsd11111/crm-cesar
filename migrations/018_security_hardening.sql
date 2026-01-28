-- Migration: 018_security_hardening.sql
-- Description: Fix RLS policies to avoid "Always True" warnings by requiring implicit authentication check.

-- 1. AGENTS
DROP POLICY IF EXISTS "Full access for authenticated users" ON agents;
CREATE POLICY "Full access for authenticated users" ON agents
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 2. CALL ANALYSES
DROP POLICY IF EXISTS "Allow all for authenticated users" ON call_analyses;
DROP POLICY IF EXISTS "Enable all for all" ON call_analyses;
CREATE POLICY "Allow all for authenticated users" ON call_analyses
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 3. CAMPAIGNS
DROP POLICY IF EXISTS "Allow all for authenticated users" ON campaigns;
CREATE POLICY "Allow all for authenticated users" ON campaigns
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 4. CLIENT ALERTS
DROP POLICY IF EXISTS "Allow authenticated users to delete alerts" ON client_alerts;
DROP POLICY IF EXISTS "Allow authenticated users to insert alerts" ON client_alerts;
DROP POLICY IF EXISTS "Allow authenticated users to update alerts" ON client_alerts;
CREATE POLICY "Manage alerts for authenticated users" ON client_alerts
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 5. CONTACT CHANNELS
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON contact_channels;
CREATE POLICY "Enable all access for authenticated users" ON contact_channels
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 6. CONTACTS
DROP POLICY IF EXISTS "Allow all for authenticated users" ON contacts;
CREATE POLICY "Allow all for authenticated users" ON contacts
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 7. CONTRACT TEMPLATES
DROP POLICY IF EXISTS "Allow all for authenticated users" ON contract_templates;
CREATE POLICY "Allow all for authenticated users" ON contract_templates
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 8. CONTRACTS
DROP POLICY IF EXISTS "Allow all for authenticated users" ON contracts;
CREATE POLICY "Allow all for authenticated users" ON contracts
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 9. CONVERSATION STATES
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON conversation_states;
CREATE POLICY "Enable all access for authenticated users" ON conversation_states
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 10. DISCOVERY LEADS
DROP POLICY IF EXISTS "Allow all for authenticated users" ON discovery_leads;
DROP POLICY IF EXISTS "Enable all access for now" ON discovery_leads;
CREATE POLICY "Allow all for authenticated users" ON discovery_leads
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 11. DONNA CHAT MESSAGES
DROP POLICY IF EXISTS "allow_all" ON donna_chat_messages;
CREATE POLICY "allow_authenticated" ON donna_chat_messages
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 12. EVENTS
DROP POLICY IF EXISTS "Allow all for authenticated users" ON events;
CREATE POLICY "Allow all for authenticated users" ON events
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 13. FINANCIAL GOALS
DROP POLICY IF EXISTS "Allow all for authenticated users" ON financial_goals;
CREATE POLICY "Allow all for authenticated users" ON financial_goals
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 14. INTERACTIONS
DROP POLICY IF EXISTS "Allow all for authenticated users" ON interactions;
CREATE POLICY "Allow all for authenticated users" ON interactions
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 15. LOYALTY MISSIONS
DROP POLICY IF EXISTS "Full access for authenticated users" ON loyalty_missions;
CREATE POLICY "Full access for authenticated users" ON loyalty_missions
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 16. PERSONAL LIABILITIES
DROP POLICY IF EXISTS "Allow all for authenticated users" ON personal_liabilities;
DROP POLICY IF EXISTS "Allow all for everyone" ON personal_liabilities;
CREATE POLICY "Allow all for authenticated users" ON personal_liabilities
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 17. PROSPECTS
DROP POLICY IF EXISTS "Allow all for authenticated users" ON prospects;
CREATE POLICY "Allow all for authenticated users" ON prospects
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 18. QUOTATIONS
DROP POLICY IF EXISTS "Allow all for authenticated users" ON quotations;
CREATE POLICY "Allow all for authenticated users" ON quotations
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 19. REMINDERS
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON reminders;
DROP POLICY IF EXISTS "Full access for authenticated users" ON reminders;
CREATE POLICY "Enable all access for authenticated users" ON reminders
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 20. TASKS
DROP POLICY IF EXISTS "Allow all for authenticated users" ON tasks;
CREATE POLICY "Allow all for authenticated users" ON tasks
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 21. TRANSACTIONS
DROP POLICY IF EXISTS "Allow all for authenticated users" ON transactions;
CREATE POLICY "Allow all for authenticated users" ON transactions
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 22. WHATSAPP LOGS
DROP POLICY IF EXISTS "Full access for authenticated users" ON whatsapp_logs;
DROP POLICY IF EXISTS "Permitir gestión de logs a usuarios autenticados" ON whatsapp_logs;
CREATE POLICY "Full access for authenticated users" ON whatsapp_logs
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
