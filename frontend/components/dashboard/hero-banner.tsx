// components/dashboard/hero-banner.tsx
// Full-bleed rotating hero for the app home. Crossfading backdrops with a
// slow push-in, reel-style progress, swipe on touch, arrow keys on focus.
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Info, Play, Star } from "lucide-react"
import { tmdbImage } from "@/components/landing/landing-types"
import { hrefOf, titleOf, typeOf, yearOf, type MediaItem } from "@/lib/media"
import { cn } from "@/lib/utils"
import { TrailerDialog } from "./trailer-dialog"
import { WatchlistButton } from "./watchlist-button"

const SLIDE_MS = 8000
const ease = [0.22, 1, 0.36, 1] as const

interface HeroBannerProps {
  movies: MediaItem[]
  eyebrow?: string
}

export function HeroBanner({ movies, eyebrow = "Trending this week" }: HeroBannerProps) {
  const slides = movies.filter((m) => m.backdrop_path).slice(0, 6)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const touchX = useRef<number | null>(null)

  const go = useCallback((dir: 1 | -1) => setActive((i) => (i + dir + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true)
    const onVis = () => setPaused(document.hidden)
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [])

  const halted = paused || trailerOpen
  useEffect(() => {
    if (halted || slides.length < 2) return
    const t = setTimeout(() => go(1), SLIDE_MS)
    return () => clearTimeout(t)
  }, [active, halted, slides.length, go])

  if (!slides.length) return null
  const item = slides[active]
  const title = titleOf(item)
  const type = typeOf(item)
  const year = yearOf(item)

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured titles"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1)
        if (e.key === "ArrowLeft") go(-1)
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
      className="relative isolate -mx-4 -mt-20 flex min-h-[min(78svh,760px)] items-end overflow-hidden focus-visible:outline-none sm:-mx-6 lg:-mx-8"
    >
      {/* Backdrops */}
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        {slides.map((s, i) => {
          const src = tmdbImage(s.backdrop_path, "w1280")
          return (
            <div
              key={s.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-[1400ms] ease-out",
                i === active ? "opacity-100" : "opacity-0"
              )}
            >
              {src && (
                <Image
                  src={src}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className={cn("object-cover object-[center_25%]", i === active && "kenburns")}
                />
              )}
            </div>
          )
        })}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,hsl(var(--background))_0%,hsl(var(--background)/0.8)_30%,transparent_70%),linear-gradient(0deg,hsl(var(--background))_0%,hsl(var(--background)/0.4)_35%,transparent_60%),linear-gradient(180deg,hsl(var(--background)/0.7)_0%,transparent_22%)]"
      />
      <div aria-hidden="true" className="film-grain absolute inset-0 -z-10" />

      <div className="w-full px-4 pt-32 pb-10 sm:px-6 lg:px-12 lg:pb-14">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease }}
            className="max-w-2xl space-y-5"
            aria-live="polite"
          >
            <p className="eyebrow">
              {eyebrow} · #{active + 1}
            </p>
            <h1 className="text-[2.6rem] leading-[0.98] text-balance sm:text-6xl lg:text-7xl">{title}</h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/80 tabular-nums">
              {item.vote_average > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <Star className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
                  {item.vote_average.toFixed(1)}
                </span>
              )}
              {year && <span>{year}</span>}
              <span className="rounded border border-foreground/30 px-1.5 py-px text-xs">
                {type === "tv" ? "Series" : "Film"}
              </span>
            </p>
            <p className="line-clamp-3 max-w-xl text-base leading-relaxed text-foreground/75 sm:text-lg">{item.overview}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setTrailerOpen(true)}
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-110 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                Watch trailer
              </button>
              <Link
                href={hrefOf(item)}
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-foreground/25 bg-background/30 px-5 text-[15px] font-semibold backdrop-blur-sm transition-colors hover:border-foreground/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Info className="h-4 w-4" aria-hidden="true" />
                Details
              </Link>
              <WatchlistButton key={item.id} variant="pill" mediaType={type} id={item.id} title={title} />
            </div>
          </motion.div>
        </AnimatePresence>

        {slides.length > 1 && (
          <div className="mt-10 flex max-w-xs gap-1.5" role="tablist" aria-label="Choose featured title">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={titleOf(s)}
                onClick={() => setActive(i)}
                className="group relative h-5 flex-1 focus-visible:outline-none"
              >
                <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-foreground/20 transition-colors group-hover:bg-foreground/35 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  <span
                    key={`${i}-${active}-${halted}`}
                    className={cn(
                      "absolute inset-y-0 left-0 bg-primary",
                      i < active && "w-full",
                      i > active && "w-0",
                      i === active && (halted ? "w-full" : "reel-progress")
                    )}
                    style={{ "--slide-ms": `${SLIDE_MS}ms` } as React.CSSProperties}
                  />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <TrailerDialog
        key={`${type}-${item.id}`}
        open={trailerOpen}
        onOpenChange={setTrailerOpen}
        title={title}
        mediaType={type}
        id={item.id}
      />
    </section>
  )
}
