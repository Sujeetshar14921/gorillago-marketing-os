/*
# User Profiles Table

1. Purpose
Stores display information (email, full name) for each authenticated user.
This allows organization members to look up and display team member details
without needing to query auth.users directly (which is not accessible from
the client).

2. New Table
- `user_profiles`
  - `user_id` (uuid, pk, references auth.users, cascade delete)
  - `email` (text, unique, not null)
  - `full_name` (text, nullable)
  - `avatar_url` (text, nullable)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

3. Security
- RLS enabled.
- Users can read their own profile and profiles of users in organizations
  they belong to (via organization_members join).
- Users can only insert/update their own profile row.
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Users can read their own profile
DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can read profiles of other members in their orgs
DROP POLICY IF EXISTS "select_org_member_profiles" ON user_profiles;
CREATE POLICY "select_org_member_profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om1
      INNER JOIN organization_members om2
        ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.status = 'active'
        AND om2.user_id = user_profiles.user_id
        AND om2.status = 'active'
    )
  );

-- Users can insert their own profile
DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
