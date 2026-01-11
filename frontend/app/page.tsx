import { Toaster } from "sonner"
import { AlertBanner } from "@/components/landing/alert-banner"
import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { StatsSection } from "@/components/landing/stats-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { AIShowcase } from "@/components/landing/ai-showcase"
import { DevicesSection } from "@/components/landing/devices-section"
import { TrendingSection } from "@/components/landing/trending-section"
import { Top10Section } from "@/components/landing/top10-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { FAQSection } from "@/components/landing/faq-section"
import { CTASection } from "@/components/landing/cta-section"
import { NewsletterSection } from "@/components/landing/newsletter-section"
import { ContactSection } from "@/components/landing/contact-section"
import { Footer } from "@/components/landing/footer"
import { AutoScrollCarousel } from "@/components/landing/auto-scroll-carousel"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background dark">
      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />

      {/* Promo Alert Banner */}
      <AlertBanner />

      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <StatsSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* AI Showcase Section */}
      <AIShowcase />

      {/* Auto-scrolling Carousel for Popular Movies */}
      <AutoScrollCarousel />

      {/* Devices Section */}
      <DevicesSection />

      {/* Trending Section (Movies/TV with Carousel) */}
      <TrendingSection />

      {/* Top 10 Section */}
      <Top10Section />

      {/* Pricing Section */}
      <PricingSection />

      {/* Testimonials Section (Auto-swipe Carousel) */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <CTASection />

      {/* Newsletter Section */}
      <NewsletterSection />

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </main>
  )
}
