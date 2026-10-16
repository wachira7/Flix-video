// app/(dashboard)/settings/billing/page.tsx

"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, CreditCard, Download, Plus, Trash2, Calendar, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { subscriptionAPI } from "@/lib/api/subscriptions"
import { paymentsAPI } from "@/lib/api/payments"
import { PaymentMethods } from "@/components/payment/payment-methods"
import { UsageWidget } from "@/components/dashboard/usage-widget" 

interface Subscription {
  id: string
  plan_type: string
  status: string
  current_period_end: string
  auto_renew: boolean
  plan_details: {
    name: string
    price: number
    currency: string
  }
}

interface Invoice {
  id: string
  amount: number
  currency: string
  status: string
  created_at: string
  plan_type: string
}

export default function BillingSettingsPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      // Fetch current subscription
      const subResponse = await subscriptionAPI.getMySubscription()
      setSubscription(subResponse.subscription)

      // Fetch payment history
      try {
        const invoicesResponse = await paymentsAPI.getPaymentHistory(10, 0)
        setInvoices(invoicesResponse.payments)
      } catch (error) {
        setInvoices([])
      }
    } catch (error: any) {
      console.error('Fetch error:', error)
      if (error.response?.status === 404) {
        setSubscription(null)
      } else {
        toast.error('Failed to load billing information')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return
    }

    setCancelling(true)
    try {
      await subscriptionAPI.cancelSubscription()
      toast.success('Subscription cancelled successfully')
      fetchBillingData()
    } catch (error: any) {
      console.error('Cancel error:', error)
      toast.error(error.response?.data?.error || 'Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  const handleUpgrade = () => {
    router.push('/subscription')
  }

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.info('Downloading invoice...')
    // TODO: Implement invoice download
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Skeleton className="h-12 w-64 mb-8 bg-secondary" />
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-6">
          <div className="space-y-6">
            <Skeleton className="h-48 bg-secondary" />
            <Skeleton className="h-64 bg-secondary" />
          </div>
          <Skeleton className="h-64 bg-secondary" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl text-foreground">Billing Settings</h1>
          <p className="text-muted-foreground mt-1">Manage payments and subscription</p>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT: Main Content + Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-6">
        
        {/* MAIN CONTENT - Left Side */}
        <div className="space-y-6">
          {/* Current Subscription */}
          {subscription && subscription.status === 'active' ? (
            <Card className="p-6 bg-linear-to-br from-primary/20 to-highlight/20 border-primary">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl text-foreground mb-1">
                    {subscription.plan_details.name}
                  </h2>
                  <p className="text-foreground/80">
                    {subscription.plan_details.currency} {subscription.plan_details.price.toLocaleString()}/month
                  </p>
                </div>
                <Badge className="bg-green-600">Active</Badge>
              </div>
              
              <Separator className="bg-primary/20 my-4" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Next billing date</p>
                  <p className="text-foreground font-semibold">
                    {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Auto-renewal</p>
                  <p className="text-foreground font-semibold">
                    {subscription.auto_renew ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={handleUpgrade}
                  variant="outline" 
                  className="border-primary text-foreground hover:bg-primary/15"
                >
                  Change Plan
                </Button>
                <Button 
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  variant="outline" 
                  className="border-red-700 text-red-500 hover:bg-red-900/30"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </Button>
              </div>
            </Card>
          ) : subscription && subscription.status === 'cancelled' ? (
            <Card className="p-6 bg-card border-orange-700">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-orange-500 shrink-0" />
                <div className="flex-1">
                  <h2 className="text-xl text-foreground mb-2">Subscription Cancelled</h2>
                  <p className="text-muted-foreground mb-4">
                    Your subscription has been cancelled. You'll have access to premium features until{' '}
                    {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}.
                  </p>
                  <Button 
                    onClick={handleUpgrade}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Reactivate Subscription
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 bg-card border-border">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-muted-foreground/70" />
                </div>
                <h2 className="text-xl text-foreground mb-2">No Active Subscription</h2>
                <p className="text-muted-foreground mb-6">
                  Upgrade to unlock premium features and unlimited entertainment
                </p>
                <Button 
                  onClick={handleUpgrade}
                  className="bg-linear-to-r from-primary to-highlight hover:from-primary/90 hover:to-highlight/90"
                >
                  View Plans
                </Button>
              </div>
            </Card>
          )}

          {/* Payment Methods */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-green-500" />
                <h2 className="text-xl text-foreground">Payment Methods</h2>
              </div>
            </div>
            <PaymentMethods />
          </Card>

          {/* Billing History */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl text-foreground">Billing History</h2>
            </div>

            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payment history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-foreground font-medium capitalize">
                          {invoice.plan_type} Plan
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.created_at).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-foreground font-semibold">
                          {invoice.currency} {invoice.amount.toLocaleString()}
                        </p>
                        <Badge className={
                          invoice.status === 'succeeded' 
                            ? 'bg-green-600' 
                            : invoice.status === 'pending'
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }>
                          {invoice.status}
                        </Badge>
                      </div>
                      <Button 
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        size="sm" 
                        variant="outline" 
                        className="border-border"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Invoice
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ✅ SIDEBAR - Right Side (Sticky) */}
        <aside className="hidden xl:block">
          <div className="sticky top-8">
            <UsageWidget />
          </div>
        </aside>

      </div>
    </div>
  )
}