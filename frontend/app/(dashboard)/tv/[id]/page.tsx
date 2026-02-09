// app/(dashboard)/tv/[id]/page.tsx

import { notFound } from "next/navigation"
import Image from "next/image"
import { tmdbClient, getImageUrl } from "@/lib/api/tmdb"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Star, Tv as TvIcon } from "lucide-react"
import { CastCard } from "@/components/dashboard/cast-card"
import { ContentRow } from "@/components/dashboard/content-row"
import { VideoPlayer } from "@/components/dashboard/video-player"
import { AddToListButton } from "@/components/dashboard/add-to-list-button"
import { RatingSection } from "@/components/ratings/rating-section"
import { ReviewsSection } from "@/components/reviews/reviews-section"
import { PlayOptionsButton } from "@/components/media/play-options-button"
import { toast } from "sonner"

export default async function TVDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const tvId = parseInt((await params).id)

  if (isNaN(tvId)) {
    notFound()
  }

  const [show, credits, videos, similar] = await Promise.all([
    tmdbClient.getTVDetails(tvId),
    tmdbClient.getTVCredits(tvId),
    tmdbClient.getTVVideos(tvId),
    tmdbClient.getSimilarTV(tvId),
  ])

  if (!show) {
    notFound()
  }

  const backdropUrl = getImageUrl(show.backdrop_path, "original")
  const trailer = videos.find((v) => v.type === "Trailer" && v.site === "YouTube")
  const cast = credits.cast.slice(0, 10)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[70vh] w-full">
        <Image
          src={backdropUrl || "/placeholder.svg"}
          alt={show.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 p-12 max-w-3xl">
          <h1 className="text-5xl font-bold text-white mb-4">{show.name}</h1>

          {show.tagline && (
            <p className="text-xl text-gray-300 italic mb-4">{show.tagline}</p>
          )}

          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
              <span className="text-white font-semibold">{show.vote_average.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300">{new Date(show.first_air_date).getFullYear()}</span>
            </div>
            <div className="flex items-center gap-2">
              <TvIcon className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300">{show.number_of_seasons} Seasons</span>
            </div>
            {show.genres.slice(0, 3).map((genre) => (
              <Badge key={genre.id} variant="secondary">
                {genre.name}
              </Badge>
            ))}
          </div>

          <p className="text-gray-300 text-lg mb-6 line-clamp-3">{show.overview}</p>

          <div className="flex items-center gap-4">
            {/* Play Options Button - Watch Party & Streaming */}
            <PlayOptionsButton
              contentType="tv"
              contentId={tvId}
              title={show.name}
              seasonNumber={show.number_of_seasons}
              episodeNumber={1}
            />
            
            {/* Trailer Button */}
            {trailer && <VideoPlayer videoKey={trailer.key} title={show.name} />}
            
            {/* Add to List Button */}
            <AddToListButton contentType="tv" contentId={tvId} variant="full" />
            
            {/* Quick Add to Favorites */}
            <Button 
              size="lg" 
              variant="outline" 
              className="border-gray-400 bg-gray-800/80 hover:border-purple-600 hover:bg-gray-700 transition-all"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="px-12 py-8 space-y-12">
        {/* Rating Section */}
        <RatingSection contentType="tv" contentId={tvId} title={show.name} />
        
        {/* Cast */}
        {cast.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Cast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {cast.map((member) => (
                <CastCard key={member.id} cast={member} />
              ))}
            </div>
          </div>
        )}
        
        {/* Reviews Section */}
        <ReviewsSection contentType="tv" contentId={tvId} title={show.name} />

        {similar.length > 0 && (
          <ContentRow title="More Like This" items={similar.slice(0, 10)} />
        )}
      </div>
    </div>
  )
}