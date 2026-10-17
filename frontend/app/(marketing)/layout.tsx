// app/(marketing)/layout.tsx
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { ScrollMotion } from "@/components/landing/scroll-motion"
import { Spotlight } from "@/components/landing/spotlight"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Navbar />
      <main>{children}</main>
      <Footer />
      <Spotlight />
      <ScrollMotion />
    </div>
  )
}
