// lib/supabase.ts 

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper to upload avatar
export const uploadAvatar = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  const { data, error } = await supabase.storage
    .from('flixvideo-bucket')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw error
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('flixvideo-bucket')
    .getPublicUrl(filePath)

  return publicUrlData.publicUrl
}

// Helper to delete avatar
export const deleteAvatarFromStorage = async (avatarUrl: string) => {
  // Extract file path from URL
  const urlParts = avatarUrl.split('/flixvideo-bucket/')
  if (urlParts.length > 1) {
    const filePath = `avatars/${urlParts[1]}`
    const { error } = await supabase.storage.from('flixvideo-bucket').remove([filePath])
    if (error) throw error
  }
}