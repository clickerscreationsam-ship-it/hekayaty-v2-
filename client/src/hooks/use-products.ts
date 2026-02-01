import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type ProductRow = Database['public']['Tables']['products']['Row'];
type InsertProduct = Database['public']['Tables']['products']['Insert'];

function mapProduct(p: ProductRow) {
  return {
    id: p.id,
    writerId: p.writer_id,
    title: p.title,
    description: p.description,
    coverUrl: p.cover_url,
    fileUrl: p.file_url,
    type: p.type,
    genre: p.genre,
    isPublished: p.is_published ?? false,
    rating: p.rating ?? 0,
    reviewCount: p.review_count ?? 0,
    price: p.price,
    licenseType: p.license_type ?? 'personal',
    content: p.content, // Map content field
    // Physical Fields
    stockQuantity: p.stock_quantity,
    weight: p.weight,
    requiresShipping: p.requires_shipping ?? false,
    salesCount: (p as any).sales_count ?? 0,
    appearanceSettings: p.appearance_settings,
    createdAt: p.created_at,
    updatedAt: (p as any).updated_at,
  } as any;
}

export function useProducts(filters?: { writerId?: string; genre?: string; search?: string; type?: string }) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*');

      if (filters?.writerId) query = query.eq('writer_id', filters.writerId);
      if (filters?.genre) query = query.eq('genre', filters.genre);
      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.search) query = query.ilike('title', `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;

      return data.map(mapProduct);
    },
  });
}

export function useBestSellerProducts(limit = 4) {
  return useQuery({
    queryKey: ["products", "best-sellers", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('review_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data.map(mapProduct);
    },
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return mapProduct(data);
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      // Map camelCase to snake_case
      const dbData = {
        writer_id: data.writerId,
        title: data.title,
        description: data.description,
        cover_url: data.coverUrl || 'https://placehold.co/400x600',
        file_url: data.fileUrl,
        type: data.type,
        genre: data.genre || 'fantasy',
        is_published: data.isPublished,
        price: data.price,
        license_type: data.licenseType,
        content: data.content,
        // Physical fields
        stock_quantity: data.stockQuantity,
        weight: data.weight,
        requires_shipping: data.requiresShipping,
        appearance_settings: data.appearanceSettings,
      };

      const { data: newProduct, error } = await supabase
        .from('products')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;
      return mapProduct(newProduct);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product created successfully" });
    },
    onError: (err) => {
      toast({ title: "Failed to create product", description: err.message, variant: "destructive" });
    }
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & any) => {
      const dbData: any = {};
      if (data.title) dbData.title = data.title;
      if (data.description) dbData.description = data.description;
      if (data.coverUrl) dbData.cover_url = data.coverUrl;
      if (data.fileUrl) dbData.file_url = data.fileUrl;
      if (data.type) dbData.type = data.type;
      if (data.genre) dbData.genre = data.genre;
      if (data.isPublished !== undefined) dbData.is_published = data.isPublished;
      if (data.price) dbData.price = data.price;
      if (data.licenseType) dbData.license_type = data.licenseType;
      if (data.content) dbData.content = data.content;
      // Physical fields
      if (data.stockQuantity !== undefined) dbData.stock_quantity = data.stockQuantity;
      if (data.weight !== undefined) dbData.weight = data.weight;
      if (data.requiresShipping !== undefined) dbData.requires_shipping = data.requiresShipping;
      if (data.appearanceSettings) dbData.appearance_settings = data.appearanceSettings;

      const { data: updated, error } = await supabase
        .from('products')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapProduct(updated);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
      toast({ title: "Product updated" });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product deleted" });
    },
  });
}
