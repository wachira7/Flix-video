// components/profile/avatar-upload.tsx

"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Trash2 } from "lucide-react"
import { userAPI } from "@/lib/api/user"
import { toast } from "sonner"
import { getUser } from "@/lib/auth"
import { avatarEvents } from "@/lib/events/avatar-events"

interface AvatarUploadProps {
  currentAvatar?: string | null
  username?: string
  onAvatarUpdate: (url: string | null) => void
}

export function AvatarUpload({ currentAvatar, username, onAvatarUpdate }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB")
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const response = await userAPI.uploadAvatar(file)
      
      // Update local state
      setPreviewUrl(response.avatar_url)
      onAvatarUpdate(response.avatar_url)
      
      // Update localStorage
      const currentUser = getUser()
      if (currentUser) {
        const updatedUser = { ...currentUser, avatar_url: response.avatar_url }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }

      // BROADCAST avatar update to sidebar and topbar
      avatarEvents.publish(response.avatar_url)
      
      toast.success("✅ Avatar uploaded successfully!")
      
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      // Revert preview on error
      setPreviewUrl(currentAvatar || null)
      toast.error(error.response?.data?.error || "Failed to upload avatar")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your avatar?")) return

    setDeleting(true)
    try {
      await userAPI.deleteAvatar()
      
      // Update local state
      setPreviewUrl(null)
      onAvatarUpdate(null)
      
      // Update localStorage
      const currentUser = getUser()
      if (currentUser) {
        const updatedUser = { ...currentUser, avatar_url: null }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
      
      // BROADCAST avatar removal to sidebar and topbar
       avatarEvents.publish(null)
      
      toast.success("Avatar deleted")
      
    } catch (error: any) {
      console.error('Avatar delete error:', error)
      toast.error(error.response?.data?.error || "Failed to delete avatar")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <Avatar className="w-24 h-24">
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt={username || "User"} />
          ) : (
            <AvatarFallback className="bg-linear-to-r from-purple-700 to-fuchsia-600 text-2xl">
              {username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          )}
        </Avatar>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 p-2 bg-purple-700 rounded-full hover:bg-purple-600 transition-colors disabled:opacity-50"
          type="button"
        >
          <Camera className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          variant="outline"
          className="border-gray-700"
        >
          {uploading ? "Uploading..." : "Change Avatar"}
        </Button>

        {previewUrl && (
          <Button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? "Deleting..." : "Remove"}
          </Button>
        )}

        <p className="text-xs text-gray-500">
          JPG, PNG or GIF. Max 10MB.
        </p>
      </div>
    </div>
  )
}