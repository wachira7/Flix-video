// components/dashboard/cast-card.tsx
"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { getImageUrl } from "@/lib/api/tmdb"

interface CastCardProps {
  cast: {
    id: number
    name: string
    character: string
    profile_path: string | null
  }
}

export function CastCard({ cast }: CastCardProps) {
  const imageUrl = getImageUrl(cast.profile_path, "w500")

  return (
    <Card className="overflow-hidden bg-card border-border">
      <div className="relative aspect-2/3">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={cast.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-3">
        <p className="font-semibold text-foreground text-sm truncate">{cast.name}</p>
        <p className="text-xs text-muted-foreground truncate">{cast.character}</p>
      </div>
    </Card>
  )
}