// components/admin/user-table.tsx
"use client"

import { useState } from "react"
import { User } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Ban, CheckCircle, Trash2, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { BanUserDialog } from "./ban-user-dialog"

interface UserTableProps {
  users: User[]
  onBan: (userId: string, reason: string) => Promise<void>
  onUnban: (userId: string) => Promise<void>
  onDelete: (userId: string) => Promise<void>
  onViewDetails: (userId: string) => void
}

export function UserTable({ users, onBan, onUnban, onDelete, onViewDetails }: UserTableProps) {
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleBanClick = (user: User) => {
    setSelectedUser(user)
    setBanDialogOpen(true)
  }

  const handleBanConfirm = async (reason: string) => {
    if (!selectedUser) return
    await onBan(selectedUser.id, reason)
  }

  const handleDeleteClick = async (user: User) => {
    if (!confirm(`Delete user ${user.email}? This action cannot be undone.`)) return
    await onDelete(user.id)
  }

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
          <tbody className="divide-y divide-gray-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                  {/* User Email + ID */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-linear-to-r from-purple-700 to-fuchsia-600 flex items-center justify-center text-white font-semibold">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{user.email}</div>
                        <div className="text-sm text-gray-400">ID: {user.id?.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>

                  {/* Role Badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={
                        user.is_admin || user.role === 'admin'
                          ? 'border-purple-500 text-purple-400'
                          : user.role === 'moderator'
                          ? 'border-blue-500 text-blue-400'
                          : 'border-gray-500 text-gray-400'
                      }
                    >
                      {(user.is_admin || user.role === 'admin') && '👑 '}
                      {user.role === 'moderator' && !user.is_admin && '⭐ '}
                      {user.is_admin || user.role === 'admin'
                        ? 'Admin'
                        : user.role === 'moderator'
                        ? 'Moderator'
                        : 'User'}
                    </Badge>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.banned_at ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : (
                      <Badge className="bg-green-500/10 text-green-400 border border-green-500">
                        {user.status
                          ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
                          : 'Active'}
                      </Badge>
                    )}
                  </td>

                  {/* Joined */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </td>

                  {/* Last Login */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {user.last_login_at
                      ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })
                      : 'Never'}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onViewDetails(user.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {user.banned_at ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUnban(user.id)}
                          className="text-green-400 hover:text-green-300"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBanClick(user)}
                          className="text-yellow-400 hover:text-yellow-300"
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <BanUserDialog
          open={banDialogOpen}
          onOpenChange={setBanDialogOpen}
          userEmail={selectedUser.email}
          onConfirm={handleBanConfirm}
        />
      )}
    </>
  )
}

