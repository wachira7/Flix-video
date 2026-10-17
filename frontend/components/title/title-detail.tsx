// components/title/title-detail.tsx
// Shared layout for film and series pages.
import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import { tmdbImage } from "@/components/landing/landing-types"
import { ContentRow } from "@/components/dashboard/content-row"
import { RatingSection } from "@/components/ratings/rating-section"
import { ReviewsSection } from "@/components/reviews/reviews-section"
import type { MediaItem, MediaType } from "@/lib/media"
import { CastRow, type CastMember } from "./cast-row"
import { TitleActions } from "./title-actions"
import { WhereToWatch } from "./where-to-watch"

export interface TitleDetailData {
  mediaType: MediaType
  id: number
  title: string
  tagline?: string
  overview: string
  backdrop: string | null
  poster: string | null
  years: string
  rating: number
  voteCount: number
  certification: string | null
  length?: string
  genres: { id: number; name: string }[]
  credit?: { label: string; names: string[] }
  facts: { label: string; value: string }[]
  trailerKey?: string
  cast: CastMember[]
  similar: MediaItem[]
}

export function TitleDetail({ data }: { data: TitleDetailData }) {
  const backdrop = tmdbImage(data.backdrop, "w1280")
  const poster = tmdbImage(data.poster, "w500")
  const kindLabel = data.mediaType === "tv" ? "Series" : "Film"

  return (
    <article className="space-y-14">
      {/* Hero */}
      <section className="relative isolate -mx-4 -mt-20 overflow-hidden sm:-mx-6 lg:-mx-8">
        <div className="absolute inset-0 -z-20" aria-hidden="true">
          {backdrop && <Image src={backdrop} alt="" fill priority sizes="100vw" className="kenburns object-cover object-[center_20%]" />}
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,hsl(var(--background))_0%,hsl(var(--background)/0.88)_38%,hsl(var(--background)/0.5)_70%,hsl(var(--background)/0.2)_100%),linear-gradient(0deg,hsl(var(--background))_0%,transparent_45%),linear-gradient(180deg,hsl(var(--background)/0.75)_0%,transparent_25%)]"
        />
        <div aria-hidden="true" className="film-grain absolute inset-0 -z-10" />

        <div className="grid grid-cols-[minmax(0,1fr)] items-end gap-10 px-4 pt-36 pb-12 sm:px-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:px-12 lg:pt-44 lg:pb-16">
          {poster && (
            <div className="hero-reveal relative hidden aspect-2/3 overflow-hidden rounded-xl border border-white/10 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)] md:block" style={{ "--delay": "0.1s" } as React.CSSProperties}>
              <Image src={poster} alt={`${data.title} poster`} fill sizes="220px" className="object-cover" />
            </div>
          )}

          <div className="min-w-0 max-w-3xl space-y-5">
            <p className="hero-reveal eyebrow" style={{ "--delay": "0.15s" } as React.CSSProperties}>
              {kindLabel} · {data.years}
            </p>
            <h1 className="hero-reveal text-[2.6rem] leading-[0.98] text-balance sm:text-6xl lg:text-7xl" style={{ "--delay": "0.25s" } as React.CSSProperties}>
              {data.title}
            </h1>
            {data.tagline && (
              <p className="hero-reveal font-display text-xl text-foreground/80 italic sm:text-2xl" style={{ "--delay": "0.35s" } as React.CSSProperties}>
                {data.tagline}
              </p>
            )}

            <div className="hero-reveal flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-foreground/85 tabular-nums" style={{ "--delay": "0.4s" } as React.CSSProperties}>
              {data.rating > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
                  <span className="font-semibold text-foreground">{data.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({data.voteCount.toLocaleString()} votes)</span>
                </span>
              )}
              {data.certification && (
                <span className="rounded border border-foreground/40 px-1.5 py-px text-xs font-semibold" title="Age rating">
                  {data.certification}
                </span>
              )}
              {data.length && <span>{data.length}</span>}
              {data.genres.slice(0, 3).map((g) => (
                <Link
                  key={g.id}
                  href={`/browse?${data.mediaType === "tv" ? "type=tv&" : ""}genre=${g.id}`}
                  className="rounded-full border border-foreground/20 px-2.5 py-0.5 text-xs transition-colors hover:border-primary/60 hover:text-primary"
                >
                  {g.name}
                </Link>
              ))}
            </div>

            <p className="hero-reveal max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg" style={{ "--delay": "0.5s" } as React.CSSProperties}>
              {data.overview}
            </p>

            {data.credit && data.credit.names.length > 0 && (
              <p className="hero-reveal text-sm text-muted-foreground" style={{ "--delay": "0.55s" } as React.CSSProperties}>
                {data.credit.label} <span className="text-foreground">{data.credit.names.join(", ")}</span>
              </p>
            )}

            <div className="hero-reveal pt-2" style={{ "--delay": "0.6s" } as React.CSSProperties}>
              <TitleActions mediaType={data.mediaType} id={data.id} title={data.title} trailerKey={data.trailerKey} />
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-14">
        <div className="min-w-0 space-y-14">
          <WhereToWatch mediaType={data.mediaType} id={data.id} title={data.title} />
          <CastRow cast={data.cast} />
          <RatingSection contentType={data.mediaType} contentId={data.id} title={data.title} />
          <ReviewsSection contentType={data.mediaType} contentId={data.id} title={data.title} />
        </div>

        {data.facts.length > 0 && (
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border bg-card/60 p-6">
              <h2 className="text-2xl">Details</h2>
              <dl className="mt-4 divide-y divide-border text-sm">
                {data.facts.map((f) => (
                  <div key={f.label} className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <dt className="text-muted-foreground">{f.label}</dt>
                    <dd className="text-right font-medium">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        )}
      </div>

      <ContentRow title="More like this" items={data.similar} />
    </article>
  )
}
