// app/(dashboard)/dashboard/page.tsx
import { tmdbClient, type Movie, type TVShow } from "@/lib/api/tmdb"
import type { MediaItem } from "@/lib/media"
import { HeroBanner } from "@/components/dashboard/hero-banner"
import { ContentRow } from "@/components/dashboard/content-row"
import { ContinueWatching } from "@/components/dashboard/continue-watching"
import { HomeGreeting } from "@/components/dashboard/home-greeting"

// Re-fetch TMDB lists at most once an hour
export const revalidate = 3600

async function list<T extends Movie | TVShow>(load: Promise<{ results: unknown[] }>, type: "movie" | "tv") {
  try {
    const res = await load
    return (res.results as T[]).filter((r) => r.poster_path).map((r) => ({ ...r, media_type: type }) as MediaItem)
  } catch {
    return [] as MediaItem[]
  }
}

export default async function DashboardPage() {
  const [trendingMovies, trendingTV, upcoming, topRated] = await Promise.all([
    list<Movie>(tmdbClient.getTrending("movie", "week"), "movie"),
    list<TVShow>(tmdbClient.getTrending("tv", "week"), "tv"),
    list<Movie>(tmdbClient.getUpcoming(), "movie"),
    list<Movie>(tmdbClient.getTopRated("movie"), "movie"),
  ])

  // Interleave films and series for the hero, in trending order
  const hero: MediaItem[] = []
  for (let i = 0; i < 4; i++) {
    if (trendingMovies[i]) hero.push(trendingMovies[i])
    if (trendingTV[i]) hero.push(trendingTV[i])
  }

  return (
    <div className="space-y-14">
      <HeroBanner movies={hero} />

      <div className="space-y-14">
        <HomeGreeting />
        <ContinueWatching />
        <ContentRow title="Top 10 films this week" items={trendingMovies} ranked href="/browse" />
        <ContentRow title="Series everyone's watching" items={trendingTV} href="/browse?type=tv" />
        <ContentRow title="Coming soon" subtitle="Upcoming releases worth a reminder" items={upcoming} href="/browse?list=new" />
        <ContentRow title="All-time greats" subtitle="The highest rated films on TMDB" items={topRated} href="/browse?list=top-rated" />
      </div>
    </div>
  )
}
