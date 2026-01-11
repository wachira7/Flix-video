// app/actions/tmdb.ts - Update all functions to use .results

"use server"

import { tmdbClient } from "@/lib/api/tmdb"

export async function getTrendingMovies() {
  try {
    const response = await tmdbClient.getTrending("movie", "week")
    return { success: true, data: response.results.slice(0, 25) } // Use .results
  } catch (error) {
    console.error("Failed to fetch trending movies:", error)
    return { success: false, error: "Failed to fetch movies" }
  }
}

export async function getTrendingTV() {
  try {
    const response = await tmdbClient.getTrending("tv", "week")
    return { success: true, data: response.results.slice(0, 25) } // Use .results
  } catch (error) {
    console.error("Failed to fetch trending TV shows:", error)
    return { success: false, error: "Failed to fetch TV shows" }
  }
}

export async function getTopRatedTV() {
  try {
    const response = await tmdbClient.getTopRated("tv")
    return { success: true, data: response.results.slice(0, 15) } // Use .results
  } catch (error) {
    console.error("Failed to fetch top rated TV shows:", error)
    return { success: false, error: "Failed to fetch top rated shows" }
  }
}

export async function getPopularMovies() {
  try {
    const response = await tmdbClient.getPopular("movie")
    return { success: true, data: response.results.slice(0, 25) } // Use .results
  } catch (error) {
    console.error("Failed to fetch popular movies:", error)
    return { success: false, error: "Failed to fetch popular movies" }
  }
}

export async function getTopRatedMovies() {
  try {
    const response = await tmdbClient.getTopRated("movie")
    return { success: true, data: response.results.slice(0, 20) } 
  } catch (error) {
    console.error("Failed to fetch top rated movies:", error)
    return { success: false, error: "Failed to fetch top rated movies" }
  }
}

export async function getUpcomingMovies() {
  try {
    const response = await tmdbClient.getUpcoming()
    return { success: true, data: response.results.slice(0, 25) } // Use .results
  } catch (error) {
    console.error("Failed to fetch upcoming movies:", error)
    return { success: false, error: "Failed to fetch upcoming movies" }
  }
}

export async function getOnTheAirTV() {
  try {
    const response = await tmdbClient.getOnTheAir()
    return { success: true, data: response.results.slice(0, 25) } // Use .results
  } catch (error) {
    console.error("Failed to fetch on the air TV shows:", error)
    return { success: false, error: "Failed to fetch on the air TV shows" }
  }
}