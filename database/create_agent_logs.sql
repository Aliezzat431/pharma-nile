-- ============================================================
-- SQL to Create Missing agent_action_logs Table
-- Paste this script into your Supabase Dashboard SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    action_type VARCHAR(10) NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
    table_name VARCHAR(150) NOT NULL,
    record_id VARCHAR(255),
    previous_payload JSONB,
    new_payload JSONB,
    undone BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE agent_action_logs ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy: A user can only view logs belonging to their pharmacy.
DROP POLICY IF EXISTS "agent_logs_select" ON agent_action_logs;
CREATE POLICY "agent_logs_select" ON agent_action_logs
    FOR SELECT TO authenticated
    USING (pharmacy_id = get_my_pharmacy_id());

-- 2. INSERT Policy: A user can only write logs with their primary pharmacy_id.
DROP POLICY IF EXISTS "agent_logs_insert" ON agent_action_logs;
CREATE POLICY "agent_logs_insert" ON agent_action_logs
    FOR INSERT TO authenticated
    WITH CHECK (pharmacy_id = get_my_pharmacy_id());

-- 3. UPDATE Policy: A user can only toggle the 'undone' state for logs they own.
DROP POLICY IF EXISTS "agent_logs_update" ON agent_action_logs;
CREATE POLICY "agent_logs_update" ON agent_action_logs
    FOR UPDATE TO authenticated
    USING (pharmacy_id = get_my_pharmacy_id());
