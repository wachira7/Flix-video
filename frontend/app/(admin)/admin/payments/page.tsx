// app/(admin)/admin/payments/page.tsx
"use client"

import { useState, useEffect } from "react"
import { adminAPI } from "@/lib/api/admin"
import { StatsCard } from "@/components/admin/stats-card"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, CreditCard, TrendingUp, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

export default function PaymentsPage() {
  const [stats, setStats] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [failedPayments, setFailedPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'failed'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsData, paymentsData, failedData] = await Promise.all([
        adminAPI.getPaymentStats(),
        adminAPI.getPayments(1, 20),
        adminAPI.getFailedPayments(1, 20)
      ])
      setStats(statsData.stats)
      setPayments(paymentsData.payments || [])
      setFailedPayments(failedData.payments || [])
    } catch (error: any) {
      console.error("Failed to load payments:", error)
      toast.error("Failed to load payment data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading payments...</p>
        </div>
      </div>
    )
  }

  const displayPayments = activeTab === 'all' ? payments : failedPayments

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Payment Management</h1>
        <p className="text-gray-400">Monitor transactions and revenue</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={`KES ${parseFloat(stats?.total_revenue || 0).toLocaleString()}`}
          icon={DollarSign}
          iconColor="text-green-500"
        />
        <StatsCard
          title="Total Payments"
          value={parseInt(stats?.total_payments || 0).toLocaleString()}
          icon={CreditCard}
          iconColor="text-blue-500"
        />
        <StatsCard
          title="Success Rate"
          value={`${stats?.successful_payments && stats?.total_payments
            ? ((parseInt(stats.successful_payments) / parseInt(stats.total_payments)) * 100).toFixed(1)
            : 0}%`}
          icon={TrendingUp}
          iconColor="text-purple-500"
        />
        <StatsCard
          title="Failed Payments"
          value={parseInt(stats?.failed_payments || 0).toLocaleString()}
          change={parseInt(stats?.failed_payments) > 0 ? 'Needs attention!' : 'All clear!'}
          changeType={parseInt(stats?.failed_payments) > 0 ? 'negative' : 'positive'}
          icon={AlertCircle}
          iconColor="text-red-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-purple-600 text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          All Payments ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('failed')}
          className={`pb-3 px-4 border-b-2 transition-colors ${
            activeTab === 'failed'
              ? 'border-purple-600 text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Failed Payments ({failedPayments.length})
        </button>
      </div>

      {/* Payments Table */}
      <Card className="bg-gray-900 border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {displayPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No payments found
                  </td>
                </tr>
              ) : (
                displayPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 text-sm text-white font-mono">
                      {payment.transaction_id?.slice(0, 12) || payment.id.slice(0, 12)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {payment.user_email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-semibold">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {payment.payment_method}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge
                        className={
                          payment.status === 'completed' || payment.status === 'success'
                            ? 'bg-green-500/10 text-green-400 border-green-500'
                            : payment.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500'
                            : 'bg-red-500/10 text-red-400 border-red-500'
                        }
                      >
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
