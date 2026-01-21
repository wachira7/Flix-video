// frontend/app/(dashboard)/subscription/checkout/page.tsx

"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { subscriptionAPI, type Plan } from "@/lib/api/subscriptions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ArrowLeft, CreditCard, Smartphone, Bitcoin } from "lucide-react"
import Link from "next/link"

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan')

  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'mpesa' | 'crypto' | null>(null)

  useEffect(() => {
    if (!planId) {
      router.push('/subscription')
      return
    }
    fetchPlan()
  }, [planId])

  const fetchPlan = async () => {
    try {
      const response = await subscriptionAPI.getPlans()
      const selectedPlan = response.plans.find((p: Plan) => p.id === planId)
      
      if (!selectedPlan) {
        toast.error('Plan not found')
        router.push('/subscription')
        return
      }

      setPlan(selectedPlan)
    } catch (error) {
      console.error('Fetch plan error:', error)
      toast.error('Failed to load plan details')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPayment = (method: 'stripe' | 'mpesa' | 'crypto') => {
    setSelectedMethod(method)
    // Navigate to specific payment page
    router.push(`/subscription/payment/${method}?plan=${planId}&amount=${plan?.price}`)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-48 mb-8 bg-gray-800" />
        <Skeleton className="h-96 bg-gray-800" />
      </div>
    )
  }

  if (!plan) {
    return null
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back Button */}
      <Link href="/subscription">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Plans
        </Button>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Complete Your Purchase</h1>
        <p className="text-gray-400">Choose your preferred payment method</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Order Summary */}
        <Card className="md:col-span-1 p-6 bg-gray-900 border-gray-800 h-fit">
          <h2 className="text-xl font-semibold text-white mb-4">Order Summary</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm">Plan</p>
              <p className="text-white font-semibold">{plan.name}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Billing</p>
              <p className="text-white">{plan.billing_period || 'One-time'}</p>
            </div>

            <div className="border-t border-gray-800 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">KES {plan.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg">
                <span className="text-white">Total</span>
                <span className="text-white">KES {plan.price.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Right: Payment Methods */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Select Payment Method</h2>

          {/* Stripe */}
          <Card
            className={`p-6 bg-gray-900 border-2 cursor-pointer transition-all hover:border-purple-600 ${
              selectedMethod === 'stripe' ? 'border-purple-600' : 'border-gray-800'
            }`}
            onClick={() => handleSelectPayment('stripe')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Credit/Debit Card</h3>
                <p className="text-gray-400 text-sm">Pay securely with Visa, Mastercard, or Amex</p>
              </div>
              <Button
                onClick={() => handleSelectPayment('stripe')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Select
              </Button>
            </div>
          </Card>

          {/* M-Pesa */}
          <Card
            className={`p-6 bg-gray-900 border-2 cursor-pointer transition-all hover:border-green-600 ${
              selectedMethod === 'mpesa' ? 'border-green-600' : 'border-gray-800'
            }`}
            onClick={() => handleSelectPayment('mpesa')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600 rounded-lg">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">M-Pesa</h3>
                <p className="text-gray-400 text-sm">Pay instantly with your M-Pesa mobile money</p>
              </div>
              <Button
                onClick={() => handleSelectPayment('mpesa')}
                className="bg-green-600 hover:bg-green-700"
              >
                Select
              </Button>
            </div>
          </Card>

          {/* Crypto */}
          <Card
            className={`p-6 bg-gray-900 border-2 cursor-pointer transition-all hover:border-orange-600 ${
              selectedMethod === 'crypto' ? 'border-orange-600' : 'border-gray-800'
            }`}
            onClick={() => handleSelectPayment('crypto')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-600 rounded-lg">
                <Bitcoin className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Cryptocurrency</h3>
                <p className="text-gray-400 text-sm">Pay with Bitcoin, Ethereum, USDT, and more</p>
              </div>
              <Button
                onClick={() => handleSelectPayment('crypto')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Select
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-lg">
        <p className="text-gray-400 text-sm text-center">
          🔒 Your payment information is encrypted and secure. We never store your card details.
        </p>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 max-w-4xl mx-auto"><Skeleton className="h-96 bg-gray-800" /></div>}>
      <CheckoutContent />
    </Suspense>
  )
}