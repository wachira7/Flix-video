// frontend/app/(dashboard)/subscription/payment/mpesa/page.tsx
"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { MpesaForm } from "@/components/payment/mpesa-form"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function MpesaPaymentContent() {
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

        {/* M-Pesa Form */}
        <MpesaForm planId={planId} amount={amount} />

        {/* How it Works */}
        <Card className="mt-8 p-6 bg-gray-900 border-gray-800">
          <h3 className="text-white font-semibold mb-4">How M-Pesa Payment Works</h3>
          <ol className="space-y-3 text-gray-400 text-sm">
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">1</span>
              <span>Enter your M-Pesa registered phone number</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">2</span>
              <span>You'll receive an STK push notification on your phone</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">3</span>
              <span>Enter your M-Pesa PIN to complete the payment</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">4</span>
              <span>Your subscription will be activated instantly</span>
            </li>
          </ol>
        </Card>
      </div>
    </div>
  )
}

export default function MpesaPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Skeleton className="h-96 w-full max-w-2xl bg-gray-800" />
      </div>
    }>
      <MpesaPaymentContent />
    </Suspense>
  )
}