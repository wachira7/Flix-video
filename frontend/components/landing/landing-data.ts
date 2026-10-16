// components/landing/landing-data.ts
// Server-side data for the landing page. Every fetch fails soft so the page
// still renders (with artwork-free fallbacks) when TMDB is unreachable.
// Only import this from server components.
import { tmdbClient, type Movie, type TVShow } from "@/lib/api/tmdb"

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

const year = (date?: string) => (date ? date.slice(0, 4) : "")

function fromMovie(m: Movie): LandingTitle {
  return {
    id: m.id,
    title: m.title,
    year: year(m.release_date),
    rating: m.vote_average,
    overview: m.overview,
    poster: m.poster_path || null,
    backdrop: m.backdrop_path || null,
    href: `/movie/${m.id}`,
  }
}

function fromTV(s: TVShow): LandingTitle {
  return {
    id: s.id,
    title: s.name,
    year: year(s.first_air_date),
    rating: s.vote_average,
    overview: s.overview,
    poster: s.poster_path || null,
    backdrop: s.backdrop_path || null,
    href: `/tv/${s.id}`,
  }
}

// The worked example in the "Ask FlixVideo" section.
// Prompt: a smart sci-fi film under two hours with a hopeful ending.
const AI_EXAMPLES = [
  {
    id: 329865,
    title: "Arrival",
    year: "2016",
    runtime: "1h 56m",
    reason: "A first-contact story told through language, not lasers. Bittersweet, but it ends on hope.",
  },
  {
    id: 782,
    title: "Gattaca",
    year: "1997",
    runtime: "1h 46m",
    reason: "Sharp ideas about genetic destiny, carried by one man who refuses the future he was assigned.",
  },
  {
    id: 17431,
    title: "Moon",
    year: "2009",
    runtime: "1h 37m",
    reason: "A quiet one-location mystery with a big idea, and a final act that lets the light in.",
  },
]

const formatRuntime = (mins?: number) => (mins ? `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m` : "")

export async function getLandingData(): Promise<LandingData> {
  const [movies, tv, details] = await Promise.all([
    tmdbClient
      .getTrending("movie", "week")
      .then((r) => (r.results as Movie[]).map(fromMovie))
      .catch(() => [] as LandingTitle[]),
    tmdbClient
      .getTrending("tv", "week")
      .then((r) => (r.results as TVShow[]).map(fromTV))
      .catch(() => [] as LandingTitle[]),
    Promise.all(AI_EXAMPLES.map((e) => tmdbClient.getMovieDetails(e.id).catch(() => null))),
  ])

  const picks: AIPick[] = AI_EXAMPLES.map((e, i) => {
    const d = details[i]
    return {
      id: e.id,
      title: e.title,
      year: e.year,
      runtime: formatRuntime(d?.runtime) || e.runtime,
      reason: e.reason,
      rating: d?.vote_average ?? 0,
      overview: d?.overview ?? "",
      poster: d?.poster_path || null,
      backdrop: d?.backdrop_path || null,
      href: `/movie/${e.id}`,
    }
  })

  const slides = movies.filter((m) => m.backdrop).slice(0, 5)

  return {
    feature: slides[0] ?? null,
    slides,
    topMovies: movies.filter((m) => m.poster).slice(0, 10),
    topTV: tv.filter((s) => s.poster).slice(0, 10),
    picks,
  }
}
