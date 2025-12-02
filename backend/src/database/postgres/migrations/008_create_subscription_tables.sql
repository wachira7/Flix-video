-- Migration 008: Create Subscription Tables
-- Description: Subscription plans and user subscriptions
-- Author: WaruTech
-- Date: 2025-11-24

-- ============================================
-- SUBSCRIPTION PLANS TABLE
-- ============================================
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    
    -- Pricing
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('monthly', 'yearly', 'lifetime')),
    trial_days INTEGER DEFAULT 0,
    
    -- Features
    features JSONB NOT NULL, -- Array of features
    max_devices INTEGER DEFAULT 1,
    max_downloads INTEGER, -- NULL = unlimited
    video_quality VARCHAR(20) DEFAULT 'HD' CHECK (video_quality IN ('SD', 'HD', '4K')),
    supports_offline BOOLEAN DEFAULT FALSE,
    ad_free BOOLEAN DEFAULT TRUE,
    
    -- Stripe integration
    stripe_price_id VARCHAR(255),
    stripe_product_id VARCHAR(255),
    
    -- Plan management
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_display_order ON subscription_plans(display_order);
CREATE INDEX idx_subscription_plans_stripe_price ON subscription_plans(stripe_price_id);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    
    -- Subscription lifecycle
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'expired', 'paused')),
    
    -- Billing dates
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment details
    payment_method VARCHAR(50) CHECK (payment_method IN ('stripe', 'mpesa', 'crypto')),
    auto_renew BOOLEAN DEFAULT TRUE,
    
    -- Stripe integration
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    
    -- Usage tracking
    devices_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_user_active ON subscriptions(user_id, status) WHERE status IN ('active', 'trialing');

-- ============================================
-- SUBSCRIPTION HISTORY TABLE
-- ============================================
CREATE TABLE subscription_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    
    -- Event details
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('created', 'renewed', 'upgraded', 'downgraded', 'cancelled', 'expired', 'paused', 'resumed')),
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    
    -- Payment info
    amount DECIMAL(10, 2),
    currency VARCHAR(3),
    payment_id UUID REFERENCES payments(id),
    
    -- Additional data
    notes TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_subscription_history_subscription_id ON subscription_history(subscription_id);
CREATE INDEX idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX idx_subscription_history_event_type ON subscription_history(event_type);
CREATE INDEX idx_subscription_history_created_at ON subscription_history(created_at DESC);

-- ============================================
-- DEVICES TABLE (User devices for download limits)
-- ============================================
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    
    -- Device info
    device_name VARCHAR(255),
    device_type VARCHAR(50) CHECK (device_type IN ('web', 'ios', 'android', 'tv', 'desktop')),
    device_id VARCHAR(255) NOT NULL, -- Unique device identifier
    device_model VARCHAR(255),
    os_name VARCHAR(100),
    os_version VARCHAR(100),
    app_version VARCHAR(100),
    
    -- Device tracking
    is_active BOOLEAN DEFAULT TRUE,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_ip INET,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, device_id)
);

-- Create indexes
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_subscription_id ON devices(subscription_id);
CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_devices_is_active ON devices(is_active);
CREATE INDEX idx_devices_last_active ON devices(last_active_at DESC);
CREATE INDEX idx_devices_user_active ON devices(user_id, is_active);

-- ============================================
-- COUPONS TABLE
-- ============================================
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    
    -- Discount details
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3), -- Required for fixed discounts
    
    -- Validity
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER, -- NULL = unlimited
    uses_count INTEGER DEFAULT 0,
    
    -- Restrictions
    applies_to_plans UUID[], -- NULL = all plans
    min_purchase_amount DECIMAL(10, 2),
    first_time_only BOOLEAN DEFAULT FALSE,
    
    -- Stripe integration
    stripe_coupon_id VARCHAR(255),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_is_active ON coupons(is_active);
CREATE INDEX idx_coupons_valid_from ON coupons(valid_from);
CREATE INDEX idx_coupons_valid_until ON coupons(valid_until);
CREATE INDEX idx_coupons_stripe_coupon ON coupons(stripe_coupon_id);

-- ============================================
-- COUPON USAGE TABLE
-- ============================================
CREATE TABLE coupon_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    
    discount_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(coupon_id, user_id) -- One use per user
);

-- Create indexes
CREATE INDEX idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE INDEX idx_coupon_usage_created_at ON coupon_usage(created_at DESC);

-- ============================================
-- FUNCTION: Check if user has active subscription
-- ============================================
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM subscriptions
        WHERE user_id = p_user_id
        AND status IN ('active', 'trialing')
        AND current_period_end > NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Update coupon uses count
-- ============================================
CREATE OR REPLACE FUNCTION update_coupon_uses_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE coupons SET uses_count = uses_count + 1 WHERE id = NEW.coupon_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coupon_uses_count
    AFTER INSERT ON coupon_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_coupon_uses_count();

-- ============================================
-- TRIGGERS: Update timestamps
-- ============================================
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED SUBSCRIPTION PLANS
-- ============================================
INSERT INTO subscription_plans (name, slug, description, price, billing_interval, features, max_devices, video_quality, supports_offline, is_popular, display_order) VALUES
('Basic', 'basic', 'Watch on one device in SD quality', 9.99, 'monthly', '["SD Video Quality", "1 Device", "Unlimited Movies & Shows"]'::jsonb, 1, 'SD', false, false, 1),
('Standard', 'standard', 'Watch on two devices in HD quality', 14.99, 'monthly', '["HD Video Quality", "2 Devices", "Unlimited Movies & Shows", "Download Content"]'::jsonb, 2, 'HD', true, true, 2),
('Premium', 'premium', 'Watch on four devices in 4K quality', 19.99, 'monthly', '["4K Video Quality", "4 Devices", "Unlimited Movies & Shows", "Download Content", "Ad-Free"]'::jsonb, 4, '4K', true, false, 3),
('Annual Standard', 'annual-standard', 'Save 20% with annual billing', 143.88, 'yearly', '["HD Video Quality", "2 Devices", "Unlimited Movies & Shows", "Download Content"]'::jsonb, 2, 'HD', true, false, 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE subscription_plans IS 'Available subscription tiers and pricing';
COMMENT ON TABLE subscriptions IS 'User subscription status and billing';
COMMENT ON TABLE subscription_history IS 'Audit log of subscription changes';
COMMENT ON TABLE devices IS 'Registered user devices for streaming';
COMMENT ON TABLE coupons IS 'Discount coupons and promo codes';
COMMENT ON TABLE coupon_usage IS 'Tracking of coupon redemptions';

COMMENT ON COLUMN subscriptions.status IS 'Subscription lifecycle status';
COMMENT ON COLUMN subscriptions.auto_renew IS 'Whether subscription renews automatically';
COMMENT ON COLUMN devices.device_id IS 'Unique device identifier (UUID or device fingerprint)';
COMMENT ON COLUMN coupons.discount_type IS 'Percentage off or fixed amount discount';