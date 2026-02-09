// frontend/app/(dashboard)/ai-chat/page.tsx

"use client"

import { useState, useEffect } from "react"
import { recommendationsAPI, type Recommendation } from "@/lib/api/recommendations"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Brain, Sparkles, RefreshCw, Trash2, Clock, TrendingUp, AlertCircle, CheckCircle2, Zap } from "lucide-react"
import { RecommendationCard } from "@/components/ai/recommendation-card"
import { motion, AnimatePresence } from "framer-motion"

export default function AIChatPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [summary, setSummary] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [cached, setCached] = useState(false)
  const [generatedAt, setGeneratedAt] = useState<string>("")
  const [stats, setStats] = useState<any>(null)
  const [aiStatus, setAiStatus] = useState<any>(null)

  useEffect(() => {
    checkAIStatus()
    loadCachedRecommendations()
  }, [])

  const checkAIStatus = async () => {
    try {
      const response = await recommendationsAPI.getStatus()
      setAiStatus(response.ai_providers)
    } catch (error) {
      console.error('Failed to check AI status:', error)
    }
  }

  const loadCachedRecommendations = async () => {
    try {
      const response = await recommendationsAPI.getMy()
      setRecommendations(response.recommendations)
      setSummary(response.summary)
      setCached(true)
      setGeneratedAt(response.generated_at)
      setStats(response.stats)
    } catch (error: any) {
      // No cached recommendations - that's okay
      if (error.response?.status !== 404) {
        console.error('Load cached error:', error)
      }
    } finally {
      setInitialLoading(false)
    }
  }

  const generateRecommendations = async () => {
    setLoading(true)
    try {
      const response = await recommendationsAPI.generate()
      setRecommendations(response.recommendations)
      setSummary(response.summary)
      setCached(false)
      setGeneratedAt(response.generated_at)
      setStats(response.stats)
      
      toast.success(
        response.cached 
          ? "Loaded cached recommendations" 
          : "AI recommendations generated!"
      )
    } catch (error: any) {
      console.error('Generate error:', error)
      
      const errorMsg = error.response?.data?.error || 'Failed to generate recommendations'
      
      if (errorMsg.includes('Not enough viewing data')) {
        toast.error('Add some favorites or ratings first!', {
          description: 'The AI needs your viewing history to make personalized recommendations.'
        })
      } else if (errorMsg.includes('limit reached')) {
        toast.error('Daily limit reached!', {
          description: 'Upgrade to Premium for unlimited AI recommendations.'
        })
      } else if (errorMsg.includes('AI service not configured')) {
        toast.error('AI service unavailable', {
          description: 'The AI recommendation service is currently unavailable.'
        })
      } else {
        toast.error('Failed to generate recommendations', {
          description: errorMsg
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async () => {
    try {
      await recommendationsAPI.clearCache()
      setRecommendations([])
      setSummary("")
      setCached(false)
      setGeneratedAt("")
      setStats(null)
      toast.success('Cache cleared! Generate fresh recommendations.')
    } catch (error) {
      console.error('Clear cache error:', error)
      toast.error('Failed to clear cache')
    }
  }

  if (initialLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Skeleton className="h-12 w-64 mb-8 bg-gray-800" />
        <Skeleton className="h-32 mb-6 bg-gray-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-96 bg-gray-800" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-linear-to-br from-purple-600 to-pink-600 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">AI Recommendations</h1>
            <p className="text-gray-400 mt-1">
              Personalized suggestions powered by artificial intelligence
            </p>
          </div>
        </div>

        {/* AI Status Badge */}
        {aiStatus && (
          <div className="flex items-center gap-2 mt-4">
            <Badge className={
              aiStatus.available_count > 0 
                ? "bg-green-600" 
                : "bg-red-600"
            }>
              {aiStatus.available_count > 0 ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  AI Ready
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  AI Unavailable
                </>
              )}
            </Badge>
            {aiStatus.available_count > 0 && (
              <span className="text-sm text-gray-500">
                Using {aiStatus.primary_provider === 'openai' ? 'OpenAI GPT-4' : 'Claude AI'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button
          onClick={generateRecommendations}
          disabled={loading || (aiStatus && aiStatus.available_count === 0)}
          className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          size="lg"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {recommendations.length > 0 ? 'Refresh Recommendations' : 'Generate Recommendations'}
            </>
          )}
        </Button>

        {recommendations.length > 0 && (
          <Button
            onClick={clearCache}
            variant="outline"
            className="border-gray-700 text-white hover:bg-gray-800"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
        )}
      </div>

      {/* Cache Info */}
      {cached && generatedAt && (
        <Alert className="mb-6 bg-blue-900/20 border-blue-700">
          <Clock className="w-4 h-4" />
          <AlertDescription>
            These recommendations were generated {new Date(generatedAt).toLocaleString()}.
            They're cached for 24 hours to save AI costs.
          </AlertDescription>
        </Alert>
      )}

      {/* AI Summary */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6 mb-8 bg-linear-to-br from-purple-900/50 to-pink-900/50 border-purple-700">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-600 rounded-lg shrink-0">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">AI Analysis</h2>
                <p className="text-gray-300 leading-relaxed">{summary}</p>
                
                {stats && (
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-purple-800">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-400">
                        {stats.tokens_used} tokens used
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-400">
                        Cost: {stats.cost_estimate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-400">
                        Cached for {stats.cache_duration}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Recommendations Grid */}
      {recommendations.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold text-white">Your Personalized Picks</h2>
            <Badge className="bg-purple-600">
              {recommendations.length} recommendations
            </Badge>
          </div>

          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={`${rec.tmdb_id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <RecommendationCard recommendation={rec} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      ) : !loading && (
        <Card className="p-12 bg-gray-900 border-gray-800 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-linear-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              No Recommendations Yet
            </h2>
            <p className="text-gray-400 mb-6">
              Click the button above to generate personalized AI recommendations based on your viewing history.
            </p>
            <Button
              onClick={generateRecommendations}
              disabled={loading || (aiStatus && aiStatus.available_count === 0)}
              className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}