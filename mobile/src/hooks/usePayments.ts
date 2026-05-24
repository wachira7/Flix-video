import { useQuery, useMutation } from '@tanstack/react-query';
import { paymentsService } from '../services/payments.service';

export const usePaymentHistory = (page = 1) =>
  useQuery({ queryKey: ['payments', page], queryFn: () => paymentsService.getHistory(page) });

export const useCreateStripeIntent = () =>
  useMutation({ mutationFn: (planId: number) => paymentsService.createStripeIntent(planId) });

export const useInitiateMpesa = () =>
  useMutation({
    mutationFn: ({ planId, phoneNumber }: { planId: number; phoneNumber: string }) =>
      paymentsService.initiateMpesa(planId, phoneNumber),
  });

export const useApplyCoupon = () =>
  useMutation({ mutationFn: (code: string) => paymentsService.applyCoupon(code) });
