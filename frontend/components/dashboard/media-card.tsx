// components/dashboard/media-card.tsx
// Poster card used across the app. Whole card is a link; the watchlist
// button sits on top. Caption stays visible so it works without hover.
"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import { tmdbImage } from "@/components/landing/landing-types"
import { hrefOf, titleOf, typeOf, yearOf, type MediaItem } from "@/lib/media"
import { cn } from "@/lib/utils"
import { WatchlistButton } from "./watchlist-button"

interface MediaCardProps {
  media: MediaItem
  /** Kept for existing callers; entrance motion now lives on the row/grid */
  index?: number
  /** 0..1 watch progress, shows a bar along the bottom */
  progress?: number
  /** Short "why this" line from recommendations */
  reason?: string
  /** Large rank number beside the poster */
  rank?: number
  priority?: boolean
  className?: string
  /** Start the watchlist button in its saved state */
  saved?: boolean
  onSavedChange?: (saved: boolean) => void
  /** Replace the watchlist button with custom actions (top-right) */
  actions?: ReactNode
  /** Extra line under the year, e.g. "Watched 2 days ago" */
  note?: ReactNode
}

export function MediaCard({
  media,
  progress,
  reason,
  rank,
  priority,
  className,
  saved,
  onSavedChange,
  actions,
  note,
}: MediaCardProps) {
  const title = titleOf(media)
  const year = yearOf(media)
  const type = typeOf(media)
  const poster = tmdbImage(media.poster_path || media.backdrop_path || null, "w342")
  const rating = media.vote_average ?? 0

  return (
    <div className={cn("group relative", rank !== undefined && "pl-8", className)}>
      <div className="relative">
        {rank !== undefined && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-2 -left-8 z-10 font-display text-[4.75rem] leading-none text-foreground/90 italic [text-shadow:0_2px_20px_hsl(var(--background))]"
          >
            {rank}
          </span>
        )}

        <Link
          href={hrefOf(media)}
          className="block rounded-md focus-visible:outline-none"
          aria-label={`${title}${year ? ` (${year})` : ""}`}
        >
          <div className="relative aspect-2/3 overflow-hidden rounded-md border border-border/60 bg-muted transition-[transform,border-color,box-shadow] duration-500 ease-out group-hover:-translate-y-1.5 group-hover:border-primary/60 group-hover:shadow-[0_20px_44px_-18px_hsl(var(--primary)/0.5)] group-focus-within:border-primary/60 group-focus-visible:ring-2 group-focus-visible:ring-ring">
            {poster ? (
              <Image
                src={poster}
                alt=""
                fill
                priority={priority}
                sizes="(min-width: 1280px) 190px, (min-width: 768px) 22vw, 40vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />
            ) : (
              <div className="absolute inset-0 flex items-end p-3">
                <span className="font-display text-lg leading-tight">{title}</span>
              </div>
            )}

            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />

            {rating > 0 && (
              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums backdrop-blur-md">
                <Star className="h-3 w-3 fill-primary text-primary" aria-hidden="true" />
                {rating.toFixed(1)}
              </span>
            )}

            {reason && (
              <span className="absolute inset-x-2 bottom-2 line-clamp-2 rounded-md bg-black/70 px-2 py-1.5 text-[11px] leading-snug text-white backdrop-blur-md transition-opacity duration-300 group-hover:opacity-0">
                <span className="mr-1 font-semibold text-primary">Why:</span>
                {reason}
              </span>
            )}

            <span className="absolute right-2 bottom-3 left-2 translate-y-2 text-xs font-semibold text-primary opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              View details →
            </span>

            {progress !== undefined && progress > 0 && (
              <span className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                <span className="block h-full bg-primary" style={{ width: `${Math.min(100, progress * 100)}%` }} />
              </span>
            )}
          </div>
        </Link>
      </div>

      {actions ? (
        <div className="absolute top-2 right-2 z-10 flex gap-1.5 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 max-lg:opacity-100">
          {actions}
        </div>
      ) : (
        <WatchlistButton
          mediaType={type}
          id={media.id}
          title={title}
          initiallySaved={saved}
          onChange={onSavedChange}
          className="absolute top-2 right-2 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 max-lg:opacity-100"
        />
      )}

      <div className="mt-2.5 space-y-0.5 pr-1">
        <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">{title}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {[year, type === "tv" ? "Series" : "Film"].filter(Boolean).join(" · ")}
        </p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    </div>
  )
}
