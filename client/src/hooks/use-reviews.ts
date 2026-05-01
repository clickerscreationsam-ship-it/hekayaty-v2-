import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { InsertReview } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useReviews(productId: number) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, user:users(display_name, avatar_url)')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(r => ({
        ...r,
        userId: r.user_id,
        productId: r.product_id,
        createdAt: r.created_at,
        user: r.user ? {
          displayName: (r.user as any).display_name,
          avatarUrl: (r.user as any).avatar_url
        } : null
      }));
    },
    enabled: !!productId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertReview) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Must be logged in");

      const { data: newReview, error } = await supabase
        .from('reviews')
        .upsert({
          product_id: data.productId,
          user_id: user.id,
          rating: data.rating,
          comment: data.comment
        }, { onConflict: 'user_id, product_id' })
        .select()
        .single();

      if (error) throw error;

      return newReview;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] }); // Invalidate all product lists
      queryClient.invalidateQueries({ queryKey: ["product", variables.productId] }); // Invalidate single product
      toast({ title: "Review submitted!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}
