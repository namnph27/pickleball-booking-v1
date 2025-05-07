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

-- Insert default payment gateway configurations
INSERT INTO payment_configs (gateway_name, is_active, config_data, created_at, updated_at)
VALUES 
  ('momo', true, '{
    "partner_code": "MOMO_PARTNER_CODE",
    "access_key": "MOMO_ACCESS_KEY",
    "secret_key": "MOMO_SECRET_KEY",
    "endpoint": "https://test-payment.momo.vn/v2/gateway/api/create",
    "return_url": "http://localhost:5000/api/payments/momo/callback",
    "notify_url": "http://localhost:5000/api/payments/momo/ipn",
    "is_sandbox": true
  }', NOW(), NOW()),
  
  ('vnpay', true, '{
    "terminal_id": "VNPAY_TERMINAL_ID",
    "secret_key": "VNPAY_SECRET_KEY",
    "endpoint": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    "return_url": "http://localhost:5000/api/payments/vnpay/callback",
    "is_sandbox": true
  }', NOW(), NOW()),
  
  ('bank_transfer', true, '{
    "account_number": "1234567890",
    "account_name": "Pickleball Booking",
    "bank_name": "Vietcombank",
    "branch": "Ho Chi Minh City",
    "is_active": true
  }', NOW(), NOW());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs(payment_id);
