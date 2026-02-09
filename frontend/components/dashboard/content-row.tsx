// components/dashboard/content-row.tsx

"use client"

import { useRef, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { MediaCard } from "./media-card"
import type { Movie, TVShow } from "@/lib/api/tmdb"

interface ContentRowProps {
  title: string
  items: (Movie | TVShow)[]
}

export function ContentRow({ title, items }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({
      left: direction === "left" ? -800 : 800,
      behavior: "smooth"
    })
  }

  const checkScroll = () => {
    if (!scrollRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    
    setShowLeftArrow(scrollLeft > 20)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20)
  }

  // Auto-scroll
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      if (!scrollRef.current) return
      
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      const maxScroll = scrollWidth - clientWidth
      
      if (scrollLeft >= maxScroll - 20) {
        scrollRef.current.scrollTo({ left: 0, behavior: "smooth" })
      } else {
        scrollRef.current.scrollBy({ left: 800, behavior: "smooth" })
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [isPaused])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    setTimeout(checkScroll, 100)
    container.addEventListener('scroll', checkScroll)

    return () => container.removeEventListener('scroll', checkScroll)
  }, [items])

  if (!items || items.length === 0) return null

  return (
    <div 
      className="mb-10 relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      
      {/* Wrapper with max-width to force overflow */}
      <div className="relative" style={{ maxWidth: "100%" }}>
        
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-0 bottom-0 z-30 w-16 bg-linear-to-r from-black via-black/80 to-transparent hover:from-black/95 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ pointerEvents: "auto" }}
          >
            <ChevronLeft className="w-10 h-10 text-white drop-shadow-lg" />
          </button>
        )}

        {/* Scroll Container - CONSTRAINED WIDTH */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-scroll scrollbar-hide scroll-smooth group"
          style={{ 
            scrollbarWidth: "none", 
            msOverflowStyle: "none",
            width: "100%",
            maxWidth:"none"  
          }}
        >
          {items.map((item, index) => (
            <div 
              key={item.id} 
              className="shrink-0"
              style={{ width: "220px" }}
            >
              <MediaCard media={item} index={index} />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-0 bottom-0 z-30 w-16 bg-linear-to-l from-black via-black/80 to-transparent hover:from-black/95 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ pointerEvents: "auto" }}
          >
            <ChevronRight className="w-10 h-10 text-white drop-shadow-lg" />
          </button>
        )}
      </div>

    </div>
  )
}