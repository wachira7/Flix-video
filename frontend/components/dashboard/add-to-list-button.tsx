// components/dashboard/add-to-list-button.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Plus, Check, List } from "lucide-react"
import { favoritesAPI } from "@/lib/api/favorites"
import { watchlistAPI } from "@/lib/api/watchlist"
import { listsAPI } from "@/lib/api/lists"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu"

interface AddToListButtonProps {
  contentType: "movie" | "tv"
  contentId: number
  variant?: "icon" | "full"
}

export function AddToListButton({ contentType, contentId, variant = "full" }: AddToListButtonProps) {
  const [inFavorites, setInFavorites] = useState(false)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userLists, setUserLists] = useState<any[]>([])
  const [listsLoading, setListsLoading] = useState(false)

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

  const loadUserLists = async () => {
    if (userLists.length > 0) return // Already loaded
    
    setListsLoading(true)
    try {
      const result = await listsAPI.getMyLists(1, 20)
      setUserLists(result.lists || [])
    } catch (error) {
      console.error("Load lists error:", error)
      toast.error("Failed to load lists")
    } finally {
      setListsLoading(false)
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

  const addToCustomList = async (listId: string, listTitle: string) => {
    setLoading(true)
    try {
      await listsAPI.addItem(listId, {
        contentType,
        contentId
      })
      toast.success(`Added to "${listTitle}"`)
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Failed to add to list"
      if (errorMsg.includes("already in list")) {
        toast.info("Already in this list")
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const ButtonContent = variant === "icon" ? (
    <Button
      size="lg"
      variant="outline"
      className="border-gray-400 bg-gray-800/80 hover:bg-gray-700"
      disabled={loading}
    >
      <Plus className="w-6 h-6" />
    </Button>
  ) : (
    <Button
      size="lg"
      variant="outline"
      className="border-gray-400 bg-gray-800/80 hover:bg-gray-700 text-white"
      disabled={loading}
    >
      <Plus className="w-6 h-6 mr-2" />
      My List
    </Button>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {ButtonContent}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-900 border-gray-800 w-56">
        {/* Favorites */}
        <DropdownMenuItem onClick={toggleFavorite} className="text-white hover:bg-gray-800">
          <Heart className={`w-4 h-4 mr-2 ${inFavorites ? "fill-red-500 text-red-500" : ""}`} />
          {inFavorites ? "Remove from Favorites" : "Add to Favorites"}
        </DropdownMenuItem>

        {/* Watchlist */}
        <DropdownMenuItem onClick={toggleWatchlist} className="text-white hover:bg-gray-800">
          <Check className={`w-4 h-4 mr-2 ${inWatchlist ? "text-green-500" : ""}`} />
          {inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-800" />

        {/* Custom Lists */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger 
            className="text-white hover:bg-gray-800"
            onMouseEnter={loadUserLists}
          >
            <List className="w-4 h-4 mr-2" />
            Add to List
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-gray-900 border-gray-800">
            {listsLoading ? (
              <DropdownMenuItem disabled className="text-gray-400">
                Loading lists...
              </DropdownMenuItem>
            ) : userLists.length === 0 ? (
              <DropdownMenuItem disabled className="text-gray-400">
                No lists yet
              </DropdownMenuItem>
            ) : (
              userLists.map((list) => (
                <DropdownMenuItem
                  key={list.id}
                  onClick={() => addToCustomList(list.id, list.title)}
                  className="text-white hover:bg-gray-800"
                >
                  {list.title}
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem
              onClick={() => window.location.href = '/lists/create'}
              className="text-purple-400 hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New List
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}