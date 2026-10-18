// components/auth/forgot-password-form.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Mail } from "lucide-react"
import axios from "axios"
import { AuthField, FormAlert, FormHeader, SubmitButton, formItem, formStagger } from "./auth-fields"
import { CheckInbox } from "./check-inbox"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const forgotPasswordSchema = z.object({
  email: z.string().regex(emailRegex, "Enter a valid email address"),
})

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export function ForgotPasswordForm() {
  const [state, setState] = useState<"idle" | "loading" | "success">("idle")
  const [formError, setFormError] = useState<string>()
  const [shake, setShake] = useState(0)
  const [sentTo, setSentTo] = useState<string>()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setState("loading")
    setFormError(undefined)
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, data)
      setState("success")
      setTimeout(() => setSentTo(data.email), 500)
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } }
      setState("idle")
      setFormError(
        err.response
          ? err.response.data?.message || "We couldn't send the reset email. Please try again."
          : "We couldn't reach FlixVideo. Check your connection and try again."
      )
      setShake((n) => n + 1)
    }
  }

  return (
    <AnimatePresence mode="wait">
      {sentTo ? (
        <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <CheckInbox title="Check your" italic="inbox." email={sentTo}>
            <p>If there&apos;s an account with that email, you&apos;ll get a link to choose a new password.</p>
            <p className="text-sm">The link expires after a while, so use it soon.</p>
          </CheckInbox>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          variants={formStagger}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, scale: 0.97, filter: "blur(4px)", transition: { duration: 0.3 } }}
          className="space-y-6"
        >
          <FormHeader title="Forgot your" italic="password?">
            Enter the email you signed up with and we&apos;ll send you a reset link.
          </FormHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <AuthField
              id="email"
              type="email"
              label="Email"
              icon={Mail}
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <FormAlert message={formError} shakeKey={shake} />
            <SubmitButton state={state} loadingText="Sending link">
              Send reset link
            </SubmitButton>
          </form>

          <motion.div variants={formItem} className="text-center">
            <Link
              href="/login"
              className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              Back to sign in
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
