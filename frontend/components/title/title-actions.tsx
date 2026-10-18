// components/title/title-actions.tsx
// The action bar on a title page. Every button does exactly what it says.
"use client"

import { useState } from "react"
import Link from "next/link"
import { Link2, Play, Tv, Users } from "lucide-react"
import { toast } from "sonner"
import { TrailerDialog } from "@/components/dashboard/trailer-dialog"
import { WatchlistButton } from "@/components/dashboard/watchlist-button"
import type { MediaType } from "@/lib/media"
import { FavoriteButton } from "./favorite-button"
import { ListPicker } from "./list-picker"

const iconButton =
  "flex h-12 w-12 items-center justify-center rounded-lg border border-foreground/25 bg-background/30 backdrop-blur-sm transition-colors hover:border-foreground/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"

interface TitleActionsProps {
  mediaType: MediaType
  id: number
  title: string
  trailerKey?: string
}

export function TitleActions({ mediaType, id, title, trailerKey }: TitleActionsProps) {
  const [trailerOpen, setTrailerOpen] = useState(false)

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title, url })
      else {
        await navigator.clipboard.writeText(url)
        toast.success("Link copied")
      }
    } catch {
      // share sheet dismissed
    }
  }

  const party = new URLSearchParams({ type: mediaType, id: String(id), title })

  return (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
      <button
        type="button"
        onClick={() => setTrailerOpen(true)}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm whitespace-nowrap sm:px-6 sm:text-[15px] font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-110 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        <Play className="h-4 w-4 fill-current" aria-hidden="true" />
        {trailerKey ? "Watch trailer" : "Find a trailer"}
      </button>
      <a
        href="#where-to-watch"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-foreground/25 bg-background/30 px-4 text-sm whitespace-nowrap sm:px-5 sm:text-[15px] font-semibold backdrop-blur-sm transition-colors hover:border-foreground/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Tv className="h-4 w-4" aria-hidden="true" />
        Where to watch
      </a>
      <div className="col-span-2 flex gap-2 sm:contents">
        <WatchlistButton
          variant="pill"
          mediaType={mediaType}
          id={id}
          title={title}
          checkOnMount
          className="flex-1 justify-center px-3 text-sm whitespace-nowrap sm:flex-none sm:px-5 sm:text-[15px]"
        />
        <FavoriteButton mediaType={mediaType} id={id} title={title} />
        <ListPicker mediaType={mediaType} id={id} title={title} />
        <Link
          href={`/watch-party/create?${party}`}
          aria-label={`Start a watch party for ${title}`}
          title="Start a watch party"
          className={iconButton}
        >
          <Users className="h-5 w-5" />
        </Link>
        <button type="button" onClick={share} aria-label={`Share ${title}`} title="Share" className={iconButton}>
          <Link2 className="h-5 w-5" />
        </button>
      </div>

      <TrailerDialog
        open={trailerOpen}
        onOpenChange={setTrailerOpen}
        title={title}
        mediaType={mediaType}
        id={id}
        videoKey={trailerKey}
      />
    </div>
  )
}
