// components/ratings/star-rating.tsx 

"use client"

import { Star } from "lucide-react"
import { Slider } from "@/components/ui/slider"

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: "sm" | "md" | "lg"
  showValue?: boolean
}

export function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = "md",
  showValue = true 
}: StarRatingProps) {
  const getRatingColor = (val: number) => {
    if (val >= 8) return "text-green-500"
    if (val >= 6) return "text-yellow-500"
    if (val >= 4) return "text-orange-500"
    return "text-red-500"
  }

  const getRatingLabel = (val: number) => {
    if (val >= 9) return "Masterpiece"
    if (val >= 8) return "Excellent"
    if (val >= 7) return "Very Good"
    if (val >= 6) return "Good"
    if (val >= 5) return "Average"
    if (val >= 4) return "Below Average"
    if (val >= 3) return "Poor"
    return "Terrible"
  }

  const sizeClasses = {
    sm: { star: "w-3 h-3", text: "text-lg" },
    md: { star: "w-4 h-4", text: "text-2xl" },
    lg: { star: "w-5 h-5", text: "text-3xl" }
  }

  // If readonly, just show the rating display
  if (readonly || !onRatingChange) {
    return (
      <div className="flex items-center gap-2">
        <Star className={`${sizeClasses[size].star} text-yellow-500 fill-yellow-500`} />
        {showValue && (
          <span className={`${sizeClasses[size].text} font-bold text-white`}>
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    )
  }

  // Interactive rating input
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <span className="text-gray-400">Your Rating</span>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getRatingColor(rating)}`}>
            {rating.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">{getRatingLabel(rating)}</div>
        </div>
      </div>
      
      <Slider
        value={[rating]}
        onValueChange={(val) => onRatingChange(val[0])}
        min={0}
        max={10}
        step={0.5}
        className="w-full"
      />
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>0.0</span>
        <span>5.0</span>
        <span>10.0</span>
      </div>
    </div>
  )
}