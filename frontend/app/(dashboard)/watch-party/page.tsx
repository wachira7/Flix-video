// app/(dashboard)/watch-party/page.tsx
// Your watch parties, plus join-with-a-code.
"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { ArrowRight, Copy, Plus, Users } from "lucide-react"
import { toast } from "sonner"
import { watchPartyAPI, type WatchParty } from "@/lib/api/watchparty"
import { normalizeType, useTitles } from "@/lib/hooks/use-content"
import { tmdbImage } from "@/components/landing/landing-types"
import { cn } from "@/lib/utils"

type Filter = "all" | "playing" | "waiting" | "ended"
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "playing", label: "Live" },
  { id: "waiting", label: "Waiting" },
  { id: "ended", label: "Ended" },
]

const STATUS: Record<WatchParty["status"], { label: string; tone: string; live?: boolean }> = {
  playing: { label: "Live", tone: "text-success", live: true },
  paused: { label: "Paused", tone: "text-primary" },
  waiting: { label: "Waiting", tone: "text-primary" },
  ended: { label: "Ended", tone: "text-white/70" },
}

export default function WatchPartiesPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>("all")
  const [parties, setParties] = useState<WatchParty[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [code, setCode] = useState("")
  const [ending, setEnding] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setParties(null)
    setFailed(false)
    watchPartyAPI
      .getMyParties({ status: filter, limit: 50 })
      .then((r) => alive && setParties(r.parties ?? []))
      .catch(() => {
        if (!alive) return
        setFailed(true)
        setParties([])
      })
    return () => {
      alive = false
    }
  }, [filter])

  const refs = useMemo(() => parties?.map((p) => ({ type: normalizeType(p.content_type), id: p.content_id })) ?? null, [parties])
  const titles = useTitles(refs)
  const titleFor = (p: WatchParty) => titles?.find((t) => t.id === p.content_id)

  const join = (e: React.FormEvent) => {
    e.preventDefault()
    const c = code.trim().toUpperCase()
    if (c.length >= 4) router.push(`/watch-party/${c}`)
  }

  const copyLink = async (c: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/watch-party/${c}`)
      toast.success("Invite link copied")
    } catch {
      toast(`Party code: ${c}`)
    }
  }

  const end = async (p: WatchParty) => {
    try {
      await watchPartyAPI.end(p.id)
      setParties((list) => list?.map((x) => (x.id === p.id ? { ...x, status: "ended" } : x)) ?? null)
      toast("Party ended")
    } catch {
      toast.error("Couldn't end that party.")
    } finally {
      setEnding(null)
    }
  }

  return (
    <div className="space-y-10 pt-4">
      <header className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
        <div className="space-y-3">
          <p className="eyebrow">Together</p>
          <h1 className="text-4xl leading-none sm:text-5xl">
            Watch <em className="italic text-primary">parties</em>
          </h1>
          <p className="max-w-lg text-muted-foreground">Pick something, share a code, and watch the trailer in sync while you chat and react.</p>
          <Link href="/watch-party/create" className="mt-2 inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-[filter] hover:brightness-110">
            <Plus className="h-4 w-4" /> Start a party
          </Link>
        </div>
        <form onSubmit={join} className="rounded-2xl border bg-card/60 p-5">
          <label htmlFor="party-code" className="text-sm font-semibold">
            Got a code?
          </label>
          <div className="mt-3 flex gap-2">
            <input
              id="party-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              maxLength={12}
              placeholder="E.G. 7K2QXA"
              autoComplete="off"
              className="h-12 min-w-0 flex-1 rounded-lg border border-input bg-background/60 px-4 font-mono text-lg tracking-[0.2em] uppercase placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none"
            />
            <button type="submit" disabled={code.length < 4} className="flex h-12 shrink-0 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold transition-colors hover:border-primary/60 hover:text-primary disabled:opacity-40">
              Join <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </header>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl">Your parties</h2>
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={cn(
                  "rounded-full border px-3.5 py-1 text-sm transition-colors",
                  filter === f.id ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {parties === null ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : parties.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="mt-4 font-display text-3xl">{failed ? "We couldn't load your parties" : "No parties here yet"}</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {failed ? "Check your connection and try again." : "Start one from any title page, or right here."}
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false}>
              {parties.map((p, i) => {
                const t = titleFor(p)
                const bg = tmdbImage(t?.backdrop_path ?? null, "w780")
                const s = STATUS[p.status] ?? STATUS.waiting
                const open = p.status !== "ended"
                return (
                  <motion.li key={p.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}>
                    <div className="spotlight group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-primary/50">
                      <div className="relative h-28 bg-muted">
                        {bg && <Image src={bg} alt="" fill sizes="400px" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                        <div className="absolute inset-0 bg-linear-to-t from-card to-transparent" />
                        <span className={cn("absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md", s.tone)}>
                          {s.live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />}
                          {s.label}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-4">
                        <div>
                          <p className="truncate font-display text-xl leading-tight">{p.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Started {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })} · up to {p.max_participants} guests
                          </p>
                        </div>
                        <div className="mt-auto flex items-center gap-2">
                          <button type="button" onClick={() => copyLink(p.party_code)} title="Copy invite link" className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 font-mono text-xs tracking-wider transition-colors hover:border-primary/60">
                            <Copy className="h-3.5 w-3.5" /> {p.party_code}
                          </button>
                          {open && (
                            <>
                              {ending === p.id ? (
                                <span className="ml-auto flex gap-1.5">
                                  <button type="button" onClick={() => end(p)} className="h-9 rounded-lg bg-destructive px-3 text-xs font-medium text-white">End</button>
                                  <button type="button" onClick={() => setEnding(null)} className="h-9 rounded-lg border px-3 text-xs">Keep</button>
                                </span>
                              ) : (
                                <>
                                  <button type="button" onClick={() => setEnding(p.id)} className="ml-auto h-9 rounded-lg px-2.5 text-xs text-muted-foreground transition-colors hover:text-destructive">
                                    End
                                  </button>
                                  <Link href={`/watch-party/${p.party_code}`} className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:brightness-110">
                                    Open <ArrowRight className="h-3.5 w-3.5" />
                                  </Link>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  )
}
