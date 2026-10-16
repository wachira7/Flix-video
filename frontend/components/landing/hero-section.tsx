// components/landing/hero-section.tsx
// Entrance motion is CSS-only (.hero-reveal in globals.css) so the hero
// animates in before hydration and never stays hidden if JS is slow.
import type { CSSProperties } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HeroBackdrop } from "./hero-backdrop"
import type { LandingTitle } from "./landing-data"

interface HeroProps {
  slides: LandingTitle[]
  showTop10: boolean
}

export function HeroSection({ slides, showTop10 }: HeroProps) {
  return (
    <section className="relative isolate flex min-h-[min(88svh,880px)] items-end overflow-hidden pt-28 pb-14 md:pb-20">
      {/* Backdrop: this week's top trending films, dimmed like house lights going down */}
      <HeroBackdrop slides={slides} />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,hsl(var(--background))_8%,hsl(var(--background)/0.75)_45%,transparent_85%),linear-gradient(0deg,hsl(var(--background))_2%,transparent_45%),linear-gradient(180deg,hsl(var(--background)/0.6),transparent_25%)]"
      />
      <div aria-hidden="true" className="light-leak absolute -top-1/4 -left-1/4 -z-10 h-[80%] w-[70%]" />
      <div aria-hidden="true" className="film-grain absolute inset-0 -z-10" />

      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <div className="max-w-2xl space-y-7" data-parallax="-0.12" data-parallax-fade="">
          <p className="hero-reveal eyebrow" style={{ "--delay": "0.2s" } as CSSProperties}>
            Film and TV discovery, made in Kenya
          </p>

          <h1
            className="hero-reveal text-[2.9rem] leading-[0.98] sm:text-6xl md:text-7xl lg:text-[5.25rem]"
            style={{ "--delay": "0.35s" } as CSSProperties}
          >
            Know what to watch <em className="italic text-primary">tonight.</em>
          </h1>

          <p className="hero-reveal max-w-xl text-lg leading-relaxed text-foreground/75 md:text-xl" style={{ "--delay": "0.5s" } as CSSProperties}>
            FlixVideo learns your taste, explains every recommendation, and shows you where each title is
            streaming, for rent or to buy.
          </p>

          <div className="hero-reveal flex flex-wrap items-center gap-3 pt-1" style={{ "--delay": "0.65s" } as CSSProperties}>
            <Button size="lg" className="h-12 px-7 text-base" asChild>
              <Link href="/signup">Start free</Link>
            </Button>
            {showTop10 && (
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-foreground/25 bg-background/30 px-7 text-base backdrop-blur-sm"
                asChild
              >
                <Link href="#this-week">See this week&apos;s top 10</Link>
              </Button>
            )}
          </div>

          <p className="hero-reveal text-sm text-muted-foreground" style={{ "--delay": "0.8s" } as CSSProperties}>
            Free plan, no card needed. Upgrade any time with M-Pesa or card.
          </p>
        </div>
      </div>

    </section>
  )
}
