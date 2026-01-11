// components/dashboard/media-card.tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Play, Plus, ThumbsUp, Info } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Movie, TVShow } from "@/lib/api/tmdb"
import { getImageUrl } from "@/lib/api/tmdb"
import Link from "next/link"

interface MediaCardProps {
  media: Movie | TVShow
  index: number
}

export function MediaCard({ media, index }: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const title = 'title' in media ? media.title : media.name
  const releaseDate = 'release_date' in media ? media.release_date : media.first_air_date
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'
  const imageUrl = getImageUrl(media.poster_path || media.backdrop_path, "w500")

   // Determine if it's a movie or TV show
  const mediaType = 'title' in media ? 'movie' : 'tv'
  const detailUrl = `/${mediaType}/${media.id}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
     <Link href={detailUrl}>  
      <Card className="overflow-hidden bg-gray-900 border-gray-800 cursor-pointer">
        <div className="relative aspect-2/3">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
          
          {/* Overlay on hover */}
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent flex flex-col justify-end p-4"
            >
              <h3 className="text-white font-semibold mb-2 line-clamp-2">{title}</h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-500 font-semibold">
                  {Math.round(media.vote_average * 10)}% Match
                </span>
                <span className="text-gray-400 text-sm">{year}</span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-gray-200 flex-1"
                >
                  <Play className="w-4 h-4 mr-1" fill="currentColor" />
                  Play
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-600 bg-gray-800/80 hover:bg-gray-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-600 bg-gray-800/80 hover:bg-gray-700"
                >
                  <Info className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Rating Badge */}
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1">
            <span className="text-yellow-500 font-semibold text-sm">
              ⭐ {media.vote_average.toFixed(1)}
            </span>
          </div>
        </div>
      </Card>
      </Link>
    </motion.div>
  )
}