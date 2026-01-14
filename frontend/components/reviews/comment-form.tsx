// components/reviews/comment-form.tsx 

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { reviewCommentsAPI } from "@/lib/api/review-comments"
import { toast } from "sonner"

interface CommentFormProps {
  reviewId: string
  parentCommentId?: string | null
  existingComment?: {
    id: string
    content: string
  }
  onSuccess: () => void
  onCancel?: () => void
  compact?: boolean
  placeholder?: string
}

export function CommentForm({
  reviewId,
  parentCommentId = null,
  existingComment,
  onSuccess,
  onCancel,
  compact = false,
  placeholder = "Add a comment..."
}: CommentFormProps) {
  const [content, setContent] = useState(existingComment?.content || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast.error("Comment cannot be empty")
      return
    }

    if (content.length > 1000) {
      toast.error("Comment must be 1000 characters or less")
      return
    }

    setLoading(true)
    try {
      if (existingComment) {
        await reviewCommentsAPI.updateComment(existingComment.id, {
          content: content.trim()
        })
        toast.success("Comment updated")
      } else {
        await reviewCommentsAPI.createComment(reviewId, {
          content: content.trim(),
          parent_comment_id: parentCommentId
        })
        toast.success("Comment posted")
      }

      setContent("")
      onSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to post comment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-2" : "space-y-3"}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className={`bg-gray-800 border-gray-700 text-white resize-none ${
          compact ? "min-h-[60px]" : "min-h-20"
        }`}
        maxLength={1000}
      />
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {content.length}/1000 characters
        </span>
        
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={loading}
              className="border-gray-700"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={loading || !content.trim()}
            className="bg-linear-to-r from-purple-700 to-fuchsia-600"
          >
            {loading ? "Posting..." : existingComment ? "Update" : "Post"}
          </Button>
        </div>
      </div>
    </form>
  )
}