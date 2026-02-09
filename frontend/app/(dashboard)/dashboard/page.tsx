// app/(dashboard)/dashboard/page.tsx

import { getTrendingMovies, getTrendingTV, getPopularMovies, getUpcomingMovies, getOnTheAirTV } from "@/app/actions/tmdb"
import { HeroBanner } from "@/components/dashboard/hero-banner"
import { ContentRow } from "@/components/dashboard/content-row"
import { SubscriptionBanner } from "@/components/dashboard/subscription-banner"
// import { UsageWidget } from "@/components/dashboard/usage-widget"
// import { AIRecommendationsWidget } from "@/components/dashboard/ai-recommendations-widget" 
import { tmdbClient } from "@/lib/api/tmdb"
import type { Movie, TVShow } from "@/lib/api/tmdb"

// Helper function to get random items from array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export default async function DashboardPage() {
  // Fetch all content in parallel
  const [trendingMoviesRes, trendingTVRes, popularMoviesRes, upcomingMoviesRes, onTheAirTVRes, topRatedMoviesRes, topRatedTVRes] = 
    await Promise.all([
      getTrendingMovies(),
      getTrendingTV(),
      getPopularMovies(),
      getUpcomingMovies(),
      getOnTheAirTV(),
      tmdbClient.getTopRated("movie"),
      tmdbClient.getTopRated("tv"),
    ])

  const trendingMovies = (trendingMoviesRes.success ? trendingMoviesRes.data : []) as Movie[]
  const trendingTV = (trendingTVRes.success ? trendingTVRes.data : []) as TVShow[]
  const popularMovies = (popularMoviesRes.success ? popularMoviesRes.data : []) as Movie[]
  const upcomingMovies = (upcomingMoviesRes.success ? upcomingMoviesRes.data : []) as Movie[]
  const onTheAirTV = (onTheAirTVRes.success ? onTheAirTVRes.data : []) as TVShow[]

  const topRatedMovies = topRatedMoviesRes.results as Movie[]
  const topRatedTV = topRatedTVRes.results as TVShow[]

  const combinedTrending = [...trendingMovies, ...trendingTV]
  const randomHeroItems = getRandomItems(combinedTrending, 10)

  return (
    <div className="min-h-screen">
      {/* Hero Banner - Full Width */}
      {randomHeroItems.length > 0 && <HeroBanner movies={randomHeroItems} />}

      {/* Main Container - Full Width */}
      <div className=" px-6 py-8">
        {/* Subscription Banner - Full Width */}
        <div className="mb-8">
          <SubscriptionBanner />
        </div>

        {/* Content Rows - Full Width */}
        <div className="space-y-8">
          <ContentRow title="Trending Movies" items={trendingMovies} />
          <ContentRow title="Upcoming Movies" items={upcomingMovies} />
          <ContentRow title="Trending TV Shows" items={trendingTV} />
          <ContentRow title="On The Air TV Shows" items={onTheAirTV} />
          <ContentRow title="Popular on FlixVideo" items={popularMovies} />
          <ContentRow title="Top Rated Movies" items={topRatedMovies} />
          <ContentRow title="Top Rated TV Shows" items={topRatedTV} />
        </div>
      </div>
    </div>
  )
}