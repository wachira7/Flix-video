import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '../services/notifications.service';

export const useNotifications = (page = 1) =>
  useQuery({ queryKey: ['notifications', page], queryFn: () => notificationsService.getAll(page) });

export const useUnreadCount = () =>
  useQuery({ queryKey: ['notifications', 'unread-count'], queryFn: notificationsService.getUnreadCount });

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
};
