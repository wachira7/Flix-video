// components/landing/ai-conversation.tsx
// Plays the example conversation when it scrolls into view: the prompt types
// out, the assistant "thinks", then picks arrive one by one.
// Server render and no-JS show the finished conversation.
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { RotateCcw, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { tmdbImage, type AIPick } from "./landing-types"

type Phase = "done" | "idle" | "typing" | "thinking" | "answering"

const TYPE_MS = 32
const THINK_MS = 900
const PICK_MS = 380

export function AIConversation({ prompt, picks }: { prompt: string; picks: AIPick[] }) {
  const ref = useRef<HTMLElement>(null)
  const [phase, setPhase] = useState<Phase>("done")
  const [typed, setTyped] = useState(prompt.length)
  const [shown, setShown] = useState(picks.length)

  const play = useCallback(() => {
    setTyped(0)
    setShown(0)
    setPhase("typing")
  }, [])

  // Arm the animation only once JS is running and motion is allowed
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.8) return // already on screen: leave it finished
    setPhase("idle")
    setTyped(0)
    setShown(0)
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          play()
          io.disconnect()
        }
      },
      { threshold: 0.45 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [play])

  useEffect(() => {
    if (phase === "typing") {
      if (typed >= prompt.length) {
        const t = setTimeout(() => setPhase("thinking"), 250)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => setTyped((n) => n + 1), TYPE_MS)
      return () => clearTimeout(t)
    }
    if (phase === "thinking") {
      const t = setTimeout(() => setPhase("answering"), THINK_MS)
      return () => clearTimeout(t)
    }
    if (phase === "answering") {
      if (shown >= picks.length) {
        setPhase("done")
        return
      }
      const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 0 : PICK_MS)
      return () => clearTimeout(t)
    }
  }, [phase, typed, shown, prompt.length, picks.length])

  const promptVisible = phase !== "idle"
  const answerVisible = phase === "answering" || phase === "done"

  return (
    <figure ref={ref} className="reveal spotlight rounded-xl border bg-card p-4 sm:p-6" data-reveal="right">
      <div className="flex min-h-12 justify-end">
        <p
          className={cn(
            "max-w-[85%] rounded-2xl rounded-br-sm bg-secondary px-4 py-3 text-[15px] text-foreground transition-opacity duration-300",
            promptVisible ? "opacity-100" : "opacity-0"
          )}
        >
          <span className="sr-only">{prompt}</span>
          <span aria-hidden="true">
            {prompt.slice(0, typed)}
            {phase === "typing" && <span className="caret" />}
          </span>
        </p>
      </div>

      <div className="mt-5 flex h-5 items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className={cn("h-4 w-4 text-primary", phase === "thinking" && "animate-pulse")} aria-hidden="true" />
        {phase === "thinking" ? (
          <span className="inline-flex items-center gap-1" aria-label="Thinking">
            <span className="dot" />
            <span className="dot [animation-delay:150ms]" />
            <span className="dot [animation-delay:300ms]" />
          </span>
        ) : (
          <span className={cn("transition-opacity duration-300", answerVisible ? "opacity-100" : "opacity-0")}>
            Three picks that fit
          </span>
        )}
      </div>

      <ol className="mt-3 divide-y divide-border">
        {picks.map((pick, i) => {
          const poster = tmdbImage(pick.poster, "w342")
          const visible = i < shown
          return (
            <li
              key={pick.id}
              className={cn(
                "flex gap-4 py-4 transition-[opacity,transform] duration-500 ease-out first:pt-2 last:pb-1",
                visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              )}
            >
              <div className="relative aspect-2/3 w-16 shrink-0 overflow-hidden rounded-sm bg-muted sm:w-[72px]">
                {poster && <Image src={poster} alt={`${pick.title} poster`} fill sizes="72px" className="object-cover" />}
              </div>
              <div className="min-w-0 space-y-1.5">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-display text-xl leading-tight">{pick.title}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {pick.year} · {pick.runtime}
                  </span>
                </p>
                <p className="text-sm leading-relaxed text-foreground/80">
                  <span className="mr-1.5 inline-block rounded-full bg-primary px-2 py-px text-[11px] font-semibold text-primary-foreground">
                    Why it fits
                  </span>
                  {pick.reason}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      <figcaption className="mt-4 flex items-center justify-between gap-4 border-t pt-3 text-xs text-muted-foreground">
        <span>Example conversation. Your picks are based on your own ratings and watch history.</span>
        <button
          type="button"
          onClick={play}
          disabled={phase !== "done"}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-foreground/80 transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-0"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Replay
        </button>
      </figcaption>
    </figure>
  )
}
