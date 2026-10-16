// frontend/app/(dashboard)/subscription/success/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Download, Sparkles } from "lucide-react"
import confetti from "canvas-confetti"

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full p-8 bg-card border-border text-center">
        {/* Success Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-linear-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <CheckCircle className="w-12 h-12 text-foreground" />
          </div>
          <div className="absolute inset-0 w-24 h-24 bg-green-600 rounded-full mx-auto animate-ping opacity-20" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl text-foreground mb-2">
          Payment Successful! 🎉
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Welcome to FlixVideo Premium! Your subscription is now active.
        </p>

        {/* What's Next */}
        <div className="bg-secondary rounded-lg p-6 mb-8 text-left">
          <h2 className="text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            What's New for You
          </h2>
          <ul className="space-y-3 text-foreground/80 text-sm">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <span>Unlimited AI-powered movie recommendations</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <span>Ad-free streaming experience</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <span>4K HD quality streaming</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <span>Priority customer support</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <span>Unlimited custom watchlists</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-linear-to-r from-primary to-highlight hover:from-primary/90 hover:to-highlight/90"
            size="lg"
          >
            Start Exploring
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            onClick={() => router.push('/settings/billing')}
            variant="outline"
            className="flex-1 border-border text-foreground hover:bg-secondary"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            View Receipt
          </Button>
        </div>

        {/* Auto Redirect Notice */}
        <p className="text-muted-foreground text-sm">
          Redirecting to dashboard in {countdown} seconds...
        </p>
      </Card>
    </div>
  )
}