// frontend/components/dashboard/subscription-banner.tsx

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { subscriptionAPI } from "@/lib/api/subscriptions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, ArrowRight, Sparkles, X, Zap } from "lucide-react"

interface Subscription {
  plan_type: string
  status: string
  current_period_end: string
  auto_renew: boolean
  plan_details: {
    name: string
    price: number
  }
}

export function SubscriptionBanner() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if banner was dismissed in this session
    const wasDismissed = sessionStorage.getItem('subscription-banner-dismissed')
    if (wasDismissed) {
      setDismissed(true)
      setLoading(false)
      return
    }

    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await subscriptionAPI.getMySubscription()
      setSubscription(response.subscription)
    } catch (error) {
      // User probably doesn't have a subscription (free plan)
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('subscription-banner-dismissed', 'true')
  }

  const handleUpgrade = () => {
    router.push('/subscription')
  }

  // Don't show banner if loading, dismissed, or user is premium
  if (loading || dismissed) return null
  if (subscription && subscription.plan_type === 'premium' && subscription.status === 'active') return null

  // Free plan or no subscription
  if (!subscription || subscription.plan_type === 'free') {
    return (
      <Card className="relative p-6 mb-6 bg-linear-to-r from-purple-900/50 via-fuchsia-900/50 to-pink-900/50 border-purple-700 overflow-hidden">
        {/* Background Effect */}
        <div className="absolute inset-0 bg-linear-to-r from-purple-600/10 to-pink-600/10 animate-pulse" />
        
        {/* Content */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-white">
                  Unlock Premium Features
                </h3>
                <Badge className="bg-yellow-600 text-white animate-pulse">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Limited Offer
                </Badge>
              </div>
              
              <p className="text-gray-300 mb-3">
                Get unlimited AI recommendations, 4K streaming, ad-free experience, and more!
              </p>
              
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-xs text-white">
                  <Zap className="w-3 h-3" />
                  Unlimited AI Chat
                </span>
                <span className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-xs text-white">
                  <Zap className="w-3 h-3" />
                  No Ads
                </span>
                <span className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-xs text-white">
                  <Zap className="w-3 h-3" />
                  4K Quality
                </span>
                <span className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-xs text-white">
                  <Zap className="w-3 h-3" />
                  Priority Support
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleUpgrade}
              size="lg"
              className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Upgrade Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  // Basic plan
  if (subscription.plan_type === 'basic' && subscription.status === 'active') {
    return (
      <Card className="relative p-6 mb-6 bg-linear-to-r from-blue-900/50 to-purple-900/50 border-blue-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                You're on the {subscription.plan_details.name} Plan
              </h3>
              <p className="text-gray-300 text-sm">
                Upgrade to Premium for unlimited features • 
                Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleUpgrade}
              variant="outline"
              className="border-purple-700 text-white hover:bg-purple-800"
            >
              Upgrade to Premium
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  // Cancelled subscription
  if (subscription.status === 'cancelled') {
    return (
      <Card className="relative p-6 mb-6 bg-linear-to-r from-orange-900/50 to-red-900/50 border-orange-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-600 rounded-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Subscription Cancelled
              </h3>
              <p className="text-gray-300 text-sm">
                You'll have access until {new Date(subscription.current_period_end).toLocaleDateString()} • 
                Reactivate anytime!
              </p>
            </div>
          </div>

          <Button
            onClick={handleUpgrade}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Reactivate Subscription
          </Button>
        </div>
      </Card>
    )
  }

  return null
}