"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import type { TVShow } from "@/lib/api/tmdb"
import { getTopRatedTV } from "@/app/actions/tmdb"
import { getImageUrl } from "@/lib/api/tmdb"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { motion } from "framer-motion"

export function Top10Section() {
  const [shows, setShows] = useState<TVShow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const result = await getTopRatedTV()
        if (result.success) {
          setShows(
            (result.data as TVShow[]).filter(
              (s) =>
                (s.backdrop_path && s.backdrop_path.trim() !== "") || (s.poster_path && s.poster_path.trim() !== ""),
            ),
          )
        }
      } catch (error) {
        console.error("Failed to fetch top shows:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTop()
  }, [])

  if (loading) {
    return (
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Top 10 Shows
              <span className="gradient-text"> This Week</span>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {shows.slice(0, 10).map((show, index) => {
              const imagePath = show.backdrop_path || show.poster_path

              return (
                <motion.div
                  key={show.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-4 p-4 bg-background rounded-lg border-2 hover:border-primary/50 transition-all cursor-pointer group"
                >
                  {/* Rank */}
                  <div className="w-12 h-12 flex items-center justify-center bg-linear-to-br from-purple-600 to-pink-600 rounded-lg shrink-0">
                    <span className="text-2xl font-bold text-white">{index + 1}</span>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-20 h-12 rounded overflow-hidden shrink-0">
                    <Image
                      src={getImageUrl(imagePath, "w500") || "/placeholder.svg"}
                      alt={show.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{show.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ⭐ {show.vote_average.toFixed(1)} • {new Date(show.first_air_date).getFullYear()}
                    </p>
                  </div>

                  {/* Badge */}
                  <Badge variant="secondary">Trending</Badge>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
