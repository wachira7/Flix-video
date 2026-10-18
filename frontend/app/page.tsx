import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { AIShowcase } from "@/components/landing/ai-showcase"
import { FeaturesSection } from "@/components/landing/features-section"
import { Top10Section } from "@/components/landing/top10-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { FAQSection } from "@/components/landing/faq-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"
import { Spotlight } from "@/components/landing/spotlight"
import { ScrollMotion } from "@/components/landing/scroll-motion"
import { getLandingData } from "@/components/landing/landing-data"

// Re-fetch TMDB trending data at most once an hour
export const revalidate = 3600

export default async function LandingPage() {
  const { feature, slides, topMovies, topTV, picks } = await getLandingData()

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection slides={slides} showTop10={topMovies.length + topTV.length > 0} />
      <AIShowcase picks={picks} />
      <FeaturesSection />
      <Top10Section movies={topMovies} tv={topTV} />
      <PricingSection />
      <FAQSection />
      <CTASection posters={[...topMovies, ...topTV].filter((t) => t.id !== feature?.id)} />
      <Footer />
      <Spotlight />
      <ScrollMotion />
    </main>
  )
}
