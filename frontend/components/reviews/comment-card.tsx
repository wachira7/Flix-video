// components/reviews/comment-card.tsx 

"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, Reply } from "lucide-react"
import { reviewCommentsAPI } from "@/lib/api/review-comments"
import { toast } from "sonner"
import { format } from "date-fns"
import { CommentForm } from "./comment-form"

interface Comment {
  id: string
  user_id: string
  username: string
  avatar_url?: string
  content: string
  created_at: string
  updated_at: string
  depth: number
  parent_comment_id?: string
}

interface CommentCardProps {
  comment: Comment
  currentUserId?: string
  onDelete?: () => void
  onCommentAdded?: () => void
}

export function CommentCard({ comment, currentUserId, onDelete, onCommentAdded }: CommentCardProps) {
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isReplying, setIsReplying] = useState(false)

  const isOwnComment = currentUserId === comment.user_id
  
  // SMART NESTING: Visual indent stops at 3, but can reply up to 10 levels
  const visualDepth = Math.min(comment.depth, 3)  // Visual indent caps at 3
  const canReply = comment.depth < 10  // But can reply up to 10 levels deep

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    setLoading(true)
    try {
      await reviewCommentsAPI.deleteComment(comment.id)
      toast.success("Comment deleted")
      onDelete?.()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete comment")
    } finally {
      setLoading(false)
    }
  }

  const handleEditSuccess = () => {
    setIsEditing(false)
    onCommentAdded?.()
  }

  const handleReplySuccess = () => {
    setIsReplying(false)
    onCommentAdded?.()
  }

  // Calculate left padding based on VISUAL depth (capped at 3)
  const paddingLeft = visualDepth * 40

  return (
    <div style={{ paddingLeft: `${paddingLeft}px` }}>
      <div className="flex items-start gap-3 py-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-linear-to-r from-purple-700 to-fuchsia-600 text-xs">
            {comment.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                {comment.username}
              </span>
              <span className="text-xs text-gray-500">
                {format(new Date(comment.created_at), "MMM d, yyyy")}
              </span>
              {/* ADD DEPTH INDICATOR for deep comments */}
              {comment.depth > 3 && (
                <span className="text-xs text-gray-600 italic">
                  (↳ Level {comment.depth})
                </span>
              )}
            </div>

            {isOwnComment && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                  className="h-7 px-2"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={loading}
                  className="h-7 px-2 text-red-500 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Content or Edit Form */}
          {isEditing ? (
            <CommentForm
              reviewId={comment.parent_comment_id || comment.id}
              existingComment={{
                id: comment.id,
                content: comment.content
              }}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditing(false)}
              compact
            />
          ) : (
            <>
              <p className="text-sm text-gray-300 mb-2">{comment.content}</p>
              
              {/* Reply Button - Now allows up to 10 levels */}
              {canReply && currentUserId && !isOwnComment && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsReplying(!isReplying)}
                  className="h-7 px-2 text-xs text-gray-400 hover:text-white"
                >
                  <Reply className="w-3 h-3 mr-1" />
                  Reply
                </Button>
              )}

              {/* Reply Form */}
              {isReplying && (
                <div className="mt-3">
                  <CommentForm
                    reviewId={comment.id}
                    parentCommentId={comment.id}
                    onSuccess={handleReplySuccess}
                    onCancel={() => setIsReplying(false)}
                    compact
                    placeholder={`Reply to ${comment.username}...`}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}