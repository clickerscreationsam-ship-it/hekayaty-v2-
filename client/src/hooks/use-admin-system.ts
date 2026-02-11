import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, Database } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { AdminPrivateMessage, AdminAnnouncement, InsertAdminPrivateMessage, InsertAdminAnnouncement } from "@shared/schema";

type RowMsg = Database['public']['Tables']['admin_private_messages']['Row'];
type RowAnn = Database['public']['Tables']['admin_writer_announcements']['Row'];

function mapAdminMessage(m: RowMsg & { sender?: any; receiver?: any }) {
    return {
        id: m.id,
        senderId: m.sender_id,
        receiverId: m.receiver_id,
        content: m.content,
        isRead: m.is_read,
        createdAt: new Date(m.created_at),
        sender: m.sender,
        receiver: m.receiver,
    };
}

function mapAdminAnnouncement(a: RowAnn & { admin?: any }) {
    return {
        id: a.id,
        adminId: a.admin_id,
        title: a.title,
        content: a.content,
        isPinned: a.is_pinned,
        createdAt: new Date(a.created_at),
        admin: a.admin,
    };
}

// --- PRIVATE MESSAGES ---

export function useAdminPrivateMessages() {
    return useQuery({
        queryKey: ['admin-private-messages'],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from('admin_private_messages')
                .select(`
                    *,
                    sender:sender_id(display_name, avatar_url),
                    receiver:receiver_id(display_name, avatar_url)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data.map(mapAdminMessage) as (AdminPrivateMessage & { sender: any, receiver: any })[];
        }
    });
}

export function useSendAdminPrivateMessage() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (message: InsertAdminPrivateMessage) => {
            // Map camelCase back to snake_case for Supabase if necessary
            // supabase-js handles objects but keys must match the DB
            const { data, error } = await supabase
                .from('admin_private_messages')
                .insert([{
                    sender_id: message.senderId,
                    receiver_id: message.receiverId,
                    content: message.content,
                    is_read: message.isRead || false,
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-private-messages'] });
            toast({ title: "Message sent successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to send message", description: error.message, variant: "destructive" });
        }
    });
}

export function useMarkMessageRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (messageId: number) => {
            const { error } = await supabase
                .from('admin_private_messages')
                .update({ is_read: true })
                .eq('id', messageId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-private-messages'] });
        }
    });
}

// --- ANNOUNCEMENTS ---

export function useAdminAnnouncements() {
    return useQuery({
        queryKey: ['admin-announcements'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('admin_writer_announcements')
                .select(`
                    *,
                    admin:admin_id(display_name, avatar_url)
                `)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data.map(mapAdminAnnouncement) as (AdminAnnouncement & { admin: any })[];
        }
    });
}

export function useCreateAdminAnnouncement() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (announcement: InsertAdminAnnouncement) => {
            const { data, error } = await supabase
                .from('admin_writer_announcements')
                .insert([{
                    admin_id: announcement.adminId,
                    title: announcement.title,
                    content: announcement.content,
                    is_pinned: announcement.isPinned || false,
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
            toast({ title: "Announcement published" });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to publish", description: error.message, variant: "destructive" });
        }
    });
}

export function useDeleteAdminAnnouncement() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: number) => {
            const { error } = await supabase
                .from('admin_writer_announcements')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
            toast({ title: "Announcement deleted" });
        }
    });
}

