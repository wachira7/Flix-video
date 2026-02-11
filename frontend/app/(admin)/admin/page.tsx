// app/(admin)/admin/page.tsx
"use client"

import { useState, useEffect } from "react"
import { StatsCard } from "@/components/admin/stats-card"
import { adminAPI } from "@/lib/api/admin"
import { 
  Users, 
  DollarSign,   // ← NOW USED! 💰
  CreditCard, 
  TrendingUp, 
  Activity, 
  UserPlus, 
  Star, 
  Flag, 
  MessageSquare, 
  ListVideo 
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useRouter } from "next/navigation"

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [userAnalytics, setUserAnalytics] = useState<any>(null)
  const [paymentStats, setPaymentStats] = useState<any>(null)  // ← ADD
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [dashboard, analytics, payments] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getUserAnalytics(30).catch(() => null),
        adminAPI.getPaymentStats().catch(() => null)  // ← ADD
      ])

      setDashboardData(dashboard)
      setUserAnalytics(analytics)
      setPaymentStats(payments)  // ← ADD
    } catch (error: any) {
      console.error("Failed to load dashboard:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Map actual backend response structure
  const users = dashboardData?.stats?.users || {}
  const content = dashboardData?.stats?.content || {}
  const moderation = dashboardData?.stats?.moderation || {}

  // Payment stats - from getPaymentStats response:
  // { stats: { total_revenue, total_payments, successful_payments, failed_payments } }
  const revenue = paymentStats?.stats || {}

  // Growth chart data
  const growthData = userAnalytics?.growth?.map((g: any) => ({
    date: new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    users: parseInt(g.new_users)
  })) || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">
          Welcome back! Here's what's happening with FlixVideo.
        </p>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          👥 User Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Users"
            value={parseInt(users.total_users || 0).toLocaleString()}
            icon={Users}
            iconColor="text-blue-500"
          />
          <StatsCard
            title="New Today"
            value={parseInt(users.new_users_today || 0).toLocaleString()}
            change="Last 24 hours"
            changeType={parseInt(users.new_users_today) > 0 ? 'positive' : 'neutral'}
            icon={UserPlus}
            iconColor="text-green-500"
          />
          <StatsCard
            title="New This Week"
            value={parseInt(users.new_users_week || 0).toLocaleString()}
            change="Last 7 days"
            changeType={parseInt(users.new_users_week) > 0 ? 'positive' : 'neutral'}
            icon={TrendingUp}
            iconColor="text-purple-500"
          />
          <StatsCard
            title="Banned Users"
            value={parseInt(users.banned_users || 0).toLocaleString()}
            icon={Activity}
            iconColor="text-red-500"
          />
        </div>
      </div>

      {/* Revenue Stats ← NEW SECTION USING DollarSign */}
      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          💰 Revenue Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Revenue"
            value={`KES ${parseFloat(revenue.total_revenue || 0).toLocaleString()}`}
            change="All time"
            changeType="positive"
            icon={DollarSign}   // ← DollarSign USED HERE! 💰
            iconColor="text-green-500"
          />
          <StatsCard
            title="Revenue (30 Days)"
            value={`KES ${parseFloat(revenue.revenue_30d || 0).toLocaleString()}`}
            change="Last 30 days"
            changeType={parseFloat(revenue.revenue_30d) > 0 ? 'positive' : 'neutral'}
            icon={TrendingUp}
            iconColor="text-blue-500"
          />
          <StatsCard
            title="Successful Payments"
            value={parseInt(revenue.successful_payments || 0).toLocaleString()}
            icon={CreditCard}
            iconColor="text-purple-500"
          />
          <StatsCard
            title="Failed Payments"
            value={parseInt(revenue.failed_payments || 0).toLocaleString()}
            change={parseInt(revenue.failed_payments) > 0 ? 'Needs attention!' : 'All clear!'}
            changeType={parseInt(revenue.failed_payments) > 0 ? 'negative' : 'positive'}
            icon={Activity}
            iconColor="text-red-500"
          />
        </div>
      </div>

      {/* Content Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          🎬 Content Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Reviews"
            value={parseInt(content.total_reviews || 0).toLocaleString()}
            icon={MessageSquare}
            iconColor="text-yellow-500"
          />
          <StatsCard
            title="Total Lists"
            value={parseInt(content.total_lists || 0).toLocaleString()}
            icon={ListVideo}
            iconColor="text-pink-500"
          />
          <StatsCard
            title="Watch Parties"
            value={parseInt(content.total_parties || 0).toLocaleString()}
            icon={Star}
            iconColor="text-orange-500"
          />
          <StatsCard
            title="Pending Reports"
            value={parseInt(moderation.pending_reports || 0).toLocaleString()}
            change={parseInt(moderation.pending_reports) > 0 ? 'Needs attention!' : 'All clear!'}
            changeType={parseInt(moderation.pending_reports) > 0 ? 'negative' : 'positive'}
            icon={Flag}
            iconColor="text-red-500"
          />
        </div>
      </div>

      {/* User Growth Chart + Platform Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            User Growth (Last 30 Days)
          </h3>
          {growthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6' }}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
              <Users className="w-12 h-12 mb-3 opacity-30" />
              <p>Not enough data yet</p>
              <p className="text-sm mt-1">Chart will populate as users register</p>
            </div>
          )}
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Platform Summary
          </h3>
          <div className="space-y-1">
            {[
              { icon: Users, color: 'text-blue-500', label: 'Total Users', value: parseInt(users.total_users || 0).toLocaleString() },
              { icon: DollarSign, color: 'text-green-500', label: 'Total Revenue', value: `KES ${parseFloat(revenue.total_revenue || 0).toLocaleString()}` },
              { icon: MessageSquare, color: 'text-yellow-500', label: 'Reviews Written', value: parseInt(content.total_reviews || 0).toLocaleString() },
              { icon: ListVideo, color: 'text-pink-500', label: 'Lists Created', value: parseInt(content.total_lists || 0).toLocaleString() },
              { icon: Star, color: 'text-orange-500', label: 'Watch Parties', value: parseInt(content.total_parties || 0).toLocaleString() },
              { icon: Flag, color: 'text-red-500', label: 'Pending Reports', value: parseInt(moderation.pending_reports || 0).toLocaleString(), alert: parseInt(moderation.pending_reports) > 0 },
            ].map(({ icon: Icon, color, label, value, alert }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span className="text-gray-300">{label}</span>
                </div>
                <span className={`font-bold text-lg ${alert ? 'text-red-400' : 'text-white'}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: Users, color: 'text-blue-500', label: 'Manage Users', desc: `${parseInt(users.total_users || 0)} total users`, path: '/admin/users' },
            { icon: DollarSign, color: 'text-green-500', label: 'Payments', desc: `KES ${parseFloat(revenue.total_revenue || 0).toLocaleString()} total`, path: '/admin/payments' },
            { icon: TrendingUp, color: 'text-purple-500', label: 'Analytics', desc: 'Deep dive metrics', path: '/admin/analytics' },
            { icon: Flag, color: 'text-red-500', label: 'Moderation', desc: parseInt(moderation.pending_reports || 0) > 0 ? `⚠️ ${moderation.pending_reports} pending` : '✅ All clear', path: '/admin/moderation' },
          ].map(({ icon: Icon, color, label, desc, path }) => (
            <button
              key={path}
              onClick={() => router.push(path)}
              className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left group"
            >
              <Icon className={`w-8 h-8 ${color} mb-2 group-hover:scale-110 transition-transform`} />
              <h4 className="text-white font-semibold">{label}</h4>
              <p className="text-sm text-gray-400 mt-1">{desc}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
