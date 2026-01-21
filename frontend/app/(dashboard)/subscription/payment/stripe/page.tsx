// frontend/app/(dashboard)/subscription/payment/card/page.tsx
"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { StripeForm } from "@/components/payment/stripe-form"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function CardPaymentContent() {
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

        {/* Stripe Form */}
        <StripeForm planId={planId} amount={amount} />

        {/* Security Badges */}
        <div className="mt-8 flex items-center justify-center gap-8 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💳</span>
            <span>PCI Compliant</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CardPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Skeleton className="h-96 w-full max-w-2xl bg-gray-800" />
      </div>
    }>
      <CardPaymentContent />
    </Suspense>
  )
}