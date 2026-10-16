// components/auth/login-form.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Lock, Mail } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import {
  AuthField,
  FormAlert,
  FormHeader,
  GoogleButton,
  OrDivider,
  SubmitButton,
  formItem,
  formStagger,
  useReveal,
} from "./auth-fields"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

/** Only allow same-site relative paths as a post-login destination */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null
}

function errorMessage(error: unknown) {
  const err = error as { response?: { data?: { error?: string; message?: string } } }
  if (!err.response) return "We couldn't reach FlixVideo. Check your connection and try again."
  const raw = (err.response.data?.error || err.response.data?.message || "").toLowerCase()
  if (raw.includes("verify") || raw.includes("verified")) return "Please verify your email first. Check your inbox for the link."
  if (raw.includes("not found")) return "There's no account with that email. Create one instead?"
  if (raw.includes("invalid") || raw.includes("incorrect") || raw.includes("wrong"))
    return "That email and password don't match. Try again or reset your password."
  return err.response.data?.error || err.response.data?.message || "Sign in failed. Please try again."
}

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = safeNext(params.get("next"))
  const [state, setState] = useState<"idle" | "loading" | "success">("idle")
  const [formError, setFormError] = useState<string | undefined>(params.get("error") ?? undefined)
  const [shake, setShake] = useState(0)
  const password = useReveal()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginInput) => {
    setState("loading")
    setFormError(undefined)
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, data)
      const { token, user } = response.data

      // localStorage for client-side access, cookie for the middleware
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))
      document.cookie = `token=${token}; path=/; max-age=2592000; SameSite=Strict`

      setState("success")
      const name = user?.username || user?.name || user?.email?.split("@")[0]
      toast.success(name ? `Welcome back, ${name}` : "Welcome back")

      const isStaff = user?.role === "admin" || user?.is_admin === true || user?.role === "moderator"
      setTimeout(() => router.push(isStaff ? "/admin" : next || "/dashboard"), 600)
    } catch (error) {
      setState("idle")
      setFormError(errorMessage(error))
      setShake((n) => n + 1)
    }
  }

  return (
    <motion.div variants={formStagger} initial="hidden" animate="show" className="space-y-6">
      <FormHeader title="Sign in" italic="to FlixVideo">
        Good to see you again.
      </FormHeader>

      <GoogleButton label="Continue with Google" onClick={() => (window.location.href = `${API_URL}/api/auth/google`)} />
      <OrDivider />

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
        <AuthField
          id="password"
          type={password.type}
          label="Password"
          icon={Lock}
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password?.message}
          trailing={password.toggle}
          labelAside={
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Forgot password?
            </Link>
          }
          {...register("password")}
        />

        <FormAlert message={formError} shakeKey={shake} />

        <SubmitButton state={state} loadingText="Signing in">
          Sign in
        </SubmitButton>
      </form>

      <motion.p variants={formItem} className="text-center text-sm text-muted-foreground">
        New to FlixVideo?{" "}
        <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline">
          Create a free account
        </Link>
      </motion.p>
    </motion.div>
  )
}
