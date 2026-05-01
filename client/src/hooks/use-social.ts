import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export function useLikeProduct() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (productId: number) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Must be logged in");

            // Check if already liked
            const { data: existing } = await supabase
                .from('likes')
                .select('*')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .maybeSingle();

            if (existing) {
                // Unlike
                const { error } = await supabase
                    .from('likes')
                    .delete()
                    .eq('id', existing.id);
                if (error) throw error;
                return { isLiked: false };
            } else {
                // Like
                const { error } = await supabase
                    .from('likes')
                    .insert({ user_id: user.id, product_id: productId });
                if (error) throw error;
                return { isLiked: true };
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["likes"] });
            toast({
                title: data.isLiked ? "Liked!" : "Unliked",
                description: data.isLiked ? "Added to your favorites." : "Removed from favorites."
            });
        }
    });
}
