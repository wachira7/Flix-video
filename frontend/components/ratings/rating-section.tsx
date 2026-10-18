// components/ratings/rating-section.tsx
// Rate 1–10 by tapping a segment. Saves immediately; hover previews the label.
"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { ratingsAPI } from "@/lib/api/ratings"
import { cn } from "@/lib/utils"

interface RatingSectionProps {
  contentType: "movie" | "tv"
  contentId: number
  title: string
}

const LABELS = ["", "Awful", "Very bad", "Bad", "Poor", "Okay", "Decent", "Good", "Great", "Excellent", "Masterpiece"]

export function RatingSection({ contentType, contentId, title }: RatingSectionProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    ratingsAPI
      .getUserRating(contentType, contentId)
      .then((r) => {
        const value = r.rating ? Math.round(parseFloat(r.rating.rating)) : null
        if (alive) setRating(value && value > 0 ? value : null)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [contentType, contentId])

  const save = async (value: number) => {
    const previous = rating
    setRating(value)
    setSaving(true)
    try {
      await ratingsAPI.rateContent(contentType, contentId, value)
      toast.success(`You rated ${title} ${value}/10`)
    } catch (error) {
      setRating(previous)
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(message || "Couldn't save your rating. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const clear = async () => {
    const previous = rating
    setRating(null)
    try {
      await ratingsAPI.deleteRating(contentType, contentId)
      toast("Rating removed")
    } catch {
      setRating(previous)
      toast.error("Couldn't remove your rating.")
    }
  }

  const shown = hover ?? rating

  return (
    <section aria-labelledby="rating-heading" className="rounded-2xl border bg-card/60 p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your take</p>
          <h2 id="rating-heading" className="mt-2 text-3xl">
            Rate {contentType === "movie" ? "this film" : "this series"}
          </h2>
        </div>
        <div className="flex h-10 items-center gap-3" aria-live="polite">
          {saving && <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label="Saving" />}
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={shown ?? "none"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="text-right"
            >
              {shown ? (
                <>
                  <span className="font-display text-4xl leading-none text-primary tabular-nums">{shown}</span>
                  <span className="text-sm text-muted-foreground">/10 · {LABELS[shown]}</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Not rated yet</span>
              )}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label={`Rate ${title} from 1 to 10`}
        className="mt-6 grid grid-cols-10 gap-1.5"
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const filled = shown !== null && n <= shown
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} out of 10, ${LABELS[n]}`}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(null)}
              onClick={() => save(n)}
              disabled={saving}
              className="group relative h-12 overflow-hidden rounded-md bg-muted transition-transform duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-wait sm:h-14"
            >
              <motion.span
                className={cn("absolute inset-0", hover !== null ? "bg-primary/80" : "bg-primary")}
                initial={false}
                animate={{ scaleY: filled ? 1 : 0 }}
                transition={{ duration: 0.22, delay: hover === null ? (n - 1) * 0.02 : 0 }}
                style={{ originY: 1 }}
              />
              <span
                className={cn(
                  "relative text-xs font-semibold tabular-nums transition-colors",
                  filled ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {n}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Your ratings shape your recommendations.</span>
        {rating && (
          <button type="button" onClick={clear} className="inline-flex items-center gap-1 hover:text-foreground">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear rating
          </button>
        )}
      </div>
    </section>
  )
}
