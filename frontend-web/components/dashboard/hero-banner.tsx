// components/dashboard/hero-banner.tsx
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Info, Volume2, VolumeX, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Movie, TVShow } from "@/lib/api/tmdb"
import { getImageUrl } from "@/lib/api/tmdb"

interface HeroBannerProps {
  movies: (Movie | TVShow)[]  // accept both types
}

export function HeroBanner({ movies }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  const item = movies[currentIndex]
  const imageUrl = getImageUrl(item.backdrop_path, "original")

  // Helper functions to handle both Movie and TVShow types
  const getTitle = (item: Movie | TVShow) => {
    return 'title' in item ? item.title : item.name
  }

  const getReleaseYear = (item: Movie | TVShow) => {
    const date = 'release_date' in item ? item.release_date : item.first_air_date
    return date ? new Date(date).getFullYear() : 'N/A'
  }

  // Auto-rotate every 6.0 seconds
  useEffect(() => {
    if (isPaused || movies.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length)
    }, 6000) // 6.0 seconds

    return () => clearInterval(interval)
  }, [isPaused, movies.length])

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length)
  }

  return (
    <div 
      className="relative h-[70vh] w-full mb-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={getTitle(item)}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-r from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`content-${currentIndex}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
          className="relative h-full flex flex-col justify-end p-12 max-w-2xl"
        >
          <h1 className="text-5xl font-bold text-white mb-4">{getTitle(item)}</h1>
          
          <div className="flex items-center gap-4 mb-4 text-white">
            <span className="text-green-500 font-semibold text-lg">
              {Math.round(item.vote_average * 10)}% Match
            </span>
            <span className="text-gray-300">
              {getReleaseYear(item)}
            </span>
            <span className="px-2 py-1 border border-gray-400 text-sm">HD</span>
          </div>

          <p className="text-gray-300 text-lg mb-6 line-clamp-3">
            {item.overview}
          </p>

          <div className="flex items-center gap-4">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-200 font-semibold"
            >
              <Play className="w-6 h-6 mr-2" fill="currentColor" />
              Play
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-400 bg-gray-800/80 hover:bg-gray-700 text-white font-semibold"
            >
              <Info className="w-6 h-6 mr-2" />
              More Info
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {movies.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/80 rounded-full w-12 h-12"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/80 rounded-full w-12 h-12"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </Button>
        </>
      )}

      {/* Pagination Dots */}
      {movies.length > 1 && (
        <div className="absolute bottom-24 left-12 z-20 flex gap-2">
          {movies.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white w-8' 
                  : 'bg-gray-500 hover:bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}

      {/* Mute Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMuted(!muted)}
        className="absolute bottom-12 right-12 z-20 bg-gray-800/80 hover:bg-gray-700 rounded-full"
      >
        {muted ? (
          <VolumeX className="w-6 h-6 text-white" />
        ) : (
          <Volume2 className="w-6 h-6 text-white" />
        )}
      </Button>
    </div>
  )
}