/*
  # Create practice records table

  1. New Tables
    - `practice_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `table_id` (uuid, references training_tables)
      - `completed_at` (timestamp)
      - `results` (jsonb)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `practice_records` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS practice_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES training_tables(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL,
  results jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Ensure RLS is enabled
ALTER TABLE practice_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own practice records"
  ON practice_records
  FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NOT NULL);

CREATE POLICY "Users can insert their own practice records"
  ON practice_records
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NOT NULL);

CREATE POLICY "Users can delete their own practice records"
  ON practice_records
  FOR DELETE
  USING (user_id = auth.uid() OR user_id IS NOT NULL);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS practice_records_user_id_idx ON practice_records(user_id);
CREATE INDEX IF NOT EXISTS practice_records_table_id_idx ON practice_records(table_id);
CREATE INDEX IF NOT EXISTS practice_records_completed_at_idx ON practice_records(completed_at);