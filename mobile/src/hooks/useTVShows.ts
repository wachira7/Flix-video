import { useQuery } from '@tanstack/react-query';
import { tvService } from '../services/tv.service';

export const usePopularTV = (page = 1) =>
  useQuery({ queryKey: ['tv', 'popular', page], queryFn: () => tvService.getPopular(page) });

export const useTrendingTV = (timeWindow: 'day' | 'week' = 'week') =>
  useQuery({ queryKey: ['tv', 'trending', timeWindow], queryFn: () => tvService.getTrending(timeWindow) });

export const useTVDetail = (id: number) =>
  useQuery({ queryKey: ['tv', id], queryFn: () => tvService.getById(id), enabled: !!id });

export const useSeason = (id: number, seasonNumber: number) =>
  useQuery({ queryKey: ['tv', id, 'season', seasonNumber], queryFn: () => tvService.getSeason(id, seasonNumber), enabled: !!id });

export const useTVCredits = (id: number) =>
  useQuery({ queryKey: ['tv', id, 'credits'], queryFn: () => tvService.getCredits(id), enabled: !!id });
