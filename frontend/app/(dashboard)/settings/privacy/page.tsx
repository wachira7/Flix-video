// frontend/app/(dashboard)/settings/privacy/page.tsx - CREATE/UPDATE

"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Shield, Eye, EyeOff, Users, Activity, FileText, Lock, Globe, Database, UserCheck } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export default function PrivacySettingsPage() {
  const [loading, setLoading] = useState(false)
  const [privacy, setPrivacy] = useState({
    profileVisibility: "friends",
    showWatchHistory: true,
    showFavorites: true,
    showRatings: false,
    allowFriendRequests: true,
    showOnlineStatus: true,
    shareActivity: true,
    allowTagging: true,
    dataCollection: true,
    personalizedAds: false,
    thirdPartySharing: false,
    analyticsTracking: true,
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success("Privacy settings saved")
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key: string) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }))
  }

  const handleDownloadData = () => {
    toast.info("Preparing your data download...")
    // Implement data download
  }

  const handleDeleteAccount = () => {
    toast.error("Account deletion initiated. You will receive a confirmation email.")
    // Implement account deletion
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Settings</h1>
          <p className="text-gray-400">Control your privacy and data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900/50 border-gray-800 p-4">
              
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Privacy */}
            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <UserCheck className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Profile Privacy</h2>
                  <p className="text-sm text-gray-400">Control who can see your profile</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-visibility">Profile Visibility</Label>
                  <Select
                    value={privacy.profileVisibility}
                    onValueChange={(value) =>
                      setPrivacy({ ...privacy, profileVisibility: value })
                    }
                  >
                    <SelectTrigger id="profile-visibility" className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Public - Everyone can see
                        </div>
                      </SelectItem>
                      <SelectItem value="friends">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Friends Only
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Private - Only me
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Controls who can view your profile and activity
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <div>
                      <Label htmlFor="show-watch-history" className="text-white font-medium">
                        Show Watch History
                      </Label>
                      <p className="text-sm text-gray-400">
                        Let others see what you've watched
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="show-watch-history"
                    checked={privacy.showWatchHistory}
                    onCheckedChange={() => handleToggle("showWatchHistory")}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-gray-400" />
                    <div>
                      <Label htmlFor="show-favorites" className="text-white font-medium">
                        Show Favorites
                      </Label>
                      <p className="text-sm text-gray-400">
                        Display your favorite content on profile
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="show-favorites"
                    checked={privacy.showFavorites}
                    onCheckedChange={() => handleToggle("showFavorites")}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-gray-400" />
                    <div>
                      <Label htmlFor="show-ratings" className="text-white font-medium">
                        Show Ratings & Reviews
                      </Label>
                      <p className="text-sm text-gray-400">
                        Make your ratings and reviews public
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="show-ratings"
                    checked={privacy.showRatings}
                    onCheckedChange={() => handleToggle("showRatings")}
                  />
                </div>
              </div>
            </Card>

            {/* Social Privacy */}
            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Social Privacy</h2>
                  <p className="text-sm text-gray-400">Manage social interactions</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <Label htmlFor="allow-friend-requests" className="text-white font-medium">
                        Allow Friend Requests
                      </Label>
                      <p className="text-sm text-gray-400">
                        Let others send you friend requests
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="allow-friend-requests"
                    checked={privacy.allowFriendRequests}
                    onCheckedChange={() => handleToggle("allowFriendRequests")}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <div>
                      <Label htmlFor="show-online-status" className="text-white font-medium">
                        Show Online Status
                      </Label>
                      <p className="text-sm text-gray-400">
                        Let friends see when you're online
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="show-online-status"
                    checked={privacy.showOnlineStatus}
                    onCheckedChange={() => handleToggle("showOnlineStatus")}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <div>
                      <Label htmlFor="share-activity" className="text-white font-medium">
                        Share Activity
                      </Label>
                      <p className="text-sm text-gray-400">
                        Share what you're watching with friends
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="share-activity"
                    checked={privacy.shareActivity}
                    onCheckedChange={() => handleToggle("shareActivity")}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <Label htmlFor="allow-tagging" className="text-white font-medium">
                        Allow Tagging
                      </Label>
                      <p className="text-sm text-gray-400">
                        Let friends tag you in posts and comments
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="allow-tagging"
                    checked={privacy.allowTagging}
                    onCheckedChange={() => handleToggle("allowTagging")}
                  />
                </div>
              </div>
            </Card>

            {/* Data & Privacy */}
            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Database className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Data & Privacy</h2>
                  <p className="text-sm text-gray-400">Control how your data is used</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-gray-400" />
                    <div>
                      <Label htmlFor="data-collection" className="text-white font-medium">
                        Data Collection
                      </Label>
                      <p className="text-sm text-gray-400">
                        Allow FlixVideo to collect usage data
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="data-collection"
                    checked={privacy.dataCollection}
                    onCheckedChange={() => handleToggle("dataCollection")}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <div>
                      <Label htmlFor="analytics-tracking" className="text-white font-medium">
                        Analytics Tracking
                      </Label>
                      <p className="text-sm text-gray-400">
                        Help improve FlixVideo with anonymous analytics
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="analytics-tracking"
                    checked={privacy.analyticsTracking}
                    onCheckedChange={() => handleToggle("analyticsTracking")}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div>
                      <Label htmlFor="personalized-ads" className="text-white font-medium">
                        Personalized Ads
                      </Label>
                      <p className="text-sm text-gray-400">
                        See ads tailored to your interests
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="personalized-ads"
                    checked={privacy.personalizedAds}
                    onCheckedChange={() => handleToggle("personalizedAds")}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <Label htmlFor="third-party-sharing" className="text-white font-medium">
                        Third-Party Data Sharing
                      </Label>
                      <p className="text-sm text-gray-400">
                        Share data with trusted partners
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="third-party-sharing"
                    checked={privacy.thirdPartySharing}
                    onCheckedChange={() => handleToggle("thirdPartySharing")}
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm text-blue-400">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Your privacy is important. We never sell your personal data to third parties.
                  </p>
                </div>
              </div>
            </Card>

            {/* Data Management */}
            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Data Management</h2>
                  <p className="text-sm text-gray-400">Download or delete your data</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div>
                    <p className="font-medium text-white">Download Your Data</p>
                    <p className="text-sm text-gray-400">
                      Get a copy of all your FlixVideo data
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-gray-600"
                    onClick={handleDownloadData}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div>
                    <p className="font-medium text-white">Clear Watch History</p>
                    <p className="text-sm text-gray-400">
                      Remove all viewing history from your account
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-yellow-900/50 text-yellow-400 hover:bg-yellow-900/20"
                      >
                        Clear History
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-900 border-gray-800">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Clear Watch History?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          This will permanently delete your entire watch history. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-yellow-600 hover:bg-yellow-700"
                          onClick={() => toast.success("Watch history cleared")}
                        >
                          Clear History
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-900/20 rounded-lg border border-red-900/50">
                  <div>
                    <p className="font-medium text-white">Delete Account</p>
                    <p className="text-sm text-gray-400">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                      >
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-900 border-gray-800">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Account?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          This will permanently delete your account and all associated data. 
                          This action cannot be undone. Are you absolutely sure?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={handleDeleteAccount}
                        >
                          Yes, Delete My Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>

            {/* Privacy Policy */}
            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Legal</h2>
                  <p className="text-sm text-gray-400">Review our policies</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-700 text-gray-300 hover:text-white"
                  onClick={() => window.open("/privacy-policy", "_blank")}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Privacy Policy
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-700 text-gray-300 hover:text-white"
                  onClick={() => window.open("/terms-of-service", "_blank")}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Terms of Service
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-700 text-gray-300 hover:text-white"
                  onClick={() => window.open("/cookie-policy", "_blank")}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Cookie Policy
                </Button>
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-linear-to-r from-purple-700 to-fuchsia-600 hover:from-purple-800 hover:to-fuchsia-700"
              >
                {loading ? "Saving..." : "Save Privacy Settings"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}