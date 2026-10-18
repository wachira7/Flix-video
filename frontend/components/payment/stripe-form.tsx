// frontend/components/payment/stripe-form.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { paymentsAPI } from "@/lib/api/payments"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, CreditCard } from "lucide-react"
import { toast } from "sonner"

interface StripeFormProps {
  planId: string
  amount: number
}

export function StripeForm({ planId, amount }: StripeFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    try {
      const response = await paymentsAPI.createStripeCheckout(
        amount,
        planId,
        `FlixVideo ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`
      )

      if (response.success && response.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = response.checkout_url
      } else {
        toast.error('Failed to create checkout session')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Stripe checkout error:', error)
      toast.error(error.response?.data?.error || 'Payment failed')
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-foreground" />
        </div>
        <h2 className="text-2xl text-foreground mb-2">Pay with Card</h2>
        <p className="text-muted-foreground">
          You'll be redirected to Stripe's secure payment page
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between p-4 bg-secondary rounded-lg">
          <span className="text-muted-foreground">Amount</span>
          <span className="text-foreground font-semibold">KES {amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between p-4 bg-secondary rounded-lg">
          <span className="text-muted-foreground">Plan</span>
          <span className="text-foreground font-semibold capitalize">{planId}</span>
        </div>
      </div>

      <Button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Proceed to Payment'
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Powered by Stripe • Secure payment processing
      </p>
    </Card>
  )
}