// app/(dashboard)/movie/[id]/page.tsx

import { notFound } from "next/navigation"
import Image from "next/image"
import { tmdbClient, getImageUrl } from "@/lib/api/tmdb"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Clock, Calendar, Star } from "lucide-react"
import { CastCard } from "@/components/dashboard/cast-card"
import { ContentRow } from "@/components/dashboard/content-row"
import { VideoPlayer } from "@/components/dashboard/video-player"
import { AddToListButton } from "@/components/dashboard/add-to-list-button"
import { RatingSection } from "@/components/ratings/rating-section"
import { ReviewsSection } from "@/components/reviews/reviews-section"
import { PlayOptionsButton } from "@/components/media/play-options-button"
import { toast } from "sonner"

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const movieId = parseInt((await params).id)

  if (isNaN(movieId)) {
    notFound()
  }

  // Fetch all data in parallel
  const [movie, credits, videos, similar] = await Promise.all([
    tmdbClient.getMovieDetails(movieId),
    tmdbClient.getMovieCredits(movieId),
    tmdbClient.getMovieVideos(movieId),
    tmdbClient.getSimilarMovies(movieId),
  ])

  if (!movie) {
    notFound()
  }

  const backdropUrl = getImageUrl(movie.backdrop_path, "original")
  const posterUrl = getImageUrl(movie.poster_path, "w500")
  const trailer = videos.find((v) => v.type === "Trailer" && v.site === "YouTube")
  const cast = credits.cast.slice(0, 10)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[70vh] w-full">
        <Image
          src={backdropUrl || "/placeholder.svg"}
          alt={movie.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 p-12 max-w-3xl">
          <h1 className="text-5xl font-bold text-white mb-4">{movie.title}</h1>

          {movie.tagline && (
            <p className="text-xl text-gray-300 italic mb-4">{movie.tagline}</p>
          )}

          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
              <span className="text-white font-semibold">{movie.vote_average.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300">{new Date(movie.release_date).getFullYear()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300">{movie.runtime} min</span>
            </div>
            {movie.genres.slice(0, 3).map((genre) => (
              <Badge key={genre.id} variant="secondary">
                {genre.name}
              </Badge>
            ))}
          </div>

          <p className="text-gray-300 text-lg mb-6 line-clamp-3">{movie.overview}</p>

          <div className="flex items-center gap-4">
            {/* Play Options Button - Watch Party & Streaming */}
            <PlayOptionsButton
              contentType="movie"
              contentId={movieId}
              title={movie.title}
            />
            
            {/* Trailer Button */}
            {trailer && <VideoPlayer videoKey={trailer.key} title={movie.title} />}
            
            {/* Add to List Button */}
            <AddToListButton contentType="movie" contentId={movieId} variant="full" />
            
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
        <RatingSection contentType="movie" contentId={movieId} title={movie.title} />
        
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
        <ReviewsSection contentType="movie" contentId={movieId} title={movie.title} />

        {/* Similar Movies */}
        {similar.length > 0 && (
          <ContentRow title="More Like This" items={similar.slice(0, 10)} />
        )}
      </div>
    </div>
  )
}