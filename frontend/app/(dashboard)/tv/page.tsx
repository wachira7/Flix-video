// app/(dashboard)/tv/page.tsx
"use client"

import { useState, useEffect } from "react"
import { tmdbClient } from "@/lib/api/tmdb"
import { MediaCard } from "@/components/dashboard/media-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, Tv } from "lucide-react"
import type { TVShow } from "@/lib/api/tmdb"

type SortOption = "popular" | "top_rated" | "on_the_air" | "airing_today"

export default function TVShowsPage() {
  const [shows, setShows] = useState<TVShow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>("popular")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchShows(1)
  }, [sortBy])

    const fetchShows = async (pageNum: number = 1) => {
    setLoading(true)
    try {
      let response
      switch (sortBy) {
        case "top_rated":
          response = await tmdbClient.getTopRated("tv", pageNum)
          break
        case "on_the_air":
          response = await tmdbClient.getOnTheAir(pageNum)
          break
        case "airing_today":
          response = await tmdbClient.getTrending("tv", "day", pageNum)
          break
        default:
          response = await tmdbClient.getPopular("tv", pageNum)
      }
      
      setShows(response.results as TVShow[])
      setTotalPages(Math.min(response.total_pages, 100)) // Limit to 100 pages
      setPage(pageNum)
    } catch (error) {
      console.error("Fetch TV shows error:", error)
      setShows([])
    } finally {
      setLoading(false)
    }
  }


  const handlePageChange = (newPage: number) => {
    fetchShows(newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case "popular":
        return "Popular TV Shows"
      case "top_rated":
        return "Top Rated TV Shows"
      case "on_the_air":
        return "Currently Airing"
      case "airing_today":
        return "Airing Today"
      default:
        return "TV Shows"
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Tv className="w-8 h-8 text-fuchsia-500" />
            <h1 className="text-4xl font-bold text-white">{getSortLabel(sortBy)}</h1>
          </div>
          <p className="text-gray-400">
            Explore trending series and binge-worthy shows
          </p>
        </div>
        
        <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
          <SelectTrigger className="w-full md:w-56 bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white">
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="top_rated">Top Rated</SelectItem>
            <SelectItem value="on_the_air">Currently Airing</SelectItem>
            <SelectItem value="airing_today">Airing Today</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TV Shows Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(24)].map((_, i) => (
            <Skeleton key={i} className="aspect-2/3 bg-gray-800 rounded-lg" />
          ))}
        </div>
      ) : shows.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {shows.map((show, index) => (
              <MediaCard key={show.id} media={show} index={index} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 mt-12">
            <Button
              variant="outline"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="border-gray-700 bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {(() => {
                // Calculate page window (5 pages centered on current page)
                let startPage = Math.max(1, page - 2)
                let endPage = Math.min(totalPages, startPage + 4)
                
                // Adjust if we're near the end
                if (endPage - startPage < 4) {
                  startPage = Math.max(1, endPage - 4)
                }
                
                const pages = []
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(i)
                }
                
                return pages.map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    onClick={() => handlePageChange(pageNum)}
                    className={
                      page === pageNum
                        ? "bg-linear-to-r from-purple-700 to-fuchsia-600"
                        : "border-gray-700 bg-gray-800 hover:bg-gray-700"
                    }
                  >
                    {pageNum}
                  </Button>
                ))
              })()}
            </div>

            <Button
              variant="outline"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="border-gray-700 bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Results Info */}
          <div className="text-center mt-6 text-gray-400">
            Showing page {page} of {totalPages}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Tv className="w-16 h-16 text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No TV shows found</p>
        </div>
      )}
    </div>
  )
}