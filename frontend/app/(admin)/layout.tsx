// app/(admin)/layout.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { getUser } from "@/lib/auth"
import { Toaster } from "sonner"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = getUser()
    
    // Check if user is admin or moderator
    if (!user || (user.role !== 'admin' && user.role !== 'moderator' && !user.is_admin)) {
      router.push('/dashboard')
      return
    }

    setIsAuthorized(true)
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="dark min-h-svh bg-background text-foreground">
      <AdminSidebar />
      <main className="px-4 py-6 sm:px-6 lg:pl-[calc(248px+2rem)] lg:pr-8 lg:py-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
      <Toaster 
        position="top-right"
        richColors
        closeButton
        expand={false}
        duration={4000}
        theme="dark"
      />
    </div>
  )
}
