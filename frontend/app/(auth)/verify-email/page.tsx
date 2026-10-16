// app/(auth)/verify-email/page.tsx
"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Check, Loader2, X } from "lucide-react"
import { CheckInbox } from "@/components/auth/check-inbox"
import { FormHeader, formItem, formStagger } from "@/components/auth/auth-fields"

type Status = "loading" | "success" | "error"

function VerifyEmail() {
  const token = useSearchParams().get("token")
  const router = useRouter()
  const [status, setStatus] = useState<Status>("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) return
    let redirect: ReturnType<typeof setTimeout>
    const verify = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email/${token}`)
        const data = await response.json().catch(() => ({}))
        if (response.ok) {
          setStatus("success")
          redirect = setTimeout(() => router.push("/login"), 3000)
        } else {
          setStatus("error")
          setMessage(data.message || "This link has expired or was already used.")
        }
      } catch {
        setStatus("error")
        setMessage("We couldn't reach FlixVideo. Check your connection and try again.")
      }
    }
    verify()
    return () => clearTimeout(redirect)
  }, [token, router])

  // Arrived straight after sign-up, without a token: tell them to check email
  if (!token) {
    return (
      <CheckInbox title="Check your" italic="inbox.">
        <p>We sent you a link to verify your email. Open it and you&apos;ll be ready to sign in.</p>
        <p className="text-sm">Nothing there after a few minutes? Check your spam or promotions folder.</p>
      </CheckInbox>
    )
  }

  const badge = {
    loading: { icon: <Loader2 className="h-8 w-8 animate-spin" />, tone: "bg-primary/15 text-primary" },
    success: { icon: <Check className="h-8 w-8" strokeWidth={3} />, tone: "bg-success/15 text-success" },
    error: { icon: <X className="h-8 w-8" strokeWidth={3} />, tone: "bg-destructive/15 text-destructive" },
  }[status]

  return (
    <motion.div key={status} variants={formStagger} initial="hidden" animate="show" className="space-y-7">
      <motion.span
        variants={formItem}
        className={`flex h-20 w-20 items-center justify-center rounded-full ${badge.tone}`}
        aria-hidden="true"
      >
        <motion.span
          initial={{ scale: 0.4 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 14 }}
          className="flex"
        >
          {badge.icon}
        </motion.span>
      </motion.span>

      {status === "loading" && (
        <FormHeader title="Verifying your" italic="email">
          This only takes a moment.
        </FormHeader>
      )}

      {status === "success" && (
        <>
          <FormHeader title="You're" italic="verified.">
            Your account is ready. Taking you to sign in…
          </FormHeader>
          <motion.div variants={formItem} className="h-1 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-success"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "linear" }}
            />
          </motion.div>
          <motion.div variants={formItem}>
            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Sign in now
            </Link>
          </motion.div>
        </>
      )}

      {status === "error" && (
        <>
          <FormHeader title="We couldn't" italic="verify that.">
            {message}
          </FormHeader>
          <motion.div variants={formItem} className="grid gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center rounded-lg border text-[15px] font-medium transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Back to sign in
            </Link>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  )
}
