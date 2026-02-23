// This page is the callback URL for OAuth providers. It receives the token from the server and stores it in localStorage and cookies, then redirects to the dashboard.
//./app/(auth)/callback/page.tsx
"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function CallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      router.push('/login?error=Authentication failed')
      return
    }

    // Store token
    localStorage.setItem('token', token)
    document.cookie = `token=${token}; path=/; max-age=2592000; SameSite=Strict`

    // Decode JWT and store user object (same as email/password login)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      localStorage.setItem('user', JSON.stringify({
        id: payload.id,
        role: payload.role || 'user'
      }))
    } catch {
      // ignore decode error
    }

    router.push('/dashboard')
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-purple-600" />
        <h1 className="text-2xl font-bold text-white mb-2">Signing you in...</h1>
        <p className="text-gray-400">Please wait</p>
      </div>
    </div>
  )
}