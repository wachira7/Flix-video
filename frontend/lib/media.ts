// lib/media.ts
// Helpers for TMDB movie / TV / multi-search items, which name the same
// fields differently.
import type { Movie, TVShow } from "@/lib/api/tmdb"

export type MediaType = "movie" | "tv"
export type MediaItem = (Movie | TVShow) & { media_type?: string }

export function typeOf(item: MediaItem): MediaType {
  if (item.media_type === "tv" || item.media_type === "movie") return item.media_type
  return "title" in item ? "movie" : "tv"
}

export function titleOf(item: MediaItem) {
  return "title" in item ? item.title : (item as TVShow).name
}

export function yearOf(item: MediaItem) {
  const date = "release_date" in item ? item.release_date : (item as TVShow).first_air_date
  return date ? date.slice(0, 4) : ""
}

export function hrefOf(item: MediaItem) {
  return `/${typeOf(item)}/${item.id}`
}

/** Pick the best YouTube trailer from a TMDB videos list */
export function pickTrailer(videos: { key: string; site: string; type: string; official: boolean }[]) {
  const yt = videos.filter((v) => v.site === "YouTube")
  return (
    yt.find((v) => v.type === "Trailer" && v.official) ||
    yt.find((v) => v.type === "Trailer") ||
    yt.find((v) => v.type === "Teaser") ||
    yt[0]
  )?.key
}
