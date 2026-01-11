// components/dashboard/add-to-list-button.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Plus, Check } from "lucide-react"
import { favoritesAPI } from "@/lib/api/favorites"
import { watchlistAPI } from "@/lib/api/watchlist"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface AddToListButtonProps {
  contentType: "movie" | "tv"
  contentId: number
  variant?: "icon" | "full"
}

export function AddToListButton({ contentType, contentId, variant = "full" }: AddToListButtonProps) {
  const [inFavorites, setInFavorites] = useState(false)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [contentType, contentId])

  const checkStatus = async () => {
    try {
      const [favResult, watchResult] = await Promise.all([
        favoritesAPI.checkFavorite(contentType, contentId),
        watchlistAPI.checkWatchlist(contentType, contentId)
      ])
      setInFavorites(favResult.is_favorited)
      setInWatchlist(watchResult.in_watchlist)
    } catch (error) {
      console.error("Check status error:", error)
    }
  }

  const toggleFavorite = async () => {
    setLoading(true)
    try {
      if (inFavorites) {
        await favoritesAPI.removeFavorite(contentType, contentId)
        setInFavorites(false)
        toast.success("Removed from favorites")
      } else {
        await favoritesAPI.addFavorite(contentType, contentId)
        setInFavorites(true)
        toast.success("Added to favorites")
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update favorites")
    } finally {
      setLoading(false)
    }
  }

  const toggleWatchlist = async () => {
    setLoading(true)
    try {
      if (inWatchlist) {
        await watchlistAPI.removeFromWatchlist(contentType, contentId)
        setInWatchlist(false)
        toast.success("Removed from watchlist")
      } else {
        await watchlistAPI.addToWatchlist(contentType, contentId)
        setInWatchlist(true)
        toast.success("Added to watchlist")
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update watchlist")
    } finally {
      setLoading(false)
    }
  }

  if (variant === "icon") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            variant="outline"
            className="border-gray-400 bg-gray-800/80 hover:bg-gray-700"
            disabled={loading}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-gray-900 border-gray-800">
          <DropdownMenuItem onClick={toggleFavorite} className="text-white hover:bg-gray-800">
            <Heart className={`w-4 h-4 mr-2 ${inFavorites ? "fill-red-500 text-red-500" : ""}`} />
            {inFavorites ? "Remove from Favorites" : "Add to Favorites"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleWatchlist} className="text-white hover:bg-gray-800">
            <Check className={`w-4 h-4 mr-2 ${inWatchlist ? "text-green-500" : ""}`} />
            {inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="lg"
          variant="outline"
          className="border-gray-400 bg-gray-800/80 hover:bg-gray-700 text-white"
          disabled={loading}
        >
          <Plus className="w-6 h-6 mr-2" />
          My List
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-900 border-gray-800">
        <DropdownMenuItem onClick={toggleFavorite} className="text-white hover:bg-gray-800">
          <Heart className={`w-4 h-4 mr-2 ${inFavorites ? "fill-red-500 text-red-500" : ""}`} />
          {inFavorites ? "Remove from Favorites" : "Add to Favorites"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleWatchlist} className="text-white hover:bg-gray-800">
          <Check className={`w-4 h-4 mr-2 ${inWatchlist ? "text-green-500" : ""}`} />
          {inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}