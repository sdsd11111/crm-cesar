-- Critical Performance Indexes for Donna Stats and UX Improvements
-- Run this migration to prevent performance degradation with large datasets

-- ============================================================================
-- WHATSAPP LOGS INDEXES (Critical for Donna Dashboard Stats)
-- ============================================================================

-- Index for status + sentAt queries (used in macro stats endpoint)
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status_sent_at 
ON whatsapp_logs(status, sent_at DESC);

-- Index for phone number lookups (used in message history)
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone 
ON whatsapp_logs(phone);

-- Index for contact_id lookups (used in client history)
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_contact_id 
ON whatsapp_logs(contact_id);

-- ============================================================================
-- LOYALTY MISSIONS INDEXES (Critical for Donna Mission Management)
-- ============================================================================

-- Index for status queries (used in mission filtering)
CREATE INDEX IF NOT EXISTS idx_loyalty_missions_status 
ON loyalty_missions(status);

-- Index for status + created_at (used in mission sorting)
CREATE INDEX IF NOT EXISTS idx_loyalty_missions_status_created 
ON loyalty_missions(status, created_at DESC);

-- Index for contact_id lookups (used in client mission history)
CREATE INDEX IF NOT EXISTS idx_loyalty_missions_contact_id 
ON loyalty_missions(contact_id);

-- GIN index for metadata JSONB queries (used in campaign breakdown)
CREATE INDEX IF NOT EXISTS idx_loyalty_missions_metadata_type 
ON loyalty_missions USING GIN ((metadata->'type'));

-- ============================================================================
-- TASKS INDEXES (Critical for Tasks Page Performance)
-- ============================================================================

-- Index for status queries (used in task filtering)
CREATE INDEX IF NOT EXISTS idx_tasks_status 
ON tasks(status);

-- Index for assigned_to + status (used in user task filtering)
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status 
ON tasks(assigned_to, status);

-- Index for due_date (used in task sorting and overdue detection)
CREATE INDEX IF NOT EXISTS idx_tasks_due_date 
ON tasks(due_date DESC NULLS LAST);

-- ============================================================================
-- DISCOVERY LEADS INDEXES (Critical for Discovery Filters)
-- ============================================================================

-- Index for columna2 (used in queue filtering)
CREATE INDEX IF NOT EXISTS idx_discovery_leads_columna2 
ON discovery_leads(columna2);

-- Index for status (used in investigated filtering)
CREATE INDEX IF NOT EXISTS idx_discovery_leads_status 
ON discovery_leads(status);

-- Index for columna2 + status (used in combined filters)
CREATE INDEX IF NOT EXISTS idx_discovery_leads_columna2_status 
ON discovery_leads(columna2, status);

-- Composite index for province + city (used in geographic filtering)
CREATE INDEX IF NOT EXISTS idx_discovery_leads_location 
ON discovery_leads(province, city);

-- Index for business_name search (used in text search)
CREATE INDEX IF NOT EXISTS idx_discovery_leads_business_name 
ON discovery_leads(business_name);

-- ============================================================================
-- INTERACTIONS INDEXES (Critical for Trainer and Client History)
-- ============================================================================

-- Index for discovery_lead_id (used in Trainer interaction history)
CREATE INDEX IF NOT EXISTS idx_interactions_discovery_lead_id 
ON interactions(discovery_lead_id);

-- Index for contact_id (used in client interaction history)
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id 
ON interactions(contact_id);

-- Index for performed_at (used in chronological sorting)
CREATE INDEX IF NOT EXISTS idx_interactions_performed_at 
ON interactions(performed_at DESC);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify indexes were created successfully:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- Check index usage after running for a while:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY idx_scan DESC;
