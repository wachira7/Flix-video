// components/reviews/comments-section.tsx 

"use client"

import { useState, useEffect } from "react"
import { reviewCommentsAPI } from "@/lib/api/review-comments"
import { CommentCard } from "./comment-card"
import { CommentForm } from "./comment-form"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageCircle } from "lucide-react"
import { getUser } from "@/lib/auth"

interface CommentsSectionProps {
  reviewId: string
}

export function CommentsSection({ reviewId }: CommentsSectionProps) {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const user = getUser()

  useEffect(() => {
    fetchComments()
  }, [reviewId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const response = await reviewCommentsAPI.getComments(reviewId)
      setComments(response.comments || [])
    } catch (error) {
      console.error("Fetch comments error:", error)
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 border-t border-gray-800 pt-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-4 h-4 text-gray-400" />
        <h4 className="text-sm font-semibold text-white">
          Comments ({comments.length})
        </h4>
      </div>

      {/* Comment Form */}
      {user && (
        <div className="mb-4">
          <CommentForm
            reviewId={reviewId}
            onSuccess={fetchComments}
            placeholder="Add a comment..."
          />
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-20 bg-gray-800" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-1">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              onDelete={fetchComments}
              onCommentAdded={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  )
}