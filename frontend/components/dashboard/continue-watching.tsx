// components/dashboard/continue-watching.tsx
// Row of titles with saved progress. Renders nothing until there is some.
"use client"

import { useEffect, useMemo, useState } from "react"
import { userAPI } from "@/lib/api/user"
import { normalizeType, useTitles } from "@/lib/hooks/use-content"
import { ContentRow } from "./content-row"

interface Entry {
  contentType: string
  contentId: string
  progressSeconds?: number
  durationSeconds?: number
}

export function ContinueWatching() {
  const [entries, setEntries] = useState<Entry[] | null>(null)

  useEffect(() => {
    userAPI
      .getContinueWatching(12)
      .then((r) => setEntries(r.continue_watching ?? []))
      .catch(() => setEntries([]))
  }, [])

  const refs = useMemo(
    () => entries?.map((e) => ({ type: normalizeType(e.contentType), id: Number(e.contentId) })) ?? null,
    [entries]
  )
  const items = useTitles(refs)

  const progress = useMemo(() => {
    const map: Record<number, number> = {}
    entries?.forEach((e) => {
      if (e.durationSeconds) map[Number(e.contentId)] = (e.progressSeconds ?? 0) / e.durationSeconds
    })
    return map
  }, [entries])

  if (!items?.length) return null
  return <ContentRow title="Continue watching" items={items} progress={progress} href="/library?tab=history" />
}
