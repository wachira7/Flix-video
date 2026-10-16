// components/landing/hero-backdrop.tsx
// Crossfading backdrops of this week's top trending films, with a slow zoom
// on the active frame and a reel-style progress indicator.
"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { tmdbImage, type LandingTitle } from "./landing-data"

const SLIDE_MS = 7000

export function HeroBackdrop({ slides }: { slides: LandingTitle[] }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (slides.length < 2) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setPaused(true)
      return
    }
    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [slides.length])

  useEffect(() => {
    if (paused || slides.length < 2) return
    const t = window.setTimeout(() => setActive((i) => (i + 1) % slides.length), SLIDE_MS)
    return () => window.clearTimeout(t)
  }, [active, paused, slides.length])

  if (!slides.length) {
    return (
      <div className="hero-backdrop absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_75%_35%,hsl(var(--primary)/0.35),transparent_60%)]" />
    )
  }

  const current = slides[active]

  return (
    <>
      {/* Outer layer drifts with scroll; inner layer runs the fade-in animation */}
      <div className="absolute inset-x-0 -top-[18%] bottom-0 -z-20" aria-hidden="true" data-parallax="0.3">
        <div className="hero-backdrop absolute inset-0">
          {slides.map((slide, i) => {
            const src = tmdbImage(slide.backdrop, "w1280")
            if (!src) return null
            return (
              <div
                key={slide.id}
                className={cn(
                  "absolute inset-0 transition-opacity duration-[1600ms] ease-out",
                  i === active ? "opacity-100" : "opacity-0",
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className={cn("object-cover object-[center_30%] opacity-70", i === active && "kenburns")}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div
        className="hero-reveal absolute right-5 bottom-5 hidden w-72 md:right-8 md:block"
        style={{ "--delay": "1.2s" } as React.CSSProperties}
      >
        <p className="truncate text-right font-mono text-[11px] tracking-wide text-foreground/60" aria-live="polite">
          <span className="text-primary">#{active + 1}</span> trending this week · {current.title}
          {current.year && ` (${current.year})`}
        </p>
        {slides.length > 1 && (
          <div className="mt-2.5 flex gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show ${slide.title}`}
                aria-current={i === active}
                className="group relative h-4 flex-1 focus-visible:outline-none"
              >
                <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 overflow-hidden rounded-full bg-foreground/20 group-hover:bg-foreground/35 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  <span
                    key={`${i}-${active}`}
                    className={cn(
                      "absolute inset-y-0 left-0 bg-primary",
                      i < active && "w-full",
                      i > active && "w-0",
                      i === active && (paused ? "w-full" : "reel-progress"),
                    )}
                    style={{ "--slide-ms": `${SLIDE_MS}ms` } as React.CSSProperties}
                  />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
