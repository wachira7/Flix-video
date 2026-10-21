// app/demo/page.tsx
// One-click demo: no sign-up. Creates a private, pre-filled account that's
// deleted after a day, then drops the visitor on the home screen.
"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, Check, Clapperboard, Loader2, RotateCcw } from "lucide-react"
import { Wordmark } from "@/components/landing/wordmark"
import { demoExpiresAt, endDemo, startDemo } from "@/lib/demo"
import { cn } from "@/lib/utils"

type Stage = "checking" | "signed-in" | "ended" | "starting" | "ready" | "error"

const STEPS = [
  "Creating your private account",
  "Filling a watchlist, favourites and two lists",
  "Saving an AI chat and a watch party for you",
]

function errorText(e: unknown) {
  const res = (e as { response?: { status?: number; data?: { error?: string } } }).response
  if (!res) return "We couldn't reach FlixVideo. Check your connection and try again."
  if (res.status === 429 || res.status === 503) return res.data?.error ?? "Too many demos right now. Please try again soon."
  return "Something went wrong starting the demo. Please try again."
}

function Demo() {
  const router = useRouter()
  const params = useSearchParams()
  const [stage, setStage] = useState<Stage>("checking")
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  const begin = useCallback(async () => {
    setStage("starting")
    setError(null)
    setStep(0)
    const ticker = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 700)
    try {
      // Keep the steps on screen long enough to read
      await Promise.all([startDemo(), new Promise((r) => setTimeout(r, 2100))])
      clearInterval(ticker)
      setStep(STEPS.length)
      setStage("ready")
      setTimeout(() => router.replace("/dashboard"), 700)
    } catch (e) {
      clearInterval(ticker)
      setError(errorText(e))
      setStage("error")
    }
  }, [router])

  useEffect(() => {
    if (started.current) return
    started.current = true
    const expires = demoExpiresAt()
    if (expires && expires.getTime() > Date.now()) {
      router.replace("/dashboard") // a demo is already running
      return
    }
    if (params.get("ended")) {
      endDemo()
      setStage("ended")
      return
    }
    if (localStorage.getItem("token") && !expires) {
      setStage("signed-in")
      return
    }
    begin()
  }, [begin, params, router])

  return (
    <div className="dark relative isolate flex min-h-svh flex-col overflow-hidden bg-background text-foreground">
      <div aria-hidden="true" className="light-leak absolute -top-1/3 -left-1/4 -z-10 h-[90%] w-[70%]" />
      <div aria-hidden="true" className="film-grain pointer-events-none absolute inset-0 -z-10" />

      <header className="px-5 py-6 md:px-8">
        <Wordmark />
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 pb-24">
        <p className="eyebrow">Try FlixVideo</p>
        <h1 className="mt-4 text-5xl leading-[1.02] sm:text-6xl">
          A night in, <em className="italic text-primary">already set up.</em>
        </h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
          No sign-up. You get a private account with a watchlist, lists, an AI chat and a watch party ready to explore. It&apos;s deleted
          after a day.
        </p>

        <div className="mt-10 min-h-48" aria-live="polite">
          {/* initial={false}: the steps show straight away, before scripts load */}
          <AnimatePresence mode="wait" initial={false}>
            {(stage === "checking" || stage === "starting" || stage === "ready") && (
              <motion.ol key="steps" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {STEPS.map((label, i) => {
                  const done = step > i
                  const active = step === i && stage !== "checking"
                  return (
                    <li key={label} className={cn("flex items-center gap-3 transition-opacity", !done && !active && "opacity-40")}>
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                          done ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25"
                        )}
                      >
                        {done ? <Check className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : null}
                      </span>
                      <span className={cn("text-[15px]", done && "text-muted-foreground")}>{label}</span>
                    </li>
                  )
                })}
                {stage === "ready" && (
                  <motion.li initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 pt-2 font-display text-2xl">
                    <Clapperboard className="h-5 w-5 text-primary" aria-hidden="true" /> Ready. Enjoy the show.
                  </motion.li>
                )}
              </motion.ol>
            )}

            {stage === "signed-in" && (
              <motion.div key="signed-in" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <p className="text-muted-foreground">You&apos;re already signed in to FlixVideo.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/dashboard" className="button-sweep inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground">
                    Go to your home <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      endDemo()
                      begin()
                    }}
                    className="inline-flex h-12 items-center rounded-lg border px-6 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Sign out and start a demo
                  </button>
                </div>
              </motion.div>
            )}

            {stage === "ended" && (
              <motion.div key="ended" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <p className="text-muted-foreground">Your demo has ended and its data has been deleted.</p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={begin} className="button-sweep inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground">
                    Start a fresh demo <ArrowRight className="h-4 w-4" />
                  </button>
                  <Link href="/signup" className="inline-flex h-12 items-center rounded-lg border px-6 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Create a free account
                  </Link>
                </div>
              </motion.div>
            )}

            {stage === "error" && (
              <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
                  {error}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={begin} className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground">
                    <RotateCcw className="h-4 w-4" /> Try again
                  </button>
                  <Link href="/signup" className="inline-flex h-12 items-center rounded-lg border px-6 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Create a free account instead
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-10 text-xs leading-relaxed text-muted-foreground/80">
          The demo is on the Free plan with 3 AI messages. Payments, public reviews and account changes are switched off, and anything you
          make stays private.
        </p>
      </main>
    </div>
  )
}

export default function DemoPage() {
  return (
    <Suspense fallback={null}>
      <Demo />
    </Suspense>
  )
}
