//frontend-web/lib/api/tmdb.ts
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || ""
const TMDB_BASE_URL = "https://api.themoviedb.org/3"

export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string
  backdrop_path: string
  vote_average: number
  release_date: string
  genre_ids: number[]
}

export interface TVShow {
  id: number
  name: string
  overview: string
  poster_path: string
  backdrop_path: string
  vote_average: number
  first_air_date: string
  genre_ids: number[]
}


class TMDBClient {
  private async fetcher<T>(endpoint: string): Promise<T> {
    const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${TMDB_API_KEY}`

    console.log("[v0] TMDB API URL:", url.replace(TMDB_API_KEY || "", "***"))

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log("TMDB API error:", response.status, errorText)
      throw new Error(`TMDB API error: ${response.statusText}`)
    }

    return response.json()
  }

  async getTrending(mediaType: "movie" | "tv" = "movie", timeWindow: "day" | "week" = "week") {
    const data = await this.fetcher<{ results: Movie[] | TVShow[] }>(`/trending/${mediaType}/${timeWindow}`)
    return data.results
  }

  async getPopular(mediaType: "movie" | "tv" = "movie") {
    const data = await this.fetcher<{ results: Movie[] | TVShow[] }>(`/${mediaType}/popular`)
    return data.results
  }

  async getTopRated(mediaType: "movie" | "tv" = "movie") {
    const data = await this.fetcher<{ results: Movie[] | TVShow[] }>(`/${mediaType}/top_rated`)
    return data.results
  }
  async getUpcoming() {
    const data = await this.fetcher<{ results: Movie[] }>(`/movie/upcoming`)
    return data.results
  }

  async getOnTheAir() {
    const data = await this.fetcher<{ results: TVShow[] }>(`/tv/on_the_air`)
    return data.results
  }

}

export const tmdbClient = new TMDBClient()

// Standalone helper function for client components
export function getImageUrl(path: string | null | undefined, size: "w500" | "original" = "w500"): string {
  if (!path || path.trim() === "") return "/placeholder.svg"
  return `https://image.tmdb.org/t/p/${size}${path}`
}
