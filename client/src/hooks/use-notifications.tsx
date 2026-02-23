import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { supabase } from "@/lib/supabase";
import { Notification, NotificationSettings } from "@shared/schema";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";
import { useLocation } from "wouter";
import { ToastAction } from "@/components/ui/toast";

export function useNotifications() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [, setLocation] = useLocation();

    const { data: notifications = [], isLoading } = useQuery<Notification[]>({
        queryKey: ["/api/notifications"],
        enabled: !!user,
    });

    const { data: settings } = useQuery<NotificationSettings>({
        queryKey: ["/api/notification-settings"],
        enabled: !!user,
    });

    const markRead = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("PATCH", `/api/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        },
    });

    const markAllRead = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/notifications/read-all");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        },
    });

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
                    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });

                    if (newNotif.priority === 'high') {
                        toast({
                            title: newNotif.title,
                            description: newNotif.content,
                            variant: "premium",
                            action: newNotif.link ? (
                                <ToastAction
                                    altText="View"
                                    className="h-8 bg-primary text-black hover:bg-primary/90 font-bold px-3 transition-all active:scale-95 border-none"
                                    onClick={() => {
                                        if (newNotif.link) setLocation(newNotif.link);
                                        markRead.mutate(newNotif.id);
                                    }}
                                >
                                    {newNotif.type === 'commerce' ? 'Order' :
                                        newNotif.type === 'store' ? 'Chat' : 'View'}
                                </ToastAction>
                            ) : undefined,
                            duration: 5000,
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, queryClient, toast, setLocation, markRead]);

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
