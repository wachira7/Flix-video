// app/(dashboard)/subscription/checkout/page.tsx
// One-page checkout: order summary + M-Pesa / card / crypto.
"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Bitcoin, Check, Clock, CreditCard, Loader2, Lock, ShieldCheck, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { paymentsAPI } from "@/lib/api/payments"
import { formatKes, planById, PLANS } from "@/lib/plans"
import { MpesaCheckout } from "@/components/payment/mpesa-checkout"
import { CryptoForm } from "@/components/payment/crypto-form"
import { cn } from "@/lib/utils"

type Method = "mpesa" | "card" | "crypto"

const METHODS: { id: Method; label: string; icon: typeof Smartphone; hint: string }[] = [
  { id: "mpesa", label: "M-Pesa", icon: Smartphone, hint: "Prompt on your phone" },
  { id: "card", label: "Card", icon: CreditCard, hint: "Visa, Mastercard" },
  { id: "crypto", label: "Crypto", icon: Bitcoin, hint: "BTC, ETH, USDT" },
]

type Availability = Record<Method, boolean>

const SOON_COPY: Record<Method, string> = {
  mpesa: "We're finishing our M-Pesa setup with Safaricom. It'll be here soon.",
  card: "Card payments are being set up and will be here soon.",
  crypto: "Crypto payments are being set up and will be here soon.",
}

// A method that can't take real money yet (sandbox/test keys)
function ComingSoon({ method, available, onPick }: { method: Method; available: Method[]; onPick: (m: Method) => void }) {
  const label = METHODS.find((m) => m.id === method)!.label
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Clock className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="mt-5 font-display text-2xl">{label} is coming soon</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {SOON_COPY[method]}{" "}
        {available.length > 0 ? "You can pay another way now:" : "Everything on the Free plan keeps working in the meantime."}
      </p>
      {available.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {available.map((m) => {
            const info = METHODS.find((x) => x.id === m)!
            return (
              <button
                key={m}
                type="button"
                onClick={() => onPick(m)}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <info.icon className="h-4 w-4" aria-hidden="true" /> Pay with {info.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CardCheckout({ planId, price, name }: { planId: string; price: number; name: string }) {
  const [busy, setBusy] = useState(false)
  const go = async () => {
    setBusy(true)
    try {
      const r = await paymentsAPI.createStripeCheckout(price, planId, `FlixVideo ${name} plan`)
      if (r.checkout_url) window.location.href = r.checkout_url
      else throw new Error("no url")
    } catch (e) {
      const message = (e as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(message || "We couldn't open the card checkout. Please try again.")
      setBusy(false)
    }
  }
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        You&apos;ll go to Stripe&apos;s secure page to enter your card, then come straight back here. FlixVideo never sees your card number.
      </p>
      <button type="button" onClick={go} disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition-[filter] hover:brightness-110 disabled:opacity-70">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {busy ? "Opening secure checkout" : `Pay ${formatKes(price)} by card`}
      </button>
    </div>
  )
}

function Checkout() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const plan = planById(params.get("plan"))
  const requested = (["mpesa", "card", "crypto"].includes(params.get("method") ?? "") ? params.get("method") : null) as Method | null
  const [avail, setAvail] = useState<Availability | null>(null)

  useEffect(() => {
    paymentsAPI
      .getAvailability()
      .then((r) => setAvail({ mpesa: r.methods.mpesa.available, card: r.methods.card.available, crypto: r.methods.crypto.available }))
      // If we can't tell, offer everything; the server still refuses test payments
      .catch(() => setAvail({ mpesa: true, card: true, crypto: true }))
  }, [])

  const availableMethods = avail ? METHODS.map((m) => m.id).filter((m) => avail[m]) : []
  // An explicit ?method= wins; otherwise start on the first method that works
  const method: Method = requested ?? availableMethods[0] ?? "mpesa"

  if (!plan || plan.price === 0) {
    return (
      <div className="mx-auto max-w-md pt-16 text-center">
        <h1 className="text-4xl">Pick a plan first</h1>
        <p className="mt-3 text-muted-foreground">Choose Basic or Premium to continue to payment.</p>
        <Link href="/subscription" className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">
          See plans
        </Link>
      </div>
    )
  }

  const setMethod = (m: Method) => router.replace(`${pathname}?plan=${plan.id}&method=${m}`, { scroll: false })
  const others = PLANS.filter((p) => p.price > 0 && p.id !== plan.id)

  return (
    <div className="mx-auto max-w-5xl space-y-8 pt-4">
      <Link href="/subscription" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Plans
      </Link>
      <h1 className="text-4xl leading-tight sm:text-5xl">
        Upgrade to <em className="italic text-primary">{plan.name}</em>
      </h1>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 rounded-2xl border bg-card/60 p-5 sm:p-7">
          <h2 className="text-2xl">How would you like to pay?</h2>
          <div role="tablist" aria-label="Payment method" className="mt-5 grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                role="tab"
                type="button"
                aria-selected={method === m.id}
                onClick={() => setMethod(m.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-colors",
                  method === m.id ? "border-primary/70 bg-primary/10" : "hover:border-muted-foreground/50"
                )}
              >
                <m.icon className={cn("h-5 w-5", method === m.id ? "text-primary" : "text-muted-foreground")} />
                <span className="text-sm font-semibold">{m.label}</span>
                {avail && !avail[m.id] ? (
                  <span className="text-[11px] font-medium text-muted-foreground/80">Coming soon</span>
                ) : (
                  <span className="hidden text-[11px] text-muted-foreground sm:block">{m.hint}</span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-7">
            <AnimatePresence mode="wait">
              <motion.div key={avail ? method : "loading"} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                {!avail ? (
                  <div className="space-y-3" aria-busy="true">
                    <div className="h-5 w-48 animate-pulse rounded bg-muted" />
                    <div className="h-12 animate-pulse rounded-lg bg-muted/70" />
                  </div>
                ) : !avail[method] ? (
                  <ComingSoon method={method} available={availableMethods} onPick={setMethod} />
                ) : (
                  <>
                    {method === "mpesa" && <MpesaCheckout plan={plan} />}
                    {method === "card" && <CardCheckout planId={plan.id} price={plan.price} name={plan.name} />}
                    {method === "crypto" && <CryptoForm planId={plan.id} amount={plan.price} />}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-card/60 p-6">
            <p className="eyebrow">Order summary</p>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-display text-2xl">{plan.name}</span>
              <span className="tabular-nums">{formatKes(plan.price)}</span>
            </div>
            <p className="text-sm text-muted-foreground">30 days of access. Doesn&apos;t renew on its own.</p>
            <ul className="mt-5 space-y-2.5 border-t pt-5">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-baseline justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">Due today</span>
              <span className="font-display text-3xl tabular-nums">{formatKes(plan.price)}</span>
            </div>
          </div>
          {others.map((o) => (
            <Link key={o.id} href={`${pathname}?plan=${o.id}&method=${method}`} className="block rounded-xl border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
              Switch to <span className="font-medium text-foreground">{o.name}</span> for {formatKes(o.price)} a month →
            </Link>
          ))}
          <p className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
            Payments are processed by Safaricom, Stripe or NOWPayments.
          </p>
        </aside>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <Checkout />
    </Suspense>
  )
}
