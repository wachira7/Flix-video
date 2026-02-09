// components/dashboard/ai-recommendations-widget.tsx

"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Sparkles, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { recommendationsAPI } from "@/lib/api/recommendations"

export function AIRecommendationsWidget() {
  const router = useRouter()
  const [hasRecommendations, setHasRecommendations] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkRecommendations()
  }, [])

  const checkRecommendations = async () => {
    try {
      await recommendationsAPI.getMy()
      setHasRecommendations(true)
    } catch (error) {
      setHasRecommendations(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return null

  return (
    <Card className="p-6 bg-linear-to-br from-purple-900/50 to-pink-900/50 border-purple-700">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-purple-600 rounded-lg shrink-0">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-white">AI Recommendations</h3>
            <Badge className="bg-yellow-600 text-white animate-pulse">
              <Sparkles className="w-3 h-3 mr-1" />
              New
            </Badge>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            {hasRecommendations 
              ? "Your personalized AI recommendations are ready!"
              : "Get AI-powered movie suggestions based on your taste"
            }
          </p>
          <Button
            onClick={() => router.push('/ai-chat')}
            className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {hasRecommendations ? 'View Recommendations' : 'Generate Now'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  )
}