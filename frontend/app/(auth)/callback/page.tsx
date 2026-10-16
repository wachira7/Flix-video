// app/(auth)/callback/page.tsx
// OAuth callback: receives the token from the server, stores it in localStorage
// and a cookie, then redirects to the dashboard (or back to the mobile app).
"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { FormHeader } from "@/components/auth/auth-fields"
import { motion } from "framer-motion"

function Callback() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      router.push("/login?error=" + encodeURIComponent("Google sign in didn't finish. Please try again."))
      return
    }

    localStorage.setItem("token", token)
    document.cookie = `token=${token}; path=/; max-age=2592000; SameSite=Strict`

    // Decode JWT and store user object (same as email/password login)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      localStorage.setItem("user", JSON.stringify({ id: payload.id, role: payload.role || "user" }))
    } catch {
      // ignore decode error
    }

    // Redirect back to mobile app if request came from it
    if (typeof navigator !== "undefined" && /android|iphone|ipad/i.test(navigator.userAgent)) {
      window.location.href = `flixvideo://callback?token=${token}`
      return
    }

    router.push("/dashboard")
  }, [searchParams, router])

  return (
    <motion.div initial="hidden" animate="show" className="space-y-6">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
      </span>
      <FormHeader title="Signing you" italic="in…">
        Just a moment.
      </FormHeader>
    </motion.div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={null}>
      <Callback />
    </Suspense>
  )
}
