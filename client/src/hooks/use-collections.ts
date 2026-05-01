import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function useCollections(filters?: { writerId?: string; isPublished?: boolean }) {
    return useQuery({
        queryKey: ["collections", filters],
        queryFn: async () => {
            let query = supabase
                .from('collections')
                .select(`
          *,
          items:collection_items(
            id,
            story_id,
            order_index,
            story:products(*)
          )
        `)
                .is('deleted_at', null);

            if (filters?.writerId) query = query.eq('writer_id', filters.writerId);
            if (filters?.isPublished !== undefined) query = query.eq('is_published', filters.isPublished);

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
    });
}

export function useCollection(id: string) {
    return useQuery({
        queryKey: ["collection", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('collections')
                .select(`
          *,
          items:collection_items(
            id,
            story_id,
            order_index,
            story:products(*)
          )
        `)
                .eq('id', id)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateCollection() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: any) => {
            const { storyIds, ...collectionData } = data;

            const { data: newCollection, error } = await supabase
                .from('collections')
                .insert(collectionData)
                .select()
                .single();

            if (error) throw error;

            if (storyIds && storyIds.length > 0) {
                const items = storyIds.map((storyId: number, index: number) => ({
                    collection_id: newCollection.id,
                    story_id: storyId,
                    order_index: index
                }));

                const { error: itemsError } = await supabase
                    .from('collection_items')
                    .insert(items);

                if (itemsError) throw itemsError;
            }

            return newCollection;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["collections"] });
            toast({ title: "Collection created successfully" });
        },
        onError: (err: any) => {
            toast({ title: "Failed to create collection", description: err.message, variant: "destructive" });
        }
    });
}

export function useUpdateCollection() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, storyIds, ...data }: { id: string, storyIds?: number[] } & any) => {
            const { data: updated, error } = await supabase
                .from('collections')
                .update(data)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            if (storyIds !== undefined) {
                // Simple strategy: delete and re-insert items for ordering
                await supabase.from('collection_items').delete().eq('collection_id', id);

                if (storyIds.length > 0) {
                    const items = storyIds.map((storyId: number, index: number) => ({
                        collection_id: id,
                        story_id: storyId,
                        order_index: index
                    }));

                    await supabase.from('collection_items').insert(items);
                }
            }

            return updated;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["collections"] });
            queryClient.invalidateQueries({ queryKey: ["collection", variables.id] });
            toast({ title: "Collection updated" });
        },
    });
}

export function useDeleteCollection() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('collections')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["collections"] });
            toast({ title: "Collection deleted (moved to trash)" });
        },
    });
}
