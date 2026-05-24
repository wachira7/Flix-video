import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialService } from '../services/social.service';

export const useFollowers = (userId: number) =>
  useQuery({ queryKey: ['social', 'followers', userId], queryFn: () => socialService.getFollowers(userId), enabled: !!userId });

export const useFollowing = (userId: number) =>
  useQuery({ queryKey: ['social', 'following', userId], queryFn: () => socialService.getFollowing(userId), enabled: !!userId });

export const useToggleFollow = (userId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isFollowing: boolean) =>
      isFollowing ? socialService.unfollow(userId) : socialService.follow(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['social', 'following'] });
    },
  });
};

export const useUserLists = (userId: number) =>
  useQuery({ queryKey: ['social', 'lists', userId], queryFn: () => socialService.getUserLists(userId), enabled: !!userId });
