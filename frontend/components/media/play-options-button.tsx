// components/media/play-options-button.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Play, Users, ExternalLink, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { StreamingModal } from "./streaming-modal"

interface PlayOptionsButtonProps {
  contentType: 'movie' | 'tv'
  contentId: number
  title: string
  seasonNumber?: number
  episodeNumber?: number
}

export function PlayOptionsButton({
  contentType,
  contentId,
  title,
  seasonNumber,
  episodeNumber,
}: PlayOptionsButtonProps) {
  const router = useRouter()
  const [showStreamingModal, setShowStreamingModal] = useState(false)

  const handleStartWatchParty = () => {
    const params = new URLSearchParams({
      type: contentType,
      id: contentId.toString(),
      title: title,
    })

    if (contentType === 'tv' && seasonNumber && episodeNumber) {
      params.append('season', seasonNumber.toString())
      params.append('episode', episodeNumber.toString())
    }

    router.push(`/watch-party/create?${params.toString()}`)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-200 font-semibold"
          >
            <Play className="w-6 h-6 mr-2" fill="currentColor" />
            Play
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56 bg-gray-900 border-gray-700">
          {/* Start Watch Party */}
          <DropdownMenuItem
            onClick={handleStartWatchParty}
            className="cursor-pointer text-white hover:bg-purple-600 focus:bg-purple-600"
          >
            <Users className="w-5 h-5 mr-3" />
            <div className="flex flex-col">
              <span className="font-semibold">Start Watch Party</span>
              <span className="text-xs text-gray-400">Watch together with friends</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-gray-700" />

          {/* Where to Watch */}
          <DropdownMenuItem
            onClick={() => setShowStreamingModal(true)}
            className="cursor-pointer text-white hover:bg-purple-600 focus:bg-purple-600"
          >
            <ExternalLink className="w-5 h-5 mr-3" />
            <div className="flex flex-col">
              <span className="font-semibold">Where to Watch</span>
              <span className="text-xs text-gray-400">Find streaming platforms</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Streaming Modal */}
      <StreamingModal
        open={showStreamingModal}
        onOpenChange={setShowStreamingModal}
        contentType={contentType}
        contentId={contentId}
        title={title}
      />
    </>
  )
}