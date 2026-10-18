// lib/plans.ts
// Plan details shown in the UI. Mirrors backend/src/config/plans.js (the
// backend is the source of truth for prices and limits). Keep them in sync.

export type PlanId = "free" | "basic" | "premium"

export interface PlanInfo {
  id: PlanId
  name: string
  price: number
  blurb: string
  features: string[]
  featured?: boolean
}

export const PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    blurb: "For finding something good tonight.",
    features: [
      "1 AI pick a day",
      "3 watchlists and 5 custom lists",
      "2 watch parties a day, up to 5 guests",
      "Ratings and reviews",
      "Includes ads",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: 499,
    blurb: "For people who watch most weeks.",
    features: [
      "5 AI picks a day",
      "10 watchlists and 20 custom lists",
      "10 watch parties a day, up to 10 guests",
      "HD quality",
      "Export your lists",
      "No ads",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 999,
    blurb: "Everything, with the AI assistant.",
    features: [
      "Unlimited AI picks",
      "AI assistant, 50 conversations a month",
      "Unlimited watchlists and lists",
      "Unlimited watch parties, up to 50 guests",
      "Custom themes and early access",
      "Priority support, no ads",
    ],
    featured: true,
  },
]

export const planById = (id: string | null | undefined) => PLANS.find((p) => p.id === id)

export const formatKes = (amount: number) => `KSh ${amount.toLocaleString("en-KE")}`
