import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

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

            const { error } = await supabase
                .from('private_chat_messages')
                .insert({
                    chat_id: chatId,
                    sender_id: user.id,
                    content
                });

            if (error) throw error;

            // Update chat timestamp
            await supabase.from('private_chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);

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

            // Check existing
            const { data: existing } = await supabase
                .from('private_chats')
                .select('id')
                .eq('user_id', user.id)
                .eq('artist_id', artistId)
                .single();

            if (existing) return existing.id;

            // Create new
            const { data: newChat, error } = await supabase
                .from('private_chats')
                .insert({ user_id: user.id, artist_id: artistId })
                .select()
                .single();

            if (error) throw error;
            return newChat.id;
        }
    });

    return {
        messages,
        isLoading,
        sendMessage: sendMessageMutation.mutate,
        startChat: startChatMutation.mutateAsync
    };
}
