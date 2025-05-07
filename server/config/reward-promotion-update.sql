-- Create reward_rules table
CREATE TABLE IF NOT EXISTS reward_rules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  action_type VARCHAR(50) NOT NULL, -- booking, payment, referral, etc.
  points INTEGER NOT NULL,
  is_percentage BOOLEAN DEFAULT FALSE, -- If true, points is a percentage of the amount
  percentage_base VARCHAR(50), -- total_price, etc. (only used if is_percentage is true)
  min_amount DECIMAL(10, 2), -- Minimum amount to qualify for points (optional)
  max_points INTEGER, -- Maximum points that can be earned (optional)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add source_id and source_type to reward_history
ALTER TABLE reward_history ADD COLUMN IF NOT EXISTS source_id INTEGER;
ALTER TABLE reward_history ADD COLUMN IF NOT EXISTS source_type VARCHAR(50); -- booking, payment, referral, etc.

-- Create promotion_usages table
CREATE TABLE IF NOT EXISTS promotion_usages (
  id SERIAL PRIMARY KEY,
  promotion_id INTEGER REFERENCES promotions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add usage_limit to promotions
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS usage_limit INTEGER DEFAULT NULL;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS user_specific BOOLEAN DEFAULT FALSE;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS specific_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Update notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_id INTEGER;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_type VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- Add birth_date column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add view_count column to promotions table
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create points_expiry table (optional - only if points expire)
CREATE TABLE IF NOT EXISTS points_expiry (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reward_rules_action_type ON reward_rules(action_type);
CREATE INDEX IF NOT EXISTS idx_reward_history_source_id ON reward_history(source_id);
CREATE INDEX IF NOT EXISTS idx_reward_history_source_type ON reward_history(source_type);
CREATE INDEX IF NOT EXISTS idx_promotion_usages_promotion_id ON promotion_usages(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usages_user_id ON promotion_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usages_booking_id ON promotion_usages(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_points_expiry_user_id ON points_expiry(user_id);
CREATE INDEX IF NOT EXISTS idx_points_expiry_expiry_date ON points_expiry(expiry_date);

-- Insert default reward rules
INSERT INTO reward_rules (name, description, action_type, points, is_percentage, percentage_base, min_amount, max_points, is_active, created_at, updated_at)
VALUES
  ('Booking Completion', 'Earn points when a booking is completed', 'booking_completed', 0, TRUE, 'total_price', 0, 1000, TRUE, NOW(), NOW()),
  ('First Booking', 'Earn points for your first booking', 'first_booking', 100, FALSE, NULL, 0, NULL, TRUE, NOW(), NOW()),
  ('Referral', 'Earn points when you refer a friend', 'referral', 200, FALSE, NULL, 0, NULL, TRUE, NOW(), NOW()),
  ('Birthday Bonus', 'Earn bonus points on your birthday', 'birthday', 500, FALSE, NULL, 0, NULL, TRUE, NOW(), NOW()),
  ('Monthly Loyalty', 'Earn points for booking at least once a month', 'monthly_loyalty', 300, FALSE, NULL, 0, NULL, TRUE, NOW(), NOW()),
  ('Consecutive Bookings', 'Earn points for consecutive bookings', 'consecutive_bookings', 150, FALSE, NULL, 0, NULL, TRUE, NOW(), NOW()),
  ('Off-Peak Booking', 'Earn points for booking during off-peak hours', 'off_peak_booking', 50, FALSE, NULL, 0, NULL, TRUE, NOW(), NOW()),
  ('Multiple Court Booking', 'Earn points for booking multiple courts', 'multiple_court_booking', 75, FALSE, NULL, 0, NULL, TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
