// app/(dashboard)/search/page.tsx
// Full search: live results as you type, tabs with counts, people with the
// titles they're known for, year filter for films/series, infinite scroll.
"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Clock, Loader2, Search, SearchX, X } from "lucide-react"
import { searchAPI } from "@/lib/api/search"
import { tmdbClient } from "@/lib/api/tmdb"
import { tmdbImage } from "@/components/landing/landing-types"
import { MediaCard } from "@/components/dashboard/media-card"
import type { MediaItem } from "@/lib/media"
import { cn } from "@/lib/utils"

type Tab = "all" | "movie" | "tv" | "person"

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "movie", label: "Films" },
  { id: "tv", label: "Series" },
  { id: "person", label: "People" },
]

interface Person {
  id: number
  name: string
  profile_path: string | null
  known_for_department?: string
  known_for?: (MediaItem & { media_type: string })[]
  media_type?: string
}

type Result = (MediaItem & { media_type?: string }) | Person

const RECENT_KEY = "flix:recent-searches"
const isPerson = (r: Result): r is Person => (r as Person).media_type === "person" || "known_for" in r

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").slice(0, 6)
  } catch {
    return []
  }
}

function saveRecent(q: string) {
  try {
    const next = [q, ...readRecent().filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 6)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {}
}

async function fetchTab(tab: Tab, q: string, page: number, year: string) {
  const y = year ? Number(year) : undefined
  switch (tab) {
    case "movie":
      return searchAPI.searchMovies(q, page, y ? { year: y } : undefined)
    case "tv":
      return searchAPI.searchTV(q, page, y ? { first_air_date_year: y } : undefined)
    case "person":
      return searchAPI.searchPeople(q, page)
    default:
      return searchAPI.searchMulti(q, page)
  }
}

function PersonCard({ person }: { person: Person }) {
  const src = tmdbImage(person.profile_path, "w185")
  const known = (person.known_for ?? []).filter((k) => k.poster_path).slice(0, 3)
  return (
    <div className="group flex h-full gap-4 rounded-xl border bg-card/60 p-4 transition-colors hover:border-primary/40">
      <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-transparent transition-[box-shadow] group-hover:ring-primary/50">
        {src ? (
          <Image src={src} alt="" fill sizes="80px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center font-display text-3xl text-muted-foreground">{person.name.charAt(0)}</span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-xl leading-tight">{person.name}</p>
        <p className="text-xs text-muted-foreground">{person.known_for_department || "Person"}</p>
        {known.length > 0 && (
          <div className="mt-3 flex gap-2">
            {known.map((k) => (
              <Link
                key={`${k.media_type}-${k.id}`}
                href={`/${k.media_type === "tv" ? "tv" : "movie"}/${k.id}`}
                title={"title" in k ? k.title : (k as { name?: string }).name}
                className="relative aspect-2/3 w-10 overflow-hidden rounded-sm border border-border/60 transition-transform hover:-translate-y-0.5 hover:border-primary/60"
              >
                <Image src={tmdbImage(k.poster_path, "w92")!} alt="" fill sizes="40px" className="object-cover" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SearchPageInner() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const reduce = useReducedMotion()
  const inputRef = useRef<HTMLInputElement>(null)

  const urlQuery = params.get("q") ?? ""
  const urlType = params.get("type")
  const [input, setInput] = useState(urlQuery)
  const [tab, setTab] = useState<Tab>(urlType === "person" ? "person" : urlType === "movie" || urlType === "tv" ? urlType : "all")
  const [year, setYear] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [counts, setCounts] = useState<Partial<Record<Tab, number>>>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const reqId = useRef(0)
  const sentinel = useRef<HTMLDivElement>(null)

  const q = urlQuery.trim()

  // Before searching: recent searches + this week's trending titles as ideas
  useEffect(() => {
    setRecent(readRecent())
    tmdbClient
      .getTrending("movie", "week")
      .then((r) => setSuggestions((r.results as { title?: string }[]).slice(0, 8).flatMap((m) => (m.title ? [m.title] : []))))
      .catch(() => {})
    if (!urlQuery) inputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Typing updates the URL (debounced); the URL drives the search
  useEffect(() => {
    if (input.trim() === q) return
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString())
      if (input.trim()) next.set("q", input.trim())
      else next.delete("q")
      router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false })
    }, 350)
    return () => clearTimeout(t)
  }, [input, q, params, pathname, router])

  const run = useCallback(
    async (pageNum: number) => {
      if (!q) return
      const id = ++reqId.current
      setLoading(true)
      try {
        const res = await fetchTab(tab, q, pageNum, year)
        if (id !== reqId.current) return
        const items = ((res.results ?? []) as Result[]).filter((r) =>
          isPerson(r) ? true : (r as MediaItem).poster_path
        )
        setResults((prev) => (pageNum === 1 ? items : [...prev, ...items]))
        setPage(pageNum)
        setTotalPages(Math.min(res.total_pages ?? 1, 20))
        if (pageNum === 1) saveRecent(q)
      } catch {
        if (id === reqId.current && pageNum === 1) setResults([])
      } finally {
        if (id === reqId.current) setLoading(false)
      }
    },
    [q, tab, year]
  )

  useEffect(() => {
    setResults([])
    run(1)
  }, [run])

  // Tab counts for the current query
  useEffect(() => {
    if (!q) return setCounts({})
    let alive = true
    Promise.allSettled((["movie", "tv", "person"] as Tab[]).map((t) => fetchTab(t, q, 1, ""))).then((all) => {
      if (!alive) return
      const next: Partial<Record<Tab, number>> = {}
      ;(["movie", "tv", "person"] as Tab[]).forEach((t, i) => {
        const r = all[i]
        if (r.status === "fulfilled") next[t] = r.value.total_results ?? r.value.results?.length ?? 0
      })
      next.all = (next.movie ?? 0) + (next.tv ?? 0) + (next.person ?? 0)
      setCounts(next)
    })
    return () => {
      alive = false
    }
  }, [q])

  // Infinite scroll
  const canMore = !loading && page < totalPages && results.length > 0
  useEffect(() => {
    const el = sentinel.current
    if (!el || !canMore) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && run(page + 1), { rootMargin: "600px" })
    io.observe(el)
    return () => io.disconnect()
  }, [canMore, page, run])

  const people = useMemo(() => results.filter(isPerson), [results])
  const titles = useMemo(() => results.filter((r) => !isPerson(r)) as MediaItem[], [results])
  const years = useMemo(() => Array.from({ length: 40 }, (_, i) => String(new Date().getFullYear() + 1 - i)), [])

  const startSearch = (text: string) => {
    setInput(text)
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-8 pt-4">
      <header className="space-y-6">
        <p className="eyebrow">Search</p>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            if (input.trim()) router.replace(`${pathname}?q=${encodeURIComponent(input.trim())}`, { scroll: false })
          }}
          className="group relative"
        >
          <Search className="pointer-events-none absolute top-1/2 left-5 h-6 w-6 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Films, series, actors, directors…"
            aria-label="Search films, series and people"
            className="h-16 w-full rounded-2xl border border-input bg-card/60 pr-14 pl-14 font-display text-2xl text-foreground transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/70 hover:border-muted-foreground/40 focus:border-primary/60 focus:bg-card focus:ring-4 focus:ring-primary/10 focus:outline-none sm:h-20 sm:text-3xl [&::-webkit-search-cancel-button]:hidden"
          />
          <div className="absolute top-1/2 right-5 -translate-y-1/2">
            {loading && page === 1 ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-label="Searching" />
            ) : input ? (
              <button type="button" onClick={() => startSearch("")} aria-label="Clear search" className="rounded-full p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </form>

        {q && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div role="tablist" aria-label="Result type" className="inline-flex rounded-full border bg-card/60 p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative z-10 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    tab === t.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab === t.id && (
                    <motion.span layoutId="search-tab" className="absolute inset-0 -z-10 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                  )}
                  {t.label}
                  {counts[t.id] !== undefined && <span className="ml-1.5 tabular-nums opacity-70">{counts[t.id]! > 999 ? "999+" : counts[t.id]}</span>}
                </button>
              ))}
            </div>
            {(tab === "movie" || tab === "tv") && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Year
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                >
                  <option value="">Any</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
      </header>

      {!q ? (
        <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-10 md:grid-cols-2">
          {recent.length > 0 && (
            <section>
              <h2 className="text-2xl">Recent searches</h2>
              <ul className="mt-4 space-y-1">
                {recent.map((r) => (
                  <li key={r}>
                    <button type="button" onClick={() => startSearch(r)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent">
                      <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {suggestions.length > 0 && (
            <section>
              <h2 className="text-2xl">
                Trending <em className="italic text-primary">searches</em>
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => startSearch(s)}
                    className="rounded-full border px-4 py-2 text-sm transition-colors hover:border-primary/60 hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>
          )}
        </motion.div>
      ) : !loading && results.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-16 text-center">
          <SearchX className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-3xl">Nothing for “{q}”</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Check the spelling, try fewer words, or ask the AI to find it from a description.
          </p>
          <Link href={`/ai-chat?prompt=${encodeURIComponent(`Help me find a film or series: ${q}`)}`} className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:brightness-110">
            Ask FlixVideo AI
          </Link>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={`${tab}-${q}-${year}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
            {people.length > 0 && (
              <section aria-label="People">
                {tab === "all" && <h2 className="mb-4 text-2xl">People</h2>}
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {(tab === "all" ? people.slice(0, 3) : people).map((p, i) => (
                    <motion.li key={p.id} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: (i % 12) * 0.03 } }}>
                      <PersonCard person={p} />
                    </motion.li>
                  ))}
                </ul>
              </section>
            )}
            {titles.length > 0 && (
              <section aria-label="Titles">
                {tab === "all" && people.length > 0 && <h2 className="mb-4 text-2xl">Films & series</h2>}
                <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
                  {titles.map((t, i) => (
                    <motion.li
                      key={`${t.media_type ?? tab}-${t.id}`}
                      initial={reduce ? false : { opacity: 0, y: 18, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, delay: (i % 20) * 0.025 } }}
                    >
                      <MediaCard media={tab === "movie" || tab === "tv" ? { ...t, media_type: tab } : t} />
                    </motion.li>
                  ))}
                  {loading &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <li key={`sk-${i}`} aria-hidden="true">
                        <div className="aspect-2/3 animate-pulse rounded-md bg-muted" />
                      </li>
                    ))}
                </ul>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <div ref={sentinel} className="flex justify-center py-2">
        {loading && page > 1 && <Loader2 className="h-5 w-5 animate-spin text-primary" aria-label="Loading more" />}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  )
}
