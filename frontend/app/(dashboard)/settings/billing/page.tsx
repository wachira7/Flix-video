// app/(dashboard)/settings/billing/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { format } from "date-fns"
import { Bitcoin, CreditCard, Crown, Loader2, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { subscriptionAPI } from "@/lib/api/subscriptions"
import { paymentsAPI } from "@/lib/api/payments"
import { formatKes, planById } from "@/lib/plans"
import { SettingsCard, SettingsHeader } from "@/components/settings/settings-ui"
import { cn } from "@/lib/utils"

interface Subscription {
  plan_type: string
  status: string
  current_period_end?: string
  auto_renew?: boolean
}

interface Receipt {
  id: string
  amount: number
  currency: string
  status: string
  created_at: string
  plan_type?: string
  payment_method?: string
}

const METHOD_ICON: Record<string, typeof CreditCard> = { mpesa: Smartphone, stripe: CreditCard, crypto: Bitcoin }
const STATUS_TONE: Record<string, string> = {
  succeeded: "bg-success/15 text-success",
  completed: "bg-success/15 text-success",
  pending: "bg-primary/15 text-primary",
  failed: "bg-destructive/15 text-destructive",
}

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined)
  const [receipts, setReceipts] = useState<Receipt[] | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    subscriptionAPI
      .getMySubscription()
      .then((r) => setSub(r.subscription ?? null))
      .catch(() => setSub(null))
    paymentsAPI
      .getPaymentHistory(20, 0)
      .then((r) => setReceipts(r.payments ?? []))
      .catch(() => setReceipts([]))
  }, [])

  const active = sub && (sub.status === "active" || sub.status === "trialing") && sub.plan_type !== "free"
  const plan = planById(active ? sub!.plan_type : "free")!

  const cancel = async () => {
    setBusy(true)
    try {
      await subscriptionAPI.cancelSubscription()
      setSub((s) => (s ? { ...s, auto_renew: false } : s))
      setConfirm(false)
      toast("Your plan won't renew")
    } catch (e) {
      const message = (e as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(message || "We couldn't cancel. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <SettingsHeader title="Billing" italic="& plan">
        Your plan, renewal and receipts.
      </SettingsHeader>

      <SettingsCard>
        {sub === undefined ? (
          <div className="m-5 h-16 animate-pulse rounded-lg bg-muted" />
        ) : (
          <div className="flex flex-wrap items-center gap-4 px-5 py-5 sm:px-6">
            <span className={cn("flex h-12 w-12 items-center justify-center rounded-full", active ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary")}>
              <Crown className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl leading-tight">{plan.name}</p>
              <p className="text-sm text-muted-foreground">
                {!active
                  ? "Free plan. No card needed."
                  : sub?.current_period_end
                    ? `${formatKes(plan.price)} a month · ${sub.auto_renew === false ? "ends" : "renews"} ${format(new Date(sub.current_period_end), "d MMM yyyy")}`
                    : `${formatKes(plan.price)} a month`}
              </p>
            </div>
            <Link href="/subscription" className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium transition-colors hover:border-primary/60 hover:text-primary">
              {active ? "Change plan" : "See plans"}
            </Link>
          </div>
        )}

        {active && sub?.auto_renew !== false && (
          <div className="px-5 py-4 sm:px-6">
            <AnimatePresence mode="wait" initial={false}>
              {confirm ? (
                <motion.div key="c" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex-1 text-muted-foreground">
                    You&apos;ll keep {plan.name} until {sub?.current_period_end ? format(new Date(sub.current_period_end), "d MMM yyyy") : "the end of this period"}, then move to Free.
                  </span>
                  <button type="button" onClick={cancel} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-lg bg-destructive px-3 font-medium text-white disabled:opacity-60">
                    {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Cancel renewal
                  </button>
                  <button type="button" onClick={() => setConfirm(false)} className="h-9 rounded-lg border px-3 hover:bg-accent">
                    Keep {plan.name}
                  </button>
                </motion.div>
              ) : (
                <motion.button key="a" type="button" onClick={() => setConfirm(true)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground transition-colors hover:text-destructive">
                  Cancel renewal
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </SettingsCard>

      <SettingsCard title="Receipts">
        {receipts === null ? (
          <div className="m-5 h-24 animate-pulse rounded-lg bg-muted" />
        ) : receipts.length === 0 ? (
          <p className="px-6 py-6 text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          receipts.map((r) => {
            const Icon = METHOD_ICON[r.payment_method ?? ""] ?? CreditCard
            return (
              <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 sm:px-6">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{planById(r.plan_type)?.name ?? "FlixVideo"} plan</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), "d MMM yyyy, HH:mm")}</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", STATUS_TONE[r.status] ?? "bg-muted text-muted-foreground")}>
                  {r.status === "succeeded" ? "Paid" : r.status}
                </span>
                <span className="w-24 text-right text-sm tabular-nums">
                  {r.currency === "KES" || !r.currency ? formatKes(Number(r.amount)) : `${r.currency} ${r.amount}`}
                </span>
              </div>
            )
          })
        )}
      </SettingsCard>
    </>
  )
}
