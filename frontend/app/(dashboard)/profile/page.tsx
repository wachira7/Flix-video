// frontend app/(dashboard)/profile/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"  
import { userAPI } from "@/lib/api/user"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { User, ArrowLeft } from "lucide-react"  

interface ProfileData {
  username?: string
  full_name?: string
  bio?: string
  date_of_birth?: string | null
  gender?: string
  country?: string
  city?: string
  timezone?: string
  language?: string
  avatar_url?: string | null
}

export default function ProfilePage() {
  const router = useRouter()  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({})

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile()
      // Format date properly for the input field (YYYY-MM-DD)
      const profileData = response.profile || {}
      if (profileData.date_of_birth) {
        // Ensure it's in YYYY-MM-DD format
        const date = new Date(profileData.date_of_birth)
        profileData.date_of_birth = date.toISOString().split('T')[0]
      }
      setProfile(profileData)
    } catch (error) {
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setSaving(true)
    try {
      //Build the profile object - only include fields that have values
      const profileToSave: any = {}

      // Handle text fields
      if (profile.username?.trim()) profileToSave.username = profile.username.trim()
      if (profile.full_name?.trim()) profileToSave.full_name = profile.full_name.trim()
      if (profile.bio?.trim()) profileToSave.bio = profile.bio.trim()
      if (profile.gender) profileToSave.gender = profile.gender
      if (profile.country?.trim()) profileToSave.country = profile.country.trim()
      if (profile.city?.trim()) profileToSave.city = profile.city.trim()
      if (profile.timezone) profileToSave.timezone = profile.timezone
      
      // Always include language
      profileToSave.language = profile.language || 'en'

      //  Handle date_of_birth properly
      if (profile.date_of_birth && profile.date_of_birth.trim()) {
        // HTML date input already gives us YYYY-MM-DD format
        profileToSave.date_of_birth = profile.date_of_birth.trim()
      }

      // console.log('📅 Sending date_of_birth:', profileToSave.date_of_birth)
      // console.log('Full payload:', profileToSave)
      
      await userAPI.updateProfile(profileToSave)
      
      toast.success("Profile updated successfully!", {
        duration: 2000,
        position: "top-center"
      })
      
      // Update localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        ...profileToSave
      }))
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
      
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.response?.data?.error || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-48 bg-gray-800" />
        <Skeleton className="h-96 bg-gray-800" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <User className="w-8 h-8 text-purple-500" />
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 bg-gray-900 border-gray-800 mb-6">
          <h2 className="text-xl font-semibold text-white mb-6">Avatar</h2>
          <AvatarUpload
            currentAvatar={profile.avatar_url}
            username={profile.username}
            onAvatarUpdate={(url) => setProfile(prev => ({ ...prev, avatar_url: url }))}
          />
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-800 space-y-6">
          <h2 className="text-xl font-semibold text-white">Personal Information</h2>

          {/* Username */}
          <div>
            <Label htmlFor="username" className="text-gray-300">Username</Label>
            <Input
              id="username"
              value={profile.username || ''}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Choose a unique username"
              className="bg-gray-800 border-gray-700 text-white mt-2"
            />
          </div>

          {/* Full Name */}
          <div>
            <Label htmlFor="full_name" className="text-gray-300">Full Name</Label>
            <Input
              id="full_name"
              value={profile.full_name || ''}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Your full name"
              className="bg-gray-800 border-gray-700 text-white mt-2"
            />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="text-gray-300">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              className="bg-gray-800 border-gray-700 text-white mt-2 min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {(profile.bio || '').length}/500 characters
            </p>
          </div>

          {/* Date of Birth */}
          <div>
            <Label htmlFor="date_of_birth" className="text-gray-300">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={profile.date_of_birth || ''}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              className="bg-gray-800 border-gray-700 text-white mt-2"
              max={new Date().toISOString().split('T')[0]} // Can't be in the future
            />
            {profile.date_of_birth && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {new Date(profile.date_of_birth).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Gender */}
          <div>
            <Label htmlFor="gender" className="text-gray-300">Gender</Label>
            <Select
              value={profile.gender || ''}
              onValueChange={(value) => handleInputChange('gender', value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Country */}
          <div>
            <Label htmlFor="country" className="text-gray-300">Country</Label>
            <Input
              id="country"
              value={profile.country || ''}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder="Your country"
              className="bg-gray-800 border-gray-700 text-white mt-2"
            />
          </div>

          {/* City */}
          <div>
            <Label htmlFor="city" className="text-gray-300">City</Label>
            <Input
              id="city"
              value={profile.city || ''}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Your city"
              className="bg-gray-800 border-gray-700 text-white mt-2"
            />
          </div>

          {/* Language */}
          <div>
            <Label htmlFor="language" className="text-gray-300">Preferred Language</Label>
            <Select
              value={profile.language || 'en'}
              onValueChange={(value) => handleInputChange('language', value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="sw">Swahili</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-linear-to-r from-purple-700 to-fuchsia-600"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}