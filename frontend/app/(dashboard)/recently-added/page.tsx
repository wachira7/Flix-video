// app/(dashboard)/recently-added/page.tsx
"use client"

import { useState, useEffect } from "react"
import { tmdbClient } from "@/lib/api/tmdb"
import { MediaCard } from "@/components/dashboard/media-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock } from "lucide-react"
import type { Movie, TVShow } from "@/lib/api/tmdb"

export default function RecentlyAddedPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [tvShows, setTVShows] = useState<TVShow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    setLoading(true)
    try {
      const [moviesRes, tvRes] = await Promise.all([
        tmdbClient.getTrending("movie", "day"),
        tmdbClient.getTrending("tv", "day")
      ])
      setMovies(moviesRes.results as Movie[])
      setTVShows(tvRes.results as TVShow[])
    } catch (error) {
      console.error("Fetch recently added error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="flex items-center gap-3 mb-8">
        <Clock className="w-8 h-8 text-green-500" />
        <div>
          <h1 className="text-4xl font-bold text-white">Recently Added</h1>
          <p className="text-gray-400">Fresh content added today</p>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-gray-800 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="movies">Movies</TabsTrigger>
          <TabsTrigger value="tv">TV Shows</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[...Array(24)].map((_, i) => (
                <Skeleton key={i} className="aspect-2/3 bg-gray-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-4">Recently Added Movies</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
                {movies.map((movie, index) => (
                  <MediaCard key={movie.id} media={movie} index={index} />
                ))}
              </div>

              <h2 className="text-2xl font-bold text-white mb-4">Recently Added TV Shows</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {tvShows.map((show, index) => (
                  <MediaCard key={show.id} media={show} index={index} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="movies">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[...Array(20)].map((_, i) => (
                <Skeleton key={i} className="aspect-2/3 bg-gray-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {movies.map((movie, index) => (
                <MediaCard key={movie.id} media={movie} index={index} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tv">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[...Array(20)].map((_, i) => (
                <Skeleton key={i} className="aspect-2/3 bg-gray-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {tvShows.map((show, index) => (
                <MediaCard key={show.id} media={show} index={index} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}