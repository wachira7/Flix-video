// components/dashboard/trailer-dialog.tsx
// Controlled trailer player. Looks the trailer up only when opened.
"use client"

import { useEffect, useState } from "react"
import { Loader2, X } from "lucide-react"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { tmdbClient } from "@/lib/api/tmdb"
import { pickTrailer, type MediaType } from "@/lib/media"

interface TrailerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  mediaType: MediaType
  id: number
  videoKey?: string
}

export function TrailerDialog({ open, onOpenChange, title, mediaType, id, videoKey }: TrailerDialogProps) {
  const [key, setKey] = useState<string | null | undefined>(videoKey)

  useEffect(() => {
    if (!open || key !== undefined) return
    let alive = true
    const load = mediaType === "movie" ? tmdbClient.getMovieVideos(id) : tmdbClient.getTVVideos(id)
    load
      .then((videos) => alive && setKey(pickTrailer(videos) ?? null))
      .catch(() => alive && setKey(null))
    return () => {
      alive = false
    }
  }, [open, key, mediaType, id])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl gap-0 overflow-hidden border-border/60 bg-black p-0 sm:rounded-xl [&>button]:hidden">
        <VisuallyHidden.Root>
          <DialogTitle>{title} trailer</DialogTitle>
        </VisuallyHidden.Root>
        <div className="relative aspect-video w-full">
          {key ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${key}?autoplay=1&rel=0&modestbranding=1`}
              title={`${title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              {key === undefined ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading trailer" />
              ) : (
                <>
                  <p className="font-display text-2xl text-foreground">No trailer yet</p>
                  <p>TMDB doesn&apos;t have a trailer for {title}.</p>
                </>
              )}
            </div>
          )}
        </div>
        <DialogClose
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label="Close trailer"
        >
          <X className="h-5 w-5" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
