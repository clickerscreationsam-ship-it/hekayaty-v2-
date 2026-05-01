import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface Chapter {
    id: number;
    productId: number;
    title: string;
    content: string | null;
    orderIndex: number;
    createdAt: string;
}

function mapChapter(c: any): Chapter {
    return {
        id: c.id,
        productId: c.product_id,
        title: c.title,
        content: c.content,
        orderIndex: c.order_index,
        createdAt: c.created_at,
    };
}

export function useChapters(productId: number) {
    return useQuery({
        queryKey: ["chapters", productId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('chapters')
                .select('*')
                .eq('product_id', productId)
                .order('order_index', { ascending: true });

            if (error) throw error;
            return data.map(mapChapter);
        },
        enabled: !!productId,
    });
}

export function useChapter(id: number) {
    return useQuery({
        queryKey: ["chapter", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('chapters')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return mapChapter(data);
        },
        enabled: !!id,
    });
}

export function useCreateChapter() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { productId: number, title: string, content?: string, orderIndex?: number }) => {
            const { data: newChapter, error } = await supabase
                .from('chapters')
                .insert({
                    product_id: data.productId,
                    title: data.title,
                    content: data.content,
                    order_index: data.orderIndex ?? 0
                })
                .select()
                .single();

            if (error) throw error;
            return mapChapter(newChapter);
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ["chapters", vars.productId] });
            toast({ title: "Chapter created" });
        },
        onError: (err: any) => {
            toast({ title: "Failed to create chapter", description: err.message, variant: "destructive" });
        }
    });
}

export function useUpdateChapter() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { id: number, title?: string, content?: string, orderIndex?: number }) => {
            const updates: any = {};
            if (data.title !== undefined) updates.title = data.title;
            if (data.content !== undefined) updates.content = data.content;
            if (data.orderIndex !== undefined) updates.order_index = data.orderIndex;

            const { data: updated, error } = await supabase
                .from('chapters')
                .update(updates)
                .eq('id', data.id)
                .select()
                .single();

            if (error) throw error;
            return mapChapter(updated);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["chapters", data.productId] });
            queryClient.invalidateQueries({ queryKey: ["chapter", data.id] });
            toast({ title: "Chapter saved" });
        },
        onError: (err: any) => {
            toast({ title: "Failed to save chapter", description: err.message, variant: "destructive" });
        }
    });
}

export function useDeleteChapter() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: number) => {
            // First get the chapter to know the product ID for invalidation
            const { data: chapter } = await supabase
                .from('chapters')
                .select('product_id')
                .eq('id', id)
                .single();

            const { error } = await supabase
                .from('chapters')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return chapter;
        },
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: ["chapters", data.product_id] });
            }
            toast({ title: "Chapter deleted" });
        },
        onError: (err: any) => {
            toast({ title: "Failed to delete chapter", description: err.message, variant: "destructive" });
        }
    });
}
