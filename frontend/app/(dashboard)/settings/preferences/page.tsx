// frontend/app/(dashboard)/settings/preferences/page.tsx

"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Link from "next/link"
import { 
  Palette, 
  Globe, 
  Play, 
  Volume2,
  Subtitles,
  Monitor,
  Clock,
  Shield,
  ArrowLeft
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

export default function PreferencesSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "Africa/Nairobi",
    theme: "dark",
    autoplay: true,
    autoplayPreviews: true,
    skipIntro: true,
    skipCredits: false,
    defaultQuality: "auto",
    defaultSubtitles: "off",
    subtitleSize: 16,
    audioLanguage: "en",
    dataUsage: "auto",
    maturityLevel: "all",
    showAdultContent: true,
    contentTypes: {
      movies: true,
      tvShows: true,
      documentaries: true,
      anime: true,
    },
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success("Preferences saved successfully")
    } catch (error) {
      toast.error("Failed to save preferences")
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }))
  }

  const handleContentTypeToggle = (type: string) => {
    setPreferences(prev => ({
      ...prev,
      contentTypes: {
        ...prev.contentTypes,
        [type]: !prev.contentTypes[type as keyof typeof prev.contentTypes],
      },
    }))
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link href="/settings">
            <Button 
              variant="ghost" 
              className="mb-4 text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Preferences</h1>
          <p className="text-gray-400">Customize your viewing experience</p>
        </div>

        <div className="space-y-6">
          {/* Language & Region */}
          <Card className="bg-gray-900/50 border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Globe className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Language & Region</h2>
                <p className="text-sm text-gray-400">Choose your preferred language and timezone</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Display Language</Label>
                <Select
                  value={preferences.language}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, language: value })
                  }
                >
                  <SelectTrigger id="language" className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sw">Swahili</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={preferences.timezone}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, timezone: value })
                  }
                >
                  <SelectTrigger id="timezone" className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Nairobi">East Africa Time (GMT+3)</SelectItem>
                    <SelectItem value="Africa/Lagos">West Africa Time (GMT+1)</SelectItem>
                    <SelectItem value="Africa/Cairo">Egypt (GMT+2)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                    <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Los Angeles (GMT-8)</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai (GMT+4)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audio-language">Preferred Audio Language</Label>
                <Select
                  value={preferences.audioLanguage}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, audioLanguage: value })
                  }
                >
                  <SelectTrigger id="audio-language" className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sw">Swahili</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Appearance */}
          <Card className="bg-gray-900/50 border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Palette className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Appearance</h2>
                <p className="text-sm text-gray-400">Customize the look and feel</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={preferences.theme}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, theme: value })
                  }
                >
                  <SelectTrigger id="theme" className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark (Default)</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Dark theme is optimized for viewing experience
                </p>
              </div>
            </div>
          </Card>

          {/* Playback Settings */}
          <Card className="bg-gray-900/50 border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Play className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Playback Settings</h2>
                <p className="text-sm text-gray-400">Control how content plays</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Play className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label htmlFor="autoplay" className="text-white font-medium">
                      Autoplay Next Episode
                    </Label>
                    <p className="text-sm text-gray-400">
                      Automatically play next episode in a series
                    </p>
                  </div>
                </div>
                <Switch
                  id="autoplay"
                  checked={preferences.autoplay}
                  onCheckedChange={() => handleToggle("autoplay")}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label htmlFor="autoplay-previews" className="text-white font-medium">
                      Autoplay Previews
                    </Label>
                    <p className="text-sm text-gray-400">
                      Preview content while browsing
                    </p>
                  </div>
                </div>
                <Switch
                  id="autoplay-previews"
                  checked={preferences.autoplayPreviews}
                  onCheckedChange={() => handleToggle("autoplayPreviews")}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label htmlFor="skip-intro" className="text-white font-medium">
                      Skip Intro
                    </Label>
                    <p className="text-sm text-gray-400">
                      Automatically skip TV show intros
                    </p>
                  </div>
                </div>
                <Switch
                  id="skip-intro"
                  checked={preferences.skipIntro}
                  onCheckedChange={() => handleToggle("skipIntro")}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label htmlFor="skip-credits" className="text-white font-medium">
                      Skip Credits
                    </Label>
                    <p className="text-sm text-gray-400">
                      Automatically skip end credits
                    </p>
                  </div>
                </div>
                <Switch
                  id="skip-credits"
                  checked={preferences.skipCredits}
                  onCheckedChange={() => handleToggle("skipCredits")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-quality">Default Video Quality</Label>
                <Select
                  value={preferences.defaultQuality}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, defaultQuality: value })
                  }
                >
                  <SelectTrigger id="default-quality" className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (Recommended)</SelectItem>
                    <SelectItem value="4k">4K Ultra HD</SelectItem>
                    <SelectItem value="1080p">1080p Full HD</SelectItem>
                    <SelectItem value="720p">720p HD</SelectItem>
                    <SelectItem value="480p">480p SD</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Auto adjusts quality based on your connection speed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data-usage">Data Usage</Label>
                <Select
                  value={preferences.dataUsage}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, dataUsage: value })
                  }
                >
                  <SelectTrigger id="data-usage" className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="wifi">Wi-Fi Only</SelectItem>
                    <SelectItem value="low">Save Data</SelectItem>
                    <SelectItem value="high">Maximum Quality</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Control data consumption on mobile
                </p>
              </div>
            </div>
          </Card>

          {/* Subtitle Settings */}
          <Card className="bg-gray-900/50 border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Subtitles className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Subtitle Settings</h2>
                <p className="text-sm text-gray-400">Customize subtitle appearance</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-subtitles">Default Subtitles</Label>
                <Select
                  value={preferences.defaultSubtitles}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, defaultSubtitles: value })
                  }
                >
                  <SelectTrigger id="default-subtitles" className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sw">Swahili</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Subtitle Size</Label>
                  <span className="text-sm text-gray-400">{preferences.subtitleSize}px</span>
                </div>
                <Slider
                  value={[preferences.subtitleSize]}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, subtitleSize: value[0] })
                  }
                  min={12}
                  max={24}
                  step={2}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Small</span>
                  <span>Medium</span>
                  <span>Large</span>
                </div>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-center text-white" style={{ fontSize: `${preferences.subtitleSize}px` }}>
                  Sample subtitle text
                </p>
              </div>
            </div>
          </Card>

          {/* Content Preferences */}
          <Card className="bg-gray-900/50 border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Content Preferences</h2>
                <p className="text-sm text-gray-400">Control what content you see</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maturity-level">Maturity Level</Label>
                <Select
                  value={preferences.maturityLevel}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, maturityLevel: value })
                  }
                >
                  <SelectTrigger id="maturity-level" className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Maturity Levels</SelectItem>
                    <SelectItem value="teen">Teen and Below (13+)</SelectItem>
                    <SelectItem value="kids">Kids Only (All Ages)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Filters content based on age appropriateness
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <Label htmlFor="adult-content" className="text-white font-medium">
                    Show Adult Content
                  </Label>
                  <p className="text-sm text-gray-400">
                    Display mature-rated content (18+)
                  </p>
                </div>
                <Switch
                  id="adult-content"
                  checked={preferences.showAdultContent}
                  onCheckedChange={() => handleToggle("showAdultContent")}
                />
              </div>

              <div className="space-y-3">
                <Label>Content Types</Label>
                <p className="text-sm text-gray-400 mb-3">
                  Select the types of content you want to see
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <Label htmlFor="content-movies" className="text-white">
                      Movies
                    </Label>
                    <Switch
                      id="content-movies"
                      checked={preferences.contentTypes.movies}
                      onCheckedChange={() => handleContentTypeToggle("movies")}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <Label htmlFor="content-tv" className="text-white">
                      TV Shows
                    </Label>
                    <Switch
                      id="content-tv"
                      checked={preferences.contentTypes.tvShows}
                      onCheckedChange={() => handleContentTypeToggle("tvShows")}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <Label htmlFor="content-docs" className="text-white">
                      Documentaries
                    </Label>
                    <Switch
                      id="content-docs"
                      checked={preferences.contentTypes.documentaries}
                      onCheckedChange={() => handleContentTypeToggle("documentaries")}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <Label htmlFor="content-anime" className="text-white">
                      Anime
                    </Label>
                    <Switch
                      id="content-anime"
                      checked={preferences.contentTypes.anime}
                      onCheckedChange={() => handleContentTypeToggle("anime")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Link href="/settings">
              <Button
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </Link>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
            >
              {loading ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}