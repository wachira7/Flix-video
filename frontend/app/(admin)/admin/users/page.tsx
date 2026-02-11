// app/(admin)/admin/users/page.tsx
"use client"

import { useState, useEffect } from "react"
import { adminAPI, User } from "@/lib/api/admin"
import { UserTable } from "@/components/admin/user-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, Filter, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    loadUsers()
  }, [page, roleFilter, statusFilter])

  // filters are currently active
  const activeFiltersCount = [
    roleFilter !== 'all',
    statusFilter !== 'all',
    searchQuery !== ''
  ].filter(Boolean).length

  const loadUsers = async () => {
    try {
      setLoading(true)
      const result = await adminAPI.getUsers(
        page,
        20,
        roleFilter === 'all' ? undefined : roleFilter,
        statusFilter === 'all' ? undefined : statusFilter
      )

      // Handle all possible response structures
      const usersList =
        result.users ||
        result.data?.users ||
        result.data ||
        []

      const total =
        result.total ||
        result.pagination?.total ||
        result.data?.total ||
        result.count ||
        usersList.length

      setUsers(usersList)
      setTotalUsers(total)
    } catch (error: any) {
      console.error("Failed to load users:", error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = () => {
    setRoleFilter('all')
    setStatusFilter('all')
    setSearchQuery('')
    setPage(1)
  }

  const handleBan = async (userId: string, reason: string) => {
    try {
      await adminAPI.banUser(userId, reason)
      toast.success("User banned successfully")
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to ban user")
    }
  }

  const handleUnban = async (userId: string) => {
    try {
      await adminAPI.unbanUser(userId)
      toast.success("User unbanned successfully")
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to unban user")
    }
  }

  const handleDelete = async (userId: string) => {
    try {
      await adminAPI.deleteUser(userId)
      toast.success("User deleted successfully")
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete user")
    }
  }

  const handleViewDetails = async (userId: string) => {
    try {
      const result = await adminAPI.getUserDetails(userId)
      alert(`User Details:\n\nEmail: ${result.user.email}\nRole: ${result.user.role}\nStatus: ${result.user.status}\nCreated: ${new Date(result.user.created_at).toLocaleDateString()}`)
    } catch (error: any) {
      toast.error("Failed to load user details")
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-400">
            {totalUsers.toLocaleString()} total users
          </p>
        </div>

        {/* Right side - active filter badge + refresh button */}
        <div className="flex items-center gap-3">
          {/* Active filters badge - only shows when filters are applied */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 
                              border border-purple-500 rounded-full">
                <Filter className="w-3 h-3 text-purple-400" />
                <span className="text-purple-400 text-sm font-medium">
                  {activeFiltersCount} active
                </span>
              </div>
              {/* Clear all filters button */}
              <button
                onClick={handleClearFilters}
                className="text-xs text-gray-400 hover:text-white underline transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          <Button
            onClick={loadUsers}
            variant="outline"
            className="border-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Search Users</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Filter by Role</label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Filter by Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-12 text-center">
          <Filter className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No users found</p>
          {activeFiltersCount > 0 && (
            <p className="text-gray-500 text-sm mt-2">
              Try adjusting your filters or{' '}
              <button
                onClick={handleClearFilters}
                className="text-purple-400 hover:text-purple-300 underline"
              >
                clear all filters
              </button>
            </p>
          )}
        </Card>
      ) : (
        <UserTable
          users={filteredUsers}
          onBan={handleBan}
          onUnban={handleUnban}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Pagination */}
      {totalUsers > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-gray-700"
          >
            Previous
          </Button>
          <span className="text-gray-400 px-4">
            Page {page} of {Math.ceil(totalUsers / 20)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(totalUsers / 20)}
            className="border-gray-700"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
