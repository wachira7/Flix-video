// components/reviews/review-form.tsx
"use client"

import { useState } from "react"
import { reviewsAPI } from "@/lib/api/reviews"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Edit, Plus } from "lucide-react"

interface ReviewFormProps {
  contentType: "movie" | "tv"
  contentId: number
  existingReview?: {
    id: string
    title?: string
    content: string
    contains_spoilers: boolean
  }
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function ReviewForm({ contentType, contentId, existingReview, onSuccess, trigger }: ReviewFormProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(existingReview?.title || "")
  const [content, setContent] = useState(existingReview?.content || "")
  const [containsSpoilers, setContainsSpoilers] = useState(existingReview?.contains_spoilers || false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      toast.error("Review content is required")
      return
    }

    setLoading(true)
    try {
      const data = {
        title: title.trim() || undefined,
        content: content.trim(),
        contains_spoilers: containsSpoilers
      }

      if (existingReview) {
        await reviewsAPI.updateReview(existingReview.id, data)
        toast.success("Review updated successfully!")
      } else {
        await reviewsAPI.createReview(contentType, contentId, data)
        toast.success("Review posted successfully!")
      }

      setOpen(false)
      onSuccess()
      
      // Reset form if creating new review
      if (!existingReview) {
        setTitle("")
        setContent("")
        setContainsSpoilers(false)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to submit review")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-linear-to-r from-purple-700 to-fuchsia-600">
            {existingReview ? (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Edit Review
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Write Review
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">
            {existingReview ? "Edit Review" : "Write a Review"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title (Optional) */}
          <div>
            <Label htmlFor="title" className="text-gray-300">
              Title (Optional)
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum up your review in one line"
              className="bg-gray-800 border-gray-700 text-white mt-2"
              maxLength={255}
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content" className="text-gray-300">
              Review <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts about this movie/show..."
              className="bg-gray-800 border-gray-700 text-white mt-2 min-h-[200px]"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {content.length} characters
            </p>
          </div>

          {/* Spoiler Warning */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="spoilers"
              checked={containsSpoilers}
              onCheckedChange={(checked) => setContainsSpoilers(checked as boolean)}
              className="border-gray-700"
            />
            <Label
              htmlFor="spoilers"
              className="text-gray-300 cursor-pointer"
            >
              This review contains spoilers
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !content.trim()}
              className="bg-linear-to-r from-purple-700 to-fuchsia-600"
            >
              {loading ? "Submitting..." : existingReview ? "Update Review" : "Post Review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}