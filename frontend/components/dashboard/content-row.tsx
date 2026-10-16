// components/dashboard/content-row.tsx
// Horizontal poster row with snap scrolling, arrow buttons that disable at
// the ends, edge fades, and a staggered entrance when it scrolls into view.
"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { MediaItem } from "@/lib/media"
import { cn } from "@/lib/utils"
import { MediaCard } from "./media-card"

interface ContentRowProps {
  title: string
  items: MediaItem[]
  subtitle?: ReactNode
  href?: string
  ranked?: boolean
  /** Optional per-item extras, keyed by TMDB id */
  progress?: Record<number, number>
  reasons?: Record<number, string>
}

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.045 } } }
const card: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export function ContentRow({ title, items, subtitle, href, ranked, progress, reasons }: ContentRowProps) {
  const track = useRef<HTMLUListElement>(null)
  const reduce = useReducedMotion()
  const [edges, setEdges] = useState({ start: true, end: false })

  const measure = useCallback(() => {
    const el = track.current
    if (!el) return
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 })
  }, [])

  useEffect(() => {
    measure()
    const el = track.current
    el?.addEventListener("scroll", measure, { passive: true })
    window.addEventListener("resize", measure)
    return () => {
      el?.removeEventListener("scroll", measure)
      window.removeEventListener("resize", measure)
    }
  }, [measure, items.length])

  const page = (dir: 1 | -1) => {
    const el = track.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" })
  }

  if (!items?.length) return null
  const shown = ranked ? items.slice(0, 10) : items

  return (
    <section className="group/row relative" aria-label={title}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-2xl leading-tight sm:text-[1.7rem]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {href && (
            <Link
              href={href}
              className="mr-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              See all
            </Link>
          )}
          {[-1, 1].map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => page(dir as 1 | -1)}
              disabled={dir === -1 ? edges.start : edges.end}
              aria-label={dir === -1 ? `Scroll ${title} left` : `Scroll ${title} right`}
              className="hidden h-8 w-8 items-center justify-center rounded-full border text-foreground transition-[opacity,background-color,border-color] duration-200 hover:border-primary/60 hover:bg-accent disabled:pointer-events-none disabled:opacity-30 md:flex"
            >
              {dir === -1 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>

      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-background to-transparent transition-opacity duration-300 sm:w-16",
            edges.start && "opacity-0"
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-background to-transparent transition-opacity duration-300 sm:w-16",
            edges.end && "opacity-0"
          )}
        />
        <motion.ul
          ref={track}
          variants={list}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pt-2 pb-3 scrollbar-hide sm:scroll-px-6 sm:gap-4 sm:px-6 lg:scroll-px-8 lg:px-8"
        >
          {shown.map((item, i) => (
            <motion.li
              key={`${item.id}-${i}`}
              variants={card}
              className={cn(
                "shrink-0 snap-start",
                ranked ? "w-[clamp(150px,19vw,224px)]" : "w-[clamp(128px,15vw,190px)]"
              )}
            >
              <MediaCard
                media={item}
                rank={ranked ? i + 1 : undefined}
                progress={progress?.[item.id]}
                reason={reasons?.[item.id]}
                priority={i < 4}
              />
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
