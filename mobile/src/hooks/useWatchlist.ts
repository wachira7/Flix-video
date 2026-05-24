import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { watchlistService } from '../services/watchlist.service';

export const useWatchlist = () =>
  useQuery({ queryKey: ['watchlist'], queryFn: watchlistService.getAll });

export const useToggleWatchlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contentId, inWatchlist }: { contentId: number; inWatchlist: boolean }) =>
      inWatchlist ? watchlistService.remove(contentId) : watchlistService.add(contentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });
};
