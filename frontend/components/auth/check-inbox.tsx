// components/auth/check-inbox.tsx
// Animated "we sent you an email" state, shared by sign-up, forgot password
// and the verify-email page.
"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Mail } from "lucide-react"
import { FormHeader, formItem, formStagger } from "./auth-fields"

export function CheckInbox({
  title,
  italic,
  email,
  children,
  backHref = "/login",
  backLabel = "Back to sign in",
}: {
  title: string
  italic?: string
  email?: string
  children: ReactNode
  backHref?: string
  backLabel?: string
}) {
  return (
    <motion.div variants={formStagger} initial="hidden" animate="show" className="space-y-7">
      <motion.div variants={formItem} className="relative h-20 w-20">
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-primary/50"
          animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary"
          initial={{ scale: 0.4, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
        >
          <Mail className="h-8 w-8" aria-hidden="true" />
        </motion.span>
      </motion.div>

      <FormHeader title={title} italic={italic} />

      <motion.div variants={formItem} className="space-y-3 text-[15px] leading-relaxed text-muted-foreground">
        {email && (
          <p>
            We sent it to <span className="font-medium text-foreground">{email}</span>.
          </p>
        )}
        {children}
      </motion.div>

      <motion.div variants={formItem}>
        <Link
          href={backHref}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg border text-[15px] font-medium transition-colors hover:border-muted-foreground/50 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {backLabel}
        </Link>
      </motion.div>
    </motion.div>
  )
}
