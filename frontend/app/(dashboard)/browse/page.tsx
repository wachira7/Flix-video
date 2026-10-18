// app/(dashboard)/browse/page.tsx
// One place to browse films and series: by list (trending, popular, top
// rated, coming soon / on the air) or by genre. Filters live in the URL.
"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { tmdbClient, type Movie, type TVShow } from "@/lib/api/tmdb"
import { MediaCard } from "@/components/dashboard/media-card"
import { cn } from "@/lib/utils"

type Kind = "movie" | "tv"
type ListId = "trending" | "popular" | "top-rated" | "new"

const LISTS: Record<Kind, { id: ListId; label: string; heading: [string, string] }[]> = {
  movie: [
    { id: "trending", label: "Trending", heading: ["Trending", "films"] },
    { id: "popular", label: "Popular", heading: ["Popular", "films"] },
    { id: "top-rated", label: "Top rated", heading: ["Top rated", "films"] },
    { id: "new", label: "Coming soon", heading: ["Coming", "soon"] },
  ],
  tv: [
    { id: "trending", label: "Trending", heading: ["Trending", "series"] },
    { id: "popular", label: "Popular", heading: ["Popular", "series"] },
    { id: "top-rated", label: "Top rated", heading: ["Top rated", "series"] },
    { id: "new", label: "On the air", heading: ["On the air", "now"] },
  ],
}

const MAX_PAGES = 20

async function fetchPage(kind: Kind, list: ListId, genre: number | null, page: number) {
  if (genre) return tmdbClient.discover(kind, { genre, page })
  switch (list) {
    case "trending":
      return tmdbClient.getTrending(kind, "week", page)
    case "top-rated":
      return tmdbClient.getTopRated(kind, page)
    case "new":
      return kind === "movie" ? tmdbClient.getUpcoming(page) : tmdbClient.getOnTheAir(page)
    default:
      return tmdbClient.getPopular(kind, page)
  }
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-[background-color,border-color,color] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function Browse() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const reduce = useReducedMotion()

  const kind: Kind = params.get("type") === "tv" ? "tv" : "movie"
  const genre = params.get("genre") ? Number(params.get("genre")) : null
  const listParam = params.get("list") as ListId | null
  const list: ListId = LISTS[kind].some((l) => l.id === listParam) ? (listParam as ListId) : "trending"

  const [genres, setGenres] = useState<{ id: number; name: string }[]>([])
  const [items, setItems] = useState<(Movie | TVShow)[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)
  const requestId = useRef(0)

  const setQuery = (next: Record<string, string | null>) => {
    const q = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(next)) (v === null ? q.delete(k) : q.set(k, v))
    router.replace(`${pathname}?${q}`, { scroll: false })
  }

  useEffect(() => {
    tmdbClient.getGenres(kind).then(setGenres).catch(() => setGenres([]))
  }, [kind])

  const load = useCallback(
    async (pageNum: number) => {
      const id = ++requestId.current
      setLoading(true)
      setError(false)
      try {
        const res = await fetchPage(kind, list, genre, pageNum)
        if (id !== requestId.current) return
        const results = (res.results as (Movie | TVShow)[]).filter((r) => r.poster_path)
        setItems((prev) => {
          const merged = pageNum === 1 ? results : [...prev, ...results]
          return merged.filter((m, i, all) => all.findIndex((x) => x.id === m.id) === i)
        })
        setPage(pageNum)
        setTotalPages(Math.min(res.total_pages, MAX_PAGES))
      } catch {
        if (id === requestId.current) setError(true)
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    },
    [kind, list, genre]
  )

  // Reset whenever the filters change
  useEffect(() => {
    setItems([])
    load(1)
  }, [load])

  // Infinite scroll
  const canLoadMore = !loading && !error && page < totalPages
  useEffect(() => {
    const el = sentinel.current
    if (!el || !canLoadMore) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && load(page + 1), { rootMargin: "600px" })
    io.observe(el)
    return () => io.disconnect()
  }, [canLoadMore, load, page])

  const genreName = genres.find((g) => g.id === genre)?.name
  const listMeta = LISTS[kind].find((l) => l.id === list)!
  const heading: [string, string] = genreName
    ? [genreName, kind === "movie" ? "films" : "series"]
    : listMeta.heading

  return (
    <div className="space-y-8 pt-4">
      <header className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="eyebrow">Browse</p>
            <motion.h1
              key={heading.join(" ")}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-4xl leading-none sm:text-5xl"
            >
              {heading[0]} <em className="italic text-primary">{heading[1]}</em>
            </motion.h1>
          </div>

          <div role="tablist" aria-label="Films or series" className="inline-flex rounded-full border bg-card/60 p-1">
            {(["movie", "tv"] as Kind[]).map((k) => (
              <button
                key={k}
                role="tab"
                type="button"
                aria-selected={kind === k}
                onClick={() => setQuery({ type: k === "movie" ? null : "tv", genre: null })}
                className={cn(
                  "relative z-10 rounded-full px-5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  kind === k ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {kind === k && (
                  <motion.span
                    layoutId="browse-kind"
                    className="absolute inset-0 -z-10 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                {k === "movie" ? "Films" : "Series"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2" aria-label="Lists">
            {LISTS[kind].map((l) => (
              <Chip key={l.id} active={!genre && list === l.id} onClick={() => setQuery({ list: l.id === "trending" ? null : l.id, genre: null })}>
                {l.label}
              </Chip>
            ))}
          </div>
          {genres.length > 0 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" aria-label="Genres">
              {genres.map((g) => (
                <Chip key={g.id} active={genre === g.id} onClick={() => setQuery({ genre: genre === g.id ? null : String(g.id), list: null })}>
                  {g.name}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </header>

      {error && items.length === 0 ? (
        <div className="rounded-xl border p-10 text-center">
          <p className="font-display text-2xl">We couldn&apos;t load this list</p>
          <p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => load(1)}
            className="mt-5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Try again
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
          {items.map((item, i) => (
            <motion.li
              key={item.id}
              initial={reduce ? false : { opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, delay: (i % 20) * 0.025, ease: [0.22, 1, 0.36, 1] }}
            >
              <MediaCard media={{ ...item, media_type: kind }} priority={i < 6} />
            </motion.li>
          ))}
          {loading &&
            Array.from({ length: items.length ? 6 : 18 }).map((_, i) => (
              <li key={`skeleton-${i}`} aria-hidden="true">
                <div className="aspect-2/3 animate-pulse rounded-md bg-muted" />
                <div className="mt-2.5 h-3.5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="mt-1.5 h-3 w-1/3 animate-pulse rounded bg-muted" />
              </li>
            ))}
        </ul>
      )}

      <div ref={sentinel} className="flex justify-center py-4">
        {loading && items.length > 0 && <Loader2 className="h-5 w-5 animate-spin text-primary" aria-label="Loading more" />}
        {!loading && page >= totalPages && items.length > 0 && (
          <p className="text-sm text-muted-foreground">You&apos;ve reached the end of this list.</p>
        )}
      </div>
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={null}>
      <Browse />
    </Suspense>
  )
}
