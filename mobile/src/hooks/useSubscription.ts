import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsService } from '../services/subscriptions.service';

export const useSubscriptionPlans = () =>
  useQuery({ queryKey: ['subscriptions', 'plans'], queryFn: subscriptionsService.getPlans, staleTime: 5 * 60 * 1000 });

export const useCurrentSubscription = () =>
  useQuery({ queryKey: ['subscriptions', 'current'], queryFn: subscriptionsService.getCurrent });

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: subscriptionsService.cancel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions', 'current'] }),
  });
};

export const useChangePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: number) => subscriptionsService.changePlan(planId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions', 'current'] }),
  });
};
