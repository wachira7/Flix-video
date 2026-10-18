// components/landing/top10-section.tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { tmdbImage, type LandingTitle } from "./landing-types"

type Tab = "movies" | "tv"

export function Top10Section({ movies, tv }: { movies: LandingTitle[]; tv: LandingTitle[] }) {
  const [tab, setTab] = useState<Tab>(movies.length ? "movies" : "tv")
  const items = tab === "movies" ? movies : tv

  if (!movies.length && !tv.length) return null

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "movies", label: "Movies", count: movies.length },
    { id: "tv", label: "TV shows", count: tv.length },
  ]

  return (
    <section id="this-week" className="scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-5">
            <p className="eyebrow">This week</p>
            <h2 className="text-4xl leading-[1.05] md:text-5xl">Top 10 this week</h2>
          </div>

          <div role="tablist" aria-label="Choose list" className="inline-flex rounded-full border p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                id={`top10-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="top10-panel"
                disabled={!t.count}
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40",
                  tab === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <ol
          id="top10-panel"
          role="tabpanel"
          aria-labelledby={`top10-tab-${tab}`}
          className="reveal-stagger -mx-5 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 scrollbar-hide md:mx-0 md:grid md:grid-cols-5 md:gap-x-6 md:gap-y-12 md:overflow-visible md:px-0 md:pb-0"
        >
          {items.map((item, index) => {
            const poster = tmdbImage(item.poster, "w342")
            return (
              <li key={`${tab}-${item.id}`} className="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-auto">
                <Link href={item.href} className="group block focus-visible:outline-none">
                  <div className="relative pl-8">
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-2 left-1.5 z-10 font-display text-[5.5rem] leading-none text-foreground/90 italic [text-shadow:0_2px_24px_hsl(var(--background))]"
                    >
                      {index + 1}
                    </span>
                    <div className="relative aspect-2/3 overflow-hidden rounded-md border border-border/60 bg-muted transition-[transform,border-color,box-shadow] duration-500 ease-out group-hover:-translate-y-2 group-hover:border-primary/70 group-hover:shadow-[0_22px_50px_-18px_hsl(var(--primary)/0.55)] group-focus-visible:ring-2 group-focus-visible:ring-ring">
                      {poster && (
                        <Image
                          src={poster}
                          alt={`${item.title} poster`}
                          fill
                          sizes="(min-width: 768px) 200px, 40vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/85 via-black/30 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                        {item.rating > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-white tabular-nums">
                            <Star className="h-3 w-3 fill-primary text-primary" aria-hidden="true" />
                            {item.rating.toFixed(1)}
                          </span>
                        )}
                        <span className="mt-1 text-sm font-semibold text-primary">View details →</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1 pl-8">
                    <p className="truncate text-sm font-medium group-hover:text-primary">
                      <span className="sr-only">Number {index + 1}: </span>
                      {item.title}
                    </p>
                    <p className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
                      {item.year}
                      {item.rating > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-primary text-primary" aria-hidden="true" />
                          {item.rating.toFixed(1)}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ol>

        <p className="mt-8 text-xs text-muted-foreground">Ranked by TMDB weekly trending. Updated every hour.</p>
      </div>
    </section>
  )
}
