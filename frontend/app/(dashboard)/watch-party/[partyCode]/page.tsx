// app/(dashboard)/watch-party/[partyCode]/page.tsx
// Party room: the title's trailer plays in sync (the host controls it,
// guests follow), with live chat, reactions and who's here.
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Check, Copy, Crown, LogOut, MessageSquare, Send, Users, Volume2, VolumeX } from "lucide-react"
import { toast } from "sonner"
import { watchPartyAPI, type WatchParty } from "@/lib/api/watchparty"
import { watchPartySocket } from "@/lib/socket/watchparty-socket"
import { getUser } from "@/lib/auth"
import { displayName, type CurrentUser } from "@/lib/hooks/use-auth"
import { fetchTitle, normalizeType } from "@/lib/hooks/use-content"
import { useYouTubePlayer, YT_STATE } from "@/lib/hooks/use-youtube-player"
import { tmdbClient } from "@/lib/api/tmdb"
import { pickTrailer, titleOf, type MediaItem } from "@/lib/media"
import { tmdbImage } from "@/components/landing/landing-types"
import { cn } from "@/lib/utils"

interface Participant {
  socketId: string
  userId: string
  username: string
}

interface Message {
  id?: string
  userId: string
  username: string
  message: string
  timestamp: string
  type?: "text" | "system" | "reaction"
}

const REACTIONS = ["😂", "😮", "😍", "🔥", "👏", "😭"]

function Floating({ items }: { items: { id: number; emoji: string; x: number }[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {items.map((r) => (
          <motion.span
            key={r.id}
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -260, scale: [0.6, 1.3, 1, 1], x: [0, 12, -10, 6] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.4, ease: "easeOut" }}
            className="absolute bottom-6 text-4xl drop-shadow-lg"
            style={{ left: `${r.x}%` }}
          >
            {r.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default function PartyRoomPage() {
  const { partyCode } = useParams<{ partyCode: string }>()
  const router = useRouter()
  // Read once: getUser() returns a new object every call, which used to
  // re-run the socket effect (leave + rejoin) on every render
  const [me] = useState<CurrentUser | null>(() => getUser())
  const myName = displayName(me)

  const [party, setParty] = useState<WatchParty | null>(null)
  const [title, setTitle] = useState<MediaItem | null>(null)
  const [videoKey, setVideoKey] = useState<string | null | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState("")
  const [typing, setTyping] = useState<string[]>([])
  const [panel, setPanel] = useState<"chat" | "people">("chat")
  const [muted, setMuted] = useState(true)
  const [floating, setFloating] = useState<{ id: number; emoji: string; x: number }[]>([])
  const [copied, setCopied] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const chatEnd = useRef<HTMLDivElement>(null)

  const isHost = !!party && !!me?.id && party.host_user_id === me.id

  // Party + title + trailer
  useEffect(() => {
    let alive = true
    watchPartyAPI
      .getByCode(partyCode)
      .then(async ({ party }) => {
        if (!alive) return
        setParty(party)
        const type = normalizeType(party.content_type)
        const [t, videos] = await Promise.all([
          fetchTitle({ type, id: party.content_id }),
          (type === "tv" ? tmdbClient.getTVVideos(party.content_id) : tmdbClient.getMovieVideos(party.content_id)).catch(() => []),
        ])
        if (!alive) return
        setTitle(t)
        setVideoKey(pickTrailer(videos) ?? null)
      })
      .catch(() => alive && setLoadError("This party doesn't exist or has ended."))
    return () => {
      alive = false
    }
  }, [partyCode])

  const float = useCallback((emoji: string) => {
    const id = Date.now() + Math.random()
    setFloating((f) => [...f, { id, emoji, x: 10 + Math.random() * 80 }])
    setTimeout(() => setFloating((f) => f.filter((r) => r.id !== id)), 2500)
  }, [])

  // Synced player. Host has native controls; guests follow the host.
  const { host: playerHost, player, ready } = useYouTubePlayer({
    videoId: videoKey,
    controls: isHost,
    muted: !isHost,
    onStateChange: (state, p) => {
      if (!isHost) return
      if (state === YT_STATE.PLAYING) watchPartySocket.play(p.getCurrentTime())
      if (state === YT_STATE.PAUSED) watchPartySocket.pause(p.getCurrentTime())
    },
  })

  // Host reports position so late joiners land in the right place
  useEffect(() => {
    if (!isHost || !ready) return
    const t = setInterval(() => player.current && watchPartySocket.updateTimestamp(player.current.getCurrentTime()), 5000)
    return () => clearInterval(t)
  }, [isHost, ready, player])

  // Guests: jump to the party's saved position once ready
  useEffect(() => {
    if (!ready || isHost || !party || !player.current) return
    if (party.video_position) player.current.seekTo(party.video_position, true)
    if (party.status === "playing") player.current.playVideo()
  }, [ready, isHost, party, player])

  // Socket
  useEffect(() => {
    if (!party || !me?.id) return
    watchPartySocket.connect()
    watchPartySocket.joinParty({ partyId: party.id, userId: me.id, username: myName })

    const system = (message: string, timestamp: string) =>
      setMessages((m) => [...m, { userId: "system", username: "", message, timestamp, type: "system" }])

    watchPartySocket.onPartyState((data) => setParticipants(data.participants))
    watchPartySocket.onUserJoined((d) => system(`${d.username} joined`, d.timestamp))
    watchPartySocket.onUserLeft((d) => system(`${d.username} left`, d.timestamp))
    watchPartySocket.onPlay((d) => {
      if (party.host_user_id === me.id) return
      player.current?.seekTo(d.timestamp, true)
      player.current?.playVideo()
    })
    watchPartySocket.onPause((d) => {
      if (party.host_user_id === me.id) return
      player.current?.seekTo(d.timestamp, true)
      player.current?.pauseVideo()
    })
    watchPartySocket.onSeek((d) => {
      if (party.host_user_id !== me.id) player.current?.seekTo(d.timestamp, true)
    })
    watchPartySocket.onChatMessage((d) =>
      setMessages((m) => [...m, { id: d.id, userId: d.userId, username: d.username, message: d.message, timestamp: d.timestamp }])
    )
    watchPartySocket.onChatHistory((d) =>
      setMessages(
        (d.messages ?? []).map((msg: { id: string; user_id: string; username?: string; email?: string; content: string; created_at: string }) => ({
          id: msg.id,
          userId: msg.user_id,
          username: msg.username || msg.email?.split("@")[0] || "Guest",
          message: msg.content,
          timestamp: msg.created_at,
        }))
      )
    )
    watchPartySocket.onReaction((d) => {
      float(d.emoji)
      setMessages((m) => [...m, { userId: d.userId, username: d.username, message: d.emoji, timestamp: d.timestamp, type: "reaction" }])
    })
    watchPartySocket.onUserTyping((d) => {
      setTyping((t) => (t.includes(d.username) ? t : [...t, d.username]))
      setTimeout(() => setTyping((t) => t.filter((u) => u !== d.username)), 3000)
    })
    watchPartySocket.onUserStopTyping((d) => setTyping((t) => t.filter((u) => u !== d.username)))
    watchPartySocket.onError((e) => toast.error(e?.message || "Connection problem. Trying to reconnect…"))
    watchPartySocket.getChatHistory(50)

    return () => {
      watchPartySocket.leaveParty()
      watchPartySocket.removeAllListeners()
    }
  }, [party, me?.id, myName, float, player])

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [messages])

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    watchPartySocket.sendMessage({ message: text })
    watchPartySocket.stopTyping()
    setDraft("")
  }

  const react = (emoji: string) => {
    watchPartySocket.sendReaction({ emoji })
  }

  const invite = async () => {
    const link = `${window.location.origin}/watch-party/${partyCode}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Invite link copied")
    } catch {
      toast(`Share this code: ${partyCode}`)
    }
  }

  const leave = async () => {
    if (party) await watchPartyAPI.leave(party.id).catch(() => {})
    router.push("/watch-party")
  }

  const end = async () => {
    if (!party) return
    try {
      await watchPartyAPI.end(party.id)
      toast("Party ended")
      router.push("/watch-party")
    } catch {
      toast.error("Couldn't end the party. Please try again.")
    }
  }

  const toggleMute = () => {
    if (!player.current) return
    if (player.current.isMuted()) player.current.unMute()
    else player.current.mute()
    setMuted(player.current.isMuted())
  }

  const name = title ? titleOf(title) : party?.title
  const backdrop = tmdbImage(title?.backdrop_path ?? null, "w1280")
  const people = useMemo(() => {
    const seen = new Set<string>()
    return participants.filter((p) => (seen.has(p.userId) ? false : (seen.add(p.userId), true)))
  }, [participants])

  if (loadError) {
    return (
      <div className="mx-auto max-w-md pt-20 text-center">
        <h1 className="text-4xl">Party not found</h1>
        <p className="mt-3 text-muted-foreground">{loadError}</p>
        <Link href="/watch-party" className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">
          Back to watch parties
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5 pt-2">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/watch-party" aria-label="Back to watch parties" className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Watch party</p>
          <h1 className="truncate text-2xl leading-tight sm:text-3xl">{name ?? " "}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden -space-x-2 sm:flex" aria-label={`${people.length} watching`}>
            {people.slice(0, 5).map((p) => (
              <span key={p.userId} title={p.username} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-secondary text-xs font-semibold uppercase">
                {p.username.charAt(0)}
              </span>
            ))}
          </div>
          <button type="button" onClick={invite} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-[filter] hover:brightness-110">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="font-mono tracking-wider">{partyCode}</span>
          </button>
          {isHost ? (
            confirmEnd ? (
              <span className="flex items-center gap-2 text-sm">
                <button type="button" onClick={end} className="h-10 rounded-lg bg-destructive px-3 font-medium text-white hover:brightness-110">
                  End for everyone
                </button>
                <button type="button" onClick={() => setConfirmEnd(false)} className="h-10 rounded-lg border px-3 hover:bg-accent">
                  Cancel
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmEnd(true)} className="h-10 rounded-lg border px-3 text-sm transition-colors hover:border-destructive/60 hover:text-destructive">
                End party
              </button>
            )
          ) : (
            <button type="button" onClick={leave} aria-label="Leave party" className="flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-colors hover:bg-accent">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Player */}
        <div className="space-y-3">
          <div className="relative aspect-video overflow-hidden rounded-2xl border bg-black">
            {backdrop && !ready && <Image src={backdrop} alt="" fill sizes="70vw" className="object-cover opacity-40" />}
            <div ref={playerHost} className={cn("absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full", !isHost && "pointer-events-none")} />
            {videoKey === null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <p className="font-display text-2xl">No trailer for this title yet</p>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">You can still chat and react together while you watch it on your own service.</p>
              </div>
            )}
            {!isHost && ready && (
              <div className="absolute right-3 bottom-3">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute" : "Mute"}
                  className="pointer-events-auto flex h-9 items-center gap-1.5 rounded-full bg-black/60 px-3 text-xs text-white backdrop-blur-md hover:bg-black/80"
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  {muted ? "Tap to unmute" : "Sound on"}
                </button>
              </div>
            )}
            <Floating items={floating} />
          </div>

          {!isHost && ready && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Crown className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              The host controls playback. You&apos;ll stay in sync automatically.
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1.5" role="group" aria-label="Send a reaction">
              {REACTIONS.map((e) => (
                <motion.button
                  key={e}
                  type="button"
                  whileTap={{ scale: 1.4 }}
                  whileHover={{ y: -3 }}
                  onClick={() => react(e)}
                  aria-label={`React ${e}`}
                  className="flex h-11 w-11 items-center justify-center rounded-full border bg-card/60 text-xl transition-colors hover:border-primary/50"
                >
                  {e}
                </motion.button>
              ))}
            </div>
            {title && (
              <Link href={`/${normalizeType(party?.content_type)}/${title.id}`} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                About {titleOf(title)} →
              </Link>
            )}
          </div>
        </div>

        {/* Side panel */}
        <aside className="flex h-[min(70svh,640px)] flex-col overflow-hidden rounded-2xl border bg-card/60">
          <div role="tablist" className="grid grid-cols-2 border-b p-1.5">
            {(["chat", "people"] as const).map((p) => (
              <button
                key={p}
                role="tab"
                type="button"
                aria-selected={panel === p}
                onClick={() => setPanel(p)}
                className={cn(
                  "relative flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
                  panel === p ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {panel === p && <motion.span layoutId="party-panel" className="absolute inset-0 -z-10 rounded-lg bg-accent" />}
                {p === "chat" ? <MessageSquare className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                {p === "chat" ? "Chat" : `People ${people.length}`}
              </button>
            ))}
          </div>

          {panel === "chat" ? (
            <>
              <ul className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
                {messages.length === 0 && (
                  <li className="py-10 text-center text-sm text-muted-foreground">Say hello, or send a reaction to get things going.</li>
                )}
                {messages.map((m, i) => {
                  if (m.type === "system")
                    return (
                      <li key={i} className="text-center text-xs text-muted-foreground">
                        {m.message}
                      </li>
                    )
                  const mine = m.userId === me?.id
                  return (
                    <motion.li key={m.id ?? i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("flex flex-col", mine && "items-end")}>
                      {!mine && <span className="mb-0.5 text-[11px] text-muted-foreground">{m.username}</span>}
                      <span
                        className={cn(
                          m.type === "reaction" ? "text-3xl" : "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                          m.type !== "reaction" && (mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-secondary")
                        )}
                      >
                        {m.message}
                      </span>
                    </motion.li>
                  )
                })}
                <div ref={chatEnd} />
              </ul>
              <div className="border-t p-3">
                <p className="h-4 px-1 text-[11px] text-muted-foreground">
                  {typing.length > 0 && `${typing.slice(0, 2).join(", ")} ${typing.length > 1 ? "are" : "is"} typing…`}
                </p>
                <form onSubmit={send} className="mt-1 flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value)
                      watchPartySocket.typing()
                    }}
                    maxLength={500}
                    placeholder="Message the party"
                    aria-label="Message the party"
                    className="h-10 flex-1 rounded-lg border border-input bg-background/60 px-3 text-sm focus:border-primary/60 focus:outline-none"
                  />
                  <button type="submit" disabled={!draft.trim()} aria-label="Send" className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <ul className="flex-1 space-y-1 overflow-y-auto p-3">
              {people.map((p) => (
                <li key={p.userId} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold uppercase">{p.username.charAt(0)}</span>
                  <span className="flex-1 truncate text-sm">
                    {p.username}
                    {p.userId === me?.id && <span className="text-muted-foreground"> (you)</span>}
                  </span>
                  {party?.host_user_id === p.userId && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      <Crown className="h-3 w-3" /> Host
                    </span>
                  )}
                </li>
              ))}
              {people.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">Connecting…</li>}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}
