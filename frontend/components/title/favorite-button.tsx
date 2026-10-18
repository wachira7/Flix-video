// components/title/favorite-button.tsx
"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import { favoritesAPI } from "@/lib/api/favorites"
import type { MediaType } from "@/lib/media"
import { cn } from "@/lib/utils"

export function FavoriteButton({ mediaType, id, title }: { mediaType: MediaType; id: number; title: string }) {
  const [on, setOn] = useState(false)
  const [burst, setBurst] = useState(0)

  useEffect(() => {
    let alive = true
    favoritesAPI
      .checkFavorite(mediaType, id)
      .then((r) => alive && setOn(!!r.is_favorited))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [mediaType, id])

  const toggle = async () => {
    const next = !on
    setOn(next)
    if (next) setBurst((n) => n + 1)
    try {
      if (next) {
        await favoritesAPI.addFavorite(mediaType, id)
        toast.success(`${title} is in your favorites`)
      } else {
        await favoritesAPI.removeFavorite(mediaType, id)
        toast(`Removed ${title} from favorites`)
      }
    } catch {
      setOn(!next)
      toast.error("Couldn't update your favorites. Please try again.")
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
      title={on ? "In your favorites" : "Add to favorites"}
      className={cn(
        "relative flex h-12 w-12 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        on ? "border-primary/60 bg-primary/15 text-primary" : "border-foreground/25 bg-background/30 hover:border-foreground/50"
      )}
    >
      <motion.span
        key={burst}
        initial={burst ? { scale: 0.5 } : false}
        animate={{ scale: [0.5, 1.3, 1] }}
        transition={{ duration: 0.45 }}
        className="flex"
      >
        <Heart className={cn("h-5 w-5", on && "fill-current")} />
      </motion.span>
      {burst > 0 && on && (
        <motion.span
          key={`ring-${burst}`}
          aria-hidden="true"
          initial={{ scale: 0.6, opacity: 0.7 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 rounded-lg border-2 border-primary"
        />
      )}
    </button>
  )
}
