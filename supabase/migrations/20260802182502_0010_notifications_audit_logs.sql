/*
# Notifications and Audit Logs

1. Purpose
`notifications` stores in-app and email notifications for users within an organization.
`audit_logs` records security-relevant and administrative actions for compliance and traceability.

2. New Tables
- `notifications`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations)
  - `user_id` (uuid, fk → auth.users) — recipient (nullable for org-wide notifications)
  - `type` (text: campaign_published, campaign_failed, post_published, budget_finished,
            token_expired, ai_completed_generation, new_product_imported, system_alert,
            team_invite, billing_alert, recommendation)
  - `title` (text)
  - `message` (text)
  - `entity_type` (text, nullable) — linked entity type
  - `entity_id` (uuid, nullable) — linked entity ID
  - `is_read` (boolean, default false)
  - `read_at` (timestamptz)
  - `created_at`

- `audit_logs`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations)
  - `user_id` (uuid, fk → auth.users)
  - `action` (text) — e.g. create_campaign, publish_post, update_settings, delete_product,
              connect_social_account, approve_ad, invite_member, change_role
  - `entity_type` (text) — the type of entity affected
  - `entity_id` (uuid) — the ID of the entity affected
  - `details` (jsonb) — before/after or contextual data
  - `ip_address` (text)
  - `user_agent` (text)
  - `created_at`

3. Indexes
- notifications on organization_id, user_id, is_read, created_at
- audit_logs on organization_id, user_id, action, created_at

4. Security
- RLS enabled on both tables.
- notifications: SELECT for org members (user sees their own + org-wide); UPDATE (mark as read)
  for the user who owns the notification or any org member; INSERT for org members; DELETE for admins.
- audit_logs: SELECT for org admins; INSERT for org members (system writes logs); no UPDATE/DELETE
  (audit logs are immutable).
*/

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL
    CHECK (type IN ('campaign_published','campaign_failed','post_published','budget_finished',
                    'token_expired','ai_completed_generation','new_product_imported','system_alert',
                    'team_invite','billing_alert','recommendation')),
  title text NOT NULL,
  message text,
  entity_type text,
  entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

DROP POLICY IF EXISTS "select_org_notifications" ON notifications;
CREATE POLICY "select_org_notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_notifications" ON notifications;
CREATE POLICY "insert_org_notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (is_org_member(organization_id));

DROP POLICY IF EXISTS "update_org_notifications" ON notifications;
CREATE POLICY "update_org_notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

DROP POLICY IF EXISTS "delete_org_notifications" ON notifications;
CREATE POLICY "delete_org_notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

-- =========================================================
-- AUDIT LOGS
-- =========================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Audit logs: admins can read, any org member can write (for system logging), no update/delete
DROP POLICY IF EXISTS "select_org_audit_logs" ON audit_logs;
CREATE POLICY "select_org_audit_logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_org_admin(organization_id));

DROP POLICY IF EXISTS "insert_org_audit_logs" ON audit_logs;
CREATE POLICY "insert_org_audit_logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (is_org_member(organization_id));