// lib/hooks/use-youtube-player.ts
// Minimal YouTube IFrame API wrapper for synced playback.
"use client"

import { useEffect, useRef, useState } from "react"

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

export interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
  mute(): void
  unMute(): void
  isMuted(): boolean
  destroy(): void
}

export const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } as const

let apiReady: Promise<any> | null = null
function loadApi(): Promise<any> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  apiReady ??= new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve(window.YT)
    }
    const script = document.createElement("script")
    script.src = "https://www.youtube.com/iframe_api"
    script.async = true
    document.head.appendChild(script)
  })
  return apiReady
}

interface Options {
  videoId: string | null | undefined
  /** Guests get no native controls so playback stays in sync */
  controls: boolean
  muted?: boolean
  onStateChange?: (state: number, player: YTPlayer) => void
}

export function useYouTubePlayer({ videoId, controls, muted, onStateChange }: Options) {
  const host = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  const [ready, setReady] = useState(false)
  const stateHandler = useRef(onStateChange)
  stateHandler.current = onStateChange

  useEffect(() => {
    if (!videoId || !host.current) return
    let destroyed = false
    const mount = document.createElement("div")
    host.current.appendChild(mount)

    loadApi().then((YT) => {
      if (destroyed) return
      player.current = new YT.Player(mount, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          controls: controls ? 1 : 0,
          disablekb: controls ? 0 : 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          mute: muted ? 1 : 0,
        },
        events: {
          onReady: () => !destroyed && setReady(true),
          onStateChange: (e: { data: number }) => player.current && stateHandler.current?.(e.data, player.current),
        },
      })
    })

    return () => {
      destroyed = true
      setReady(false)
      player.current?.destroy()
      player.current = null
      mount.remove()
    }
  }, [videoId, controls, muted])

  return { host, player, ready }
}
