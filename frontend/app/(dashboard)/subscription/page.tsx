// app/(dashboard)/subscription/page.tsx
// Your plan and the plans you can move to.
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { Check, Crown, Smartphone } from "lucide-react"
import { subscriptionAPI } from "@/lib/api/subscriptions"
import { PLANS, formatKes, planById, type PlanId } from "@/lib/plans"
import { cn } from "@/lib/utils"

interface Subscription {
  plan_type: PlanId
  status: string
  current_period_end?: string
  auto_renew?: boolean
}

const RANK: Record<PlanId, number> = { free: 0, basic: 1, premium: 2 }

export default function SubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined)

  useEffect(() => {
    subscriptionAPI
      .getMySubscription()
      .then((r) => setSub(r.subscription ?? null))
      .catch(() => setSub(null))
  }, [])

  const current: PlanId = sub?.status === "active" || sub?.status === "trialing" ? sub.plan_type : "free"
  const currentPlan = planById(current)!

  return (
    <div className="space-y-12 pt-4">
      <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
        <div className="space-y-3">
          <p className="eyebrow">Your plan</p>
          <h1 className="text-4xl leading-none sm:text-5xl">
            Simple prices, <em className="italic text-primary">in shillings.</em>
          </h1>
          <p className="max-w-lg text-muted-foreground">Upgrade, downgrade or cancel whenever you like. Pay monthly with M-Pesa, card or crypto.</p>
        </div>

        <div className="rounded-2xl border bg-card/60 p-5">
          {sub === undefined ? (
            <div className="h-20 animate-pulse rounded-lg bg-muted" />
          ) : (
            <div className="flex items-start gap-4">
              <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", current === "premium" ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary")}>
                <Crown className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">You&apos;re on</p>
                <p className="font-display text-3xl leading-tight">{currentPlan.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {current === "free"
                    ? "Free forever. No card needed."
                    : sub?.current_period_end
                      ? `${sub.auto_renew === false ? "Ends" : "Renews"} on ${format(new Date(sub.current_period_end), "d MMMM yyyy")}`
                      : `${formatKes(currentPlan.price)} a month`}
                </p>
                {current !== "free" && (
                  <Link href="/settings/billing" className="mt-2 inline-block text-sm text-primary hover:underline">
                    Manage billing
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <ul className="grid gap-5 md:grid-cols-3">
        {PLANS.map((plan, i) => {
          const isCurrent = plan.id === current
          const isUpgrade = RANK[plan.id] > RANK[current]
          return (
            <motion.li
              key={plan.id}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
              className={cn(
                "spotlight relative flex flex-col rounded-2xl border bg-card/60 p-7 transition-transform duration-300 hover:-translate-y-1",
                plan.featured && !isCurrent && "sheen-border border-transparent",
                isCurrent && "border-primary/70"
              )}
            >
              {(isCurrent || plan.featured) && (
                <span className={cn("absolute -top-3 left-7 rounded-full px-3 py-0.5 text-xs font-semibold", isCurrent ? "bg-foreground text-background" : "bg-primary text-primary-foreground")}>
                  {isCurrent ? "Your plan" : "Everything included"}
                </span>
              )}
              <h2 className="text-2xl">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="text-sm text-muted-foreground">KSh</span>
                <span className="font-display text-5xl leading-none tabular-nums">{plan.price.toLocaleString("en-KE")}</span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </p>
              <ul className="mt-7 flex-1 space-y-3 border-t pt-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-3 text-sm leading-snug">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {isCurrent ? (
                  <p className="flex h-11 items-center justify-center rounded-lg border text-sm text-muted-foreground">Current plan</p>
                ) : isUpgrade ? (
                  <Link
                    href={`/subscription/checkout?plan=${plan.id}`}
                    className={cn(
                      "flex h-11 items-center justify-center rounded-lg text-sm font-semibold transition-[filter,background-color]",
                      plan.featured ? "bg-primary text-primary-foreground hover:brightness-110" : "border hover:border-primary/60 hover:text-primary"
                    )}
                  >
                    Upgrade to {plan.name}
                  </Link>
                ) : (
                  <Link href="/settings/billing" className="flex h-11 items-center justify-center rounded-lg border text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Switch to {plan.name}
                  </Link>
                )}
              </div>
            </motion.li>
          )
        })}
      </ul>

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Smartphone className="h-4 w-4 text-primary" aria-hidden="true" />
        Paying with M-Pesa? You&apos;ll get a prompt on your phone. Approve it with your PIN and you&apos;re done.
      </p>
    </div>
  )
}
