// app/(dashboard)/tv/[id]/page.tsx
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { tmdbClient } from "@/lib/api/tmdb"
import type { MediaItem } from "@/lib/media"
import { TitleDetail } from "@/components/title/title-detail"
import { facts, languageName, runtimeLabel, settled, trailerFrom } from "@/components/title/format"

type Props = { params: Promise<{ id: string }> }

type ShowExtras = {
  status?: string
  in_production?: boolean
  last_air_date?: string
  original_language?: string
  vote_count?: number
  networks?: { id: number; name: string }[]
}

async function load(id: number) {
  try {
    return await tmdbClient.getTVDetails(id)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number((await params).id)
  const show = Number.isFinite(id) ? await load(id) : null
  if (!show) return { title: "Series not found · FlixVideo" }
  return {
    title: `${show.name} (${show.first_air_date?.slice(0, 4) || "TBA"}) · FlixVideo`,
    description: show.overview?.slice(0, 160),
  }
}

export default async function TVDetailPage({ params }: Props) {
  const id = Number((await params).id)
  if (!Number.isFinite(id)) notFound()

  const loaded = await load(id)
  if (!loaded) notFound()
  const show = loaded as typeof loaded & ShowExtras

  const [credits, videos, similar, certification] = await Promise.allSettled([
    tmdbClient.getTVCredits(id),
    tmdbClient.getTVVideos(id),
    tmdbClient.getSimilarTV(id),
    tmdbClient.getCertification("tv", id),
  ])

  const start = show.first_air_date?.slice(0, 4)
  const end = show.in_production ? "" : show.last_air_date?.slice(0, 4)
  const years = start ? (end && end !== start ? `${start}–${end}` : show.in_production ? `${start}–` : start) : "Coming soon"
  const seasons = show.number_of_seasons
  const episodes = show.number_of_episodes

  return (
    <TitleDetail
      data={{
        mediaType: "tv",
        id,
        title: show.name,
        tagline: show.tagline || undefined,
        overview: show.overview,
        backdrop: show.backdrop_path || null,
        poster: show.poster_path || null,
        years,
        rating: show.vote_average,
        voteCount: show.vote_count ?? 0,
        certification: settled(certification, null),
        length: seasons
          ? `${seasons} season${seasons === 1 ? "" : "s"}${episodes ? ` · ${episodes} episodes` : ""}`
          : undefined,
        genres: show.genres ?? [],
        credit: { label: "Created by", names: (show.created_by ?? []).slice(0, 2).map((c) => c.name) },
        facts: facts([
          ["Status", show.status],
          ["Network", show.networks?.slice(0, 2).map((n) => n.name).join(", ")],
          ["Episode length", runtimeLabel(show.episode_run_time?.[0])],
          ["Language", languageName(show.original_language)],
          ["Studio", show.production_companies?.slice(0, 2).map((c) => c.name).join(", ")],
        ]),
        trailerKey: trailerFrom(videos),
        cast: settled(credits, { cast: [] }).cast.slice(0, 16),
        similar: settled(similar, [])
          .filter((s) => s.poster_path)
          .map((s) => ({ ...s, media_type: "tv" }) as MediaItem),
      }}
    />
  )
}
