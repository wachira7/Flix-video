// frontend/app/(dashboard)/subscription/failure/page.tsx
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, RefreshCw, HelpCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function SubscriptionFailurePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showDetails, setShowDetails] = useState(false)

  const errorReason = searchParams.get('reason') || 'unknown'
  const paymentMethod = searchParams.get('method') || 'unknown'

  const getErrorMessage = () => {
    switch (errorReason) {
      case 'insufficient_funds':
        return 'Your payment was declined due to insufficient funds.'
      case 'card_declined':
        return 'Your card was declined. Please try a different payment method.'
      case 'expired_card':
        return 'Your card has expired. Please update your payment information.'
      case 'timeout':
        return 'The payment request timed out. Please try again.'
      case 'cancelled':
        return 'You cancelled the payment process.'
      case 'network_error':
        return 'A network error occurred. Please check your connection and try again.'
      default:
        return 'We couldn\'t process your payment. Please try again.'
    }
  }

  const getTroubleshootingSteps = () => {
    const steps = [
      'Verify your payment information is correct',
      'Ensure you have sufficient funds',
      'Check your internet connection',
      'Try a different payment method',
      'Contact your bank for more details',
      'Reach out to our support team if the issue persists',
      'Refresh the page to try again',
      'Try again in after some time',
    ]

    if (paymentMethod === 'mpesa') {
      steps.push('Make sure your M-Pesa PIN is correct')
      steps.push('Check if you received the STK push notification')
    } else if (paymentMethod === 'card') {
      steps.push('Contact your bank if the problem persists')
    }

    return steps
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full p-8 bg-gray-900 border-gray-800">
        {/* Error Icon */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 bg-red-500/10 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Payment Failed
          </h1>
          <p className="text-gray-400 text-lg">
            {getErrorMessage()}
          </p>
        </div>

        {/* Error Details (Collapsible) */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full mb-6 p-4 bg-gray-800 rounded-lg text-left hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-white font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Error Details
            </span>
            <span className="text-gray-400 text-sm">
              {showDetails ? 'Hide' : 'Show'}
            </span>
          </div>
          {showDetails && (
            <div className="mt-3 pt-3 border-t border-gray-700 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Payment Method:</span>
                <span className="text-white capitalize">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Error Code:</span>
                <span className="text-white uppercase">{errorReason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time:</span>
                <span className="text-white">{new Date().toLocaleString()}</span>
              </div>
            </div>
          )}
        </button>

        {/* Troubleshooting Steps */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            What You Can Do
          </h2>
          <ol className="space-y-3 text-gray-300 text-sm">
            {getTroubleshootingSteps().map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            onClick={() => router.push('/subscription/checkout')}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => router.push('/subscription')}
            variant="outline"
            className="flex-1 border-gray-700 text-white hover:bg-gray-800"
            size="lg"
          >
            Choose Different Plan
          </Button>
        </div>

        {/* Support Link */}
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-2">
            Still having trouble?
          </p>
          <Link href="/support" className="text-blue-500 hover:text-blue-400 text-sm font-medium">
            Contact Support →
          </Link>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6 pt-6 border-t border-gray-800">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  )
}