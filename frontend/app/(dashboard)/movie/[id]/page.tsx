// app/(dashboard)/movie/[id]/page.tsx
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { tmdbClient } from "@/lib/api/tmdb"
import type { MediaItem } from "@/lib/media"
import { TitleDetail } from "@/components/title/title-detail"
import { facts, languageName, money, runtimeLabel, settled, trailerFrom } from "@/components/title/format"

type Props = { params: Promise<{ id: string }> }

async function load(id: number) {
  try {
    return await tmdbClient.getMovieDetails(id)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number((await params).id)
  const movie = Number.isFinite(id) ? await load(id) : null
  if (!movie) return { title: "Film not found · FlixVideo" }
  return {
    title: `${movie.title} (${movie.release_date?.slice(0, 4) || "TBA"}) · FlixVideo`,
    description: movie.overview?.slice(0, 160),
  }
}

export default async function MovieDetailPage({ params }: Props) {
  const id = Number((await params).id)
  if (!Number.isFinite(id)) notFound()

  const movie = await load(id)
  if (!movie) notFound()

  const [credits, videos, similar, certification] = await Promise.allSettled([
    tmdbClient.getMovieCredits(id),
    tmdbClient.getMovieVideos(id),
    tmdbClient.getSimilarMovies(id),
    tmdbClient.getCertification("movie", id),
  ])

  const crew = settled(credits, { cast: [], crew: [] })
  const directors = crew.crew.filter((c) => c.job === "Director").map((c) => c.name)
  const m = movie as typeof movie & { status?: string; original_language?: string }

  return (
    <TitleDetail
      data={{
        mediaType: "movie",
        id,
        title: movie.title,
        tagline: movie.tagline || undefined,
        overview: movie.overview,
        backdrop: movie.backdrop_path || null,
        poster: movie.poster_path || null,
        years: movie.release_date?.slice(0, 4) || "Coming soon",
        rating: movie.vote_average,
        voteCount: (movie as { vote_count?: number }).vote_count ?? 0,
        certification: settled(certification, null),
        length: runtimeLabel(movie.runtime),
        genres: movie.genres ?? [],
        credit: { label: "Directed by", names: directors.slice(0, 2) },
        facts: facts([
          ["Status", m.status],
          ["Released", movie.release_date ? new Date(movie.release_date).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" }) : undefined],
          ["Language", languageName(m.original_language)],
          ["Budget", money(movie.budget)],
          ["Box office", money(movie.revenue)],
          ["Studio", movie.production_companies?.slice(0, 2).map((c) => c.name).join(", ")],
        ]),
        trailerKey: trailerFrom(videos),
        cast: crew.cast.slice(0, 16),
        similar: settled(similar, [])
          .filter((s) => s.poster_path)
          .map((s) => ({ ...s, media_type: "movie" }) as MediaItem),
      }}
    />
  )
}
