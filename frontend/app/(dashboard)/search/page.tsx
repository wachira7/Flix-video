// app/(dashboard)/search/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { searchAPI } from "@/lib/api/search"
import { MediaCard } from "@/components/dashboard/media-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [yearFilter, setYearFilter] = useState<string>("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery)
    }
  }, [initialQuery])

  const handleSearch = async (searchQuery: string, tabType = activeTab, pageNum = 1) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      let response
      let filters: any = {}
      
      if (yearFilter) {
        if (tabType === "tv") {
          filters = { first_air_date_year: parseInt(yearFilter) }
        } else if (tabType === "movies") {
          filters = { year: parseInt(yearFilter) }
        }
      }

      switch (tabType) {
        case "movies":
          response = await searchAPI.searchMovies(searchQuery, pageNum, filters)
          break
        case "tv":
          response = await searchAPI.searchTV(searchQuery, pageNum, filters)
          break
        case "people":
          response = await searchAPI.searchPeople(searchQuery, pageNum)
          break
        default:
          response = await searchAPI.searchMulti(searchQuery, pageNum)
      }

      setResults(response.results || [])
      setTotalPages(response.total_pages || 1)
      setPage(pageNum)
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
      handleSearch(query, activeTab, 1)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (query) {
      handleSearch(query, value, 1)
    }
  }

  const handlePageChange = (newPage: number) => {
    handleSearch(query, activeTab, newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">Search</h1>
          
          <form onSubmit={handleSubmit} className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search movies, TV shows, people..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <Button type="submit" className="bg-linear-to-r from-purple-700 to-fuchsia-600">
              Search
            </Button>
          </form>

          {/* Filters */}
          {(activeTab === "movies" || activeTab === "tv") && (
            <div className="flex gap-4">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by year" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="">All Years</SelectItem>
                  {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {yearFilter && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setYearFilter("")
                    handleSearch(query, activeTab, 1)
                  }}
                  className="border-gray-700"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-gray-800">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="tv">TV Shows</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <Skeleton key={i} className="aspect-2/3 bg-gray-800" />
                ))}
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {results.map((item, index) => (
                    <MediaCard key={item.id} media={item} index={index} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="border-gray-700"
                    >
                      Previous
                    </Button>
                    <span className="text-white">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="border-gray-700"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : query ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No results found for "{query}"</p>
                <p className="text-gray-500 text-sm mt-2">Try different keywords</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Start typing to search</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}