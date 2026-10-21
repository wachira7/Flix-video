// frontend/components/payment/crypto-form.tsx
// Crypto checkout via NOWPayments: pick a coin, get an address and exact
// amount, then wait for the network to confirm. Priced in USD on the server.
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Bitcoin, Check, Copy, ExternalLink, Loader2, RotateCcw, XCircle } from "lucide-react"
import { toast } from "sonner"
import { paymentsAPI } from "@/lib/api/payments"
import { cn } from "@/lib/utils"

interface CryptoFormProps {
  planId: string
  amount: number
}

interface CryptoPayment {
  payment_id: string
  pay_address: string
  pay_amount: number
  pay_currency: string
  payment_url?: string | null
  expiration?: string | null
}

type Stage = "loading" | "unavailable" | "choose" | "creating" | "waiting" | "success" | "failed"

const COIN_NAMES: Record<string, string> = {
  btc: "Bitcoin",
  eth: "Ethereum",
  usdt: "Tether (ERC-20)",
  usdttrc20: "Tether (TRC-20)",
  usdc: "USD Coin",
  ltc: "Litecoin",
  bnb: "BNB",
  sol: "Solana",
}
const coinLabel = (c: string) => (c === "usdttrc20" ? "USDT" : c.toUpperCase())

const POLL_MS = 10000
const MAX_POLLS = 90 // 15 minutes

function apiError(e: unknown) {
  return (e as { response?: { status?: number; data?: { error?: string } } }).response
}

export function CryptoForm({ planId, amount }: CryptoFormProps) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>("loading")
  const [message, setMessage] = useState<string | null>(null)
  const [coins, setCoins] = useState<string[]>([])
  const [coin, setCoin] = useState("")
  const [payment, setPayment] = useState<CryptoPayment | null>(null)
  const [copied, setCopied] = useState<"address" | "amount" | null>(null)
  const poll = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadCoins = useCallback(async () => {
    setStage("loading")
    try {
      const r = await paymentsAPI.getCryptoCurrencies()
      const list: string[] = r.currencies ?? []
      if (list.length === 0) {
        setMessage("No cryptocurrencies are available right now. Please try again a little later.")
        setStage("unavailable")
        return
      }
      setCoins(list)
      setCoin((c) => c || list[0])
      setStage("choose")
    } catch (e) {
      const res = apiError(e)
      setMessage(
        res?.status === 503
          ? res.data?.error || "Crypto payments aren't available right now. Please try again a little later."
          : "We couldn't load the list of coins. Check your connection and try again."
      )
      setStage("unavailable")
    }
  }, [])

  useEffect(() => {
    loadCoins()
    return () => {
      if (poll.current) clearInterval(poll.current)
    }
  }, [loadCoins])

  const watch = (paymentId: string) => {
    let polls = 0
    poll.current = setInterval(async () => {
      polls++
      try {
        const s = await paymentsAPI.getCryptoStatus(paymentId)
        const status = s.payment?.status
        if (status === "succeeded") {
          if (poll.current) clearInterval(poll.current)
          setStage("success")
          setTimeout(() => router.push(`/subscription/success?method=crypto&plan=${planId}`), 1600)
          return
        }
        if (status === "failed") {
          if (poll.current) clearInterval(poll.current)
          setMessage("The payment didn't go through. If you sent coins, email support@flixvideo.com with the address.")
          setStage("failed")
          return
        }
      } catch {
        // keep polling; a single failed check isn't a failed payment
      }
      if (polls >= MAX_POLLS && poll.current) {
        clearInterval(poll.current)
        setMessage("We haven't seen the payment yet. Network confirmations can be slow: if you've sent it, your plan will switch on once it confirms.")
        setStage("failed")
      }
    }, POLL_MS)
  }

  const create = async () => {
    if (!coin) return
    setStage("creating")
    setMessage(null)
    try {
      const r = await paymentsAPI.createCryptoPayment(amount, coin, planId, `FlixVideo ${planId} plan`)
      setPayment(r as unknown as CryptoPayment)
      setStage("waiting")
      watch((r as unknown as CryptoPayment).payment_id)
    } catch (e) {
      const res = apiError(e)
      if (res?.status === 503) {
        setMessage(res.data?.error ?? "Crypto payments aren't available right now.")
        setStage("unavailable")
        return
      }
      setMessage(res?.data?.error || "We couldn't create the payment. Please try again or use another coin.")
      setStage("choose")
    }
  }

  const copy = async (what: "address" | "amount", text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      toast.error("Couldn't copy. Select the text and copy it instead.")
    }
  }

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {stage === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/70" />
              ))}
            </div>
          </motion.div>
        )}

        {stage === "unavailable" && (
          <motion.div key="unavailable" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Bitcoin className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="mt-5 font-display text-2xl">Crypto is resting</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground" role="status">
              {message}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={loadCoins} className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
              </button>
            </div>
          </motion.div>
        )}

        {(stage === "choose" || stage === "creating") && (
          <motion.div key="choose" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <fieldset>
              <legend className="text-sm font-medium">Pay with</legend>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {coins.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={coin === c}
                    onClick={() => setCoin(c)}
                    className={cn(
                      "rounded-xl border bg-background/60 px-3 py-3 text-left transition-[border-color,background-color]",
                      coin === c ? "border-primary/70 bg-primary/10" : "hover:border-foreground/30"
                    )}
                  >
                    <span className="block text-sm font-semibold">{coinLabel(c)}</span>
                    <span className="block text-xs text-muted-foreground">{COIN_NAMES[c] ?? c.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {message && (
              <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
                {message}
              </p>
            )}

            <button
              type="button"
              onClick={create}
              disabled={!coin || stage === "creating"}
              className="button-sweep flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-70"
            >
              {stage === "creating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bitcoin className="h-4 w-4" aria-hidden="true" />}
              {stage === "creating" ? "Getting your address…" : `Get a ${coinLabel(coin)} address`}
            </button>
            <p className="text-xs text-muted-foreground">
              You&apos;ll see the exact amount to send. Crypto is priced in US dollars at today&apos;s rate, and network fees are separate.
            </p>
          </motion.div>
        )}

        {stage === "waiting" && payment && (
          <motion.div key="waiting" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send <span className="font-semibold text-foreground">exactly</span> this amount to this address. Sending less can leave the
              payment incomplete.
            </p>
            {(
              [
                { key: "amount", label: "Amount", value: `${payment.pay_amount} ${coinLabel(payment.pay_currency)}`, raw: String(payment.pay_amount) },
                { key: "address", label: `${coinLabel(payment.pay_currency)} address`, value: payment.pay_address, raw: payment.pay_address },
              ] as const
            ).map((row) => (
              <div key={row.key} className="rounded-xl border bg-background/60 p-3">
                <p className="eyebrow !text-muted-foreground/80">{row.label}</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <code className="min-w-0 flex-1 break-all font-mono text-sm">{row.value}</code>
                  <button
                    type="button"
                    onClick={() => copy(row.key, row.raw)}
                    aria-label={`Copy ${row.label.toLowerCase()}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {copied === row.key ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
            {payment.payment_url && (
              <a href={payment.payment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                Open in your wallet <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4" aria-live="polite">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
              <div className="text-sm">
                <p className="font-medium">Waiting for the network to confirm</p>
                <p className="text-muted-foreground">
                  This can take a few minutes. You can leave this page; your plan switches on once it confirms.
                  {payment.expiration ? ` The address expires ${new Date(payment.expiration).toLocaleString()}.` : ""}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {stage === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="h-8 w-8" />
            </span>
            <p className="mt-5 font-display text-3xl">Payment confirmed</p>
            <p className="mt-2 text-sm text-muted-foreground">Switching on your plan…</p>
          </motion.div>
        )}

        {stage === "failed" && (
          <motion.div key="failed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <XCircle className="h-8 w-8" />
            </span>
            <p className="mt-5 font-display text-2xl">Not confirmed yet</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
            <button type="button" onClick={loadCoins} className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <RotateCcw className="h-3.5 w-3.5" /> Start a new payment
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-xs text-muted-foreground">Powered by NOWPayments</p>
    </div>
  )
}
