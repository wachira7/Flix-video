//frontend/components/payment/payment-methods.tsx

"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CreditCard, Trash2, Plus, CheckCircle, Smartphone, Bitcoin } from "lucide-react"
import { toast } from "sonner"
import { paymentsAPI } from "@/lib/api/payments"

interface PaymentMethod {
  id: string
  type: 'card' | 'mpesa' | 'crypto'
  last4?: string
  brand?: string
  phone?: string
  wallet_address?: string
  is_default: boolean
  created_at: string
}

export function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [settingDefault, setSettingDefault] = useState<string | null>(null)

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const response = await paymentsAPI.getPaymentMethods()
      setMethods(response.payment_methods || [])
    } catch (error: any) {
      console.error('Fetch error:', error)
      // If 404, user just doesn't have any payment methods yet
      if (error.response?.status === 404) {
        setMethods([])
      } else {
        toast.error('Failed to load payment methods')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (methodId: string) => {
    setSettingDefault(methodId)
    try {
      await paymentsAPI.setDefaultPaymentMethod(methodId)
      toast.success('Default payment method updated')
      
      // Update local state
      setMethods(methods.map(m => ({
        ...m,
        is_default: m.id === methodId
      })))
    } catch (error: any) {
      console.error('Set default error:', error)
      toast.error(error.response?.data?.error || 'Failed to update default method')
    } finally {
      setSettingDefault(null)
    }
  }

  const handleDelete = async (methodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return

    setDeleting(methodId)
    try {
      await paymentsAPI.deletePaymentMethod(methodId)
      toast.success('Payment method removed')
      
      // Update local state
      setMethods(methods.filter(m => m.id !== methodId))
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.response?.data?.error || 'Failed to remove payment method')
    } finally {
      setDeleting(null)
    }
  }

  const getMethodIcon = (method: PaymentMethod) => {
    if (method.type === 'card') {
      return <CreditCard className="w-6 h-6" />
    }
    if (method.type === 'mpesa') {
      return <Smartphone className="w-6 h-6" />
    }
    if (method.type === 'crypto') {
      return <Bitcoin className="w-6 h-6" />
    }
    return <CreditCard className="w-6 h-6" />
  }

  const getMethodDisplay = (method: PaymentMethod) => {
    if (method.type === 'card' && method.brand && method.last4) {
      return `${method.brand} •••• ${method.last4}`
    }
    if (method.type === 'mpesa' && method.phone) {
      return `M-Pesa ${method.phone.slice(-4)}`
    }
    if (method.type === 'crypto' && method.wallet_address) {
      return `Crypto ${method.wallet_address.slice(0, 6)}...${method.wallet_address.slice(-4)}`
    }
    return 'Payment Method'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 bg-gray-800" />
        ))}
      </div>
    )
  }

  if (methods.length === 0) {
    return (
      <Card className="p-8 bg-gray-900 border-gray-800 text-center">
        <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <h3 className="text-white font-semibold mb-2">No Payment Methods</h3>
        <p className="text-gray-400 text-sm mb-6">
          Payment methods will be saved automatically when you make a purchase
        </p>
        <p className="text-gray-500 text-xs">
          You can manage your saved payment methods here after your first transaction
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Payment Methods List */}
      {methods.map((method) => (
        <Card
          key={method.id}
          className={`p-4 bg-gray-900 border-2 transition-colors ${
            method.is_default ? 'border-green-600' : 'border-gray-800'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-800 rounded-lg text-white">
              {getMethodIcon(method)}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-medium">
                  {getMethodDisplay(method)}
                </span>
                {method.is_default && (
                  <Badge className="bg-green-600 text-white text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Default
                  </Badge>
                )}
              </div>
              <p className="text-gray-400 text-sm">
                Added {new Date(method.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              {!method.is_default && (
                <Button
                  onClick={() => handleSetDefault(method.id)}
                  disabled={settingDefault === method.id}
                  variant="outline"
                  size="sm"
                  className="border-gray-700"
                >
                  {settingDefault === method.id ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Set Default'
                  )}
                </Button>
              )}
              <Button
                onClick={() => handleDelete(method.id)}
                disabled={deleting === method.id}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                {deleting === method.id ? (
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}