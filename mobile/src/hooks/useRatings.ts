import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ratingsService } from '../services/ratings.service';

export const useUserRating = (contentType: string, contentId: number) =>
  useQuery({
    queryKey: ['ratings', contentType, contentId],
    queryFn: () => ratingsService.getUserRating(contentType, contentId),
    enabled: !!contentId,
  });

export const useRate = (contentType: string, contentId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rating: number) => ratingsService.rate(contentType, contentId, rating),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ratings', contentType, contentId] }),
  });
};
