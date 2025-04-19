/*
  # Update Row Level Security

  This migration updates the RLS policies to make it more permissive during development
  so users don't need to authenticate with Supabase Auth to access their data.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can CRUD own tables" ON training_tables;
DROP POLICY IF EXISTS "Users can CRUD own cycles via tables" ON breath_cycles;

-- Create more permissive policies for development
CREATE POLICY "Public read access to users"
  ON users
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public write access to users"
  ON users
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public read access to training tables"
  ON training_tables
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public insert access to training tables"
  ON training_tables
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public update access to training tables"
  ON training_tables
  FOR UPDATE
  TO PUBLIC
  USING (true);

CREATE POLICY "Public delete access to training tables"
  ON training_tables
  FOR DELETE
  TO PUBLIC
  USING (true);

CREATE POLICY "Public read access to breath cycles"
  ON breath_cycles
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public insert access to breath cycles"
  ON breath_cycles
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public update access to breath cycles"
  ON breath_cycles
  FOR UPDATE
  TO PUBLIC
  USING (true);

CREATE POLICY "Public delete access to breath cycles"
  ON breath_cycles
  FOR DELETE
  TO PUBLIC
  USING (true);