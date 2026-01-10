//frontend-web/components/landing/auto-scroll-carousel.tsx
"use client"

import { useEffect, useState, useRef } from "react"
import type { Movie } from "@/lib/api/tmdb"
import { getPopularMovies} from "@/app/actions/tmdb"
import { getImageUrl } from "@/lib/api/tmdb"
import Image from "next/image"
import { Star } from "lucide-react"
import { gsap } from "gsap"

export function AutoScrollCarousel() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const result = await getPopularMovies()
        if (result.success) {
          const validMovies = (result.data as Movie[]).filter(
            (m) => (m.backdrop_path && m.backdrop_path.trim() !== "") || (m.poster_path && m.poster_path.trim() !== ""),
          )
          setMovies([...validMovies, ...validMovies])
        }
      } catch (error) {
        console.error("Failed to fetch popular movies:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPopular()
  }, [])

  useEffect(() => {
    if (!loading && scrollRef.current && movies.length > 0) {
      const scrollElement = scrollRef.current
      const scrollWidth = scrollElement.scrollWidth / 2

      // GSAP infinite scroll animation
      gsap.to(scrollElement, {
        x: -scrollWidth,
        duration: 40,
        ease: "none",
        repeat: -1,
      })

      // Pause on hover
      scrollElement.addEventListener("mouseenter", () => {
        gsap.to(scrollElement, { timeScale: 0, duration: 0.5 })
      })

      scrollElement.addEventListener("mouseleave", () => {
        gsap.to(scrollElement, { timeScale: 1, duration: 0.5 })
      })
    }
  }, [loading, movies])

  if (loading) {
    return (
      <section className="py-12 overflow-hidden">
        <div className="flex gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-64 h-36 bg-muted rounded-lg shrink-0" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 overflow-hidden">
      <div className="container mx-auto px-4 mb-8">
        <h2 className="text-3xl md:text-4xl font-bold">
          Popular on <span className="gradient-text">FlixVideo</span>
        </h2>
      </div>

      <div className="relative">
        <div ref={scrollRef} className="flex gap-4 will-change-transform">
          {movies.map((movie, index) => {
            const imagePath = movie.backdrop_path || movie.poster_path

            return (
              <div
                key={`${movie.id}-${index}`}
                className="relative w-64 h-36 rounded-lg overflow-hidden shrink-0 group cursor-pointer"
              >
                <Image
                  src={getImageUrl(imagePath, "w500") || "/placeholder.svg"}
                  alt={movie.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-semibold text-white text-sm line-clamp-1">{movie.title}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-500" fill="currentColor" />
                    <span className="text-xs text-white/90">{movie.vote_average.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Gradient overlays for edge fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-linear-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-linear-to-l from-background to-transparent pointer-events-none" />
      </div>
    </section>
  )
}
