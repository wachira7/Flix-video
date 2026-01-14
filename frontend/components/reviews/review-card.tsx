// components/reviews/review-card.tsx 
"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThumbsUp, AlertTriangle, Trash2, Edit, MessageCircle } from "lucide-react"
import { reviewsAPI } from "@/lib/api/reviews"
import { toast } from "sonner"
import { format } from "date-fns"
import { CommentsSection } from "./comments-section"

interface Review {
  id: string
  user_id: string
  title?: string
  content: string
  contains_spoilers: boolean
  likes_count: number
  created_at: string
  updated_at: string
}

interface ReviewCardProps {
  review: Review
  currentUserId?: string
  onDelete?: () => void
  onEdit?: () => void
}

export function ReviewCard({ review, currentUserId, onDelete, onEdit }: ReviewCardProps) {
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(review.likes_count)
  const [showSpoiler, setShowSpoiler] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const isOwnReview = currentUserId === review.user_id

  const handleLike = async () => {
    setLoading(true)
    try {
      await reviewsAPI.toggleLike(review.id)
      setLiked(!liked)
      setLikesCount(liked ? likesCount - 1 : likesCount + 1)
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to like review")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this review?")) return
    
    setLoading(true)
    try {
      await reviewsAPI.deleteReview(review.id)
      toast.success("Review deleted")
      onDelete?.()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete review")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <div className="flex items-start gap-4">
        <Avatar>
          <AvatarFallback className="bg-linear-to-r from-purple-700 to-fuchsia-600">
            {review.user_id.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              {review.title && (
                <h4 className="text-lg font-semibold text-white mb-1">{review.title}</h4>
              )}
              <p className="text-sm text-gray-400">
                {format(new Date(review.created_at), "MMM d, yyyy")}
              </p>
            </div>
            
            {isOwnReview && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onEdit}
                  disabled={loading}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-red-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Spoiler Warning */}
          {review.contains_spoilers && !showSpoiler ? (
            <div className="bg-yellow-900/20 border border-yellow-700 rounded p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span className="text-yellow-500 font-semibold">Contains Spoilers</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSpoiler(true)}
                className="border-yellow-700 text-yellow-500 hover:bg-yellow-900/30"
              >
                Show Review
              </Button>
            </div>
          ) : (
            <p className="text-gray-300 whitespace-pre-wrap mb-4">{review.content}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLike}
              disabled={loading || isOwnReview}
              className={liked ? "text-purple-500" : "text-gray-400"}
            >
              <ThumbsUp className="w-4 h-4 mr-2" fill={liked ? "currentColor" : "none"} />
              {likesCount}
            </Button>

            {/* Comment Toggle Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowComments(!showComments)}
              className="text-gray-400 hover:text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Comments
            </Button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <CommentsSection reviewId={review.id} />
          )}
        </div>
      </div>
    </Card>
  )
}