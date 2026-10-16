// components/landing/landing-types.ts
// Shared shapes and the TMDB image helper. No imports, so client components
// can use it without pulling the TMDB API client into the browser bundle.

export interface LandingTitle {
  id: number
  title: string
  year: string
  rating: number
  overview: string
  poster: string | null
  backdrop: string | null
  href: string
}

export interface AIPick extends LandingTitle {
  runtime: string
  reason: string
}

export interface LandingData {
  feature: LandingTitle | null
  slides: LandingTitle[]
  topMovies: LandingTitle[]
  topTV: LandingTitle[]
  picks: AIPick[]
}

export function tmdbImage(path: string | null, size: "w342" | "w500" | "w780" | "w1280" = "w500") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null
}
