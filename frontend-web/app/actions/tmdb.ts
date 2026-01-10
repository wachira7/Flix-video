//frontend-web/app/actions/tmdb.ts
"use server"

import { tmdbClient } from "@/lib/api/tmdb"

export async function getTrendingMovies() {
  try {
    const movies = await tmdbClient.getTrending("movie", "week")
    return { success: true, data: movies.slice(0, 25) }
  } catch (error) {
    console.error("Failed to fetch trending movies:", error)
    return { success: false, error: "Failed to fetch movies" }
  }
}

export async function getTrendingTV() {
  try {
    const tvShows = await tmdbClient.getTrending("tv", "week")
    return { success: true, data: tvShows.slice(0, 25) }
  } catch (error) {
    console.error("Failed to fetch trending TV shows:", error)
    return { success: false, error: "Failed to fetch TV shows" }
  }
}

export async function getTopRatedTV() {
  try {
    const shows = await tmdbClient.getTopRated("tv")
    return { success: true, data: shows.slice(0, 25) }
  } catch (error) {
    console.error("Failed to fetch top rated TV shows:", error)
    return { success: false, error: "Failed to fetch top rated shows" }
  }
}

export async function getPopularMovies() {
  try {
    const movies = await tmdbClient.getPopular("movie")
    return { success: true, data: movies.slice(0, 25) }
  } catch (error) {
    console.error("Failed to fetch popular movies:", error)
    return { success: false, error: "Failed to fetch popular movies" }
  }
}

export async function getUpcomingMovies() {
  try {
    const movies = await tmdbClient.getUpcoming()
    return { success: true, data: movies.slice(0, 25) }
  } catch (error) {
    console.error("Failed to fetch upcoming movies:", error)
    return { success: false, error: "Failed to fetch upcoming movies" }
  }
}

export async function getOnTheAirTV() {
  try {
    const shows = await tmdbClient.getOnTheAir()
    return { success: true, data: shows.slice(0, 25) }
  } catch (error) {
    console.error("Failed to fetch on the air TV shows:", error)
    return { success: false, error: "Failed to fetch on the air shows" }
  }  
}