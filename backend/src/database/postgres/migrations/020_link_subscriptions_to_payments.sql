-- Migration 020: Link each subscription to the payment that paid for it.
-- Lets a payment grant its plan exactly once, even if the provider
-- sends the success callback more than once.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_payment_id ON subscriptions(payment_id) WHERE payment_id IS NOT NULL;
