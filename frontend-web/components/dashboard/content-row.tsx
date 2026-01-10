// components/dashboard/content-row.tsx
"use client"

import { useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MediaCard } from "./media-card"
import type { Movie, TVShow } from "@/lib/api/tmdb"

interface ContentRowProps {
  title: string
  items: (Movie | TVShow)[]
}

export function ContentRow({ title, items }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -700 : 700
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  // Auto-scroll every 12 seconds
  useEffect(() => {
    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        if (scrollRef.current) {
          const container = scrollRef.current
          const maxScroll = container.scrollWidth - container.clientWidth
          
          // If reached end, scroll back to start
          if (container.scrollLeft >= maxScroll - 10) {
            container.scrollTo({ left: 0, behavior: "smooth" })
          } else {
            container.scrollBy({ left: 800, behavior: "smooth" })
          }
        }
      }, 12000) // Every 12 seconds
    }

    startAutoScroll()

    // Pause auto-scroll on hover
    const container = scrollRef.current
    if (container) {
      container.addEventListener('mouseenter', () => {
        if (autoScrollRef.current) {
          clearInterval(autoScrollRef.current)
        }
      })
      
      container.addEventListener('mouseleave', () => {
        startAutoScroll()
      })
    }

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current)
      }
    }
  }, [])

  if (items.length === 0) return null

  return (
    <div className="mb-10 group">
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      
      <div className="relative">
        {/* Left Arrow */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full bg-black/50 hover:bg-black/80 rounded-none opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </Button>

        {/* Content Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item, index) => (
            <div key={item.id} className="min-w-[200px] max-w-[200px]">
              <MediaCard media={item} index={index} />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full bg-black/50 hover:bg-black/80 rounded-none opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </Button>
      </div>
    </div>
  )
}