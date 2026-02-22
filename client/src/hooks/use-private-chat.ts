import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export interface PrivateChat {
    id: string;
    userId: string;
    artistId: string;
    createdAt: string;
    updatedAt: string;
    otherUser?: {
        username: string;
        displayName: string;
        avatarUrl: string | null;
    };
    lastMessage?: string;
}

export interface PrivateMessage {
    id: number;
    chatId: string;
    senderId: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    sender?: {
        username: string;
        displayName: string;
        avatarUrl: string | null;
    };
}

export function usePrivateChats(role: 'client' | 'artist') {
    const { user } = useAuth();

    return useQuery<PrivateChat[]>({
        queryKey: ['private-chats', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('private_chats')
                .select(`
          *,
          client:users!private_chats_user_id_fkey(username, display_name, avatar_url),
          artist:users!private_chats_artist_id_fkey(username, display_name, avatar_url)
        `)
                .or(`user_id.eq.${user.id},artist_id.eq.${user.id}`)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            return data.map((chat: any) => ({
                id: chat.id,
                userId: chat.user_id,
                artistId: chat.artist_id,
                createdAt: chat.created_at,
                updatedAt: chat.updated_at,
                otherUser: user.id === chat.user_id
                    ? { username: chat.artist.username, displayName: chat.artist.display_name, avatarUrl: chat.artist.avatar_url }
                    : { username: chat.client.username, displayName: chat.client.display_name, avatarUrl: chat.client.avatar_url }
            }));
        },
        enabled: !!user
    });
}

export function usePrivateChat(chatId: string | null) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch Messages
    const { data: messages = [], isLoading } = useQuery<PrivateMessage[]>({
        queryKey: ['private-messages', chatId],
        queryFn: async () => {
            if (!chatId) return [];

            const { data, error } = await supabase
                .from('private_chat_messages')
                .select(`
            *,
            sender:users!private_chat_messages_sender_id_fkey(username, display_name, avatar_url)
        `)
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data.map((msg: any) => ({
                ...msg,
                chatId: msg.chat_id,
                senderId: msg.sender_id,
                isRead: msg.is_read,
                createdAt: msg.created_at,
                sender: {
                    username: msg.sender.username,
                    displayName: msg.sender.display_name,
                    avatarUrl: msg.sender.avatar_url
                }
            }));
        },
        enabled: !!chatId
    });

    // Realtime Subscription
    useEffect(() => {
        if (!chatId) return;

        const channel = supabase
            .channel(`private_chat:${chatId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'private_chat_messages', filter: `chat_id=eq.${chatId}` },
                async (payload) => {
                    // Need to fetch sender info or optimistically update if we trust the payload mostly
                    // For simplicity, let's invalidate query to refresh full message with sender relation
                    queryClient.invalidateQueries({ queryKey: ['private-messages', chatId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId, queryClient]);


    // Send Message
    const sendMessageMutation = useMutation({
        mutationFn: async (content: string) => {
            if (!user || !chatId) throw new Error("Unauthorized");

            await apiRequest("POST", "/api/chat/messages", { chatId, content });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['private-messages', chatId] });
            queryClient.invalidateQueries({ queryKey: ['private-chats'] });
        },
        onError: (err: any) => {
            toast({ title: 'Failed to send', description: err.message, variant: 'destructive' });
        }
    });

    // Start/Get Chat (Helper to find existing or create new)
    const startChatMutation = useMutation({
        mutationFn: async (artistId: string) => {
            if (!user) throw new Error("Unauthorized");

            const res = await apiRequest("POST", "/api/chat/start", { artistId });
            const data = await res.json();
            return data.id;
        }
    });

    return {
        messages,
        isLoading,
        sendMessage: sendMessageMutation.mutate,
        startChat: startChatMutation.mutateAsync
    };
}
