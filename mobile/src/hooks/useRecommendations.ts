import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationsService } from '../services/recommendations.service';

export const useRecommendations = () =>
  useQuery({ queryKey: ['recommendations'], queryFn: recommendationsService.getForUser });

export const useRefreshRecommendations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recommendationsService.refreshRecommendations,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recommendations'] }),
  });
};
