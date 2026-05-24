import { useQuery } from '@tanstack/react-query';
import { moviesService } from '../services/movies.service';

export const usePopularMovies = (page = 1) =>
  useQuery({ queryKey: ['movies', 'popular', page], queryFn: () => moviesService.getPopular(page) });

export const useTrendingMovies = (timeWindow: 'day' | 'week' = 'week') =>
  useQuery({ queryKey: ['movies', 'trending', timeWindow], queryFn: () => moviesService.getTrending(timeWindow) });

export const useTopRatedMovies = (page = 1) =>
  useQuery({ queryKey: ['movies', 'top-rated', page], queryFn: () => moviesService.getTopRated(page) });

export const useMovieDetail = (id: number) =>
  useQuery({ queryKey: ['movies', id], queryFn: () => moviesService.getById(id), enabled: !!id });

export const useMovieCredits = (id: number) =>
  useQuery({ queryKey: ['movies', id, 'credits'], queryFn: () => moviesService.getCredits(id), enabled: !!id });

export const useSimilarMovies = (id: number) =>
  useQuery({ queryKey: ['movies', id, 'similar'], queryFn: () => moviesService.getSimilar(id), enabled: !!id });
