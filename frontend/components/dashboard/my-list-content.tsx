// components/dashboard/my-list-content.tsx - Complete rewrite:

"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { getToken } from "@/lib/auth"
import { tmdbClient } from "@/lib/api/tmdb"
import { MediaCard } from "./media-card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import type { Movie, TVShow } from "@/lib/api/tmdb"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface MyListContentProps {
  type: "favorites" | "watchlist"
}

interface ListItem {
  content_id: number
  content_type: string
  added_at: string
}

export function MyListContent({ type }: MyListContentProps) {
  const [items, setItems] = useState<(Movie | TVShow)[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
  }, [type])

  const fetchItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = getToken()
      const endpoint = type === "favorites" ? "/api/favorites" : "/api/watchlist"
      
      // Get list from backend
      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const listItems: ListItem[] = response.data[type]

      if (listItems.length === 0) {
        setItems([])
        setLoading(false)
        return
      }

      // Fetch full TMDB data for each item
      const fullDataPromises = listItems.map(async (item) => {
        try {
          if (item.content_type === "tv_show" || item.content_type === "tv") {
            const data = await tmdbClient.getTVDetails(item.content_id)
            return data
          } else {
            const data = await tmdbClient.getMovieDetails(item.content_id)
            return data
          }
        } catch (error) {
          console.error(`Failed to fetch details for ${item.content_type} ${item.content_id}:`, error)
          return null
        }
      })

      const fullData = await Promise.all(fullDataPromises)
      
      // Filter out any null results (failed fetches)
      const validItems = fullData.filter((item) => item !== null) as (Movie | TVShow)[]

      
      setItems(validItems)
    } catch (err: any) {
      console.error(`Fetch ${type} error:`, err)
      setError(err.response?.data?.error || `Failed to load ${type}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="aspect-2/3 bg-gray-800 rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-white text-lg">{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-400 text-lg mb-2">
          Your {type} is empty
        </p>
        <p className="text-gray-500 text-sm">
          Browse content and add items to your {type}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map((item, index) => (
        <MediaCard 
          key={item.id} 
          media={item} 
          index={index} 
        />
      ))}
    </div>
  )
}