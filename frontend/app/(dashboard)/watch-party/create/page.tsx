// app/(dashboard)/watch-party/create/page.tsx

"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Users, Lock, Unlock, Film, Tv } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { watchPartyAPI, CreatePartyData } from "@/lib/api/watchparty"

export default function CreateWatchPartyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get pre-filled data from URL params (when creating from movie/TV page)
  const prefilledContentType = searchParams.get('type') as 'movie' | 'tv' | null
  const prefilledContentId = searchParams.get('id')
  const prefilledTitle = searchParams.get('title')
  const prefilledSeason = searchParams.get('season')
  const prefilledEpisode = searchParams.get('episode')

  const [formData, setFormData] = useState<CreatePartyData>({
    content_type: prefilledContentType || 'movie',
    content_id: prefilledContentId ? parseInt(prefilledContentId) : 0,
    title: prefilledTitle || '',
    season_number: prefilledSeason ? parseInt(prefilledSeason) : undefined,
    episode_number: prefilledEpisode ? parseInt(prefilledEpisode) : undefined,
    is_public: false,
    max_participants: 10,
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.content_id || !formData.title) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.content_type === 'tv' && (!formData.season_number || !formData.episode_number)) {
      toast.error('Please specify season and episode for TV shows')
      return
    }

    try {
      setLoading(true)
      const response = await watchPartyAPI.create(formData)
      
      toast.success('Watch party created!')
      
      // Redirect to party room
      router.push(`/watch-party/${response.party.party_code}`)
    } catch (error: any) {
      console.error('Create party error:', error)
      toast.error(error.response?.data?.error || 'Failed to create watch party')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Create Watch Party</h1>
          <p className="text-gray-400">Set up a synchronized viewing session</p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 bg-gray-900 border-gray-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Content Type */}
              <div>
                <Label className="text-white mb-3 block">Content Type</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, content_type: 'movie' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.content_type === 'movie'
                        ? 'border-purple-600 bg-purple-600/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Film className="w-8 h-8 mx-auto mb-2 text-white" />
                    <p className="text-white font-semibold">Movie</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, content_type: 'tv' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.content_type === 'tv'
                        ? 'border-purple-600 bg-purple-600/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Tv className="w-8 h-8 mx-auto mb-2 text-white" />
                    <p className="text-white font-semibold">TV Show</p>
                  </button>
                </div>
              </div>

              {/* Content ID */}
              <div>
                <Label htmlFor="content_id" className="text-white">
                  {formData.content_type === 'movie' ? 'Movie' : 'TV Show'} ID *
                </Label>
                <Input
                  id="content_id"
                  type="number"
                  value={formData.content_id || ''}
                  onChange={(e) => setFormData({ ...formData, content_id: parseInt(e.target.value) })}
                  placeholder="TMDB ID (e.g., 550)"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Find on TMDB (The Movie Database)
                </p>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-white">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              {/* TV Show specific fields */}
              {formData.content_type === 'tv' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="season" className="text-white">Season *</Label>
                    <Input
                      id="season"
                      type="number"
                      value={formData.season_number || ''}
                      onChange={(e) => setFormData({ ...formData, season_number: parseInt(e.target.value) })}
                      placeholder="1"
                      className="bg-gray-800 border-gray-700 text-white"
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="episode" className="text-white">Episode *</Label>
                    <Input
                      id="episode"
                      type="number"
                      value={formData.episode_number || ''}
                      onChange={(e) => setFormData({ ...formData, episode_number: parseInt(e.target.value) })}
                      placeholder="1"
                      className="bg-gray-800 border-gray-700 text-white"
                      min="1"
                    />
                  </div>
                </div>
              )}

              {/* Max Participants */}
              <div>
                <Label htmlFor="max_participants" className="text-white">
                  Max Participants
                </Label>
                <Input
                  id="max_participants"
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                  className="bg-gray-800 border-gray-700 text-white"
                  min="2"
                  max="50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Between 2 and 50 participants
                </p>
              </div>

              {/* Public/Private Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  {formData.is_public ? (
                    <Unlock className="w-5 h-5 text-green-500" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <Label className="text-white font-semibold">
                      {formData.is_public ? 'Public Party' : 'Private Party'}
                    </Label>
                    <p className="text-xs text-gray-400">
                      {formData.is_public
                        ? 'Anyone can discover and join'
                        : 'Only people with the code can join'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Create Watch Party
                  </span>
                )}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}