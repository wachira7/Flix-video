
# App directories (Next.js App Router)
mkdir -p app/api/webhooks/{stripe,mpesa,crypto}
mkdir -p app/'(marketing)'/{pricing,features,about}
mkdir -p app/'(auth)'/{login,signup,verify-email,forgot-password,reset-password}
mkdir -p app/'(dashboard)'/{browse/{movies,tv-shows,genres},watch,my-list/{favorites,history},search,profile/edit,settings/{account,billing,notifications,privacy,preferences,devices},subscription/{checkout,payment/{card,mpesa,crypto}},social/{watch-parties,friends,profile},ai-chat,lists/create,analytics,tv,movie}

# Component directories
mkdir -p components/landing
mkdir -p components/dashboard
mkdir -p components/auth
mkdir -p components/content
mkdir -p components/player
mkdir -p components/social
mkdir -p components/payment
mkdir -p components/ui
mkdir -p components/ai
mkdir -p components/list
mkdir -p components/review
mkdir -p components/search
mkdir -p components/notifications
mkdir -p components/layout
mkdir -p components/common

# Lib directories
mkdir -p lib/api
mkdir -p lib/hooks
mkdir -p lib/utils
mkdir -p lib/contexts
mkdir -p lib/store
mkdir -p lib/validations

# Other directories
mkdir -p types
mkdir -p public/images/{heroes,features,logos,screenshots}
mkdir -p public/fonts
mkdir -p public/icons
mkdir -p styles

# ============================================
# CREATE ROOT FILES
# ============================================

touch next.config.mjs
touch tsconfig.json
touch tailwind.config.js
touch postcss.config.js
touch .env.local
touch .env.example
touch .eslintrc.json
touch .gitignore
touch README.md

# ============================================
# CREATE APP FILES
# ============================================

# Root app files
touch app/layout.tsx
touch app/page.tsx
touch app/globals.css
touch app/not-found.tsx
touch app/error.tsx
touch app/loading.tsx

# API webhook routes
touch app/api/webhooks/stripe/route.ts
touch app/api/webhooks/mpesa/route.ts
touch app/api/webhooks/crypto/route.ts

# Marketing pages
touch app/'(marketing)'/layout.tsx
touch app/'(marketing)'/pricing/page.tsx
touch app/'(marketing)'/features/page.tsx
touch app/'(marketing)'/about/page.tsx

# Auth pages
touch app/'(auth)'/layout.tsx
touch app/'(auth)'/login/page.tsx
touch app/'(auth)'/signup/page.tsx
touch app/'(auth)'/verify-email/page.tsx
touch app/'(auth)'/forgot-password/page.tsx
touch app/'(auth)'/reset-password/page.tsx

# Dashboard pages
touch app/'(dashboard)'/layout.tsx
touch app/'(dashboard)'/browse/page.tsx
touch app/'(dashboard)'/browse/movies/page.tsx
touch app/'(dashboard)'/browse/tv-shows/page.tsx
touch app/'(dashboard)'/browse/genres/page.tsx
touch app/'(dashboard)'/watch/page.tsx
touch app/'(dashboard)'/my-list/page.tsx
touch app/'(dashboard)'/my-list/favorites/page.tsx
touch app/'(dashboard)'/my-list/history/page.tsx
touch app/'(dashboard)'/search/page.tsx
touch app/'(dashboard)'/profile/page.tsx
touch app/'(dashboard)'/profile/edit/page.tsx
touch app/'(dashboard)'/settings/page.tsx
touch app/'(dashboard)'/settings/account/page.tsx
touch app/'(dashboard)'/settings/billing/page.tsx
touch app/'(dashboard)'/settings/notifications/page.tsx
touch app/'(dashboard)'/settings/privacy/page.tsx
touch app/'(dashboard)'/settings/preferences/page.tsx
touch app/'(dashboard)'/settings/devices/page.tsx
touch app/'(dashboard)'/subscription/page.tsx
touch app/'(dashboard)'/subscription/checkout/page.tsx
touch app/'(dashboard)'/subscription/payment/card/page.tsx
touch app/'(dashboard)'/subscription/payment/mpesa/page.tsx
touch app/'(dashboard)'/subscription/payment/crypto/page.tsx
touch app/'(dashboard)'/social/watch-parties/page.tsx
touch app/'(dashboard)'/social/friends/page.tsx
touch app/'(dashboard)'/social/profile/page.tsx
touch app/'(dashboard)'/ai-chat/page.tsx
touch app/'(dashboard)'/lists/page.tsx
touch app/'(dashboard)'/lists/create/page.tsx
touch app/'(dashboard)'/analytics/page.tsx
touch app/'(dashboard)'/tv/page.tsx
touch app/'(dashboard)'/movie/page.tsx

# ============================================
# CREATE LANDING COMPONENT FILES
# ============================================

touch components/landing/navbar.tsx
touch components/landing/hero-section.tsx
touch components/landing/features-section.tsx
touch components/landing/pricing-section.tsx
touch components/landing/ai-showcase.tsx
touch components/landing/devices-section.tsx
touch components/landing/trending-section.tsx
touch components/landing/top10-section.tsx
touch components/landing/testimonials-section.tsx
touch components/landing/stats-section.tsx
touch components/landing/faq-section.tsx
touch components/landing/cta-section.tsx
touch components/landing/newsletter-section.tsx
touch components/landing/contact-section.tsx
touch components/landing/footer.tsx

# ============================================
# CREATE DASHBOARD COMPONENT FILES
# ============================================

touch components/dashboard/sidebar.tsx
touch components/dashboard/header.tsx
touch components/dashboard/search-bar.tsx
touch components/dashboard/user-menu.tsx
touch components/dashboard/notifications-dropdown.tsx

# ============================================
# CREATE AUTH COMPONENT FILES
# ============================================

touch components/auth/login-form.tsx
touch components/auth/signup-form.tsx
touch components/auth/forgot-password-form.tsx
touch components/auth/reset-password-form.tsx
touch components/auth/verify-email-form.tsx
touch components/auth/social-login.tsx

# ============================================
# CREATE CONTENT COMPONENT FILES
# ============================================

touch components/content/movie-card.tsx
touch components/content/tv-show-card.tsx
touch components/content/content-grid.tsx
touch components/content/content-details.tsx
touch components/content/content-carousel.tsx

# ============================================
# CREATE PLAYER COMPONENT FILES
# ============================================

touch components/player/video-player.tsx
touch components/player/player-controls.tsx
touch components/player/quality-selector.tsx
touch components/player/subtitle-selector.tsx

# ============================================
# CREATE SOCIAL COMPONENT FILES
# ============================================

touch components/social/watch-party-card.tsx
touch components/social/watch-party-room.tsx
touch components/social/friend-card.tsx
touch components/social/friend-list.tsx

# ============================================
# CREATE PAYMENT COMPONENT FILES
# ============================================

touch components/payment/stripe-form.tsx
touch components/payment/mpesa-form.tsx
touch components/payment/crypto-form.tsx
touch components/payment/payment-methods.tsx

# ============================================
# CREATE UI COMPONENT FILES (Shadcn/Radix)
# ============================================

touch components/ui/button.tsx
touch components/ui/card.tsx
touch components/ui/dialog.tsx
touch components/ui/input.tsx
touch components/ui/label.tsx
touch components/ui/select.tsx
touch components/ui/tabs.tsx
touch components/ui/toast.tsx
touch components/ui/dropdown-menu.tsx
touch components/ui/avatar.tsx
touch components/ui/badge.tsx
touch components/ui/separator.tsx
touch components/ui/skeleton.tsx

# ============================================
# CREATE AI COMPONENT FILES
# ============================================

touch components/ai/chat-interface.tsx
touch components/ai/chat-message.tsx
touch components/ai/recommendation-card.tsx

# ============================================
# CREATE LIB FILES
# ============================================

# API client
touch lib/api/client.ts
touch lib/api/auth.ts
touch lib/api/content.ts
touch lib/api/payments.ts
touch lib/api/subscriptions.ts
touch lib/api/social.ts

# Hooks
touch lib/hooks/use-auth.ts
touch lib/hooks/use-content.ts
touch lib/hooks/use-subscription.ts
touch lib/hooks/use-scroll-animation.ts
touch lib/hooks/use-media-query.ts

# Utils
touch lib/utils/cn.ts
touch lib/utils/format.ts
touch lib/utils/validators.ts
touch lib/utils/currency.ts

# Contexts
touch lib/contexts/auth-context.tsx
touch lib/contexts/theme-context.tsx

# Store
touch lib/store/auth-store.ts
touch lib/store/ui-store.ts

# Validations
touch lib/validations/auth.ts
touch lib/validations/payment.ts

# ============================================
# CREATE TYPE FILES
# ============================================

touch types/api.ts
touch types/content.ts
touch types/user.ts
touch types/payment.ts
touch types/subscription.ts

# ============================================
# VERIFY STRUCTURE
# ============================================

echo ""
echo "✅ Directory structure created!"
echo ""
echo "📊 Summary:"
echo "  - App routes: $(find app -name 'page.tsx' | wc -l) pages"
echo "  - Components: $(find components -name '*.tsx' | wc -l) files"
echo "  - Lib files: $(find lib -name '*.ts' -o -name '*.tsx' | wc -l) files"
echo "  - Type files: $(find types -name '*.ts' | wc -l) files"
echo ""
echo "🎯 Ready for coding!"
echo ""
