import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "/api";

export interface SpotlightProduct {
  id: number;
  title: string;
  description?: string;
  coverUrl?: string;
  cover_url?: string;
  price?: number;
  type?: string;
  genre?: string;
  writerId?: string;
  writer_id?: string;
  rating?: number;
  reviewCount?: number;
}

export interface SpotlightItem {
  id: number;
  productId: number;
  product_id?: number;
  badge: string;
  editorialNote?: string;
  editorial_note?: string;
  orderIndex: number;
  order_index?: number;
  isActive: boolean;
  is_active?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  product?: SpotlightProduct;
}

export interface AddSpotlightPayload {
  productId: number;
  badge: string;
  editorialNote?: string;
  orderIndex?: number;
  isActive?: boolean;
}

export interface UpdateSpotlightPayload {
  badge?: string;
  editorialNote?: string;
  orderIndex?: number;
  isActive?: boolean;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const userId = (window as any).__supabase_user_id || localStorage.getItem("supabase_user_id");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (userId) headers["x-user-id"] = userId;

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// === Public Hooks ===

/** Fetch active spotlight items for homepage/public pages */
export function useSpotlight() {
  return useQuery<SpotlightItem[]>({
    queryKey: ["spotlight", "public"],
    queryFn: () => apiFetch<SpotlightItem[]>(`${API_BASE}/spotlight`),
    staleTime: 60_000, // 1 minute
  });
}

/** Check if a specific product is in the spotlight (for product detail pages) */
export function useProductSpotlightStatus(productId: number | undefined) {
  return useQuery<SpotlightItem | null>({
    queryKey: ["spotlight", "product", productId],
    queryFn: () =>
      apiFetch<SpotlightItem>(`${API_BASE}/spotlight/product/${productId}`).catch(
        (err) => (err.message?.includes("404") || err.message?.includes("not found") ? null : Promise.reject(err))
      ),
    enabled: !!productId,
    staleTime: 60_000,
  });
}

// === Admin Hooks ===

/** Fetch all spotlight items (including inactive) for admin panel */
export function useAdminSpotlight() {
  return useQuery<SpotlightItem[]>({
    queryKey: ["spotlight", "admin"],
    queryFn: () => apiFetch<SpotlightItem[]>(`${API_BASE}/admin/spotlight`),
  });
}

/** Hook with all admin mutations */
export function useSpotlightMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["spotlight"] });
  };

  const add = useMutation({
    mutationFn: (payload: AddSpotlightPayload) =>
      apiFetch<SpotlightItem>(`${API_BASE}/admin/spotlight`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "تمت الإضافة ✨", description: "تمت إضافة الكتاب إلى Spotlight بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, ...payload }: UpdateSpotlightPayload & { id: number }) =>
      apiFetch<SpotlightItem>(`${API_BASE}/admin/spotlight/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "تم التحديث ✅", description: "تم تحديث عنصر Spotlight بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`${API_BASE}/admin/spotlight/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast({ title: "تمت الإزالة", description: "تم إزالة الكتاب من Spotlight" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  return { add, update, remove };
}
