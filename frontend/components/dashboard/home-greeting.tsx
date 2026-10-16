// components/dashboard/home-greeting.tsx
"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { displayName, useCurrentUser } from "@/lib/hooks/use-auth"

function partOfDay(hour: number) {
  if (hour < 5) return "Up late"
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export function HomeGreeting() {
  const { user, ready } = useCurrentUser()
  const [greeting, setGreeting] = useState<string | null>(null)

  // Time of day must come from the viewer's clock, not the server's
  useEffect(() => setGreeting(partOfDay(new Date().getHours())), [])

  if (!greeting || !ready) return <div className="h-[4.5rem]" aria-hidden="true" />
  const first = displayName(user).split(" ")[0]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h2 className="text-3xl leading-tight sm:text-4xl">
        {greeting}, <em className="italic text-primary">{first}.</em>
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Here&apos;s what&apos;s worth your time.</p>
    </motion.div>
  )
}
