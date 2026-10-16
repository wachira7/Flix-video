// lib/hooks/use-auth.ts
// Current user, avatar and plan for the app shell. The user comes from
// localStorage (set at sign-in); the plan is fetched once per page load and
// shared by every component that asks for it.
"use client"

import { useEffect, useState } from "react"
import { getUser } from "@/lib/auth"
import { avatarEvents } from "@/lib/events/avatar-events"
import { subscriptionAPI } from "@/lib/api/subscriptions"

export type PlanId = "free" | "basic" | "premium"

export interface CurrentUser {
  id?: string
  email?: string
  username?: string
  full_name?: string
  name?: string
  avatar_url?: string | null
  role?: string
}

let planRequest: Promise<PlanId> | null = null

function fetchPlan(): Promise<PlanId> {
  planRequest ??= subscriptionAPI
    .getMySubscription()
    .then((r) => (r.subscription?.plan_type as PlanId) || "free")
    .catch(() => "free" as PlanId)
  return planRequest
}

export function displayName(user: CurrentUser | null) {
  return user?.full_name || user?.name || user?.username || user?.email?.split("@")[0] || "there"
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [plan, setPlan] = useState<PlanId | null>(null)

  useEffect(() => {
    const current = getUser() as CurrentUser | null
    setUser(current)
    setAvatarUrl(current?.avatar_url ?? null)
    let alive = true
    fetchPlan().then((p) => alive && setPlan(p))
    const unsubscribe = avatarEvents.subscribe(setAvatarUrl)
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  return { user, avatarUrl, plan, ready: user !== null }
}
