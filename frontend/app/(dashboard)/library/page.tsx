// app/(dashboard)/library/page.tsx
// Everything the user has saved, in one place: watchlist, favorites,
// watch history and their own lists. Tab lives in the URL (?tab=).
"use client"

import { Suspense, useEffect, useMemo, useState, type ComponentType } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { Bookmark, Clock, Heart, ListPlus, ListVideo, Lock, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { favoritesAPI } from "@/lib/api/favorites"
import { listsAPI, type List } from "@/lib/api/lists"
import { userAPI } from "@/lib/api/user"
import { watchlistAPI } from "@/lib/api/watchlist"
import { fetchTitle, normalizeType, useTitles, type ContentRef } from "@/lib/hooks/use-content"
import { titleOf, typeOf, type MediaItem } from "@/lib/media"
import { tmdbImage } from "@/components/landing/landing-types"
import { MediaCard } from "@/components/dashboard/media-card"
import { cn } from "@/lib/utils"

type TabId = "watchlist" | "favorites" | "history" | "lists"

const TABS: { id: TabId; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "watchlist", label: "Watchlist", icon: Bookmark },
  { id: "favorites", label: "Favorites", icon: Heart },
  { id: "history", label: "History", icon: Clock },
  { id: "lists", label: "Lists", icon: ListVideo },
]

interface HistoryEntry {
  contentType: string
  contentId: string
  progressSeconds?: number
  durationSeconds?: number
  completed?: boolean
  updatedAt?: string
}

interface LibraryData {
  watchlist: ContentRef[] | null
  favorites: ContentRef[] | null
  history: HistoryEntry[] | null
  lists: List[] | null
  totals: Partial<Record<TabId, number>>
  failed: Partial<Record<TabId, boolean>>
}

const toRefs = (rows: { content_type: string; content_id: number }[] = []): ContentRef[] =>
  rows.map((r) => ({ type: normalizeType(r.content_type), id: Number(r.content_id) }))

/* ---------- shared bits ---------- */

function Empty({
  icon: Icon,
  title,
  children,
  cta,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
  cta?: { href: string; label: string }
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-16 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-3xl">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{children}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[filter] hover:brightness-110"
        >
          {cta.label}
        </Link>
      )}
    </motion.div>
  )
}

function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <div className="aspect-2/3 animate-pulse rounded-md bg-muted" />
          <div className="mt-2.5 h-3.5 w-3/4 animate-pulse rounded bg-muted" />
        </li>
      ))}
    </ul>
  )
}

function Failed({ retry }: { retry: () => void }) {
  return (
    <div className="rounded-xl border p-10 text-center">
      <p className="font-display text-2xl">We couldn&apos;t load this</p>
      <p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p>
      <button type="button" onClick={retry} className="mt-5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
        Try again
      </button>
    </div>
  )
}

function TitleGrid({
  items,
  renderCard,
}: {
  items: MediaItem[]
  renderCard: (item: MediaItem, i: number) => React.ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <motion.ul layout className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
      <AnimatePresence initial={!reduce}>
        {items.map((item, i) => (
          <motion.li
            key={`${typeOf(item)}-${item.id}`}
            layout
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, delay: Math.min(i, 12) * 0.03 } }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
          >
            {renderCard(item, i)}
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  )
}

function IconAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-black/55 text-white backdrop-blur-md transition-[transform,background-color] hover:scale-110 hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {children}
    </button>
  )
}

/* ---------- tabs ---------- */

function SavedTab({ kind, refs, onRemoved }: { kind: "watchlist" | "favorites"; refs: ContentRef[]; onRemoved: (ref: ContentRef) => void }) {
  const items = useTitles(refs)
  if (!refs.length) {
    return kind === "watchlist" ? (
      <Empty icon={Bookmark} title="Nothing saved yet" cta={{ href: "/browse", label: "Find something to watch" }}>
        Tap the + on any poster to save it here for later.
      </Empty>
    ) : (
      <Empty icon={Heart} title="No favorites yet" cta={{ href: "/browse?list=top-rated", label: "Browse top rated" }}>
        Mark the films and series you love. They also make your AI picks sharper.
      </Empty>
    )
  }
  if (!items) return <GridSkeleton count={Math.min(refs.length, 12)} />

  const removeFavorite = async (item: MediaItem) => {
    const ref = { type: typeOf(item), id: item.id }
    onRemoved(ref)
    try {
      await favoritesAPI.removeFavorite(ref.type, ref.id)
      toast(`Removed ${titleOf(item)} from favorites`)
    } catch {
      toast.error("Couldn't remove it. Please try again.")
    }
  }

  return (
    <TitleGrid
      items={items}
      renderCard={(item) =>
        kind === "watchlist" ? (
          <MediaCard
            media={item}
            saved
            onSavedChange={(saved) => !saved && onRemoved({ type: typeOf(item), id: item.id })}
          />
        ) : (
          <MediaCard
            media={item}
            actions={
              <IconAction label={`Remove ${titleOf(item)} from favorites`} onClick={() => removeFavorite(item)}>
                <Heart className="h-4 w-4 fill-primary text-primary" />
              </IconAction>
            }
          />
        )
      }
    />
  )
}

function HistoryTab({ entries, onChange }: { entries: HistoryEntry[]; onChange: (next: HistoryEntry[]) => void }) {
  const [confirmClear, setConfirmClear] = useState(false)
  const refs = useMemo(
    () => entries.map((e) => ({ type: normalizeType(e.contentType), id: Number(e.contentId) })),
    [entries]
  )
  const items = useTitles(refs)

  if (!entries.length) {
    return (
      <Empty icon={Clock} title="No history yet" cta={{ href: "/dashboard", label: "Go to Home" }}>
        Trailers and titles you watch will show up here, so you can pick up where you left off.
      </Empty>
    )
  }
  if (!items) return <GridSkeleton count={Math.min(entries.length, 12)} />

  const entryFor = (item: MediaItem) =>
    entries.find((e) => Number(e.contentId) === item.id && normalizeType(e.contentType) === typeOf(item))

  const remove = async (item: MediaItem) => {
    const entry = entryFor(item)
    if (!entry) return
    onChange(entries.filter((e) => e !== entry))
    try {
      await userAPI.deleteWatchHistoryItem(entry.contentType, item.id)
    } catch {
      toast.error("Couldn't remove it. Please try again.")
    }
  }

  const clearAll = async () => {
    const previous = entries
    onChange([])
    setConfirmClear(false)
    try {
      await userAPI.clearWatchHistory()
      toast("Watch history cleared")
    } catch {
      onChange(previous)
      toast.error("Couldn't clear your history. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <AnimatePresence mode="wait" initial={false}>
          {confirmClear ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="text-muted-foreground">Clear all {entries.length} items?</span>
              <button type="button" onClick={clearAll} className="rounded-lg bg-destructive px-3 py-1.5 font-medium text-white hover:brightness-110">
                Clear history
              </button>
              <button type="button" onClick={() => setConfirmClear(false)} className="rounded-lg border px-3 py-1.5 hover:bg-accent">
                Cancel
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="ask"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Clear history
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <TitleGrid
        items={items}
        renderCard={(item) => {
          const e = entryFor(item)
          const progress = e?.durationSeconds ? (e.progressSeconds ?? 0) / e.durationSeconds : undefined
          return (
            <MediaCard
              media={item}
              progress={e?.completed ? 1 : progress}
              note={e?.updatedAt ? `Watched ${formatDistanceToNow(new Date(e.updatedAt), { addSuffix: true })}` : undefined}
              actions={
                <IconAction label={`Remove ${titleOf(item)} from history`} onClick={() => remove(item)}>
                  <X className="h-4 w-4" />
                </IconAction>
              }
            />
          )
        }}
      />
    </div>
  )
}

function ListsTab({ lists }: { lists: List[] }) {
  const reduce = useReducedMotion()
  const [details, setDetails] = useState<Record<string, List>>({})
  const [covers, setCovers] = useState<Record<string, string[]>>({})

  // The list endpoint doesn't include items, so load each list's details
  useEffect(() => {
    let alive = true
    lists.slice(0, 24).forEach(async (l) => {
      try {
        const { list } = await listsAPI.getDetails(l.id)
        if (!alive) return
        setDetails((d) => ({ ...d, [l.id]: list }))
        const firstRefs = (list.items ?? []).slice(0, 4).map((it) => ({ type: normalizeType(it.content_type), id: it.content_id }))
        const titles = await Promise.all(firstRefs.map(fetchTitle))
        if (alive) setCovers((c) => ({ ...c, [l.id]: titles.flatMap((t) => (t?.poster_path ? [t.poster_path] : [])) }))
      } catch {
        // leave the card without a cover
      }
    })
    return () => {
      alive = false
    }
  }, [lists])

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      <motion.li initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/lists/create"
          className="group flex h-full min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90">
            <ListPlus className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium">New list</span>
        </Link>
      </motion.li>
      {lists.map((l, i) => {
        const posters = covers[l.id] ?? []
        const count = details[l.id]?.items?.length
        return (
          <motion.li
            key={l.id}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { delay: (i + 1) * 0.04 } }}
          >
            <Link
              href={`/lists/${l.id}`}
              className="spotlight group block h-full overflow-hidden rounded-xl border bg-card transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-primary/50"
            >
              <div className="relative grid h-40 grid-cols-4 gap-px overflow-hidden bg-muted">
                {[0, 1, 2, 3].map((n) => (
                  <div key={n} className="relative bg-secondary">
                    {posters[n] && (
                      <Image
                        src={tmdbImage(posters[n], "w342")!}
                        alt=""
                        fill
                        sizes="120px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                  </div>
                ))}
                <div className="absolute inset-0 bg-linear-to-t from-card via-card/10 to-transparent" />
              </div>
              <div className="space-y-1 p-4">
                <p className="flex items-center gap-2 font-display text-xl leading-tight">
                  <span className="truncate">{l.title}</span>
                  {!l.is_public && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Private" />}
                </p>
                <p className="text-xs text-muted-foreground">
                  {count === undefined ? "Loading…" : `${count} ${count === 1 ? "title" : "titles"}`}
                  {l.is_ranked && " · Ranked"}
                </p>
                {l.description && <p className="line-clamp-2 pt-1 text-sm text-muted-foreground">{l.description}</p>}
              </div>
            </Link>
          </motion.li>
        )
      })}
    </ul>
  )
}

/* ---------- page ---------- */

function Library() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const tabParam = params.get("tab") as TabId | null
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "watchlist"

  const [data, setData] = useState<LibraryData>({
    watchlist: null,
    favorites: null,
    history: null,
    lists: null,
    totals: {},
    failed: {},
  })
  const [attempt, setAttempt] = useState(0)

  // Fetch every tab's ids up front so each tab shows its count
  useEffect(() => {
    let alive = true
    const set = (patch: Partial<LibraryData>) =>
      alive && setData((d) => ({ ...d, ...patch, totals: { ...d.totals, ...patch.totals }, failed: { ...d.failed, ...patch.failed } }))

    watchlistAPI
      .getWatchlist()
      .then((r) => set({ watchlist: toRefs(r.watchlist), totals: { watchlist: r.total ?? r.watchlist?.length } }))
      .catch(() => set({ watchlist: [], failed: { watchlist: true } }))
    favoritesAPI
      .getFavorites()
      .then((r) => set({ favorites: toRefs(r.favorites), totals: { favorites: r.total ?? r.favorites?.length } }))
      .catch(() => set({ favorites: [], failed: { favorites: true } }))
    userAPI
      .getWatchHistory({ limit: 60 })
      .then((r) => set({ history: r.history ?? [], totals: { history: r.history?.length ?? 0 } }))
      .catch(() => set({ history: [], failed: { history: true } }))
    listsAPI
      .getMyLists(1, 50)
      .then((r) => set({ lists: r.lists ?? [], totals: { lists: r.total ?? r.lists?.length } }))
      .catch(() => set({ lists: [], failed: { lists: true } }))

    return () => {
      alive = false
    }
  }, [attempt])

  const selectTab = (id: TabId) => router.replace(`${pathname}${id === "watchlist" ? "" : `?tab=${id}`}`, { scroll: false })

  const dropRef = (key: "watchlist" | "favorites") => (ref: ContentRef) =>
    setData((d) => ({
      ...d,
      [key]: d[key]?.filter((r) => !(r.id === ref.id && r.type === ref.type)) ?? null,
      totals: { ...d.totals, [key]: Math.max(0, (d.totals[key] ?? 1) - 1) },
    }))

  const retry = () => {
    setData((d) => ({ ...d, failed: {}, [tab]: null }))
    setAttempt((n) => n + 1)
  }

  let body: React.ReactNode
  if (data.failed[tab]) body = <Failed retry={retry} />
  else if (tab === "watchlist") body = data.watchlist ? <SavedTab kind="watchlist" refs={data.watchlist} onRemoved={dropRef("watchlist")} /> : <GridSkeleton />
  else if (tab === "favorites") body = data.favorites ? <SavedTab kind="favorites" refs={data.favorites} onRemoved={dropRef("favorites")} /> : <GridSkeleton />
  else if (tab === "history")
    body = data.history ? (
      <HistoryTab
        entries={data.history}
        onChange={(history) => setData((d) => ({ ...d, history, totals: { ...d.totals, history: history.length } }))}
      />
    ) : (
      <GridSkeleton />
    )
  else body = data.lists ? <ListsTab lists={data.lists} /> : <GridSkeleton count={6} />

  return (
    <div className="space-y-8 pt-4">
      <header className="space-y-6">
        <div className="space-y-3">
          <p className="eyebrow">Your library</p>
          <h1 className="text-4xl leading-none sm:text-5xl">
            Saved for <em className="italic text-primary">later.</em>
          </h1>
        </div>

        <div role="tablist" aria-label="Library sections" className="-mx-4 flex gap-1 overflow-x-auto border-b px-4 scrollbar-hide sm:mx-0 sm:px-0">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id
            const total = data.totals[id]
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => selectTab(id)}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 px-4 pt-2 pb-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-primary")} />
                {label}
                {total !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-px text-[11px] tabular-nums",
                      active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {total}
                  </span>
                )}
                {active && (
                  <motion.span
                    layoutId="library-tab"
                    className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 480, damping: 38 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          {body}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default function LibraryPage() {
  return (
    <Suspense fallback={null}>
      <Library />
    </Suspense>
  )
}
