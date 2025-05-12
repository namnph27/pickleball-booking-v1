-- Add specific_date column to court_timeslots table
ALTER TABLE court_timeslots ADD COLUMN IF NOT EXISTS specific_date DATE;

-- Create a new index for the specific_date column
CREATE INDEX IF NOT EXISTS idx_court_timeslots_specific_date ON court_timeslots(specific_date);

-- Create a combined index for court_id, specific_date, and day_of_week
CREATE INDEX IF NOT EXISTS idx_court_timeslots_court_date_day ON court_timeslots(court_id, specific_date, day_of_week);

-- Drop the constraint if it exists
ALTER TABLE court_timeslots DROP CONSTRAINT IF EXISTS court_timeslots_court_id_day_time_unique;

-- Create new unique constraint
ALTER TABLE court_timeslots 
ADD CONSTRAINT court_timeslots_unique_slot 
UNIQUE (court_id, day_of_week, start_time, end_time, COALESCE(specific_date, '1970-01-01'::date));
