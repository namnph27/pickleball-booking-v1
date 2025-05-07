-- Create booking_locks table
CREATE TABLE IF NOT EXISTS booking_locks (
  id SERIAL PRIMARY KEY,
  court_id INTEGER NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lock_expiry TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL,
  UNIQUE(court_id, start_time, end_time)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_booking_locks_court_time ON booking_locks(court_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_booking_locks_expiry ON booking_locks(lock_expiry);

-- Create function to clean expired locks
CREATE OR REPLACE FUNCTION clean_expired_locks() RETURNS void AS $$
BEGIN
  DELETE FROM booking_locks WHERE lock_expiry < NOW();
END;
$$ LANGUAGE plpgsql;
