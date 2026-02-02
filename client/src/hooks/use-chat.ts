import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
    id: string;
    store_id: string;
    sender_id: string;
    content: string;
    reply_to_id: string | null;
    is_pinned: boolean;
    created_at: string;
    sender?: {
        username: string;
        display_name: string;
        avatar_url: string | null;
    };
    reply_to?: ChatMessage | null;
}

export function useChat(storeId: string) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(false);

    // Fetch messages
    const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
        queryKey: ['chat-messages', storeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select(`
          *,
          sender:users!chat_messages_sender_id_fkey(username, display_name, avatar_url)
        `)
                .eq('store_id', storeId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Manually handle replies for now or fetch them separately if needed.
            // For MVP, we'll just map them.
            const msgs = data as any[];
            return msgs.map(m => ({
                ...m,
                reply_to: msgs.find(prev => prev.id === m.reply_to_id)
            }));
        },
        enabled: !!storeId,
    });

    // Real-time subscription
    useEffect(() => {
        if (!storeId) return;

        const channel = supabase
            .channel(`store_chat:${storeId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `store_id=eq.${storeId}`,
                },
                async (payload) => {
                    console.log('Realtime payload:', payload);

                    if (payload.eventType === 'INSERT') {
                        // Fetch sender info for the new message
                        const { data: senderData } = await supabase
                            .from('users')
                            .select('username, display_name, avatar_url')
                            .eq('id', payload.new.sender_id)
                            .single();

                        const newMessage = {
                            ...payload.new,
                            sender: senderData,
                            reply_to: messages.find(m => m.id === payload.new.reply_to_id)
                        } as ChatMessage;

                        queryClient.setQueryData(['chat-messages', storeId], (old: ChatMessage[] | undefined) => {
                            if (!old) return [newMessage];
                            // Avoid duplicates
                            if (old.some(m => m.id === newMessage.id)) return old;
                            return [...old, newMessage];
                        });
                    } else if (payload.eventType === 'DELETE') {
                        queryClient.setQueryData(['chat-messages', storeId], (old: ChatMessage[] | undefined) => {
                            if (!old) return [];
                            return old.filter((m) => m.id !== payload.old.id);
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        queryClient.setQueryData(['chat-messages', storeId], (old: ChatMessage[] | undefined) => {
                            if (!old) return [];
                            return old.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m));
                        });
                    }
                }
            )
            .subscribe((status) => {
                setIsRealtimeEnabled(status === 'SUBSCRIBED');
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [storeId, queryClient, messages]);

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: async ({ content, replyToId }: { content: string; replyToId?: string | null }) => {
            if (!user) throw new Error('Unauthorized');

            const { data, error } = await supabase
                .from('chat_messages')
                .insert({
                    store_id: storeId,
                    sender_id: user.id,
                    content,
                    reply_to_id: replyToId || null,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onError: (error: any) => {
            toast({
                title: 'Error sending message',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Delete message mutation
    const deleteMutation = useMutation({
        mutationFn: async (messageId: string) => {
            const { error } = await supabase
                .from('chat_messages')
                .delete()
                .eq('id', messageId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: 'Message deleted' });
        },
    });

    // Pin message mutation
    const pinMutation = useMutation({
        mutationFn: async ({ messageId, isPinned }: { messageId: string; isPinned: boolean }) => {
            // First, unpin everything for this store (MVP only allows 1 pinned message)
            if (isPinned) {
                await supabase
                    .from('chat_messages')
                    .update({ is_pinned: false })
                    .eq('store_id', storeId);
            }

            const { error } = await supabase
                .from('chat_messages')
                .update({ is_pinned: isPinned })
                .eq('id', messageId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: 'Message status updated' });
        },
    });

    return {
        messages,
        isLoading,
        isRealtimeEnabled,
        sendMessage: sendMutation.mutateAsync,
        isSending: sendMutation.isPending,
        deleteMessage: deleteMutation.mutateAsync,
        pinMessage: pinMutation.mutateAsync,
    };
}
