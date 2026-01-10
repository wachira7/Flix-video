"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Star, Play, Calendar, TrendingUp } from "lucide-react"
import type { Movie, TVShow } from "@/lib/api/tmdb"
import { getTrendingMovies, getTrendingTV} from "@/app/actions/tmdb"
import { getImageUrl } from "@/lib/api/tmdb"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { motion } from "framer-motion"

export function TrendingSection() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [tvShows, setTVShows] = useState<TVShow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const [moviesResult, tvResult] = await Promise.all([getTrendingMovies(), getTrendingTV()])

        if (moviesResult.success) {
          setMovies((moviesResult.data as Movie[]).filter((m) => m.poster_path && m.poster_path.trim() !== ""))
        }
        if (tvResult.success) {
          setTVShows((tvResult.data as TVShow[]).filter((s) => s.poster_path && s.poster_path.trim() !== ""))
        }
      } catch (error) {
        console.error("Failed to fetch trending:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [])

  const MovieCard = ({ movie, index }: { movie: Movie; index: number }) => {
    const imageUrl = getImageUrl(movie.poster_path, "w500")
    if (!imageUrl) return null

    return (
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="group overflow-hidden hover:shadow-xl transition-all cursor-pointer">
              <div className="relative aspect-2/3 overflow-hidden">
                <Image
                  src={imageUrl || "/placeholder.svg"}
                  alt={movie.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" fill="white" />
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                  <span className="text-sm text-white font-semibold">{movie.vote_average.toFixed(1)}</span>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate">{movie.title}</h3>
                <p className="text-sm text-muted-foreground">{new Date(movie.release_date).getFullYear()}</p>
              </CardContent>
            </Card>
          </motion.div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-semibold">{movie.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-3">{movie.overview}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(movie.release_date).getFullYear()}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                {movie.vote_average.toFixed(1)}
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              Trending
            </Badge>
          </div>
        </HoverCardContent>
      </HoverCard>
    )
  }

  const TVShowCard = ({ show, index }: { show: TVShow; index: number }) => {
    return (
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="group overflow-hidden hover:shadow-xl transition-all cursor-pointer">
              <div className="relative aspect-2/3 overflow-hidden">
                <Image
                  src={getImageUrl(show.poster_path, "w500") || "/placeholder.svg"}
                  alt={show.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" fill="white" />
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                  <span className="text-sm text-white font-semibold">{show.vote_average.toFixed(1)}</span>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate">{show.name}</h3>
                <p className="text-sm text-muted-foreground">{new Date(show.first_air_date).getFullYear()}</p>
              </CardContent>
            </Card>
          </motion.div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-semibold">{show.name}</h4>
            <p className="text-sm text-muted-foreground line-clamp-3">{show.overview}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(show.first_air_date).getFullYear()}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                {show.vote_average.toFixed(1)}
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              Trending
            </Badge>
          </div>
        </HoverCardContent>
      </HoverCard>
    )
  }

  if (loading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Trending Now</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-2/3 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Trending Now in
            <span className="gradient-text"> Kenya</span>
          </h2>
          <p className="text-xl text-muted-foreground">See what everyone's watching this week</p>
        </motion.div>

        <Tabs defaultValue="movies" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="tv">TV Shows</TabsTrigger>
          </TabsList>

          <TabsContent value="movies">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {movies.map((movie, index) => (
                <MovieCard key={movie.id} movie={movie} index={index} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tv">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {tvShows.map((show, index) => (
                <TVShowCard key={show.id} show={show} index={index} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

export default TrendingSection