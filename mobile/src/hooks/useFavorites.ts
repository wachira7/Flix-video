import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesService } from '../services/favorites.service';

export const useFavorites = () =>
  useQuery({ queryKey: ['favorites'], queryFn: favoritesService.getAll });

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contentType, contentId, isFavorited }: { contentType: string; contentId: number; isFavorited: boolean }) =>
      isFavorited
        ? favoritesService.remove(contentType, contentId)
        : favoritesService.add(contentType, contentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });
};
