// components/dashboard/search-bar.tsx
// Top-bar search with live suggestions, "/" to focus, arrow-key navigation
// and recent searches (kept in this browser only).
"use client"

import { useEffect, useId, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Clock, CornerDownLeft, Film, Loader2, Search, Tv, User, X } from "lucide-react"
import { searchAPI } from "@/lib/api/search"
import { tmdbImage } from "@/components/landing/landing-types"
import { cn } from "@/lib/utils"

interface Suggestion {
  id: number
  media_type: "movie" | "tv" | "person"
  title?: string
  name?: string
  poster_path?: string | null
  profile_path?: string | null
  release_date?: string
  first_air_date?: string
  known_for_department?: string
}

const RECENT_KEY = "flix:recent-searches"

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").slice(0, 5)
  } catch {
    return []
  }
}

function saveRecent(q: string) {
  try {
    const next = [q, ...readRecent().filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 5)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {}
}

function hrefFor(s: Suggestion) {
  if (s.media_type === "person") return `/search?q=${encodeURIComponent(s.name || "")}&type=person`
  return `/${s.media_type}/${s.id}`
}

function metaFor(s: Suggestion) {
  if (s.media_type === "person") return s.known_for_department || "Person"
  const year = (s.release_date || s.first_air_date || "").slice(0, 4)
  return [s.media_type === "movie" ? "Film" : "Series", year].filter(Boolean).join(" · ")
}

export function SearchBar() {
  const router = useRouter()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Suggestion[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [cursor, setCursor] = useState(-1)

  // "/" focuses search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Debounced live search
  useEffect(() => {
    const q = query.trim()
    setCursor(-1)
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    let alive = true
    const t = setTimeout(async () => {
      try {
        const res = await searchAPI.searchMulti(q)
        if (!alive) return
        const items = ((res.results || []) as Suggestion[])
          .filter((r) => ["movie", "tv", "person"].includes(r.media_type))
          .slice(0, 6)
        setResults(items)
      } catch {
        if (alive) setResults([])
      } finally {
        if (alive) setLoading(false)
      }
    }, 250)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [query])

  const go = (href: string, saveQuery?: string) => {
    if (saveQuery) saveRecent(saveQuery)
    setOpen(false)
    setQuery("")
    inputRef.current?.blur()
    router.push(href)
  }

  const submit = () => {
    const q = query.trim()
    if (cursor >= 0 && results[cursor]) return go(hrefFor(results[cursor]), q)
    if (cursor >= 0 && !q && recent[cursor]) return go(`/search?q=${encodeURIComponent(recent[cursor])}`, recent[cursor])
    if (q) go(`/search?q=${encodeURIComponent(q)}`, q)
  }

  const options = query.trim().length >= 2 ? results.length : recent.length
  const showPanel = open && (query.trim().length >= 2 || recent.length > 0)

  return (
    <div className="relative w-full max-w-xl">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="group relative"
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={cursor >= 0 ? `${listId}-${cursor}` : undefined}
          aria-label="Search films, series and people"
          placeholder="Search films, series, people"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setRecent(readRecent())
            setOpen(true)
          }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setCursor((c) => Math.min(options - 1, c + 1))
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setCursor((c) => Math.max(-1, c - 1))
            } else if (e.key === "Escape") {
              setOpen(false)
              inputRef.current?.blur()
            }
          }}
          className="h-10 w-full rounded-full border border-input bg-card/70 pr-16 pl-10 text-sm text-foreground transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground hover:border-muted-foreground/40 focus:border-primary/60 focus:bg-card focus:ring-[3px] focus:ring-primary/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Searching" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="rounded border px-1.5 font-mono text-[10px] text-muted-foreground">/</kbd>
          )}
        </div>
      </form>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-x-0 top-12 z-50 origin-top overflow-hidden rounded-xl border bg-popover shadow-[0_24px_60px_-20px_rgb(0_0_0/0.7)]"
          >
            <ul id={listId} role="listbox" className="max-h-[60vh] overflow-y-auto p-1.5">
              {query.trim().length >= 2 ? (
                results.length > 0 ? (
                  results.map((s, i) => {
                    const img = tmdbImage((s.poster_path || s.profile_path) ?? null, "w342")
                    const Icon = s.media_type === "movie" ? Film : s.media_type === "tv" ? Tv : User
                    return (
                      <li
                        key={`${s.media_type}-${s.id}`}
                        id={`${listId}-${i}`}
                        role="option"
                        aria-selected={cursor === i}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setCursor(i)}
                        onClick={() => go(hrefFor(s), query.trim())}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors",
                          cursor === i && "bg-accent"
                        )}
                      >
                        <span
                          className={cn(
                            "relative flex h-12 w-8 shrink-0 items-center justify-center overflow-hidden bg-muted",
                            s.media_type === "person" ? "h-9 w-9 rounded-full" : "rounded-sm"
                          )}
                        >
                          {img ? (
                            <Image src={img} alt="" fill sizes="40px" className="object-cover" />
                          ) : (
                            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{s.title || s.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{metaFor(s)}</span>
                        </span>
                        {cursor === i && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />}
                      </li>
                    )
                  })
                ) : (
                  !loading && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matches for “{query.trim()}”</li>
                )
              ) : (
                <>
                  <li className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground" role="presentation">
                    Recent searches
                  </li>
                  {recent.map((r, i) => (
                    <li
                      key={r}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={cursor === i}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => go(`/search?q=${encodeURIComponent(r)}`, r)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        cursor === i && "bg-accent"
                      )}
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      {r}
                    </li>
                  ))}
                </>
              )}
            </ul>
            {query.trim().length >= 2 && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(`/search?q=${encodeURIComponent(query.trim())}`, query.trim())}
                className="flex w-full items-center justify-between border-t px-4 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                See all results for “{query.trim()}”
                <kbd className="rounded border px-1.5 font-mono text-[10px]">Enter</kbd>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
