// app/(dashboard)/lists/[listId]/page.tsx
// A list: its titles (looked up on TMDB; the API stores ids only), ranked
// numbering, inline add / rename / visibility / remove for the owner.
"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Check, Globe, Link2, Loader2, Lock, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { listsAPI, type List, type ListItem } from "@/lib/api/lists"
import { searchAPI } from "@/lib/api/search"
import { getUser } from "@/lib/auth"
import { normalizeType, useTitles } from "@/lib/hooks/use-content"
import { titleOf, typeOf, yearOf, type MediaItem } from "@/lib/media"
import { tmdbImage } from "@/components/landing/landing-types"
import { MediaCard } from "@/components/dashboard/media-card"
import { cn } from "@/lib/utils"

function AddTitles({ onAdd, existing }: { onAdd: (item: MediaItem) => Promise<void>; existing: Set<string> }) {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<MediaItem[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    const text = q.trim()
    if (text.length < 2) return setResults([])
    let alive = true
    const t = setTimeout(() => {
      searchAPI
        .searchMulti(text)
        .then((r) => alive && setResults(((r.results ?? []) as MediaItem[]).filter((x) => (x.media_type === "movie" || x.media_type === "tv") && x.poster_path).slice(0, 6)))
        .catch(() => alive && setResults([]))
    }, 250)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [q])

  return (
    <div className="space-y-3 rounded-2xl border bg-card/60 p-4">
      <div className="group relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for a film or series to add"
          aria-label="Search for a title to add"
          className="h-11 w-full rounded-lg border border-input bg-background/60 pr-3 pl-10 text-sm focus:border-primary/60 focus:outline-none"
        />
      </div>
      {results.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {results.map((r) => {
            const key = `${typeOf(r)}:${r.id}`
            const added = existing.has(key)
            return (
              <li key={key}>
                <button
                  type="button"
                  disabled={added || busy === key}
                  onClick={async () => {
                    setBusy(key)
                    await onAdd(r)
                    setBusy(null)
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border bg-background/40 p-2 text-left transition-colors hover:border-primary/50 disabled:opacity-60"
                >
                  <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-sm bg-muted">
                    <Image src={tmdbImage(r.poster_path, "w92")!} alt="" fill sizes="40px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{titleOf(r)}</span>
                    <span className="text-xs text-muted-foreground">
                      {typeOf(r) === "tv" ? "Series" : "Film"} {yearOf(r) && `· ${yearOf(r)}`}
                    </span>
                  </span>
                  {busy === key ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : added ? <Check className="h-4 w-4 text-success" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>()
  const router = useRouter()
  const [me] = useState(() => getUser() as { id?: string } | null)
  const [list, setList] = useState<(List & { username?: string; full_name?: string }) | null>(null)
  const [items, setItems] = useState<ListItem[]>([])
  const [failed, setFailed] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: "", description: "" })
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    listsAPI
      .getDetails(listId)
      .then(({ list }) => {
        setList(list)
        setItems(list.items ?? [])
        setDraft({ title: list.title, description: list.description ?? "" })
      })
      .catch(() => setFailed(true))
  }, [listId])

  const ordered = useMemo(
    () => [...items].sort((a, b) => (list?.is_ranked ? (a.rank_order ?? 0) - (b.rank_order ?? 0) : 0)),
    [items, list?.is_ranked]
  )
  const refs = useMemo(() => ordered.map((i) => ({ type: normalizeType(i.content_type), id: Number(i.content_id) })), [ordered])
  const titles = useTitles(refs)
  const existing = useMemo(() => new Set(refs.map((r) => `${r.type}:${r.id}`)), [refs])
  const isOwner = !!list && !!me?.id && list.user_id === me.id

  const add = async (item: MediaItem) => {
    try {
      const { item: created } = await listsAPI.addItem(listId, { contentType: typeOf(item), contentId: item.id, rank_order: items.length + 1 })
      setItems((list) => [...list, created])
      toast.success(`Added ${titleOf(item)}`)
    } catch (e) {
      const message = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? ""
      toast[/already/i.test(message) ? "message" : "error"](/already/i.test(message) ? `${titleOf(item)} is already on this list` : "Couldn't add it.")
    }
  }

  const remove = async (item: ListItem, name: string) => {
    setItems((list) => list.filter((i) => i.id !== item.id))
    try {
      await listsAPI.removeItem(listId, item.id)
      toast(`Removed ${name}`)
    } catch {
      setItems((list) => [...list, item])
      toast.error("Couldn't remove it.")
    }
  }

  const saveDetails = async (patch: Partial<{ title: string; description: string; is_public: boolean }>) => {
    try {
      const { list: updated } = await listsAPI.update(listId, patch)
      setList((l) => (l ? { ...l, ...updated } : l))
      return true
    } catch {
      toast.error("Couldn't save the list.")
      return false
    }
  }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied")
    } catch {
      toast(window.location.href)
    }
  }

  if (failed) {
    return (
      <div className="mx-auto max-w-md pt-16 text-center">
        <h1 className="text-4xl">List not found</h1>
        <p className="mt-3 text-muted-foreground">It may be private or deleted.</p>
        <Link href="/library?tab=lists" className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">
          Your lists
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 pt-4">
      <Link href="/library?tab=lists" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Lists
      </Link>

      {!list ? (
        <div className="h-28 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <header className="space-y-4">
          <p className="eyebrow flex items-center gap-2">
            {list.is_public ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {list.is_public ? "Public list" : "Private list"}
            {list.is_ranked && " · Ranked"}
            {!isOwner && list.username && ` · by @${list.username}`}
          </p>
          {editing ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!draft.title.trim()) return
                if (await saveDetails({ title: draft.title.trim(), description: draft.description.trim() })) setEditing(false)
              }}
              className="max-w-2xl space-y-3"
            >
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={100} aria-label="List title" className="w-full rounded-lg border border-input bg-card/60 px-3 py-2 font-display text-3xl focus:border-primary/60 focus:outline-none" />
              <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={500} rows={2} placeholder="What's this list about?" aria-label="List description" className="w-full resize-none rounded-lg border border-input bg-card/60 px-3 py-2 text-sm focus:border-primary/60 focus:outline-none" />
              <div className="flex gap-2">
                <button type="submit" className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Save</button>
                <button type="button" onClick={() => setEditing(false)} className="h-10 rounded-lg border px-4 text-sm hover:bg-accent">Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="text-4xl leading-tight sm:text-5xl">{list.title}</h1>
              {list.description && <p className="max-w-2xl text-muted-foreground">{list.description}</p>}
            </>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="mr-2 text-sm text-muted-foreground tabular-nums">
              {items.length} {items.length === 1 ? "title" : "titles"}
            </span>
            {isOwner && (
              <button type="button" onClick={() => setAdding((a) => !a)} className={cn("inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold", adding ? "border" : "bg-primary text-primary-foreground hover:brightness-110")}>
                {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {adding ? "Done adding" : "Add titles"}
              </button>
            )}
            {isOwner && !editing && (
              <button type="button" onClick={() => setEditing(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-accent">
                <Pencil className="h-4 w-4" /> Rename
              </button>
            )}
            {isOwner && (
              <button
                type="button"
                onClick={async () => (await saveDetails({ is_public: !list.is_public })) && toast.success(list.is_public ? "Only you can see this list now" : "Anyone with the link can see this list")}
                className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-accent"
              >
                {list.is_public ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                {list.is_public ? "Make private" : "Make public"}
              </button>
            )}
            {list.is_public && (
              <button type="button" onClick={share} className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-accent">
                <Link2 className="h-4 w-4" /> Share
              </button>
            )}
            {isOwner &&
              (confirmDelete ? (
                <span className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await listsAPI.delete(listId)
                        toast("List deleted")
                        router.push("/library?tab=lists")
                      } catch {
                        toast.error("Couldn't delete the list.")
                      }
                    }}
                    className="h-10 rounded-lg bg-destructive px-3 font-medium text-white"
                  >
                    Delete list
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="h-10 rounded-lg border px-3 hover:bg-accent">Keep</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Delete list" className="flex h-10 w-10 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              ))}
          </div>
        </header>
      )}

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <AddTitles onAdd={add} existing={existing} />
          </motion.div>
        )}
      </AnimatePresence>

      {list && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-6 py-14 text-center">
          <p className="font-display text-3xl">Nothing here yet</p>
          <p className="mt-2 text-sm text-muted-foreground">{isOwner ? "Add films and series with “Add titles”, or from any title page." : "The owner hasn't added anything yet."}</p>
        </div>
      ) : !titles ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: Math.min(items.length || 5, 10) }).map((_, i) => (
            <div key={i} className="aspect-2/3 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : (
        <motion.ul layout className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <AnimatePresence initial={false}>
            {titles.map((t, i) => {
              const item = ordered.find((x) => Number(x.content_id) === t.id && normalizeType(x.content_type) === typeOf(t))
              return (
                <motion.li key={`${typeOf(t)}-${t.id}`} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.03 } }} exit={{ opacity: 0, scale: 0.9 }}>
                  <MediaCard
                    media={t}
                    rank={list?.is_ranked ? i + 1 : undefined}
                    note={item?.notes}
                    actions={
                      isOwner && item ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            remove(item, titleOf(t))
                          }}
                          aria-label={`Remove ${titleOf(t)} from list`}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-black/55 text-white backdrop-blur-md hover:bg-black/80"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : undefined
                    }
                  />
                </motion.li>
              )
            })}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  )
}
