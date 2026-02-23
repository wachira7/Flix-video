// components/reviews/reviews-section.tsx
"use client"

import { useState, useEffect } from "react"
import { reviewsAPI } from "@/lib/api/reviews"
import { ReviewCard } from "./review-card"
import { ReviewForm } from "./review-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare } from "lucide-react"
import { getUser } from "@/lib/auth"

interface ReviewsSectionProps {
  contentType: "movie" | "tv"
  contentId: number
  title: string
}

export function ReviewsSection({ contentType, contentId, title }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_liked">("newest")
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    setUser(getUser())
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchReviews()
    }
  }, [contentType, contentId, sortBy, mounted])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const response = await reviewsAPI.getReviews(contentType, contentId)
      let reviewsList = response.reviews || []

      switch (sortBy) {
        case "newest":
          reviewsList.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          break
        case "oldest":
          reviewsList.sort((a: any, b: any) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
          break
        case "most_liked":
          reviewsList.sort((a: any, b: any) => b.likes_count - a.likes_count)
          break
      }

      setReviews(reviewsList)
    } catch (error) {
      console.error("Fetch reviews error:", error)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  const userReview = reviews.find((r) => r.user_id === user?.id)
  const otherReviews = reviews.filter((r) => r.user_id !== user?.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-purple-500" />
          <h2 className="text-3xl font-bold text-white">
            Reviews ({reviews.length})
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="most_liked">Most Liked</SelectItem>
            </SelectContent>
          </Select>

          {/* Write Review Button */}
          {mounted && user && !userReview && (
            <ReviewForm
              contentType={contentType}
              contentId={contentId}
              onSuccess={fetchReviews}
            />
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 bg-gray-800 rounded-lg" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
          <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No reviews yet</h3>
          <p className="text-gray-400 mb-6">Be the first to review {title}!</p>
          {mounted && user && (
            <ReviewForm
              contentType={contentType}
              contentId={contentId}
              onSuccess={fetchReviews}
            />
          )}
        </div>
      ) : (
        /* Reviews List */
        <div className="space-y-4">
          {/* User's Own Review (if exists) */}
          {userReview && (
            <div className="border-2 border-purple-700 rounded-lg">
              <ReviewCard
                review={userReview}
                currentUserId={user?.id}
                onDelete={fetchReviews}
                onEdit={() => {}}
              />
            </div>
          )}

          {/* Other Reviews */}
          {otherReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={user?.id}
              onDelete={fetchReviews}
            />
          ))}
        </div>
      )}
    </div>
  )
}