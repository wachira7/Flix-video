// app/(admin)/admin/analytics/page.tsx
"use client"

import { useState, useEffect } from "react"
import { adminAPI } from "@/lib/api/admin"
import { StatsCard } from "@/components/admin/stats-card"
import { Card } from "@/components/ui/card"
import { Users, TrendingUp, Eye, Heart } from "lucide-react"
import { toast } from "sonner"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6']

export default function AnalyticsPage() {
  const [userAnalytics, setUserAnalytics] = useState<any>(null)
  const [contentAnalytics, setContentAnalytics] = useState<any>(null)
  const [engagementAnalytics, setEngagementAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    loadAnalytics()
  }, [days])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [users, content, engagement] = await Promise.all([
        adminAPI.getUserAnalytics(days),
        adminAPI.getContentAnalytics(),
        adminAPI.getEngagementAnalytics()
      ])

     
      // Map user analytics response
      setUserAnalytics({
        totalUsers: users.active_users || 0,
        growthRate: users.growth?.length || 0,
        dailyGrowth: users.growth?.map((g: any) => ({
          date: new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: parseInt(g.new_users)
        })) || [],
        byRole: null // Not in response
      })

      // Map content analytics response
      setContentAnalytics({
        totalViews: content.top_favorited?.length || 0,
        topContent: content.top_reviewed?.map((c: any) => ({
          title: `${c.content_type} ${c.content_id}`,
          views: parseInt(c.review_count)
        })) || []
      })

      // Map engagement analytics response
      setEngagementAnalytics({
        activeUsers: engagement.daily_active_users?.length || 0,
        avgEngagementRate: 0,
        totalWatchTime: 0,
        avgSessionDuration: 0,
        totalFavorites: parseInt(engagement.activity_30d?.ratings_30d) || 0,
        totalLists: parseInt(engagement.activity_30d?.lists_30d) || 0,
        activeWatchParties: parseInt(engagement.activity_30d?.parties_30d) || 0
      })

    } catch (error: any) {
      console.error("Failed to load analytics:", error)
      toast.error("Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Deep insights into platform performance</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={userAnalytics?.totalUsers?.toLocaleString() || "0"}
          change={`${userAnalytics?.growthRate || 0}% growth`}
          changeType="positive"
          icon={Users}
          iconColor="text-blue-500"
        />
        <StatsCard
          title="Total Views"
          value={contentAnalytics?.totalViews?.toLocaleString() || "0"}
          icon={Eye}
          iconColor="text-purple-500"
        />
        <StatsCard
          title="Engagement Rate"
          value={`${engagementAnalytics?.avgEngagementRate || 0}%`}
          icon={Heart}
          iconColor="text-pink-500"
        />
        <StatsCard
          title="Active Users"
          value={engagementAnalytics?.activeUsers?.toLocaleString() || "0"}
          icon={TrendingUp}
          iconColor="text-green-500"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">User Growth Trend</h3>
          {userAnalytics?.dailyGrowth ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userAnalytics.dailyGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2} name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card>

        {/* Content Views */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Content Views</h3>
          {contentAnalytics?.topContent ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contentAnalytics.topContent.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="title" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                />
                <Bar dataKey="views" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card>

        {/* User Distribution */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">User by Role</h3>
          {userAnalytics?.byRole ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userAnalytics.byRole}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {userAnalytics.byRole.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card>

        {/* Engagement Metrics */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Engagement Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Watch Time</span>
              <span className="text-white font-semibold">
                {engagementAnalytics?.totalWatchTime?.toLocaleString() || 0} hrs
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Avg Session Duration</span>
              <span className="text-white font-semibold">
                {engagementAnalytics?.avgSessionDuration || 0} min
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Favorites</span>
              <span className="text-white font-semibold">
                {engagementAnalytics?.totalFavorites?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Lists Created</span>
              <span className="text-white font-semibold">
                {engagementAnalytics?.totalLists?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Active Watch Parties</span>
              <span className="text-white font-semibold">
                {engagementAnalytics?.activeWatchParties?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
