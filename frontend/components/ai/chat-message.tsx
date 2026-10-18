// components/ai/chat-message.tsx
// One chat bubble. Assistant replies render as markdown, and any titles the
// AI names in bold with a year — **Arrival** (2016) — are matched on TMDB
// and shown as poster cards under the reply.
"use client"

import { memo, useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { searchAPI } from "@/lib/api/search"
import { MediaCard } from "@/components/dashboard/media-card"
import type { MediaItem } from "@/lib/media"
import { cn } from "@/lib/utils"

export interface ChatMessageData {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

/** Titles written as **Title** (2016) or **Title (2016)** */
export function extractTitles(markdown: string) {
  const found = new Map<string, { title: string; year?: string }>()
  const patterns = [/\*\*([^*\n]{2,80}?)\*\*\s*\((\d{4})/g, /\*\*([^*\n]{2,80}?)\s*\((\d{4})\)\*\*/g]
  for (const re of patterns) {
    for (const m of markdown.matchAll(re)) {
      const title = m[1].replace(/[“”"]/g, "").trim()
      if (!found.has(title.toLowerCase())) found.set(title.toLowerCase(), { title, year: m[2] })
    }
  }
  return [...found.values()].slice(0, 6)
}

const resolved = new Map<string, Promise<MediaItem | null>>()

function resolveTitle({ title, year }: { title: string; year?: string }) {
  const key = `${title.toLowerCase()}|${year ?? ""}`
  let hit = resolved.get(key)
  if (!hit) {
    hit = searchAPI
      .searchMulti(title)
      .then((r) => {
        const items = ((r.results ?? []) as (MediaItem & { media_type?: string; release_date?: string; first_air_date?: string })[])
          .filter((x) => (x.media_type === "movie" || x.media_type === "tv") && x.poster_path)
        const yearOf = (x: (typeof items)[number]) => (x.release_date || x.first_air_date || "").slice(0, 4)
        // Only trust a match on year, or an exact title when no year was given
        return (
          items.find((x) => year && yearOf(x) === year) ??
          (!year ? items.find((x) => ("title" in x ? x.title : (x as { name?: string }).name)?.toLowerCase() === title.toLowerCase()) : undefined) ??
          null
        )
      })
      .catch(() => null)
    resolved.set(key, hit)
  }
  return hit
}

function Picks({ content }: { content: string }) {
  const [items, setItems] = useState<MediaItem[]>([])

  useEffect(() => {
    const titles = extractTitles(content)
    if (!titles.length) return
    let alive = true
    Promise.all(titles.map(resolveTitle)).then((all) => {
      if (alive) setItems(all.filter((x): x is MediaItem => !!x))
    })
    return () => {
      alive = false
    }
  }, [content])

  if (!items.length) return null
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Titles in this answer</p>
      <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-hide">
        {items.map((item, i) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.06 } }}
            className="w-28 shrink-0 sm:w-32"
          >
            <MediaCard media={item} />
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

const markdown = {
  p: (props: React.ComponentProps<"p">) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0" {...props} />,
  strong: (props: React.ComponentProps<"strong">) => <strong className="font-semibold text-foreground" {...props} />,
  em: (props: React.ComponentProps<"em">) => <em className="text-foreground/90" {...props} />,
  ul: (props: React.ComponentProps<"ul">) => <ul className="my-3 space-y-2 pl-1" {...props} />,
  ol: (props: React.ComponentProps<"ol">) => <ol className="my-3 list-decimal space-y-2 pl-5 marker:text-primary" {...props} />,
  li: (props: React.ComponentProps<"li">) => (
    <li className="relative pl-4 leading-relaxed before:absolute before:top-[0.7em] before:left-0 before:h-1 before:w-1 before:rounded-full before:bg-primary [ol_&]:pl-1 [ol_&]:before:hidden" {...props} />
  ),
  h1: (props: React.ComponentProps<"h3">) => <h3 className="mt-4 mb-2 font-display text-2xl" {...props} />,
  h2: (props: React.ComponentProps<"h3">) => <h3 className="mt-4 mb-2 font-display text-xl" {...props} />,
  h3: (props: React.ComponentProps<"h4">) => <h4 className="mt-3 mb-1.5 font-semibold" {...props} />,
  a: (props: React.ComponentProps<"a">) => <a className="text-primary underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
  code: (props: React.ComponentProps<"code">) => <code className="rounded bg-muted px-1 py-0.5 text-[0.9em]" {...props} />,
}

export const ChatMessage = memo(function ChatMessage({ message, animate = true }: { message: ChatMessageData; animate?: boolean }) {
  const isUser = message.role === "user"
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex gap-3", isUser && "justify-end")}
    >
      {!isUser && (
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
      <div className={cn("min-w-0", isUser ? "max-w-[85%] sm:max-w-[70%]" : "max-w-[92%] flex-1 sm:max-w-[85%]")}>
        <div
          className={cn(
            "text-[15px]",
            isUser ? "rounded-2xl rounded-br-sm bg-secondary px-4 py-3 whitespace-pre-wrap" : "pt-1.5 text-foreground/85"
          )}
        >
          {isUser ? (
            message.content
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdown}>
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        {!isUser && <Picks content={message.content} />}
        <p className={cn("mt-1.5 text-[11px] text-muted-foreground/70", isUser && "text-right")}>
          {message.timestamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
  )
})
