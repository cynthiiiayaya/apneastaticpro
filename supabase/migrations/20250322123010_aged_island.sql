/*
  # Add tap mode to breath cycles table

  1. Changes
    - Add `tap_mode` boolean column to `breath_cycles` table with default false
  2. Notes
    - This allows storing whether a breath cycle should use "tap to end" mode
    - When tap_mode is true, the hold_time is just a reference/estimated value
*/

ALTER TABLE breath_cycles 
ADD COLUMN IF NOT EXISTS tap_mode BOOLEAN DEFAULT false;

-- Create example tap mode table if no tables exist
DO $$
DECLARE
  table_count integer;
  tap_table_id uuid;
BEGIN
  SELECT COUNT(*) INTO table_count FROM training_tables;
  
  IF table_count = 0 THEN
    -- Create Max Hold Training Table
    INSERT INTO training_tables (name, user_id)
    SELECT 'Max Hold Training', id FROM users LIMIT 1
    RETURNING id INTO tap_table_id;
    
    IF tap_table_id IS NOT NULL THEN
      -- Insert cycles with tap mode
      INSERT INTO breath_cycles (table_id, breathe_time, hold_time, cycle_index, tap_mode)
      VALUES 
        (tap_table_id, 120, 120, 0, true),  -- 2 min breathe, tap hold
        (tap_table_id, 120, 180, 1, true),  -- 2 min breathe, tap hold (estimated 3 min)
        (tap_table_id, 120, 240, 2, true);  -- 2 min breathe, tap hold (estimated 4 min)
    END IF;
  END IF;
END $$;