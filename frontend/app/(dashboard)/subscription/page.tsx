// frontend/app/(dashboard)/subscription/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { subscriptionAPI, type Plan } from "@/lib/api/subscriptions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Check, Crown, Zap, ArrowRight } from "lucide-react"

export default function SubscriptionPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch plans
      const plansResponse = await subscriptionAPI.getPlans()
      setPlans(plansResponse.plans || [])

      // Fetch current subscription
      try {
        const subResponse = await subscriptionAPI.getMySubscription()
        setCurrentPlan(subResponse.subscription?.plan_type || 'free')
      } catch (error) {
        // User might not have a subscription yet
        setCurrentPlan('free')
      }
    } catch (error: any) {
      console.error('Fetch error:', error)
      toast.error('Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      toast.info('You are already on the free plan')
      return
    }

    // Navigate to checkout with selected plan
    router.push(`/subscription/checkout?plan=${planId}`)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Skeleton className="h-12 w-64 mb-8 bg-gray-800" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 bg-gray-800" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-gray-400 text-lg">
          Unlock premium features and unlimited entertainment
        </p>
      </div>

      {/* Current Plan Badge */}
      {currentPlan !== 'free' && (
        <div className="mb-8 text-center">
          <Badge className="bg-purple-600 text-white px-4 py-2">
            Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
          </Badge>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan
          const isFree = plan.id === 'free'
          const isPremium = plan.id === 'premium'

          return (
            <Card
              key={plan.id}
              className={`relative p-8 bg-gray-900 border-2 transition-all hover:scale-105 ${
                isPremium
                  ? 'border-purple-600 shadow-lg shadow-purple-600/50'
                  : isCurrentPlan
                  ? 'border-green-600'
                  : 'border-gray-800'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-linear-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
                    <Crown className="w-4 h-4 mr-1 inline" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white">
                    KES {plan.price.toLocaleString()}
                  </span>
                  {!isFree && (
                    <span className="text-gray-400">/month</span>
                  )}
                </div>
                {isFree && (
                  <p className="text-gray-400 mt-2">Forever free</p>
                )}
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                <Feature
                  text={plan.features.hd_quality ? '4K Quality' : 'SD Quality'}
                  enabled={true}
                />
                <Feature
                  text={`${plan.features.create_lists === -1 ? 'Unlimited' : plan.features.create_lists} Lists`}
                  enabled={true}
                />
                <Feature
                  text={`${plan.features.ai_recommendations_per_day === -1 ? 'Unlimited' : plan.features.ai_recommendations_per_day} AI Recommendations/day`}
                  enabled={true}
                />
                <Feature
                  text="AI Chat"
                  enabled={plan.features.ai_chat}
                />
                <Feature
                  text="Ad-Free"
                  enabled={!plan.features.ads}
                />
                <Feature
                  text="Download Lists"
                  enabled={plan.features.download_lists}
                />
                <Feature
                  text="Custom Themes"
                  enabled={plan.features.custom_themes}
                />
                <Feature
                  text="Priority Support"
                  enabled={plan.features.priority_support}
                />
              </ul>

              {/* CTA Button */}
              <Button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isCurrentPlan}
                className={`w-full ${
                  isPremium
                    ? 'bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {isCurrentPlan ? (
                  'Current Plan'
                ) : isFree ? (
                  'Current Plan'
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </Card>
          )
        })}
      </div>

      {/* Features Comparison */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          All Plans Include
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <FeatureCard icon={<Zap />} title="Instant Streaming" />
          <FeatureCard icon={<Check />} title="HD Quality" />
          <FeatureCard icon={<Check />} title="Reviews & Ratings" />
          <FeatureCard icon={<Check />} title="Watchlists" />
        </div>
      </div>
    </div>
  )
}

// Helper Components
function Feature({ text, enabled }: { text: string; enabled: boolean }) {
  return (
    <li className="flex items-center gap-2">
      {enabled ? (
        <Check className="w-5 h-5 text-green-500 shrink-0" />
      ) : (
        <span className="w-5 h-5 text-gray-600 shrink-0">-</span>
      )}
      <span className={enabled ? 'text-white' : 'text-gray-500 line-through'}>
        {text}
      </span>
    </li>
  )
}

function FeatureCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
      <div className="text-purple-500 mb-2 flex justify-center">
        {icon}
      </div>
      <p className="text-white text-sm">{title}</p>
    </div>
  )
}