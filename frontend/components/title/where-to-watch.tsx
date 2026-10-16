// components/title/where-to-watch.tsx
// Where a title is available in Kenya: our own platform data first (it can
// carry prices and deep links), then JustWatch data via TMDB.
"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { ExternalLink, Tv } from "lucide-react"
import { streamingAPI, type StreamingOption } from "@/lib/api/streaming"
import { tmdbClient } from "@/lib/api/tmdb"
import { tmdbImage } from "@/components/landing/landing-types"
import type { MediaType } from "@/lib/media"
import { cn } from "@/lib/utils"

type Kind = "stream" | "free" | "rent" | "buy"

interface Offer {
  key: string
  name: string
  logo: string | null
  href: string | null
  price?: string
  quality?: string
}

const KIND_LABEL: Record<Kind, string> = { stream: "Stream", free: "Free", rent: "Rent", buy: "Buy" }

function formatPrice(o: StreamingOption) {
  if (!o.price) return undefined
  return `${o.currency || "KES"} ${o.price.toLocaleString()}`
}

export function WhereToWatch({ mediaType, id, title }: { mediaType: MediaType; id: number; title: string }) {
  const [offers, setOffers] = useState<Record<Kind, Offer[]> | null>(null)
  const [source, setSource] = useState<"flixvideo" | "justwatch" | null>(null)
  const [tmdbLink, setTmdbLink] = useState<string | null>(null)
  const [kind, setKind] = useState<Kind>("stream")

  useEffect(() => {
    let alive = true
    const empty = (): Record<Kind, Offer[]> => ({ stream: [], free: [], rent: [], buy: [] })

    const fromOurApi = (mediaType === "movie" ? streamingAPI.getMovieAvailability(id) : streamingAPI.getTVAvailability(id))
      .then((r) => {
        const out = empty()
        for (const k of ["stream", "free", "rent", "buy"] as Kind[]) {
          out[k] = (r.options?.[k] ?? []).map((o) => ({
            key: `${o.platformSlug}-${k}`,
            name: o.platform,
            logo: o.logo ?? null,
            href: o.url || o.websiteUrl || null,
            price: formatPrice(o),
            quality: o.quality,
          }))
        }
        return out
      })
      .catch(() => empty())

    const fromTmdb = tmdbClient
      .getWatchProviders(mediaType, id)
      .then((r) => {
        const out = empty()
        if (!r) return { out, link: null }
        const map = (list: typeof r.flatrate, k: Kind) =>
          (list ?? [])
            .sort((a, b) => a.display_priority - b.display_priority)
            .map((p) => ({ key: `${p.provider_id}-${k}`, name: p.provider_name, logo: tmdbImage(p.logo_path, "w92"), href: r.link }))
        out.stream = map(r.flatrate, "stream")
        out.free = [...map(r.free, "free"), ...map(r.ads, "free")]
        out.rent = map(r.rent, "rent")
        out.buy = map(r.buy, "buy")
        return { out, link: r.link }
      })
      .catch(() => ({ out: empty(), link: null }))

    Promise.all([fromOurApi, fromTmdb]).then(([ours, theirs]) => {
      if (!alive) return
      const oursCount = Object.values(ours).flat().length
      const chosen = oursCount ? ours : theirs.out
      setOffers(chosen)
      setSource(oursCount ? "flixvideo" : Object.values(theirs.out).flat().length ? "justwatch" : null)
      setTmdbLink(theirs.link)
      const first = (["stream", "free", "rent", "buy"] as Kind[]).find((k) => chosen[k].length)
      if (first) setKind(first)
    })
    return () => {
      alive = false
    }
  }, [mediaType, id])

  const kinds = offers ? (Object.keys(KIND_LABEL) as Kind[]).filter((k) => offers[k].length) : []

  return (
    <section id="where-to-watch" aria-labelledby="wtw-heading" className="scroll-mt-24 rounded-2xl border bg-card/60 p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">In Kenya</p>
          <h2 id="wtw-heading" className="mt-2 text-3xl">
            Where to <em className="italic text-primary">watch</em>
          </h2>
        </div>
        {kinds.length > 1 && (
          <div role="tablist" aria-label="Ways to watch" className="inline-flex rounded-full border bg-background/60 p-1">
            {kinds.map((k) => (
              <button
                key={k}
                role="tab"
                type="button"
                aria-selected={kind === k}
                onClick={() => setKind(k)}
                className={cn(
                  "relative z-10 rounded-full px-3.5 py-1 text-sm font-medium transition-colors",
                  kind === k ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {kind === k && (
                  <motion.span layoutId="wtw-tab" className="absolute inset-0 -z-10 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                )}
                {KIND_LABEL[k]} <span className="opacity-70">{offers![k].length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        {!offers ? (
          <div className="flex gap-3" aria-label="Loading where to watch">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 w-44 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : kinds.length === 0 ? (
          <div className="flex items-start gap-4 rounded-xl bg-background/50 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Tv className="h-5 w-5" />
            </span>
            <div className="text-sm">
              <p className="font-medium">Not available to stream in Kenya right now</p>
              <p className="mt-1 text-muted-foreground">
                Add {title} to your watchlist and we&apos;ll keep it handy for when it lands on a service.
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.ul
              key={kind}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {offers![kind].map((o, i) => (
                <motion.li key={o.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}>
                  <a
                    href={o.href ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-xl border bg-background/60 p-3 transition-[border-color,transform,background-color] duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-background"
                  >
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {o.logo && <Image src={o.logo} alt="" fill sizes="44px" className="object-cover" unoptimized={!o.logo.includes("image.tmdb.org")} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{o.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[o.price ?? KIND_LABEL[kind], o.quality].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </AnimatePresence>
        )}
      </div>

      {source === "justwatch" && (
        <p className="mt-5 text-xs text-muted-foreground">
          Availability from{" "}
          <a href={tmdbLink ?? "https://www.justwatch.com"} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
            JustWatch
          </a>
          , via TMDB. Links open the provider list for {title}.
        </p>
      )}
    </section>
  )
}
