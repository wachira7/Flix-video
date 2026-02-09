// frontend/components/ai/recommendation-card.tsx

"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, Play, Plus, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Recommendation } from "@/lib/api/recommendations"

interface RecommendationCardProps {
  recommendation: Recommendation
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const router = useRouter()
  const [posterPath, setPosterPath] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMovieDetails()
  }, [recommendation.tmdb_id])

  const fetchMovieDetails = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY
      const url = `https://api.themoviedb.org/3/${recommendation.content_type}/${recommendation.tmdb_id}?api_key=${apiKey}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.poster_path) {
        setPosterPath(`https://image.tmdb.org/t/p/w500${data.poster_path}`)
      }
    } catch (error) {
      console.error('Failed to fetch movie details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = () => {
    const path = recommendation.content_type === 'movie' 
      ? `/movie/${recommendation.tmdb_id}`
      : `/tv/${recommendation.tmdb_id}`
    router.push(path)
  }

  return (
    <Card className="group overflow-hidden bg-gray-900 border-gray-800 hover:border-purple-600 transition-all duration-300 hover:scale-105">
      {/* Poster */}
      <div className="relative aspect-2/3 overflow-hidden bg-gray-800">
        {loading ? (
          <Skeleton className="w-full h-full bg-gray-800" />
        ) : posterPath ? (
          <img
            src={posterPath}
            alt={recommendation.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <Play className="w-16 h-16 text-gray-600" />
          </div>
        )}

        {/* Confidence Badge */}
        <div className="absolute top-2 right-2">
          <Badge className="bg-linear-to-r from-purple-600 to-pink-600 text-white">
            <TrendingUp className="w-3 h-3 mr-1" />
            {recommendation.confidence}%
          </Badge>
        </div>

        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <div className="flex gap-2 w-full">
            <Button
              onClick={handleViewDetails}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              <Play className="w-4 h-4 mr-2" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <h3 className="text-white font-semibold mb-2 line-clamp-1">
          {recommendation.title}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {recommendation.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-purple-700 text-purple-300 text-xs"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* AI Reasoning */}
        <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">
          {recommendation.reason}
        </p>
      </div>
    </Card>
  )
}