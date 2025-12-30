-- Ensure payments table exists with correct structure
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KES',
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('stripe', 'mpesa', 'crypto')),
    payment_provider VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    
    -- External IDs
    stripe_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    mpesa_checkout_request_id VARCHAR(255),
    mpesa_merchant_request_id VARCHAR(255),
    crypto_payment_id VARCHAR(255),
    
    -- Payment details
    description TEXT,
    metadata JSONB,
    
    -- Subscription info (if applicable)
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    plan_type VARCHAR(50),
    
    -- Crypto specific
    crypto_currency VARCHAR(10),
    crypto_amount DECIMAL(20, 8),
    crypto_address TEXT,
    
    -- Timestamps
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_mpesa_checkout ON payments(mpesa_checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_payments_crypto ON payments(crypto_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

-- Trigger
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
