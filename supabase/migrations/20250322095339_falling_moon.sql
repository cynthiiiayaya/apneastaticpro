/*
  # Initial Database Schema for ApneaPro

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - User's unique ID
      - `email` (text, unique) - User's email address
      - `created_at` (timestamp) - When the user was created
    - `training_tables`
      - `id` (uuid, primary key) - Table's unique ID
      - `user_id` (uuid, foreign key) - References the user who owns this table
      - `name` (text) - Name of the training table
      - `created_at` (timestamp) - When the table was created
    - `breath_cycles`
      - `id` (uuid, primary key) - Cycle's unique ID
      - `table_id` (uuid, foreign key) - References the table this cycle belongs to
      - `breathe_time` (integer) - Breathe duration in seconds
      - `hold_time` (integer) - Hold duration in seconds
      - `cycle_index` (integer) - Position in the sequence of cycles

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create training tables table
CREATE TABLE IF NOT EXISTS training_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create breath cycles table
CREATE TABLE IF NOT EXISTS breath_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES training_tables(id) ON DELETE CASCADE NOT NULL,
  breathe_time integer NOT NULL,
  hold_time integer NOT NULL,
  cycle_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE breath_cycles ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Create policies for training_tables table
CREATE POLICY "Users can CRUD own tables"
  ON training_tables
  FOR ALL
  USING (auth.uid() = user_id);

-- Create policies for breath_cycles table
CREATE POLICY "Users can CRUD own cycles via tables"
  ON breath_cycles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM training_tables
      WHERE training_tables.id = breath_cycles.table_id
      AND training_tables.user_id = auth.uid()
    )
  );

-- Create default tables function
CREATE OR REPLACE FUNCTION create_default_tables_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  co2_table_id uuid;
  o2_table_id uuid;
BEGIN
  -- Create CO2 Training Table
  INSERT INTO training_tables (user_id, name)
  VALUES (NEW.id, 'CO2 Training Table')
  RETURNING id INTO co2_table_id;
  
  -- CO2 Table Cycles
  INSERT INTO breath_cycles (table_id, breathe_time, hold_time, cycle_index)
  VALUES 
    (co2_table_id, 60, 60, 0),
    (co2_table_id, 45, 75, 1),
    (co2_table_id, 45, 90, 2),
    (co2_table_id, 30, 105, 3),
    (co2_table_id, 30, 120, 4),
    (co2_table_id, 30, 135, 5);
  
  -- Create O2 Training Table
  INSERT INTO training_tables (user_id, name)
  VALUES (NEW.id, 'O2 Training Table')
  RETURNING id INTO o2_table_id;
  
  -- O2 Table Cycles
  INSERT INTO breath_cycles (table_id, breathe_time, hold_time, cycle_index)
  VALUES 
    (o2_table_id, 120, 60, 0),
    (o2_table_id, 120, 75, 1),
    (o2_table_id, 120, 90, 2),
    (o2_table_id, 120, 105, 3),
    (o2_table_id, 120, 120, 4),
    (o2_table_id, 120, 135, 5);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default tables for new users
CREATE OR REPLACE TRIGGER create_default_tables_after_user_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_tables_for_new_user();