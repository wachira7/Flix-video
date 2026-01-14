// components/ratings/rating-section.tsx 

"use client"

import { useState, useEffect } from "react"
import { StarRating } from "./star-rating"
import { ratingsAPI } from "@/lib/api/ratings"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { parse } from "path"

interface RatingSectionProps {
  contentType: "movie" | "tv"
  contentId: number
  title: string
}

export function RatingSection({ contentType, contentId, title }: RatingSectionProps) {
  const [userRating, setUserRating] = useState<number | null>(null)
  const [tempRating, setTempRating] = useState(5.0)  // Default middle value
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUserRating()
  }, [contentType, contentId])

  const fetchUserRating = async () => {
    try {
      const response = await ratingsAPI.getUserRating(contentType, contentId)
      if (response.rating) {
        const ratingValue = parseFloat(response.rating.rating)
        setUserRating(ratingValue)
        setTempRating(ratingValue)
      }
    } catch (error) {
      // User hasn't rated yet
    }
  }

  const handleRatingChange = (rating: number) => {
    setTempRating(rating)
  }

  const handleSubmit = async () => {
    if (tempRating < 1.0) {
      toast.error("Rating must be at least 1.0")
      return
    }
    
    setLoading(true)
    try {
      await ratingsAPI.rateContent(contentType, contentId, tempRating)
      setUserRating(tempRating)
      toast.success(`Rated ${title} ${tempRating}/10!`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to submit rating")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await ratingsAPI.deleteRating(contentType, contentId)
      setUserRating(null)
      setTempRating(5.0)
      toast.success("Rating removed")
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete rating")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <h3 className="text-xl font-bold text-white mb-4">
        Rate This {contentType === "movie" ? "Movie" : "Show"}
      </h3>
      
      <div className="mb-6">
        <StarRating
          rating={tempRating}
          onRatingChange={handleRatingChange}
          size="lg"
          showValue
        />
      </div>

      <div className="flex items-center gap-3">
        {userRating ? (
          <>
            <Button
              onClick={handleSubmit}
              disabled={loading || tempRating === userRating}
              className="bg-linear-to-r from-purple-700 to-fuchsia-600"
            >
              Update Rating
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={loading}
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || tempRating < 1.0}
            className="bg-linear-to-r from-purple-700 to-fuchsia-600"
          >
            Submit Rating
          </Button>
        )}
      </div>

      {userRating && (
        <p className="text-sm text-gray-400 mt-3">
          You rated this {userRating.toFixed(1)}/10
        </p>
      )}
    </Card>
  )
}