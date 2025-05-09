-- Add id_card and tax_code columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_card VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_code VARCHAR(20);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_id_card ON users(id_card);
CREATE INDEX IF NOT EXISTS idx_users_tax_code ON users(tax_code);
