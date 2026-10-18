// lib/hooks/use-content.ts
// Our API stores only TMDB ids (watchlist, favorites, history, lists).
// This turns { type, id } references into full TMDB items, with a cache
// shared across the app so moving between tabs doesn't refetch.
"use client"

import { useEffect, useState } from "react"
import { tmdbClient } from "@/lib/api/tmdb"
import type { MediaItem, MediaType } from "@/lib/media"

export interface ContentRef {
  type: MediaType
  id: number
}

/** Our API uses 'tv_show' in places; TMDB uses 'tv' */
export function normalizeType(type: string | undefined): MediaType {
  return type === "tv" || type === "tv_show" ? "tv" : "movie"
}

const cache = new Map<string, Promise<MediaItem | null>>()

export function fetchTitle({ type, id }: ContentRef): Promise<MediaItem | null> {
  const key = `${type}:${id}`
  let hit = cache.get(key)
  if (!hit) {
    hit = (type === "tv" ? tmdbClient.getTVDetails(id) : tmdbClient.getMovieDetails(id))
      .then((item) => ({ ...item, media_type: type }) as MediaItem)
      .catch(() => {
        cache.delete(key)
        return null
      })
    cache.set(key, hit)
  }
  return hit
}

/** Resolve refs to TMDB items, preserving order and dropping failures */
export function useTitles(refs: ContentRef[] | null) {
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const signature = refs?.map((r) => `${r.type}:${r.id}`).join(",") ?? null

  useEffect(() => {
    if (!refs) return
    let alive = true
    Promise.all(refs.map(fetchTitle)).then((all) => {
      if (alive) setItems(all.filter((x): x is MediaItem => x !== null))
    })
    return () => {
      alive = false
    }
    // signature captures refs' identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  return refs ? items : null
}
