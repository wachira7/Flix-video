// frontend/components/payment/crypto-form.tsx

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { paymentsAPI } from "@/lib/api/payments"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2, Bitcoin, Copy, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface CryptoFormProps {
  planId: string
  amount: number
}

export function CryptoForm({ planId, amount }: CryptoFormProps) {
  const router = useRouter()
  const [currencies, setCurrencies] = useState<string[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState('')
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [polling, setPolling] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | null>(null)

  useEffect(() => {
    fetchCurrencies()
  }, [])

  const fetchCurrencies = async () => {
    try {
      const response = await paymentsAPI.getCryptoCurrencies()
      setCurrencies(response.currencies || [])
      if (response.currencies?.length > 0) {
        setSelectedCurrency(response.currencies[0])
      }
    } catch (error) {
      console.error('Fetch currencies error:', error)
      toast.error('Failed to load cryptocurrencies')
    }
  }

  const handlePayment = async () => {
    if (!selectedCurrency) {
      toast.error('Please select a cryptocurrency')
      return
    }

    setLoading(true)
    try {
      const response = await paymentsAPI.createCryptoPayment(
        amount,
        selectedCurrency,
        planId,
        `FlixVideo ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`
      )

      if (response.success) {
        setPaymentData(response)
        toast.success('Payment address generated!')
        
        // Start polling for payment
        startPolling(response.payment_id)
      }
    } catch (error: any) {
      console.error('Crypto payment error:', error)
      toast.error(error.response?.data?.error || 'Failed to create payment')
      setLoading(false)
    }
  }

  const startPolling = async (paymentId: string) => {
    setPolling(true)
    setLoading(false)
    let attempts = 0
    const maxAttempts = 60 // 10 minutes (10s intervals)

    const pollInterval = setInterval(async () => {
      attempts++

      try {
        const status = await paymentsAPI.getCryptoStatus(paymentId)
        
        if (status.payment.status === 'succeeded') {
          clearInterval(pollInterval)
          setPaymentStatus('success')
          setPolling(false)
          toast.success('Payment confirmed!')
          
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

      if (attempts >= maxAttempts) {
        clearInterval(pollInterval)
        setPolling(false)
        toast.error('Payment timeout. Please contact support.')
      }
    }, 10000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bitcoin className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Pay with Crypto</h2>
        <p className="text-gray-400">
          Send cryptocurrency to complete your purchase
        </p>
      </div>

      {paymentStatus === 'success' ? (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Payment Confirmed!</h3>
          <p className="text-gray-400">Redirecting to dashboard...</p>
        </div>
      ) : paymentStatus === 'failed' ? (
        <div className="text-center py-8">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Payment Failed</h3>
          <p className="text-gray-400">Please contact support</p>
        </div>
      ) : !paymentData ? (
        <div className="space-y-6">
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
            <Label className="text-white mb-2">Select Cryptocurrency</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                <SelectValue placeholder="Choose currency" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {currencies.map((currency) => (
                  <SelectItem key={currency} value={currency} className="text-white">
                    {currency.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handlePayment}
            disabled={loading || !selectedCurrency}
            className="w-full bg-orange-600 hover:bg-orange-700"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating address...
              </>
            ) : (
              'Generate Payment Address'
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Payment Instructions */}
          <div className="p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
            <p className="text-blue-400 text-sm">
              💡 Send exactly <strong>{paymentData.pay_amount} {paymentData.pay_currency.toUpperCase()}</strong> to the address below
            </p>
          </div>

          {/* Payment Address */}
          <div>
            <Label className="text-white mb-2">Payment Address</Label>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={paymentData.pay_address}
                readOnly
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              />
              <Button
                onClick={() => copyToClipboard(paymentData.pay_address)}
                variant="outline"
                className="border-gray-700"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <Label className="text-white mb-2">Amount to Send</Label>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={`${paymentData.pay_amount} ${paymentData.pay_currency.toUpperCase()}`}
                readOnly
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono"
              />
              <Button
                onClick={() => copyToClipboard(paymentData.pay_amount.toString())}
                variant="outline"
                className="border-gray-700"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Payment URL */}
          {paymentData.payment_url && (
            <Button
              onClick={() => window.open(paymentData.payment_url, '_blank')}
              variant="outline"
              className="w-full border-gray-700"
            >
              Open in Wallet
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          )}

          {/* Status */}
          {polling && (
            <div className="text-center p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-yellow-500" />
              <p className="text-yellow-500 text-sm">
                Waiting for payment confirmation...
              </p>
              <p className="text-gray-400 text-xs mt-1">
                This may take a few minutes depending on network congestion
              </p>
            </div>
          )}

          {/* Expiration */}
          <p className="text-xs text-gray-500 text-center">
            Payment expires: {new Date(paymentData.expiration).toLocaleString()}
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center mt-4">
        Powered by NOWPayments • Secure crypto payments
      </p>
    </Card>
  )
}