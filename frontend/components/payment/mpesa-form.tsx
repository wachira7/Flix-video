// frontend/components/payment/mpesa-form.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { paymentsAPI } from "@/lib/api/payments"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Smartphone, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

interface MpesaFormProps {
  planId: string
  amount: number
}

export function MpesaForm({ planId, amount }: MpesaFormProps) {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | null>(null)

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate phone number
    const cleanPhone = phoneNumber.replace(/\s+/g, '')
    if (!/^(254|0)[17]\d{8}$/.test(cleanPhone)) {
      toast.error('Please enter a valid Kenyan phone number')
      return
    }

    setLoading(true)
    try {
      const response = await paymentsAPI.initiateMpesaPayment(
        cleanPhone,
        amount,
        planId,
        `FlixVideo ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`
      )

      if (response.success) {
        setCheckoutRequestId(response.checkout_request_id)
        toast.success('Payment prompt sent! Check your phone')
        
        // Start polling for payment status
        startPolling(response.checkout_request_id)
      }
    } catch (error: any) {
      console.error('M-Pesa error:', error)
      toast.error(error.response?.data?.error || 'Failed to initiate payment')
      setLoading(false)
    }
  }

  const startPolling = async (checkoutId: string) => {
    setPolling(true)
    let attempts = 0
    const maxAttempts = 30 // 5 minutes (10s intervals)

    const pollInterval = setInterval(async () => {
      attempts++

      try {
        const status = await paymentsAPI.getMpesaStatus(checkoutId)
        
        if (status.payment.status === 'succeeded') {
          clearInterval(pollInterval)
          setPaymentStatus('success')
          setPolling(false)
          toast.success('Payment successful!')
          
          // Redirect to success page after 2 seconds
          setTimeout(() => {
            router.push('/subscription/success')
          }, 2000)
        } else if (status.payment.status === 'failed') {
          clearInterval(pollInterval)
          setPaymentStatus('failed')
          setPolling(false)
          toast.error('Payment failed')
        }
      } catch (error) {
        console.error('Polling error:', error)
      }

      // Stop after max attempts
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval)
        setPolling(false)
        toast.error('Payment timeout. Please try again.')
      }
    }, 10000) // Poll every 10 seconds
  }

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Pay with M-Pesa</h2>
        <p className="text-gray-400">
          Enter your phone number to receive a payment prompt
        </p>
      </div>

      {paymentStatus === 'success' ? (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Payment Successful!</h3>
          <p className="text-gray-400">Redirecting to dashboard...</p>
        </div>
      ) : paymentStatus === 'failed' ? (
        <div className="text-center py-8">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Payment Failed</h3>
          <p className="text-gray-400 mb-4">Please try again</p>
          <Button onClick={() => { setPaymentStatus(null); setCheckoutRequestId(null); }}>
            Try Again
          </Button>
        </div>
      ) : (
        <form onSubmit={handlePayment} className="space-y-6">
          <div className="space-y-4 mb-6">
            <div className="flex justify-between p-4 bg-gray-800 rounded-lg">
              <span className="text-gray-400">Amount</span>
              <span className="text-white font-semibold">KES {amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-4 bg-gray-800 rounded-lg">
              <span className="text-gray-400">Plan</span>
              <span className="text-white font-semibold capitalize">{planId}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="phone" className="text-white">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="254712345678 or 0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-2 bg-gray-800 border-gray-700 text-white"
              required
              disabled={loading || polling}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your M-Pesa registered phone number
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || polling}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {loading || polling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {loading ? 'Sending prompt...' : 'Waiting for payment...'}
              </>
            ) : (
              'Send Payment Prompt'
            )}
          </Button>

          {polling && (
            <div className="text-center p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
              <p className="text-yellow-500 text-sm">
                📱 Check your phone for the M-Pesa prompt and enter your PIN
              </p>
            </div>
          )}
        </form>
      )}

      <p className="text-xs text-gray-500 text-center mt-4">
        Powered by Safaricom M-Pesa • Secure mobile money
      </p>
    </Card>
  )
}