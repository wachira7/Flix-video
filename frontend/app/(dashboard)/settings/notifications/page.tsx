// app/(dashboard)/settings/notifications/page.tsx - CREATE

"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ArrowLeft, Bell, Mail, Smartphone, Film, Star, MessageCircle, Users } from "lucide-react"
import Link from "next/link"

export default function NotificationsSettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState({
    new_releases: true,
    recommendations: true,
    watchlist_updates: false,
    reviews: true,
    social: false,
    marketing: true,
    billing: true
  })

  const [pushNotifications, setPushNotifications] = useState({
    new_releases: false,
    recommendations: false,
    watchlist_updates: true,
    reviews: false,
    social: true,
    live_events: false,
    reminders: true,
    promotions: false,
    system_alerts: true,
    friend_activity: true,
  })

  const handleSave = () => {
    toast.success("Notification preferences saved!")
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
          <h1 className="text-3xl font-bold text-white">Notification Settings</h1>
          <p className="text-gray-400 mt-1">Choose what notifications you want to receive</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Email Notifications */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-white">Email Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Film className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <Label htmlFor="email-new-releases" className="text-white font-medium cursor-pointer">
                    New Releases
                  </Label>
                  <p className="text-sm text-gray-400">Get notified about new movies and TV shows</p>
                </div>
              </div>
              <Switch
                id="email-new-releases"
                checked={emailNotifications.new_releases}
                onCheckedChange={(checked) => setEmailNotifications(prev => ({ ...prev, new_releases: checked }))}
              />
            </div>

            <Separator className="bg-gray-800" />

            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <Label htmlFor="email-recommendations" className="text-white font-medium cursor-pointer">
                    Recommendations
                  </Label>
                  <p className="text-sm text-gray-400">Personalized content suggestions based on your taste</p>
                </div>
              </div>
              <Switch
                id="email-recommendations"
                checked={emailNotifications.recommendations}
                onCheckedChange={(checked) => setEmailNotifications(prev => ({ ...prev, recommendations: checked }))}
              />
            </div>

            <Separator className="bg-gray-800" />

            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Bell className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <Label htmlFor="email-watchlist" className="text-white font-medium cursor-pointer">
                    Watchlist Updates
                  </Label>
                  <p className="text-sm text-gray-400">When content in your watchlist becomes available</p>
                </div>
              </div>
              <Switch
                id="email-watchlist"
                checked={emailNotifications.watchlist_updates}
                onCheckedChange={(checked) => setEmailNotifications(prev => ({ ...prev, watchlist_updates: checked }))}
              />
            </div>

            <Separator className="bg-gray-800" />

            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <MessageCircle className="w-5 h-5 text-pink-500 mt-0.5" />
                <div>
                  <Label htmlFor="email-reviews" className="text-white font-medium cursor-pointer">
                    Reviews & Comments
                  </Label>
                  <p className="text-sm text-gray-400">When someone likes or replies to your reviews</p>
                </div>
              </div>
              <Switch
                id="email-reviews"
                checked={emailNotifications.reviews}
                onCheckedChange={(checked) => setEmailNotifications(prev => ({ ...prev, reviews: checked }))}
              />
            </div>

            <Separator className="bg-gray-800" />

            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Users className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <Label htmlFor="email-social" className="text-white font-medium cursor-pointer">
                    Social Activity
                  </Label>
                  <p className="text-sm text-gray-400">Friend requests, follows, and watch party invites</p>
                </div>
              </div>
              <Switch
                id="email-social"
                checked={emailNotifications.social}
                onCheckedChange={(checked) => setEmailNotifications(prev => ({ ...prev, social: checked }))}
              />
            </div>
          </div>
        </Card>

        {/* Push Notifications */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <Smartphone className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-white">Push Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Film className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <Label htmlFor="push-new-releases" className="text-white font-medium cursor-pointer">
                    New Releases
                  </Label>
                  <p className="text-sm text-gray-400">Instant alerts for new content</p>
                </div>
              </div>
              <Switch
                id="push-new-releases"
                checked={pushNotifications.new_releases}
                onCheckedChange={(checked) => setPushNotifications(prev => ({ ...prev, new_releases: checked }))}
              />
            </div>

            <Separator className="bg-gray-800" />

            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Bell className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <Label htmlFor="push-watchlist" className="text-white font-medium cursor-pointer">
                    Watchlist Updates
                  </Label>
                  <p className="text-sm text-gray-400">Real-time notifications for watchlist items</p>
                </div>
              </div>
              <Switch
                id="push-watchlist"
                checked={pushNotifications.watchlist_updates}
                onCheckedChange={(checked) => setPushNotifications(prev => ({ ...prev, watchlist_updates: checked }))}
              />
            </div>

            <Separator className="bg-gray-800" />

            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Users className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <Label htmlFor="push-social" className="text-white font-medium cursor-pointer">
                    Social Activity
                  </Label>
                  <p className="text-sm text-gray-400">Friend activity and watch party invites</p>
                </div>
              </div>
              <Switch
                id="push-social"
                checked={pushNotifications.social}
                onCheckedChange={(checked) => setPushNotifications(prev => ({ ...prev, social: checked }))}
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            className="bg-linear-to-r from-purple-700 to-fuchsia-600"
          >
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  )
}