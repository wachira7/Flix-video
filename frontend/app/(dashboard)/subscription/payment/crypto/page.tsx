// frontend/app/(dashboard)/subscription/payment/crypto/page.tsx
"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CryptoForm } from "@/components/payment/crypto-form"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Shield, Clock, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function CryptoPaymentContent() {
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') || 'basic'
  const amount = parseInt(searchParams.get('amount') || '0')

  if (!amount) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <Card className="p-8 bg-gray-900 border-gray-800 text-center">
          <h2 className="text-xl font-bold text-white mb-4">Invalid Payment</h2>
          <p className="text-gray-400 mb-6">No amount specified</p>
          <Link href="/subscription">
            <Button>Back to Plans</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link href="/subscription/checkout">
          <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payment Methods
          </Button>
        </Link>

        {/* Crypto Form */}
        <CryptoForm planId={planId} amount={amount} />

        {/* Why Crypto */}
        <Card className="mt-8 p-6 bg-gray-900 border-gray-800">
          <h3 className="text-white font-semibold mb-4">Why Pay with Crypto?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-orange-500 shrink-0 mt-1" />
              <div>
                <p className="text-white text-sm font-medium">Secure & Private</p>
                <p className="text-gray-400 text-xs mt-1">No personal information required</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-orange-500 shrink-0 mt-1" />
              <div>
                <p className="text-white text-sm font-medium">Low Fees</p>
                <p className="text-gray-400 text-xs mt-1">Minimal transaction costs</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-500 shrink-0 mt-1" />
              <div>
                <p className="text-white text-sm font-medium">Fast Settlement</p>
                <p className="text-gray-400 text-xs mt-1">Confirmed within minutes</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Supported Currencies */}
        <Card className="mt-4 p-6 bg-gray-900 border-gray-800">
          <h3 className="text-white font-semibold mb-3">Supported Cryptocurrencies</h3>
          <div className="flex flex-wrap gap-2">
            {['Bitcoin (BTC)', 'Ethereum (ETH)', 'USDT', 'USDC', 'Litecoin (LTC)', 'Bitcoin Cash (BCH)'].map((currency) => (
              <span key={currency} className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-300">
                {currency}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function CryptoPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Skeleton className="h-96 w-full max-w-2xl bg-gray-800" />
      </div>
    }>
      <CryptoPaymentContent />
    </Suspense>
  )
}