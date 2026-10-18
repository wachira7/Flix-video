// components/auth/reset-password-form.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Lock, Unlink } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import {
  AuthField,
  FormAlert,
  FormHeader,
  PasswordChecklist,
  SubmitButton,
  formItem,
  formStagger,
  useReveal,
} from "./auth-fields"

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(passwordRegex, "Password must contain uppercase, lowercase, number and special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export function ResetPasswordForm() {
  const router = useRouter()
  const token = useSearchParams().get("token")
  const [state, setState] = useState<"idle" | "loading" | "success">("idle")
  const [formError, setFormError] = useState<string>()
  const [shake, setShake] = useState(0)
  const password = useReveal()
  const confirm = useReveal()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) })

  const passwordValue = watch("password", "")

  const onSubmit = async (data: ResetPasswordInput) => {
    setState("loading")
    setFormError(undefined)
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { token, newPassword: data.password })
      setState("success")
      toast.success("Password updated. Sign in with your new password.")
      setTimeout(() => router.push("/login"), 700)
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } }
      setState("idle")
      setFormError(
        err.response
          ? err.response.data?.message || "We couldn't reset your password. The link may have expired."
          : "We couldn't reach FlixVideo. Check your connection and try again."
      )
      setShake((n) => n + 1)
    }
  }

  if (!token) {
    return (
      <motion.div variants={formStagger} initial="hidden" animate="show" className="space-y-6">
        <motion.span
          variants={formItem}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive"
        >
          <Unlink className="h-7 w-7" aria-hidden="true" />
        </motion.span>
        <FormHeader title="This link" italic="doesn't work.">
          Reset links can only be used once and expire after a while. Request a new one and use it straight away.
        </FormHeader>
        <motion.div variants={formItem}>
          <Link
            href="/forgot-password"
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Send me a new link
          </Link>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div variants={formStagger} initial="hidden" animate="show" className="space-y-6">
      <FormHeader title="Choose a new" italic="password">
        You&apos;ll use this to sign in from now on.
      </FormHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="space-y-2">
          <AuthField
            id="password"
            type={password.type}
            label="New password"
            icon={Lock}
            autoComplete="new-password"
            placeholder="Create a password"
            error={errors.password?.message}
            trailing={password.toggle}
            {...register("password")}
          />
          <PasswordChecklist password={passwordValue} />
        </div>
        <AuthField
          id="confirmPassword"
          type={confirm.type}
          label="Confirm new password"
          icon={Lock}
          autoComplete="new-password"
          placeholder="Type it again"
          error={errors.confirmPassword?.message}
          trailing={confirm.toggle}
          {...register("confirmPassword")}
        />
        <FormAlert message={formError} shakeKey={shake} />
        <SubmitButton state={state} loadingText="Saving">
          Save new password
        </SubmitButton>
      </form>
    </motion.div>
  )
}
