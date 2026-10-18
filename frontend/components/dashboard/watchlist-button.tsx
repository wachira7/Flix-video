// components/dashboard/watchlist-button.tsx
// Add to / remove from watchlist, optimistic, with a little check-mark pop.
"use client"

import { useEffect, useState, type MouseEvent } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, Plus } from "lucide-react"
import { toast } from "sonner"
import { watchlistAPI } from "@/lib/api/watchlist"
import type { MediaType } from "@/lib/media"
import { cn } from "@/lib/utils"

interface WatchlistButtonProps {
  mediaType: MediaType
  id: number
  title: string
  initiallySaved?: boolean
  variant?: "icon" | "pill"
  className?: string
  onChange?: (saved: boolean) => void
  /** Ask the API for the real state on mount (detail pages) */
  checkOnMount?: boolean
}

export function WatchlistButton({
  mediaType,
  id,
  title,
  initiallySaved = false,
  variant = "icon",
  className,
  onChange,
  checkOnMount,
}: WatchlistButtonProps) {
  const [saved, setSaved] = useState(initiallySaved)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!checkOnMount) return
    let alive = true
    watchlistAPI
      .checkWatchlist(mediaType, id)
      .then((r) => alive && setSaved(!!r.in_watchlist))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [checkOnMount, mediaType, id])

  const toggle = async (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    const next = !saved
    setSaved(next)
    setBusy(true)
    try {
      if (next) {
        await watchlistAPI.addToWatchlist(mediaType, id)
        toast.success(`Added ${title} to your watchlist`)
      } else {
        await watchlistAPI.removeFromWatchlist(mediaType, id)
        toast(`Removed ${title} from your watchlist`)
      }
      onChange?.(next)
    } catch (error) {
      // The API answers 400 "Already in watchlist" for duplicates
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error ?? ""
      if (next && /already/i.test(message)) {
        toast(`${title} is already in your watchlist`)
      } else {
        setSaved(!next)
        toast.error("Couldn't update your watchlist. Please try again.")
      }
    } finally {
      setBusy(false)
    }
  }

  const label = saved ? `Remove ${title} from watchlist` : `Add ${title} to watchlist`
  const icon = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={saved ? "saved" : "add"}
        initial={{ scale: 0.4, rotate: saved ? -90 : 90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0.4, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className="flex"
      >
        {saved ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
      </motion.span>
    </AnimatePresence>
  )

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        aria-label={label}
        className={cn(
          "inline-flex h-12 items-center gap-2 rounded-lg border px-5 text-[15px] font-semibold backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          saved
            ? "border-primary/60 bg-primary/15 text-primary"
            : "border-foreground/25 bg-background/30 text-foreground hover:border-foreground/50",
          className
        )}
      >
        {icon}
        {saved ? "In watchlist" : "Watchlist"}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={label}
      title={saved ? "In your watchlist" : "Add to watchlist"}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition-[background-color,border-color,transform] duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        saved ? "border-primary bg-primary text-primary-foreground" : "border-white/40 bg-black/50 text-white hover:border-white",
        className
      )}
    >
      {icon}
    </button>
  )
}
