-- SQL Schema for InsightLoop — AI Business Intelligence Dashboard
-- Phase 1 Setup & Foundations

-- 1. Triggers Setup
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create Dashboards Table
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  title TEXT,
  layout_config JSONB,
  dataset_summary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apply updated_at Trigger to Dashboards
CREATE TRIGGER set_timestamp_dashboards
BEFORE UPDATE ON dashboards
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Create Indexes for Dashboards
CREATE INDEX IF NOT EXISTS idx_dashboards_session_id ON dashboards(session_id);

-- 3. Create Chat History Table
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes for Chat History
CREATE INDEX IF NOT EXISTS idx_chat_history_dashboard_id ON chat_history(dashboard_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- 5. Define Permissive Policies (No Auth in v1)
CREATE POLICY "Allow all" ON dashboards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON chat_history FOR ALL USING (true) WITH CHECK (true);
