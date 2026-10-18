// components/payment/mpesa-checkout.tsx
// M-Pesa STK push: enter a number, approve the prompt on your phone, we
// watch for the result. The price is set by the server from the plan.
"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, RotateCcw, Smartphone, X } from "lucide-react"
import { paymentsAPI } from "@/lib/api/payments"
import { formatKes, type PlanInfo } from "@/lib/plans"
import { cn } from "@/lib/utils"

type Stage = "phone" | "sending" | "waiting" | "failed" | "timeout"

const POLL_MS = 5000
const MAX_WAIT_S = 180

/** Accepts 07.., 01.., 7.., 254.., +254..; returns 2547XXXXXXXX or null */
export function normalizeKenyanPhone(input: string) {
  const digits = input.replace(/\D/g, "")
  const local = digits.startsWith("254") ? digits.slice(3) : digits.startsWith("0") ? digits.slice(1) : digits
  return /^[17]\d{8}$/.test(local) ? `254${local}` : null
}

function formatLocal(input: string) {
  const d = input.replace(/\D/g, "").replace(/^254/, "").replace(/^0/, "").slice(0, 9)
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean).join(" ")
}

export function MpesaCheckout({ plan }: { plan: PlanInfo }) {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [stage, setStage] = useState<Stage>("phone")
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const poll = useRef<ReturnType<typeof setInterval> | null>(null)
  const tick = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = () => {
    if (poll.current) clearInterval(poll.current)
    if (tick.current) clearInterval(tick.current)
  }
  useEffect(() => stop, [])

  const normalized = normalizeKenyanPhone(phone)

  const start = async () => {
    if (!normalized) {
      setError("Enter a Safaricom number like 0712 345 678")
      return
    }
    setError(null)
    setStage("sending")
    try {
      // The server prices from the plan; amount is only sent for older servers
      const r = await paymentsAPI.initiateMpesaPayment(normalized, plan.price, plan.id, `FlixVideo ${plan.name} plan`)
      const checkoutId = r.checkout_request_id
      if (!checkoutId) throw new Error("No checkout id")
      setStage("waiting")
      setElapsed(0)
      tick.current = setInterval(() => setElapsed((s) => s + 1), 1000)
      poll.current = setInterval(async () => {
        try {
          const s = await paymentsAPI.getMpesaStatus(checkoutId)
          const status = s.payment?.status
          if (status === "succeeded") {
            stop()
            router.push(`/subscription/success?method=mpesa&plan=${plan.id}`)
          } else if (status === "failed" || status === "cancelled") {
            stop()
            setStage("failed")
          }
        } catch {
          // keep waiting; a single failed check isn't a failed payment
        }
      }, POLL_MS)
    } catch (e) {
      const message = (e as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(message || "We couldn't send the M-Pesa prompt. Check the number and try again.")
      setStage("phone")
    }
  }

  useEffect(() => {
    if (stage === "waiting" && elapsed >= MAX_WAIT_S) {
      stop()
      setStage("timeout")
    }
  }, [stage, elapsed])

  const reset = () => {
    stop()
    setStage("phone")
    setElapsed(0)
  }

  return (
    <AnimatePresence mode="wait">
      {stage === "phone" || stage === "sending" ? (
        <motion.form
          key="phone"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          onSubmit={(e) => {
            e.preventDefault()
            start()
          }}
          className="space-y-5"
        >
          <label htmlFor="mpesa-phone" className="block text-sm font-medium">
            M-Pesa number
          </label>
          <div className={cn("group flex h-14 items-center overflow-hidden rounded-xl border bg-background/60 transition-[border-color,box-shadow] focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10", error && "border-destructive/70")}>
            <span className="flex h-full items-center gap-2 border-r bg-muted/40 px-4 text-sm font-medium text-muted-foreground">
              <span aria-hidden="true">🇰🇪</span> +254
            </span>
            <input
              id="mpesa-phone"
              inputMode="tel"
              autoComplete="tel-national"
              value={formatLocal(phone)}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="712 345 678"
              aria-invalid={!!error}
              aria-describedby={error ? "mpesa-error" : undefined}
              className="h-full min-w-0 flex-1 bg-transparent px-4 text-lg tracking-wide tabular-nums focus:outline-none"
            />
          </div>
          {error && (
            <p id="mpesa-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={stage === "sending"}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#1aa04a] text-[15px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-70"
          >
            {stage === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
            {stage === "sending" ? "Sending prompt" : `Pay ${formatKes(plan.price)} with M-Pesa`}
          </button>
          <p className="text-xs text-muted-foreground">You&apos;ll get a prompt on this phone. Enter your M-Pesa PIN to approve it.</p>
        </motion.form>
      ) : stage === "waiting" ? (
        <motion.div key="waiting" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-4 text-center" aria-live="polite">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <motion.span className="absolute inset-0 rounded-full border-2 border-[#1aa04a]/60" animate={{ scale: [1, 1.5], opacity: [0.7, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
            <motion.span className="absolute inset-0 rounded-full border-2 border-[#1aa04a]/40" animate={{ scale: [1, 1.5], opacity: [0.7, 0] }} transition={{ duration: 1.6, repeat: Infinity, delay: 0.8 }} />
            <motion.span animate={{ rotate: [0, -8, 8, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.4 }} className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1aa04a] text-white">
              <Smartphone className="h-8 w-8" />
            </motion.span>
          </div>
          <p className="mt-6 font-display text-3xl">Check your phone</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Approve the {formatKes(plan.price)} prompt sent to <span className="text-foreground">+254 {formatLocal(phone)}</span> with your M-Pesa PIN.
          </p>
          <div className="mt-6 h-1 w-56 overflow-hidden rounded-full bg-muted">
            <motion.div className="h-full bg-[#1aa04a]" animate={{ width: `${Math.min(100, (elapsed / MAX_WAIT_S) * 100)}%` }} transition={{ ease: "linear", duration: 1 }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground tabular-nums">Waiting for M-Pesa… {elapsed}s</p>
          {elapsed >= 30 && (
            <button type="button" onClick={reset} className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <RotateCcw className="h-3.5 w-3.5" /> Didn&apos;t get the prompt? Send it again
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div key="failed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <X className="h-8 w-8" strokeWidth={3} />
          </span>
          <p className="mt-5 font-display text-3xl">{stage === "timeout" ? "We didn't hear back" : "Payment didn't go through"}</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            {stage === "timeout"
              ? "The prompt may have expired. If money left your account, it will show up on your plan shortly. Otherwise, try again."
              : "The prompt was cancelled or declined. Nothing was charged."}
          </p>
          <button type="button" onClick={reset} className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:brightness-110">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
