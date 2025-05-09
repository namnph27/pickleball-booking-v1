-- Add approval_status column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending';

-- Update existing court owners to be approved
UPDATE users SET approval_status = 'approved' WHERE role = 'court_owner' AND is_verified = TRUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
