-- Update payments table to support Vietnamese payment gateways
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_data JSONB;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_date TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_url VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- Create payment_logs table to track payment events
CREATE TABLE IF NOT EXISTS payment_logs (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER REFERENCES payments(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create payment_configs table for payment gateway configurations
CREATE TABLE IF NOT EXISTS payment_configs (
  id SERIAL PRIMARY KEY,
  gateway_name VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  config_data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs(payment_id);
