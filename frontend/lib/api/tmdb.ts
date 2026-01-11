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

   async getTrending(mediaType: "movie" | "tv" = "movie", timeWindow: "day" | "week" = "week", page: number = 1) {
    const data = await this.fetcher<{ results: Movie[] | TVShow[]; total_pages: number; page: number }>(
      `/trending/${mediaType}/${timeWindow}?page=${page}`
    )
    return data
  }

  async getPopular(mediaType: "movie" | "tv" = "movie", page: number = 1) {
    const data = await this.fetcher<{ results: Movie[] | TVShow[]; total_pages: number; page: number }>(
      `/${mediaType}/popular?page=${page}`
    )
    return data
  }

  async getTopRated(mediaType: "movie" | "tv" = "movie", page: number = 1) {
    const data = await this.fetcher<{ results: Movie[] | TVShow[]; total_pages: number; page: number }>(
      `/${mediaType}/top_rated?page=${page}`
    )
    return data
  }

  async getUpcoming(page: number = 1) {
    const data = await this.fetcher<{ results: Movie[]; total_pages: number; page: number }>(
      `/movie/upcoming?page=${page}`
    )
    return data
  }

  async getOnTheAir(page: number = 1) {
    const data = await this.fetcher<{ results: TVShow[]; total_pages: number; page: number }>(
      `/tv/on_the_air?page=${page}`
    )
    return data
  }
  async getMovieDetails(movieId: number) {
    const data = await this.fetcher<Movie & {
      runtime: number
      genres: { id: number; name: string }[]
      production_companies: { id: number; name: string; logo_path: string }[]
      spoken_languages: { english_name: string }[]
      tagline: string
      budget: number
      revenue: number
    }>(`/movie/${movieId}`)
    return data
  }

  async getTVDetails(tvId: number) {
    const data = await this.fetcher<TVShow & {
      episode_run_time: number[]
      genres: { id: number; name: string }[]
      number_of_seasons: number
      number_of_episodes: number
      production_companies: { id: number; name: string; logo_path: string }[]
      spoken_languages: { english_name: string }[]
      tagline: string
      created_by: { id: number; name: string }[]
    }>(`/tv/${tvId}`)
    return data
  }

  async getMovieCredits(movieId: number) {
    const data = await this.fetcher<{
      cast: Array<{
        id: number
        name: string
        character: string
        profile_path: string | null
        order: number
      }>
      crew: Array<{
        id: number
        name: string
        job: string
        profile_path: string | null
      }>
    }>(`/movie/${movieId}/credits`)
    return data
  }

  async getTVCredits(tvId: number) {
    const data = await this.fetcher<{
      cast: Array<{
        id: number
        name: string
        character: string
        profile_path: string | null
        order: number
      }>
    }>(`/tv/${tvId}/credits`)
    return data
  }

  async getMovieVideos(movieId: number) {
    const data = await this.fetcher<{
      results: Array<{
        id: string
        key: string
        name: string
        site: string
        type: string
        official: boolean
      }>
    }>(`/movie/${movieId}/videos`)
    return data.results
  }

  async getTVVideos(tvId: number) {
    const data = await this.fetcher<{
      results: Array<{
        id: string
        key: string
        name: string
        site: string
        type: string
        official: boolean
      }>
    }>(`/tv/${tvId}/videos`)
    return data.results
  }

  async getSimilarMovies(movieId: number) {
    const data = await this.fetcher<{ results: Movie[] }>(`/movie/${movieId}/similar`)
    return data.results
  }

  async getSimilarTV(tvId: number) {
    const data = await this.fetcher<{ results: TVShow[] }>(`/tv/${tvId}/similar`)
    return data.results
  }
}

export const tmdbClient = new TMDBClient()

// Standalone helper function for client components
export function getImageUrl(path: string | null | undefined, size: "w500" | "original" = "w500"): string {
  if (!path || path.trim() === "") return "/placeholder.svg"
  return `https://image.tmdb.org/t/p/${size}${path}`
}
