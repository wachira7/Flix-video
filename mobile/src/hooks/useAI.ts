import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiService } from '../services/ai.service';

export const useConversations = () =>
  useQuery({ queryKey: ['ai', 'conversations'], queryFn: aiService.getConversations });

export const useConversation = (id: string) =>
  useQuery({ queryKey: ['ai', 'conversations', id], queryFn: () => aiService.getConversation(id), enabled: !!id });

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, message }: { conversationId: string | null; message: string }) =>
      aiService.sendMessage(conversationId, message),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] }),
  });
};
