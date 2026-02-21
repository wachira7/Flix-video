-- This migration updates the payments table to include new columns that were not in migration 0072, ensuring that the database schema is consistent regardless of the order in which migrations are applied. It also adds indexes for the new columns and updates the trigger for maintaining the updated_at timestamp.
--migration 012_update_payments_table:


-- Add columns that exist in 012 but not in 007
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS crypto_payment_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS crypto_currency VARCHAR(10);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS crypto_amount DECIMAL(20, 8);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS crypto_address TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_crypto ON payments(crypto_payment_id);

-- Trigger (DROP first to avoid conflict with 007's trigger)
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON payments;
CREATE TRIGGER trigger_update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();