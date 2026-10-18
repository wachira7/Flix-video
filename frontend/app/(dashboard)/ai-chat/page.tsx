// app/(dashboard)/ai-chat/page.tsx
// Ask FlixVideo AI. Conversation history on the side (a drawer on phones),
// mood starters when empty, ?prompt= to start a chat from elsewhere.
"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { format, formatDistanceToNow } from "date-fns"
import { ArrowRight, History, Hourglass, Laugh, Moon, Plus, Popcorn, Rocket, Sparkles, Timer, Trash2, Users } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ChatMessage, type ChatMessageData } from "@/components/ai/chat-message"
import { ChatComposer } from "@/components/ai/chat-interface"
import { formatKes, planById, type PlanId } from "@/lib/plans"
import { cn } from "@/lib/utils"

interface ConversationSummary {
  sessionId: string
  updatedAt: string
  messages?: { role: string; content: string }[]
}

const aiAPI = {
  send: (message: string, sessionId: string) =>
    apiClient.post("/api/ai/chat", { message, session_id: sessionId }).then((r) => r.data),
  list: () => apiClient.get("/api/ai/conversations").then((r) => r.data),
  get: (sessionId: string) => apiClient.get(`/api/ai/conversations/${sessionId}`).then((r) => r.data),
  remove: (sessionId: string) => apiClient.delete(`/api/ai/conversations/${sessionId}`).then((r) => r.data),
  status: () => apiClient.get("/api/ai/status").then((r) => r.data),
  usage: () => apiClient.get("/api/ai/usage").then((r) => r.data),
}

interface Usage {
  plan: PlanId
  limit: number
  used: number
  remaining: number
  resets_at: string
}

const STARTERS = [
  { icon: Rocket, label: "Smart sci-fi", prompt: "A smart sci-fi film under two hours with a hopeful ending" },
  { icon: Laugh, label: "Feel-good", prompt: "Something light and funny to lift my mood tonight" },
  { icon: Users, label: "Family night", prompt: "A film the whole family will enjoy, with kids aged 8 to 12" },
  { icon: Moon, label: "Slow burn", prompt: "A slow-burn thriller with a twist I won't see coming" },
  { icon: Popcorn, label: "African cinema", prompt: "Great recent African films or series, especially from Kenya or Nigeria" },
  { icon: Timer, label: "One sitting", prompt: "A limited series I can finish in a weekend" },
]

type ChatError = { kind: "limit"; usage: Usage } | { kind: "message"; text: string }

interface ApiError {
  response?: {
    status?: number
    data?: {
      error?: string
      upgrade_required?: boolean
      current_plan?: PlanId
      limit_info?: { limit?: number; used?: number; period?: string; plan?: PlanId; resets_at?: string }
    }
  }
}

function chatError(error: unknown): ChatError {
  const res = (error as ApiError).response
  if (!res) return { kind: "message", text: "We couldn't reach FlixVideo. Check your connection and try again." }
  const info = res.data?.limit_info
  if (res.status === 429 && info?.period === "daily") {
    const limit = info.limit ?? 0
    return { kind: "limit", usage: { plan: info.plan ?? "free", limit, used: info.used ?? limit, remaining: 0, resets_at: info.resets_at ?? "" } }
  }
  if (res.status === 429) return { kind: "message", text: "You're sending messages very quickly. Give it a few minutes, then try again." }
  if (res.status === 403 && res.data?.upgrade_required) {
    return { kind: "limit", usage: { plan: res.data.current_plan ?? "free", limit: 0, used: 0, remaining: 0, resets_at: "" } }
  }
  if (res.status === 404) return { kind: "message", text: "That conversation isn't available. Start a new chat instead." }
  if (res.status === 503) return { kind: "message", text: "The AI is taking a break right now. Please try again shortly." }
  return { kind: "message", text: res.data?.error || "Something went wrong. Please try again." }
}

const resetTime = (iso: string) => {
  if (!iso) return "midnight"
  const t = format(new Date(iso), "h:mm a")
  return t === "12:00 AM" ? "midnight" : t
}

// Shown when today's messages are used up
function LimitCard({ usage }: { usage: Usage }) {
  const next = usage.plan === "free" ? planById("basic") : usage.plan === "basic" ? planById("premium") : null
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="sheen-border mb-3 flex flex-col gap-4 rounded-xl border bg-card/80 p-4 backdrop-blur sm:flex-row sm:items-center"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Hourglass className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="flex-1">
        <p className="font-semibold">
          {usage.limit > 0 ? `That's your ${usage.limit} messages for today` : "You're out of messages for today"}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          FlixVideo AI is back at {resetTime(usage.resets_at)}.
          {next ? ` ${next.name} gives you ${next.aiMessages} a day for ${formatKes(next.price)} a month.` : " Your chats are saved in History, ready for tomorrow."}
        </p>
      </div>
      {next && (
        <Link
          href={`/subscription/checkout?plan=${next.id}`}
          className="button-sweep inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Get {next.name}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </motion.div>
  )
}

// "2 of 3 left today", quietly, under the composer
function Allowance({ usage }: { usage: Usage | null }) {
  if (!usage || usage.limit <= 0) return null
  const low = usage.remaining <= 1
  return (
    <span className={cn("inline-flex items-center gap-1.5 tabular-nums", low && "text-primary")}>
      <span className="flex gap-0.5" aria-hidden="true">
        {usage.limit <= 15 &&
          Array.from({ length: usage.limit }).map((_, i) => (
            <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i < usage.remaining ? "bg-primary" : "bg-muted-foreground/30")} />
          ))}
      </span>
      {usage.remaining} of {usage.limit} messages left today
    </span>
  )
}

function HistoryList({
  items,
  active,
  onPick,
  onDelete,
  onNew,
}: {
  items: ConversationSummary[] | null
  active: string
  onPick: (id: string) => void
  onDelete: (id: string) => void
  onNew: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <button
        type="button"
        onClick={onNew}
        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-dashed text-sm font-medium transition-colors hover:border-primary/60 hover:text-primary"
      >
        <Plus className="h-4 w-4" />
        New chat
      </button>
      <p className="eyebrow mt-6 mb-2 px-1 !text-muted-foreground/70">Recent</p>
      <ul className="-mx-1 flex-1 space-y-0.5 overflow-y-auto px-1">
        {items === null ? (
          Array.from({ length: 5 }).map((_, i) => <li key={i} className="h-14 animate-pulse rounded-lg bg-muted/60" />)
        ) : items.length === 0 ? (
          <li className="px-1 text-sm text-muted-foreground">Your conversations will appear here.</li>
        ) : (
          items.map((c) => {
            const preview = c.messages?.[0]?.content?.replace(/[*#_>`]/g, "").slice(0, 80) || "Conversation"
            return (
              <li key={c.sessionId} className="group relative">
                <button
                  type="button"
                  onClick={() => onPick(c.sessionId)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2.5 pr-9 text-left transition-colors",
                    active === c.sessionId ? "bg-accent" : "hover:bg-accent/60"
                  )}
                >
                  <span className="line-clamp-1 text-sm">{preview}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(c.sessionId)}
                  aria-label="Delete conversation"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}

function AIChat() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [sessionId, setSessionId] = useState(() => uuidv4())
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ChatError | null>(null)
  const [history, setHistory] = useState<ConversationSummary[] | null>(null)
  const [online, setOnline] = useState<boolean | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [drawer, setDrawer] = useState(false)
  const composer = useRef<HTMLTextAreaElement>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const startedFromUrl = useRef(false)

  const refreshHistory = useCallback(() => {
    aiAPI
      .list()
      .then((r) => setHistory(r.conversations ?? []))
      .catch(() => setHistory([]))
  }, [])

  useEffect(() => {
    refreshHistory()
    aiAPI
      .status()
      .then((r) => setOnline((r.ai_providers?.available_count ?? 0) > 0))
      .catch(() => setOnline(null))
    aiAPI
      .usage()
      .then((r) => {
        setUsage(r.usage ?? null)
        if (r.usage && r.usage.remaining <= 0) setError({ kind: "limit", usage: r.usage })
      })
      .catch(() => setUsage(null))
  }, [refreshHistory])

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, busy])

  const send = useCallback(
    async (text: string) => {
      const content = text.trim()
      if (!content || busy) return
      setError(null)
      setInput("")
      setMessages((m) => [...m, { role: "user", content, timestamp: new Date() }])
      setBusy(true)
      try {
        const r = await aiAPI.send(content, sessionId)
        setMessages((m) => [...m, { role: "assistant", content: r.response, timestamp: new Date() }])
        if (r.usage) setUsage(r.usage)
        refreshHistory()
      } catch (e) {
        const err = chatError(e)
        setError(err)
        if (err.kind === "limit") setUsage(err.usage)
        setInput(content)
        setMessages((m) => m.slice(0, -1))
      } finally {
        setBusy(false)
        composer.current?.focus()
      }
    },
    [busy, sessionId, refreshHistory]
  )

  // ?prompt=... starts a chat straight away (from search, home, etc.)
  useEffect(() => {
    const prompt = params.get("prompt")
    if (!prompt || startedFromUrl.current) return
    startedFromUrl.current = true
    router.replace(pathname, { scroll: false })
    send(prompt)
  }, [params, pathname, router, send])

  const open = async (id: string) => {
    setDrawer(false)
    if (id === sessionId) return
    try {
      const r = await aiAPI.get(id)
      setSessionId(id)
      setError(null)
      setMessages(
        (r.conversation?.messages ?? []).map((m: { role: "user" | "assistant"; content: string; timestamp: string }) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
        }))
      )
    } catch {
      toast.error("Couldn't open that conversation.")
    }
  }

  const remove = async (id: string) => {
    setHistory((h) => h?.filter((c) => c.sessionId !== id) ?? null)
    if (id === sessionId) newChat()
    try {
      await aiAPI.remove(id)
    } catch {
      toast.error("Couldn't delete that conversation.")
      refreshHistory()
    }
  }

  const newChat = () => {
    setSessionId(uuidv4())
    setMessages([])
    setError(null)
    setDrawer(false)
    composer.current?.focus()
  }

  const empty = messages.length === 0
  const historyProps = { items: history, active: sessionId, onPick: open, onDelete: remove, onNew: newChat }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 pt-2 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="sticky top-20 hidden h-[calc(100svh-7rem)] lg:block">
        <HistoryList {...historyProps} />
      </aside>

      <section className="relative flex min-h-[calc(100svh-9rem)] min-w-0 flex-col">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", online === false ? "bg-destructive" : "bg-success")} />
            {online === false ? "AI unavailable right now" : "FlixVideo AI"}
          </div>
          <Sheet open={drawer} onOpenChange={setDrawer}>
            <SheetTrigger className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden">
              <History className="h-4 w-4" />
              History
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-background p-5">
              <SheetHeader className="p-0 pb-4">
                <SheetTitle className="text-left font-display text-2xl font-normal">Conversations</SheetTitle>
              </SheetHeader>
              <HistoryList {...historyProps} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {empty ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mx-auto flex max-w-3xl flex-col items-center pt-6 text-center sm:pt-12"
              >
                <motion.span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary"
                  animate={{ rotate: [0, -6, 6, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="h-6 w-6" />
                </motion.span>
                <h1 className="mt-6 text-4xl leading-tight sm:text-5xl">
                  What are you in the <em className="italic text-primary">mood for?</em>
                </h1>
                <p className="mt-3 max-w-md text-muted-foreground">
                  Describe a feeling, a runtime, an actor or a film you loved. Every pick comes with the reason it fits.
                </p>
                <div className="mt-10 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {STARTERS.map((s, i) => (
                    <motion.button
                      key={s.label}
                      type="button"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.05 } }}
                      onClick={() => send(s.prompt)}
                      className="spotlight group flex items-start gap-3 rounded-xl border bg-card/60 p-4 text-left transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/50"
                    >
                      <s.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary transition-transform group-hover:scale-110" aria-hidden="true" />
                      <span>
                        <span className="block text-sm font-semibold">{s.label}</span>
                        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{s.prompt}</span>
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key={sessionId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-3xl space-y-7 pb-6">
                {messages.map((m, i) => (
                  <ChatMessage key={`${sessionId}-${i}`} message={m} />
                ))}
                {busy && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3" aria-live="polite">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                    </span>
                    <span className="inline-flex items-center gap-1" aria-label="FlixVideo AI is thinking">
                      <span className="dot" />
                      <span className="dot [animation-delay:150ms]" />
                      <span className="dot [animation-delay:300ms]" />
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottom} />
        </div>

        <div className="sticky bottom-16 z-10 mx-auto mt-4 w-full max-w-3xl bg-linear-to-t from-background from-70% to-transparent pt-8 pb-4 lg:bottom-0 lg:pb-6">
          <AnimatePresence mode="wait">
            {error?.kind === "limit" && <LimitCard key="limit" usage={error.usage} />}
            {error?.kind === "message" && (
              <motion.p
                key="message"
                role="alert"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
              >
                {error.text}
              </motion.p>
            )}
          </AnimatePresence>
          <ChatComposer ref={composer} value={input} onChange={setInput} onSend={() => send(input)} busy={busy} />
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[11px] text-muted-foreground/70">
            <Allowance usage={usage} />
            <span>AI can get details wrong. Check a title&apos;s page before you commit to a movie night.</span>
          </p>
        </div>
      </section>
    </div>
  )
}

export default function AIChatPage() {
  return (
    <Suspense fallback={null}>
      <AIChat />
    </Suspense>
  )
}
