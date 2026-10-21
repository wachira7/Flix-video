// components/dashboard/demo-banner.tsx
// A slim bar across the app while a one-click demo is running.
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FlaskConical } from "lucide-react"
import { demoExpiresAt, endDemo } from "@/lib/demo"

function timeLeft(until: Date) {
  const mins = Math.max(0, Math.round((until.getTime() - Date.now()) / 60000))
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`
  return `${mins}m`
}

export function DemoBanner() {
  const router = useRouter()
  const [expires, setExpires] = useState<Date | null>(null)
  const [, tick] = useState(0)

  useEffect(() => {
    setExpires(demoExpiresAt())
    const t = setInterval(() => tick((n) => n + 1), 60000)
    return () => clearInterval(t)
  }, [])

  if (!expires) return null

  const signUp = () => {
    endDemo()
    router.push("/signup")
  }

  return (
    <div className="relative z-30 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-primary/25 bg-primary/10 px-4 py-2 text-center text-[13px]">
      <span className="inline-flex items-center gap-1.5 font-medium text-primary">
        <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" /> Demo
      </span>
      <span className="text-muted-foreground">
        Private and deleted in {timeLeft(expires)}. Payments and public posts are off.
      </span>
      <button type="button" onClick={signUp} className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
        Create a free account
      </button>
    </div>
  )
}
