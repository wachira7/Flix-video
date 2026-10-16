// app/(dashboard)/watch-party/create/page.tsx
// Start a watch party: pick a title (search, or pre-filled from a title
// page), season/episode for series, privacy and guest limit by plan.
"use client"

import { Suspense, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Globe, Loader2, Lock, Minus, Plus, Search, X } from "lucide-react"
import { toast } from "sonner"
import { watchPartyAPI } from "@/lib/api/watchparty"
import { searchAPI } from "@/lib/api/search"
import { tmdbClient } from "@/lib/api/tmdb"
import { useCurrentUser } from "@/lib/hooks/use-auth"
import { fetchTitle } from "@/lib/hooks/use-content"
import { titleOf, typeOf, yearOf, type MediaItem, type MediaType } from "@/lib/media"
import { tmdbImage } from "@/components/landing/landing-types"
import { cn } from "@/lib/utils"

// Mirrors party_participants in backend/src/config/plans.js
const GUEST_LIMIT = { free: 5, basic: 10, premium: 50 } as const

function TitlePicker({ onPick }: { onPick: (item: MediaItem) => void }) {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const text = q.trim()
    if (text.length < 2) return setResults([])
    setLoading(true)
    let alive = true
    const t = setTimeout(() => {
      searchAPI
        .searchMulti(text)
        .then((r) => alive && setResults(((r.results ?? []) as MediaItem[]).filter((x) => (x.media_type === "movie" || x.media_type === "tv") && x.poster_path).slice(0, 8)))
        .catch(() => alive && setResults([]))
        .finally(() => alive && setLoading(false))
    }, 250)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [q])

  return (
    <div className="space-y-3">
      <div className="group relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary" aria-hidden="true" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for a film or series"
          aria-label="Search for a film or series"
          className="h-14 w-full rounded-xl border border-input bg-card/60 pr-12 pl-12 text-base focus:border-primary/60 focus:ring-4 focus:ring-primary/10 focus:outline-none"
        />
        {loading && <Loader2 className="absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 animate-spin text-primary" aria-label="Searching" />}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {results.map((r, i) => (
          <motion.li key={`${r.media_type}-${r.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}>
            <button type="button" onClick={() => onPick(r)} className="flex w-full items-center gap-3 rounded-xl border bg-card/40 p-2 text-left transition-colors hover:border-primary/50 hover:bg-card">
              <span className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image src={tmdbImage(r.poster_path, "w92")!} alt="" fill sizes="44px" className="object-cover" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{titleOf(r)}</span>
                <span className="text-xs text-muted-foreground">
                  {typeOf(r) === "tv" ? "Series" : "Film"} {yearOf(r) && `· ${yearOf(r)}`}
                </span>
              </span>
            </button>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

function CreateParty() {
  const router = useRouter()
  const params = useSearchParams()
  const { plan } = useCurrentUser()
  const limit = GUEST_LIMIT[plan ?? "free"]

  const [item, setItem] = useState<MediaItem | null>(null)
  const [seasons, setSeasons] = useState(0)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [isPublic, setIsPublic] = useState(false)
  const [guests, setGuests] = useState(5)
  const [busy, setBusy] = useState(false)

  // Pre-filled from a title page (?type=&id=)
  useEffect(() => {
    const type = params.get("type") === "tv" ? "tv" : params.get("type") === "movie" ? "movie" : null
    const id = Number(params.get("id"))
    if (type && id) fetchTitle({ type, id }).then((t) => t && setItem(t))
  }, [params])

  useEffect(() => setGuests((g) => Math.min(g, limit)), [limit])

  const type: MediaType | null = item ? typeOf(item) : null
  useEffect(() => {
    if (type !== "tv" || !item) return setSeasons(0)
    tmdbClient
      .getTVDetails(item.id)
      .then((d) => setSeasons(d.number_of_seasons ?? 0))
      .catch(() => setSeasons(0))
  }, [type, item])

  const create = async () => {
    if (!item || !type) return
    setBusy(true)
    try {
      const r = await watchPartyAPI.create({
        content_type: type,
        content_id: item.id,
        title: titleOf(item),
        season_number: type === "tv" ? season : undefined,
        episode_number: type === "tv" ? episode : undefined,
        is_public: isPublic,
        max_participants: guests,
      })
      router.push(`/watch-party/${r.party.party_code}`)
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(message || "Couldn't start the party. Please try again.")
      setBusy(false)
    }
  }

  const backdrop = tmdbImage(item?.backdrop_path ?? null, "w780")

  return (
    <div className="mx-auto max-w-2xl space-y-8 pt-4">
      <Link href="/watch-party" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Watch parties
      </Link>
      <header className="space-y-3">
        <p className="eyebrow">New party</p>
        <h1 className="text-4xl leading-tight sm:text-5xl">
          What are we <em className="italic text-primary">watching?</em>
        </h1>
        <p className="text-muted-foreground">Pick a title, invite people with a code, and watch the trailer together in sync while you chat.</p>
      </header>

      <AnimatePresence mode="wait">
        {item ? (
          <motion.div key="picked" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative overflow-hidden rounded-2xl border">
            {backdrop && <Image src={backdrop} alt="" fill sizes="700px" className="object-cover opacity-30" />}
            <div className="relative flex items-center gap-4 bg-linear-to-r from-background via-background/80 to-transparent p-4">
              <span className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-muted shadow-lg">
                {item.poster_path && <Image src={tmdbImage(item.poster_path, "w185")!} alt="" fill sizes="64px" className="object-cover" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-2xl">{titleOf(item)}</p>
                <p className="text-sm text-muted-foreground">
                  {type === "tv" ? "Series" : "Film"} {yearOf(item) && `· ${yearOf(item)}`}
                </p>
              </div>
              <button type="button" onClick={() => setItem(null)} aria-label="Choose a different title" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TitlePicker onPick={setItem} />
          </motion.div>
        )}
      </AnimatePresence>

      {item && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {type === "tv" && (
            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-2 text-sm">
                <span className="font-medium">Season</span>
                <select value={season} onChange={(e) => setSeason(Number(e.target.value))} className="h-11 w-full rounded-lg border border-input bg-card px-3 focus:border-primary/60 focus:outline-none">
                  {Array.from({ length: Math.max(seasons, 1) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Season {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium">Episode</span>
                <input type="number" min={1} max={200} value={episode} onChange={(e) => setEpisode(Math.max(1, Number(e.target.value) || 1))} className="h-11 w-full rounded-lg border border-input bg-card px-3 focus:border-primary/60 focus:outline-none" />
              </label>
            </div>
          )}

          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-medium">Who can join?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { pub: false, icon: Lock, title: "Invite only", body: "People need your code or link." },
                { pub: true, icon: Globe, title: "Public", body: "Anyone with the code, and it can be listed." },
              ].map((o) => (
                <button
                  key={o.title}
                  type="button"
                  onClick={() => setIsPublic(o.pub)}
                  aria-pressed={isPublic === o.pub}
                  className={cn("flex gap-3 rounded-xl border p-4 text-left transition-colors", isPublic === o.pub ? "border-primary/70 bg-primary/10" : "hover:border-muted-foreground/50")}
                >
                  <o.icon className={cn("mt-0.5 h-5 w-5", isPublic === o.pub ? "text-primary" : "text-muted-foreground")} />
                  <span>
                    <span className="block text-sm font-semibold">{o.title}</span>
                    <span className="text-sm text-muted-foreground">{o.body}</span>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="text-sm font-semibold">Guests</p>
              <p className="text-sm text-muted-foreground">
                Your {plan ?? "free"} plan allows up to {limit}.{" "}
                {limit < 50 && (
                  <Link href="/subscription" className="text-primary hover:underline">
                    Need more?
                  </Link>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setGuests((g) => Math.max(2, g - 1))} aria-label="Fewer guests" className="flex h-9 w-9 items-center justify-center rounded-full border hover:bg-accent disabled:opacity-40" disabled={guests <= 2}>
                <Minus className="h-4 w-4" />
              </button>
              <motion.span key={guests} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-8 text-center font-display text-3xl tabular-nums">
                {guests}
              </motion.span>
              <button type="button" onClick={() => setGuests((g) => Math.min(limit, g + 1))} aria-label="More guests" className="flex h-9 w-9 items-center justify-center rounded-full border hover:bg-accent disabled:opacity-40" disabled={guests >= limit}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={create}
            disabled={busy}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition-[filter] hover:brightness-110 disabled:opacity-70"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Starting your party" : "Start the party"}
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default function CreateWatchPartyPage() {
  return (
    <Suspense fallback={null}>
      <CreateParty />
    </Suspense>
  )
}
