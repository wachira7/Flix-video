// components/dashboard/usage-widget.tsx 

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { subscriptionAPI } from "@/lib/api/subscriptions"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Brain, List, Heart, Users, TrendingUp, Crown, ArrowRight, Sparkles, X, ChevronLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface UsageData {
  plan: string
  usage: {
    [key: string]: {
      used: number
      limit: number | string
      remaining: number | string
    }
  }
}

export function UsageWidget() {
  const router = useRouter()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false) 
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user dismissed the widget
    const wasDismissed = sessionStorage.getItem('usage-widget-dismissed')
    if (wasDismissed === 'true') {
      setDismissed(true)
    }

    fetchUsage()
    
    // Refresh usage every minute
    const interval = setInterval(fetchUsage, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchUsage = async () => {
    try {
      const response = await subscriptionAPI.getUsageStats()
      setUsage(response)
      
      // Auto-hide for premium users (they don't need to see limits)
      if (response.plan === 'premium') {
        setDismissed(true)
      }
    } catch (error) {
      console.error('Fetch usage error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('usage-widget-dismissed', 'true')
  }

  // Don't show if dismissed
  if (dismissed) return null

  if (loading) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-800">
        <Skeleton className="h-6 w-32 mb-4 bg-gray-800" />
        <div className="space-y-4">
          <Skeleton className="h-16 bg-gray-800" />
          <Skeleton className="h-16 bg-gray-800" />
        </div>
      </Card>
    )
  }

  if (!usage) return null

  const getUsageIcon = (feature: string) => {
    const icons: Record<string, any> = {
      ai_recommendations_daily: Brain,
      watch_parties_daily: Users,
      lists: List,
      watchlists: Heart
    }
    return icons[feature] || TrendingUp
  }

  const getUsageColor = (used: number, limit: number | string) => {
    if (limit === 'unlimited') return 'text-green-500'
    const numLimit = typeof limit === 'number' ? limit : parseInt(limit as string)
    const percentage = (used / numLimit) * 100
    if (percentage >= 90) return 'text-red-500'
    if (percentage >= 70) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getProgressValue = (used: number, limit: number | string) => {
    if (limit === 'unlimited') return 0
    const numLimit = typeof limit === 'number' ? limit : parseInt(limit as string)
    return Math.min((used / numLimit) * 100, 100)
  }

  const isFreePlan = usage.plan === 'free'
  const isBasicPlan = usage.plan === 'basic'
  
  // Check if any limit is close to being reached
  const hasWarnings = Object.entries(usage.usage).some(([_, data]) => {
    if (data.limit === 'unlimited') return false
    const numLimit = typeof data.limit === 'number' ? data.limit : parseInt(data.limit as string)
    return (data.used / numLimit) >= 0.7
  })

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gray-900 border-gray-800 overflow-hidden">
          {/* ✅ Collapsible Header */}
          <div className="p-4 flex items-center justify-between border-b border-gray-800">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">Usage</h3>
              <Badge className={`
                ${usage.plan === 'premium' ? 'bg-purple-600' : 
                  usage.plan === 'basic' ? 'bg-blue-600' : 
                  'bg-gray-600'} text-white capitalize text-xs
              `}>
                {usage.plan === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                {usage.plan}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setCollapsed(!collapsed)}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <motion.div
                  animate={{ rotate: collapsed ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                </motion.div>
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <X className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
          </div>

          {/* ✅ Collapsible Content */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-4">
                  {/* Usage Stats */}
                  <div className="space-y-4 mb-4">
                    {Object.entries(usage.usage).map(([feature, data]) => {
                      const Icon = getUsageIcon(feature)
                      const isUnlimited = data.limit === 'unlimited'
                      const progressValue = getProgressValue(data.used, data.limit)
                      const isWarning = progressValue >= 70 && progressValue < 90
                      const isCritical = progressValue >= 90
                      
                      return (
                        <div key={feature} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${getUsageColor(data.used, data.limit)}`} />
                              <span className="text-sm text-gray-400 capitalize">
                                {feature.replace(/_/g, ' ').replace('daily', '(Today)')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`text-sm font-medium ${
                                isCritical ? 'text-red-400' : 
                                isWarning ? 'text-yellow-400' : 
                                'text-white'
                              }`}>
                                {data.used}
                              </span>
                              {!isUnlimited && (
                                <span className="text-sm text-gray-500">/ {data.limit}</span>
                              )}
                              {isUnlimited && (
                                <span className="text-green-500 ml-1">∞</span>
                              )}
                            </div>
                          </div>
                          
                          {!isUnlimited && (
                            <div className="relative">
                              <Progress 
                                value={progressValue} 
                                className="h-2"
                              />
                              {isCritical && (
                                <span className="text-xs text-red-400 mt-1 block">
                                  Limit almost reached!
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Upgrade CTA for Free/Basic Users */}
                  {(isFreePlan || isBasicPlan) && (
                    <div className="pt-4 border-t border-gray-800">
                      {hasWarnings && (
                        <div className="mb-3 p-2 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                          <p className="text-xs text-yellow-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            You're approaching your limits
                          </p>
                        </div>
                      )}
                      
                      <Button
                        onClick={() => router.push('/subscription')}
                        className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        size="sm"
                      >
                        <Crown className="w-3 h-3 mr-2" />
                        {isFreePlan ? 'Upgrade to Premium' : 'Upgrade Plan'}
                        <ArrowRight className="w-3 h-3 ml-2" />
                      </Button>
                    </div>
                  )}

                  {/* Info Footer */}
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    {isFreePlan && 'Daily limits reset at midnight'}
                    {isBasicPlan && 'Enjoying Basic? Try Premium!'}
                    {usage.plan === 'premium' && '✨ Unlimited everything!'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}