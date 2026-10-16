// components/auth/signup-form.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Lock, Mail, User } from "lucide-react"
import axios from "axios"
import { signupSchema, type SignupInput } from "@/lib/validations/auth"
import {
  AuthField,
  FormAlert,
  FormHeader,
  GoogleButton,
  OrDivider,
  PasswordChecklist,
  SubmitButton,
  formItem,
  formStagger,
  useReveal,
} from "./auth-fields"
import { CheckInbox } from "./check-inbox"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export function SignupForm() {
  const [state, setState] = useState<"idle" | "loading" | "success">("idle")
  const [formError, setFormError] = useState<string>()
  const [shake, setShake] = useState(0)
  const [sentTo, setSentTo] = useState<string>()
  const password = useReveal()
  const confirm = useReveal()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) })

  const passwordValue = watch("password", "")

  const onSubmit = async (data: SignupInput) => {
    setState("loading")
    setFormError(undefined)
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        name: data.name,
        email: data.email,
        password: data.password,
      })
      setState("success")
      setTimeout(() => setSentTo(data.email), 500)
    } catch (error) {
      const err = error as { response?: { data?: { message?: string; error?: string } } }
      setState("idle")
      setFormError(
        err.response
          ? err.response.data?.message || err.response.data?.error || "We couldn't create your account. Please try again."
          : "We couldn't reach FlixVideo. Check your connection and try again."
      )
      setShake((n) => n + 1)
    }
  }

  return (
    <AnimatePresence mode="wait">
      {sentTo ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <CheckInbox title="Check your" italic="inbox." email={sentTo}>
            <p>Open the email from FlixVideo and tap the link to verify your account. Then you can sign in.</p>
            <p className="text-sm">Nothing there after a few minutes? Check your spam or promotions folder.</p>
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
          <FormHeader title="Create your" italic="account">
            Free to start. No card needed.
          </FormHeader>

          <GoogleButton
            label="Sign up with Google"
            onClick={() => (window.location.href = `${API_URL}/api/auth/google`)}
          />
          <OrDivider />

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <AuthField
              id="name"
              label="Name"
              icon={User}
              autoComplete="name"
              placeholder="What should we call you?"
              error={errors.name?.message}
              {...register("name")}
            />
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
            <div className="space-y-2">
              <AuthField
                id="password"
                type={password.type}
                label="Password"
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
              label="Confirm password"
              icon={Lock}
              autoComplete="new-password"
              placeholder="Type it again"
              error={errors.confirmPassword?.message}
              trailing={confirm.toggle}
              {...register("confirmPassword")}
            />

            <FormAlert message={formError} shakeKey={shake} />

            <SubmitButton state={state} loadingText="Creating your account">
              Create account
            </SubmitButton>
          </form>

          <motion.p variants={formItem} className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline">
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
