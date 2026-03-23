"use client"

import { useState, useEffect, useRef } from "react"
import { Play, X, Volume2, VolumeX, Maximize, Minimize } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { userAPI } from "@/lib/api/user"

interface VideoPlayerProps {
  videoKey: string
  title: string
  contentType?: "movie" | "tv"
  contentId?: number
  durationSeconds?: number
  seasonNumber?: number
  episodeNumber?: number
}

export function VideoPlayer({
  videoKey,
  title,
  contentType,
  contentId,
  durationSeconds = 0,
  seasonNumber,
  episodeNumber,
}: VideoPlayerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [watchStartTime, setWatchStartTime] = useState<number | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── YouTube embed URL ─────────────────────────────────────────
  const getEmbedUrl = () => {
    const params = new URLSearchParams({
      autoplay: "1",
      rel: "0",
      modestbranding: "1",
      mute: isMuted ? "1" : "0",
      enablejsapi: "1",
    })
    return `https://www.youtube.com/embed/${videoKey}?${params.toString()}`
  }

  // ── Watch progress tracking ───────────────────────────────────
  const startProgressTracking = () => {
    if (!contentType || !contentId) return

    setWatchStartTime(Date.now())

    // Save progress every 30 seconds
    progressIntervalRef.current = setInterval(async () => {
      const elapsed = watchStartTime
        ? Math.floor((Date.now() - watchStartTime) / 1000)
        : 0

      try {
        await userAPI.updateWatchProgress({
          content_type: contentType,
          content_id: contentId,
          progress_seconds: elapsed,
          duration_seconds: durationSeconds,
          completed: durationSeconds > 0 && elapsed >= durationSeconds * 0.9,
          season_number: seasonNumber,
          episode_number: episodeNumber,
        })
      } catch (error) {
        // Silent fail — don't interrupt watching experience
      }
    }, 30000)
  }

  const stopProgressTracking = async () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    // Final save on close
    if (contentType && contentId && watchStartTime) {
      const elapsed = Math.floor((Date.now() - watchStartTime) / 1000)
      if (elapsed > 5) {
        try {
          await userAPI.updateWatchProgress({
            content_type: contentType,
            content_id: contentId,
            progress_seconds: elapsed,
            duration_seconds: durationSeconds,
            completed: durationSeconds > 0 && elapsed >= durationSeconds * 0.9,
            season_number: seasonNumber,
            episode_number: episodeNumber,
          })
        } catch (error) {
          // Silent fail
        }
      }
    }

    setWatchStartTime(null)
  }

  const handleOpen = () => {
    setIsOpen(true)
    startProgressTracking()
  }

  const handleClose = async () => {
    await stopProgressTracking()
    setIsOpen(false)
  }

  // ── Fullscreen ────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  return (
    <>
      {/* Trigger Button */}
      <Button
        size="lg"
        variant="outline"
        className="border-gray-400 bg-gray-800/80 hover:border-purple-600 hover:bg-gray-700 transition-all font-semibold"
        onClick={handleOpen}
      >
        <Play className="w-5 h-5 mr-2" fill="currentColor" />
        Watch Trailer
      </Button>

      {/* Player Modal */}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DialogContent className="max-w-5xl w-full p-0 bg-black border-gray-800 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
            <h3 className="text-white font-semibold truncate">{title} — Trailer</h3>
            <div className="flex items-center gap-2">
              {/* Mute toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted
                  ? <VolumeX className="w-5 h-5" />
                  : <Volume2 className="w-5 h-5" />
                }
              </Button>

              {/* Fullscreen toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
                onClick={toggleFullscreen}
              >
                {isFullscreen
                  ? <Minimize className="w-5 h-5" />
                  : <Maximize className="w-5 h-5" />
                }
              </Button>

              {/* Close */}
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
                onClick={handleClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* YouTube Embed */}
          <div ref={containerRef} className="relative w-full aspect-video bg-black">
            <iframe
              src={getEmbedUrl()}
              title={`${title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-900 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Official trailer via YouTube
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white text-xs"
              onClick={() =>
                window.open(`https://www.youtube.com/watch?v=${videoKey}`, "_blank")
              }
            >
              Open in YouTube ↗
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </>
  )
}