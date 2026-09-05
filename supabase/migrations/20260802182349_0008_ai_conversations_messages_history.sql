/*
# AI Conversations, Messages, Prompt History, and Recommendations

1. Purpose
The AI assistant subsystem. Conversations are chat sessions between a user and the AI marketing
assistant. Messages are individual turns. Prompt history logs every AI generation for auditability
and continuous learning. Recommendations are AI-suggested actions the user can approve or dismiss.

2. New Tables
- `ai_conversations`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations)
  - `title` (text) — auto-generated from first message
  - `status` (text: active, archived)
  - `created_by` (uuid, fk → auth.users)
  - `created_at`, `updated_at`

- `ai_messages`
  - `id` (uuid, pk)
  - `conversation_id` (uuid, fk → ai_conversations, cascade)
  - `organization_id` (uuid, fk → organizations) — denormalized for direct RLS
  - `role` (text: user, assistant, system)
  - `content` (text)
  - `actions` (jsonb) — structured actions the AI proposes (create campaign, generate content, etc.)
  - `action_status` (text: pending, approved, rejected, executed)
  - `model` (text)
  - `tokens_used` (integer)
  - `created_at`

- `ai_prompt_history`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations)
  - `user_id` (uuid, fk → auth.users)
  - `task` (text) — content_generation, image_generation, video_generation, product_analysis,
                  campaign_wizard, assistant_chat, seo_generation
  - `prompt` (text) — full input prompt
  - `output` (text) — AI output (truncated if very long)
  - `model` (text)
  - `tokens_input` (integer)
  - `tokens_output` (integer)
  - `metadata` (jsonb)
  - `created_at`

- `ai_recommendations`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations)
  - `type` (text: optimize_campaign, increase_budget, pause_ad, refresh_content, connect_account,
                  schedule_post, target_audience, creative_variation, budget_warning, token_expired)
  - `title` (text)
  - `description` (text)
  - `priority` (text: low, medium, high, critical)
  - `status` (text: pending, approved, dismissed, executed)
  - `entity_type` (text, nullable) — campaign, ad, post, social_account
  - `entity_id` (uuid, nullable)
  - `action_data` (jsonb) — proposed action payload
  - `dismissed_by` (uuid, fk → auth.users)
  - `approved_by` (uuid, fk → auth.users)
  - `acted_at` (timestamptz)
  - `created_at`

3. Indexes
- ai_conversations on organization_id, created_by
- ai_messages on conversation_id, organization_id
- ai_prompt_history on organization_id, task, created_at
- ai_recommendations on organization_id, status, priority

4. Security
- RLS enabled on all tables. SELECT for org members; writes scoped by role.
*/

-- =========================================================
-- AI CONVERSATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Conversation',
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','archived')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_conversations_org_id ON ai_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_by ON ai_conversations(created_by);

DROP POLICY IF EXISTS "select_org_ai_conversations" ON ai_conversations;
CREATE POLICY "select_org_ai_conversations"
  ON ai_conversations FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_ai_conversations" ON ai_conversations;
CREATE POLICY "insert_org_ai_conversations"
  ON ai_conversations FOR INSERT
  TO authenticated
  WITH CHECK (is_org_member(organization_id));

DROP POLICY IF EXISTS "update_org_ai_conversations" ON ai_conversations;
CREATE POLICY "update_org_ai_conversations"
  ON ai_conversations FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

DROP POLICY IF EXISTS "delete_org_ai_conversations" ON ai_conversations;
CREATE POLICY "delete_org_ai_conversations"
  ON ai_conversations FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_ai_conversations_updated_at ON ai_conversations;
CREATE TRIGGER trg_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- AI MESSAGES
-- =========================================================
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  action_status text NOT NULL DEFAULT 'pending'
    CHECK (action_status IN ('pending','approved','rejected','executed')),
  model text,
  tokens_used integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_org_id ON ai_messages(organization_id);

DROP POLICY IF EXISTS "select_org_ai_messages" ON ai_messages;
CREATE POLICY "select_org_ai_messages"
  ON ai_messages FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_ai_messages" ON ai_messages;
CREATE POLICY "insert_org_ai_messages"
  ON ai_messages FOR INSERT
  TO authenticated
  WITH CHECK (is_org_member(organization_id));

DROP POLICY IF EXISTS "update_org_ai_messages" ON ai_messages;
CREATE POLICY "update_org_ai_messages"
  ON ai_messages FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

DROP POLICY IF EXISTS "delete_org_ai_messages" ON ai_messages;
CREATE POLICY "delete_org_ai_messages"
  ON ai_messages FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

-- =========================================================
-- AI PROMPT HISTORY
-- =========================================================
CREATE TABLE IF NOT EXISTS ai_prompt_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  task text NOT NULL
    CHECK (task IN ('content_generation','image_generation','video_generation','product_analysis',
                    'campaign_wizard','assistant_chat','seo_generation')),
  prompt text NOT NULL,
  output text,
  model text,
  tokens_input integer,
  tokens_output integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_prompt_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_prompt_history_org_id ON ai_prompt_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_history_task ON ai_prompt_history(task);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_history_created_at ON ai_prompt_history(created_at DESC);

DROP POLICY IF EXISTS "select_org_ai_prompt_history" ON ai_prompt_history;
CREATE POLICY "select_org_ai_prompt_history"
  ON ai_prompt_history FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_ai_prompt_history" ON ai_prompt_history;
CREATE POLICY "insert_org_ai_prompt_history"
  ON ai_prompt_history FOR INSERT
  TO authenticated
  WITH CHECK (is_org_member(organization_id));

DROP POLICY IF EXISTS "update_org_ai_prompt_history" ON ai_prompt_history;
CREATE POLICY "update_org_ai_prompt_history"
  ON ai_prompt_history FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

DROP POLICY IF EXISTS "delete_org_ai_prompt_history" ON ai_prompt_history;
CREATE POLICY "delete_org_ai_prompt_history"
  ON ai_prompt_history FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

-- =========================================================
-- AI RECOMMENDATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type text NOT NULL
    CHECK (type IN ('optimize_campaign','increase_budget','pause_ad','refresh_content','connect_account',
                    'schedule_post','target_audience','creative_variation','budget_warning','token_expired')),
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','dismissed','executed')),
  entity_type text,
  entity_id uuid,
  action_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  dismissed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_rec_org_id ON ai_recommendations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_rec_status ON ai_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_ai_rec_priority ON ai_recommendations(priority);

DROP POLICY IF EXISTS "select_org_ai_recommendations" ON ai_recommendations;
CREATE POLICY "select_org_ai_recommendations"
  ON ai_recommendations FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_ai_recommendations" ON ai_recommendations;
CREATE POLICY "insert_org_ai_recommendations"
  ON ai_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (is_org_member(organization_id));

DROP POLICY IF EXISTS "update_org_ai_recommendations" ON ai_recommendations;
CREATE POLICY "update_org_ai_recommendations"
  ON ai_recommendations FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

DROP POLICY IF EXISTS "delete_org_ai_recommendations" ON ai_recommendations;
CREATE POLICY "delete_org_ai_recommendations"
  ON ai_recommendations FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));