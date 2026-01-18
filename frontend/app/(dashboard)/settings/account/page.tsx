// app/(dashboard)/settings/account/page.tsx -

"use client"

import { useState, useEffect } from "react"
import { userAPI } from "@/lib/api/user"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ArrowLeft, User, Mail, Phone, Shield, Lock } from "lucide-react"
import Link from "next/link"

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState<any>({})
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await userAPI.getProfile()
      setUserData(response.user || {})
    } catch (error) {
      toast.error("Failed to load account data")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.new_password.length < 8) {
      toast.error("New password must be at least 8 characters")
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Passwords do not match")
      return
    }

    setSaving(true)
    try {
      await userAPI.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      })
      
      toast.success("Password changed successfully!")
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to change password")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Account Settings</h1>
          <p className="text-gray-400 mt-1">Manage your account details and security</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-white">Account Information</h2>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <Label className="text-gray-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <div className="flex items-center gap-3 mt-2">
                <Input
                  value={userData.email || ''}
                  disabled
                  className="bg-gray-800 border-gray-700 text-white"
                />
                {userData.email_verified ? (
                  <Badge className="bg-green-600 shrink-0">Verified</Badge>
                ) : (
                  <Badge variant="outline" className="border-yellow-600 text-yellow-600 shrink-0">
                    Not Verified
                  </Badge>
                )}
              </div>
              {!userData.email_verified && (
                <Button size="sm" variant="link" className="text-purple-500 mt-1 p-0">
                  Send verification email
                </Button>
              )}
            </div>

            <Separator className="bg-gray-800" />

            {/* Phone */}
            <div>
              <Label className="text-gray-300 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <div className="flex items-center gap-3 mt-2">
                <Input
                  value={userData.phone || ''}
                  placeholder="Add phone number"
                  className="bg-gray-800 border-gray-700 text-white"
                />
                {userData.phone_verified ? (
                  <Badge className="bg-green-600 shrink-0">Verified</Badge>
                ) : userData.phone ? (
                  <Badge variant="outline" className="border-yellow-600 text-yellow-600 shrink-0">
                    Not Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-gray-600 text-gray-400 shrink-0">
                    Not Set
                  </Badge>
                )}
              </div>
            </div>

            <Separator className="bg-gray-800" />

            {/* Account Status */}
            <div>
              <Label className="text-gray-300 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Account Status
              </Label>
              <div className="flex items-center gap-3 mt-2">
                <Badge className="bg-green-600 capitalize">{userData.status || 'Active'}</Badge>
                <span className="text-sm text-gray-400">
                  Member since {userData.created_at ? new Date(userData.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-white">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="current_password" className="text-gray-300">
                Current Password
              </Label>
              <Input
                id="current_password"
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="new_password" className="text-gray-300">
                New Password
              </Label>
              <Input
                id="new_password"
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white mt-2"
                minLength={8}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
            </div>

            <div>
              <Label htmlFor="confirm_password" className="text-gray-300">
                Confirm New Password
              </Label>
              <Input
                id="confirm_password"
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white mt-2"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="bg-linear-to-r from-purple-700 to-fuchsia-600"
            >
              {saving ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}