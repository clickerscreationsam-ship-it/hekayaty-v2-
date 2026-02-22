import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { supabase } from "@/lib/supabase";
import { Notification, NotificationSettings } from "@shared/schema";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";

export function useNotifications() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: notifications = [], isLoading } = useQuery<Notification[]>({
        queryKey: ["/api/notifications"],
        enabled: !!user,
    });

    const { data: settings } = useQuery<NotificationSettings>({
        queryKey: ["/api/notification-settings"],
        enabled: !!user,
    });

    // Mark single as read
    const markRead = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("PATCH", `/api/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        },
    });

    // Mark all as read
    const markAllRead = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/notifications/read-all");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        },
    });

    // Realtime subscription
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`user_notifications_${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotif = payload.new as Notification;

                    // Refetch to stay in sync with server state
                    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });

                    // Visual toast for high priority
                    if (newNotif.priority === 'high') {
                        toast({
                            title: newNotif.title,
                            description: newNotif.content,
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, queryClient, toast]);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
        notifications,
        settings,
        unreadCount,
        isLoading,
        markRead: (id: number) => markRead.mutate(id),
        markAllRead: () => markAllRead.mutate(),
    };
}
