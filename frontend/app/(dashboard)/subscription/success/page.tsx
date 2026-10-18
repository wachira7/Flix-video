// app/(dashboard)/subscription/success/page.tsx
// Confirms the upgrade before celebrating: checks the Stripe session (card)
// and the subscription itself, retrying briefly while webhooks land.
"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { Check, Loader2, X } from "lucide-react"
import { paymentsAPI } from "@/lib/api/payments"
import { subscriptionAPI } from "@/lib/api/subscriptions"
import { planById, type PlanId } from "@/lib/plans"

type State = "checking" | "done" | "pending" | "failed"

const RANK: Record<PlanId, number> = { free: 0, basic: 1, premium: 2 }

function Success() {
  const params = useSearchParams()
  const sessionId = params.get("session_id")
  const expected = planById(params.get("plan"))
  const [state, setState] = useState<State>("checking")
  const [plan, setPlan] = useState<PlanId | null>(null)

  useEffect(() => {
    let alive = true
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

    ;(async () => {
      // Card: the Stripe session must have been paid
      if (sessionId) {
        try {
          const s = await paymentsAPI.getStripeStatus(sessionId)
          const status = s.payment?.status
          if (status === "failed" || status === "cancelled") return alive && setState("failed")
        } catch {
          // fall through to checking the subscription
        }
      }
      // Any method: wait for the plan to show up on the account
      for (let i = 0; i < 6 && alive; i++) {
        try {
          const r = await subscriptionAPI.getMySubscription()
          const current = (r.subscription?.status === "active" ? r.subscription.plan_type : "free") as PlanId
          if (current !== "free" && (!expected || RANK[current] >= RANK[expected.id])) {
            if (!alive) return
            setPlan(current)
            setState("done")
            return
          }
        } catch {}
        await sleep(2500)
      }
      if (alive) setState("pending")
    })()
    return () => {
      alive = false
    }
  }, [sessionId, expected])

  useEffect(() => {
    if (state !== "done" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const colors = ["#E8A33D", "#F2C46D", "#F3EDE4"]
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.55 }, colors })
    setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.6 }, colors }), 350)
  }, [state])

  const name = planById(plan)?.name ?? expected?.name ?? "your new plan"

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center pt-16 text-center">
      <motion.span
        key={state}
        initial={{ scale: 0.4, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 15 }}
        className={
          state === "done"
            ? "flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground"
            : state === "failed"
              ? "flex h-20 w-20 items-center justify-center rounded-full bg-destructive/15 text-destructive"
              : "flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary"
        }
      >
        {state === "done" ? <Check className="h-10 w-10" strokeWidth={3} /> : state === "failed" ? <X className="h-10 w-10" strokeWidth={3} /> : <Loader2 className="h-9 w-9 animate-spin" />}
      </motion.span>

      {state === "checking" && (
        <>
          <h1 className="mt-6 text-4xl">Confirming your payment</h1>
          <p className="mt-3 text-muted-foreground">This usually takes a few seconds.</p>
        </>
      )}
      {state === "done" && (
        <>
          <h1 className="mt-6 text-4xl sm:text-5xl">
            Welcome to <em className="italic text-primary">{name}.</em>
          </h1>
          <p className="mt-3 text-muted-foreground">Your upgrade is live. Enjoy more AI picks, bigger watch parties and no ads.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/ai-chat" className="inline-flex h-12 items-center rounded-lg bg-primary px-6 text-[15px] font-semibold text-primary-foreground hover:brightness-110">
              Ask the AI for tonight&apos;s pick
            </Link>
            <Link href="/dashboard" className="inline-flex h-12 items-center rounded-lg border px-6 text-[15px] font-medium hover:bg-accent">
              Go to Home
            </Link>
          </div>
        </>
      )}
      {state === "pending" && (
        <>
          <h1 className="mt-6 text-4xl">Almost there</h1>
          <p className="mt-3 text-muted-foreground">
            We&apos;ve received your payment but your plan hasn&apos;t switched over yet. It usually updates within a minute. Check Billing in Settings, or contact support@flixvideo.com if it doesn&apos;t.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/settings/billing" className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">
              View billing
            </Link>
            <Link href="/dashboard" className="inline-flex h-11 items-center rounded-lg border px-5 text-sm hover:bg-accent">
              Go to Home
            </Link>
          </div>
        </>
      )}
      {state === "failed" && (
        <>
          <h1 className="mt-6 text-4xl">The payment didn&apos;t go through</h1>
          <p className="mt-3 text-muted-foreground">Nothing was charged. You can try again with the same or a different method.</p>
          <Link href={`/subscription/checkout?plan=${expected?.id ?? "premium"}`} className="mt-8 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">
            Try again
          </Link>
        </>
      )}
    </div>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={null}>
      <Success />
    </Suspense>
  )
}
