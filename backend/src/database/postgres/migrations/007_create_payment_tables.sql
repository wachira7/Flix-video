-- Migration 007: Create Payment Tables
-- Description: Payment processing for Stripe and M-Pesa
-- Author: WaruTech
-- Date: 2025-11-24

-- ============================================
-- PAYMENTS TABLE (Main payment records)
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL, -- ISO 4217
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('stripe', 'mpesa', 'crypto')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
    description TEXT,
    metadata JSONB,
    
    -- Payment gateway references
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    mpesa_checkout_request_id VARCHAR(255),
    mpesa_merchant_request_id VARCHAR(255),
    
    -- Transaction details
    paid_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_amount DECIMAL(10, 2),
    
    -- Error handling
    error_code VARCHAR(100),
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_method ON payments(payment_method);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_mpesa_checkout ON payments(mpesa_checkout_request_id);
CREATE INDEX idx_payments_user_status ON payments(user_id, status);

-- ============================================
-- M-PESA PAYMENTS TABLE (Additional M-Pesa data)
-- ============================================
CREATE TABLE mpesa_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    
    -- M-Pesa STK Push Details
    checkout_request_id VARCHAR(255) UNIQUE NOT NULL,
    merchant_request_id VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    account_reference VARCHAR(100),
    transaction_desc VARCHAR(255),
    
    -- M-Pesa Response Data
    mpesa_receipt_number VARCHAR(100), -- Transaction ID from M-Pesa
    transaction_date TIMESTAMP WITH TIME ZONE,
    result_code INTEGER,
    result_desc TEXT,
    
    -- Callback data
    callback_received BOOLEAN DEFAULT FALSE,
    callback_data JSONB,
    callback_received_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_mpesa_payment_id ON mpesa_payments(payment_id);
CREATE INDEX idx_mpesa_checkout_request ON mpesa_payments(checkout_request_id);
CREATE INDEX idx_mpesa_merchant_request ON mpesa_payments(merchant_request_id);
CREATE INDEX idx_mpesa_receipt_number ON mpesa_payments(mpesa_receipt_number);
CREATE INDEX idx_mpesa_phone_number ON mpesa_payments(phone_number);
CREATE INDEX idx_mpesa_callback_received ON mpesa_payments(callback_received);

-- ============================================
-- PAYMENT WEBHOOKS TABLE (For all payment gateways)
-- ============================================
CREATE TABLE payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('stripe', 'mpesa', 'crypto')),
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255), -- External webhook ID
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_payment_webhooks_payment_method ON payment_webhooks(payment_method);
CREATE INDEX idx_payment_webhooks_event_type ON payment_webhooks(event_type);
CREATE INDEX idx_payment_webhooks_event_id ON payment_webhooks(event_id);
CREATE INDEX idx_payment_webhooks_processed ON payment_webhooks(processed);
CREATE INDEX idx_payment_webhooks_received_at ON payment_webhooks(received_at DESC);

-- ============================================
-- REFUNDS TABLE
-- ============================================
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    reason VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
    
    -- Gateway references
    stripe_refund_id VARCHAR(255),
    
    -- Processing details
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_stripe_refund_id ON refunds(stripe_refund_id);
CREATE INDEX idx_refunds_created_at ON refunds(created_at DESC);

-- ============================================
-- INVOICES TABLE
-- ============================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
    
    -- Billing details
    billing_name VARCHAR(255),
    billing_email VARCHAR(255),
    billing_address TEXT,
    
    -- Invoice items
    items JSONB NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Dates
    invoice_date DATE NOT NULL,
    due_date DATE,
    paid_date DATE,
    
    -- PDF
    pdf_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_payment_id ON invoices(payment_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- ============================================
-- FUNCTION: Generate invoice number
-- ============================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    invoice_num TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_num
    FROM invoices
    WHERE invoice_number ~ '^INV-[0-9]{4}-[0-9]+$'
    AND SUBSTRING(invoice_number FROM 5 FOR 4) = TO_CHAR(NOW(), 'YYYY');
    
    invoice_num := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::TEXT, 6, '0');
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-generate invoice number
-- ============================================
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- ============================================
-- TRIGGERS: Update timestamps
-- ============================================
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mpesa_payments_updated_at
    BEFORE UPDATE ON mpesa_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at
    BEFORE UPDATE ON refunds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE payments IS 'Main payment transactions table';
COMMENT ON TABLE mpesa_payments IS 'M-Pesa specific payment data and callbacks';
COMMENT ON TABLE payment_webhooks IS 'Webhook events from payment providers';
COMMENT ON TABLE refunds IS 'Payment refunds';
COMMENT ON TABLE invoices IS 'User invoices for payments';

COMMENT ON COLUMN payments.payment_method IS 'Payment gateway: stripe, mpesa, or crypto';
COMMENT ON COLUMN payments.status IS 'Payment status lifecycle';
COMMENT ON COLUMN mpesa_payments.checkout_request_id IS 'Unique M-Pesa STK Push identifier';
COMMENT ON COLUMN mpesa_payments.mpesa_receipt_number IS 'M-Pesa transaction confirmation code';
COMMENT ON COLUMN invoices.invoice_number IS 'Auto-generated invoice number (INV-YYYY-NNNNNN)';