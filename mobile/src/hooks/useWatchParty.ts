import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { watchPartyService } from '../services/watch-party.service';

export const useWatchParties = () =>
  useQuery({ queryKey: ['watch-party'], queryFn: watchPartyService.getAll });

export const useWatchParty = (id: string) =>
  useQuery({ queryKey: ['watch-party', id], queryFn: () => watchPartyService.getById(id), enabled: !!id });

export const useCreateParty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: watchPartyService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watch-party'] }),
  });
};

export const useJoinParty = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => watchPartyService.join(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watch-party', id] }),
  });
};
