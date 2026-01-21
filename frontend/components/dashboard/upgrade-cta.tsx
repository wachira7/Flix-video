// frontend/components/dashboard/upgrade-cta.tsx

"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Crown, ArrowRight } from "lucide-react"

interface UpgradeCTAProps {
  feature: string
  title?: string
  description?: string
  variant?: "inline" | "modal" | "banner"
}

export function UpgradeCTA({ 
  feature, 
  title, 
  description,
  variant = "inline" 
}: UpgradeCTAProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    router.push('/subscription?highlight=premium')
  }

  // Get feature-specific content
  const getFeatureContent = () => {
    const features: Record<string, { title: string; description: string }> = {
      ai_chat: {
        title: "AI Chat is Premium",
        description: "Upgrade to Premium to chat with our AI assistant and get personalized movie recommendations."
      },
      unlimited_lists: {
        title: "Create Unlimited Lists",
        description: "Free plan is limited to 5 lists. Upgrade to Premium for unlimited custom lists."
      },
      ai_recommendations: {
        title: "Daily AI Limit Reached",
        description: "You've used your daily AI recommendations. Upgrade to Premium for unlimited recommendations."
      },
      hd_quality: {
        title: "Watch in 4K Quality",
        description: "Upgrade to Premium to enjoy crystal-clear 4K streaming quality."
      },
      no_ads: {
        title: "Remove All Ads",
        description: "Upgrade to Premium for a completely ad-free viewing experience."
      },
      download_lists: {
        title: "Download Your Lists",
        description: "Premium members can download and export their lists in multiple formats."
      },
      custom_themes: {
        title: "Customize Your Theme",
        description: "Premium members can choose from multiple beautiful themes."
      },
      priority_support: {
        title: "Get Priority Support",
        description: "Premium members get priority customer support with faster response times."
      }
    }

    return features[feature] || {
      title: "Premium Feature",
      description: "This feature is only available to Premium members."
    }
  }

  const content = getFeatureContent()
  const displayTitle = title || content.title
  const displayDescription = description || content.description

  // Inline variant (small CTA within content)
  if (variant === "inline") {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-600 rounded-lg">
        <Lock className="w-4 h-4 text-purple-400" />
        <span className="text-sm text-purple-300">
          {displayTitle}
        </span>
        <Button
          onClick={handleUpgrade}
          size="sm"
          variant="ghost"
          className="text-purple-300 hover:text-white h-auto py-1 px-2"
        >
          Upgrade
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    )
  }

  // Banner variant (full-width alert)
  if (variant === "banner") {
    return (
      <div className="p-4 bg-linear-to-r from-purple-900/50 to-pink-900/50 border border-purple-700 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-purple-400" />
            <div>
              <h4 className="text-white font-semibold">{displayTitle}</h4>
              <p className="text-gray-300 text-sm">{displayDescription}</p>
            </div>
          </div>
          <Button
            onClick={handleUpgrade}
            className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
        </div>
      </div>
    )
  }

  // Modal variant (card that takes center stage)
  return (
    <Card className="p-8 bg-linear-to-br from-purple-900/50 to-pink-900/50 border-purple-700 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 bg-linear-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2">
        {displayTitle}
      </h2>
      
      <p className="text-gray-300 mb-6">
        {displayDescription}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={handleUpgrade}
          size="lg"
          className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Premium
        </Button>
        <Button
          onClick={() => router.push('/subscription')}
          size="lg"
          variant="outline"
          className="border-purple-700 text-white hover:bg-purple-800"
        >
          Compare Plans
        </Button>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Starting at just KES 499/month
      </p>
    </Card>
  )
}