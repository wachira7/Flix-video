-- Migration 009: Create Crypto Payment Tables
-- Description: Cryptocurrency payment processing with NOWPayments
-- Author: WaruTech
-- Date: 2025-11-24

-- ============================================
-- CRYPTO PAYMENTS TABLE
-- ============================================
CREATE TABLE crypto_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    
    -- NOWPayments details
    nowpayments_payment_id VARCHAR(255) UNIQUE NOT NULL,
    nowpayments_invoice_id VARCHAR(255),
    
    -- Cryptocurrency details
    pay_currency VARCHAR(20) NOT NULL, -- BTC, ETH, USDT, etc.
    pay_amount DECIMAL(18, 8) NOT NULL, -- Crypto amount
    price_amount DECIMAL(10, 2) NOT NULL, -- Fiat amount
    price_currency VARCHAR(3) NOT NULL, -- USD, EUR, etc.
    
    -- Payment addresses
    pay_address VARCHAR(255), -- Crypto wallet to send payment to
    payin_extra_id VARCHAR(255), -- Payment ID/Memo for some currencies
    
    -- Exchange rate at time of payment
    exchange_rate DECIMAL(18, 8),
    
    -- Payment status
    payment_status VARCHAR(50) DEFAULT 'waiting' CHECK (payment_status IN ('waiting', 'confirming', 'confirmed', 'sending', 'partially_paid', 'finished', 'failed', 'refunded', 'expired')),
    
    -- Transaction details
    actually_paid DECIMAL(18, 8), -- Actual amount received
    outcome_amount DECIMAL(18, 8), -- Amount after fees
    network_fee DECIMAL(18, 8),
    
    -- Blockchain info
    pay_in_hash VARCHAR(255), -- Transaction hash
    confirmations INTEGER DEFAULT 0,
    required_confirmations INTEGER,
    
    -- Timing
    expiration_estimate_date TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- Webhook/callback data
    callback_data JSONB,
    last_callback_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_crypto_payments_payment_id ON crypto_payments(payment_id);
CREATE INDEX idx_crypto_payments_nowpayments_id ON crypto_payments(nowpayments_payment_id);
CREATE INDEX idx_crypto_payments_status ON crypto_payments(payment_status);
CREATE INDEX idx_crypto_payments_currency ON crypto_payments(pay_currency);
CREATE INDEX idx_crypto_payments_pay_in_hash ON crypto_payments(pay_in_hash);
CREATE INDEX idx_crypto_payments_created_at ON crypto_payments(created_at DESC);

-- ============================================
-- CRYPTO WALLETS TABLE (Generated wallets)
-- ============================================
CREATE TABLE crypto_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Wallet details
    currency VARCHAR(20) NOT NULL, -- BTC, ETH, USDT, etc.
    address VARCHAR(255) UNIQUE NOT NULL,
    extra_id VARCHAR(255), -- Payment ID/Memo if required
    
    -- Wallet metadata
    label VARCHAR(255), -- User-friendly name
    network VARCHAR(50), -- Mainnet, testnet, etc.
    derivation_path VARCHAR(255), -- HD wallet path
    
    -- Balance (cached - should sync from blockchain)
    balance DECIMAL(18, 8) DEFAULT 0,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    
    -- Wallet status
    is_active BOOLEAN DEFAULT TRUE,
    is_watched BOOLEAN DEFAULT TRUE, -- Watch for incoming transactions
    
    -- Provider info
    provider VARCHAR(50), -- nowpayments, coinbase, self-hosted
    provider_wallet_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, currency, address)
);

-- Create indexes
CREATE INDEX idx_crypto_wallets_user_id ON crypto_wallets(user_id);
CREATE INDEX idx_crypto_wallets_currency ON crypto_wallets(currency);
CREATE INDEX idx_crypto_wallets_address ON crypto_wallets(address);
CREATE INDEX idx_crypto_wallets_is_active ON crypto_wallets(is_active);
CREATE INDEX idx_crypto_wallets_is_watched ON crypto_wallets(is_watched);
CREATE INDEX idx_crypto_wallets_user_currency ON crypto_wallets(user_id, currency);

-- ============================================
-- CRYPTO TRANSACTIONS TABLE (Blockchain txs)
-- ============================================
CREATE TABLE crypto_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES crypto_wallets(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    
    -- Transaction details
    tx_hash VARCHAR(255) UNIQUE NOT NULL,
    currency VARCHAR(20) NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    fee DECIMAL(18, 8),
    
    -- Transaction type
    tx_type VARCHAR(20) NOT NULL CHECK (tx_type IN ('incoming', 'outgoing', 'internal')),
    
    -- Addresses
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    
    -- Blockchain details
    block_number BIGINT,
    confirmations INTEGER DEFAULT 0,
    confirmed BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- Exchange rate at time
    fiat_value DECIMAL(10, 2),
    fiat_currency VARCHAR(3),
    exchange_rate DECIMAL(18, 8),
    
    -- Additional data
    memo TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_crypto_transactions_wallet_id ON crypto_transactions(wallet_id);
CREATE INDEX idx_crypto_transactions_payment_id ON crypto_transactions(payment_id);
CREATE INDEX idx_crypto_transactions_tx_hash ON crypto_transactions(tx_hash);
CREATE INDEX idx_crypto_transactions_currency ON crypto_transactions(currency);
CREATE INDEX idx_crypto_transactions_type ON crypto_transactions(tx_type);
CREATE INDEX idx_crypto_transactions_confirmed ON crypto_transactions(confirmed);
CREATE INDEX idx_crypto_transactions_created_at ON crypto_transactions(created_at DESC);

-- ============================================
-- EXCHANGE RATES TABLE (Cached rates)
-- ============================================
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency VARCHAR(20) NOT NULL,
    to_currency VARCHAR(20) NOT NULL,
    rate DECIMAL(18, 8) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- nowpayments, coinbase, etc.
    
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(from_currency, to_currency, provider, valid_from)
);

-- Create indexes
CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX idx_exchange_rates_provider ON exchange_rates(provider);
CREATE INDEX idx_exchange_rates_valid_from ON exchange_rates(valid_from DESC);
CREATE INDEX idx_exchange_rates_valid_until ON exchange_rates(valid_until);

-- ============================================
-- SUPPORTED CRYPTOCURRENCIES TABLE
-- ============================================
CREATE TABLE supported_cryptocurrencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL, -- BTC, ETH, USDT
    name VARCHAR(100) NOT NULL, -- Bitcoin, Ethereum, Tether
    symbol VARCHAR(10), -- ₿, Ξ
    
    -- Display info
    icon_url TEXT,
    color_hex VARCHAR(7), -- Hex color for UI
    
    -- Network details
    network VARCHAR(50), -- Bitcoin, Ethereum, TRC20, etc.
    is_token BOOLEAN DEFAULT FALSE,
    contract_address VARCHAR(255), -- For tokens
    
    -- Payment settings
    min_amount DECIMAL(18, 8), -- Minimum payment amount
    max_amount DECIMAL(18, 8), -- Maximum payment amount (NULL = unlimited)
    confirmations_required INTEGER DEFAULT 6,
    
    -- Provider availability
    nowpayments_available BOOLEAN DEFAULT FALSE,
    nowpayments_code VARCHAR(20),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_supported_crypto_code ON supported_cryptocurrencies(code);
CREATE INDEX idx_supported_crypto_active ON supported_cryptocurrencies(is_active);
CREATE INDEX idx_supported_crypto_popular ON supported_cryptocurrencies(is_popular);
CREATE INDEX idx_supported_crypto_display_order ON supported_cryptocurrencies(display_order);

-- ============================================
-- TRIGGERS: Update timestamps
-- ============================================
CREATE TRIGGER update_crypto_payments_updated_at
    BEFORE UPDATE ON crypto_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crypto_wallets_updated_at
    BEFORE UPDATE ON crypto_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crypto_transactions_updated_at
    BEFORE UPDATE ON crypto_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supported_cryptocurrencies_updated_at
    BEFORE UPDATE ON supported_cryptocurrencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED SUPPORTED CRYPTOCURRENCIES
-- ============================================
INSERT INTO supported_cryptocurrencies (code, name, symbol, network, min_amount, confirmations_required, nowpayments_available, nowpayments_code, is_popular, display_order) VALUES
('BTC', 'Bitcoin', '₿', 'Bitcoin', 0.00001, 2, true, 'btc', true, 1),
('ETH', 'Ethereum', 'Ξ', 'Ethereum', 0.001, 12, true, 'eth', true, 2),
('USDT', 'Tether', '₮', 'TRC20', 1.0, 20, true, 'usdttrc20', true, 3),
('USDT_ERC20', 'Tether (ERC20)', '₮', 'Ethereum', 1.0, 12, true, 'usdterc20', false, 4),
('USDC', 'USD Coin', '$', 'Ethereum', 1.0, 12, true, 'usdc', false, 5),
('BNB', 'Binance Coin', 'BNB', 'BSC', 0.01, 15, true, 'bnb', false, 6),
('LTC', 'Litecoin', 'Ł', 'Litecoin', 0.01, 6, true, 'ltc', false, 7),
('DOGE', 'Dogecoin', 'Ð', 'Dogecoin', 10.0, 6, true, 'doge', false, 8)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE crypto_payments IS 'Cryptocurrency payment transactions via NOWPayments';
COMMENT ON TABLE crypto_wallets IS 'User cryptocurrency wallet addresses';
COMMENT ON TABLE crypto_transactions IS 'Blockchain transaction records';
COMMENT ON TABLE exchange_rates IS 'Cached cryptocurrency exchange rates';
COMMENT ON TABLE supported_cryptocurrencies IS 'Cryptocurrencies accepted for payment';

COMMENT ON COLUMN crypto_payments.nowpayments_payment_id IS 'NOWPayments unique payment identifier';
COMMENT ON COLUMN crypto_payments.pay_amount IS 'Amount in cryptocurrency';
COMMENT ON COLUMN crypto_payments.price_amount IS 'Amount in fiat currency';
COMMENT ON COLUMN crypto_payments.actually_paid IS 'Actual crypto amount received (may differ slightly)';
COMMENT ON COLUMN crypto_wallets.extra_id IS 'Payment ID/Memo required by some currencies (XRP, XLM)';
COMMENT ON COLUMN crypto_wallets.derivation_path IS 'HD wallet derivation path (BIP44)';
COMMENT ON COLUMN crypto_transactions.tx_hash IS 'Blockchain transaction hash';
COMMENT ON COLUMN supported_cryptocurrencies.is_token IS 'Whether this is a token (vs native coin)';
COMMENT ON COLUMN supported_cryptocurrencies.contract_address IS 'Smart contract address for tokens';