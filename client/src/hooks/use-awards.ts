import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ============================================================
// Types
// ============================================================

export interface AwardWinner {
  id: number;
  awardId: number;
  category: "best_novel" | "best_writer" | "best_publisher";
  rank: number;
  winnerUserId?: string;
  winnerProductId?: number;
  specialNote?: string;
  badgeLabel?: string;
  // Enriched
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isVerified?: boolean;
    role?: string;
  };
  product?: {
    id: number;
    title: string;
    coverUrl: string;
    writerId: string;
    genre?: string;
    writer?: { displayName: string; username: string };
  };
}

export interface HekayatyAward {
  id: number;
  year: number;
  title: string;
  description?: string;
  status: "draft" | "published";
  createdBy: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  winners?: AwardWinner[];
}

export interface HallOfFameWriter {
  id: number;
  writerId: string;
  featuredReason?: string;
  achievementNote?: string;
  badgeLabel: string;
  displayOrder: number;
  addedAt: string;
  writer?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bannerUrl?: string;
    bio?: string;
    isVerified?: boolean;
    role?: string;
  };
}

// ============================================================
// Helper: enrich winners with user and product data
// ============================================================

async function enrichWinners(winners: any[]): Promise<AwardWinner[]> {
  if (!winners || winners.length === 0) return [];

  const userIds = winners.filter((w) => w.winner_user_id).map((w) => w.winner_user_id);
  const productIds = winners.filter((w) => w.winner_product_id).map((w) => w.winner_product_id);

  const [usersRes, productsRes] = await Promise.all([
    userIds.length
      ? supabase
          .from("users")
          .select("id, username, display_name, avatar_url, is_verified, role")
          .in("id", userIds)
      : Promise.resolve({ data: [] }),
    productIds.length
      ? supabase
          .from("products")
          .select("id, title, cover_url, writer_id, genre")
          .in("id", productIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Also get writer names for products
  const writerIds = (productsRes.data || []).map((p: any) => p.writer_id).filter(Boolean);
  const writersForProductsRes =
    writerIds.length > 0
      ? await supabase
          .from("users")
          .select("id, display_name, username")
          .in("id", writerIds)
      : { data: [] };

  const userMap: Record<string, any> = {};
  (usersRes.data || []).forEach((u: any) => {
    userMap[u.id] = { id: u.id, username: u.username, displayName: u.display_name, avatarUrl: u.avatar_url, isVerified: u.is_verified, role: u.role };
  });

  const writerMap: Record<string, any> = {};
  (writersForProductsRes.data || []).forEach((u: any) => {
    writerMap[u.id] = { displayName: u.display_name, username: u.username };
  });

  const productMap: Record<number, any> = {};
  (productsRes.data || []).forEach((p: any) => {
    productMap[p.id] = {
      id: p.id,
      title: p.title,
      coverUrl: p.cover_url,
      writerId: p.writer_id,
      genre: p.genre,
      writer: writerMap[p.writer_id],
    };
  });

  return winners.map((w: any) => ({
    id: w.id,
    awardId: w.award_id,
    category: w.category,
    rank: w.rank,
    winnerUserId: w.winner_user_id,
    winnerProductId: w.winner_product_id,
    specialNote: w.special_note,
    badgeLabel: w.badge_label,
    user: w.winner_user_id ? userMap[w.winner_user_id] : undefined,
    product: w.winner_product_id ? productMap[w.winner_product_id] : undefined,
  }));
}

// ============================================================
// Awards Queries
// ============================================================

export function usePublishedAwards() {
  return useQuery({
    queryKey: ["awards", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hekayaty_awards")
        .select("*")
        .eq("status", "published")
        .order("year", { ascending: false });
      if (error) throw error;
      return (data || []).map((a: any) => ({
        id: a.id,
        year: a.year,
        title: a.title,
        description: a.description,
        status: a.status,
        createdBy: a.created_by,
        publishedAt: a.published_at,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      })) as HekayatyAward[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllAwards() {
  return useQuery({
    queryKey: ["awards", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hekayaty_awards")
        .select("*")
        .order("year", { ascending: false });
      if (error) throw error;
      return (data || []).map((a: any) => ({
        id: a.id,
        year: a.year,
        title: a.title,
        description: a.description,
        status: a.status,
        createdBy: a.created_by,
        publishedAt: a.published_at,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      })) as HekayatyAward[];
    },
    staleTime: 30 * 1000,
  });
}

export function useAwardWinners(awardId: number | null) {
  return useQuery({
    queryKey: ["award-winners", awardId],
    queryFn: async () => {
      if (!awardId) return [];
      const { data, error } = await supabase
        .from("hekayaty_award_winners")
        .select("*")
        .eq("award_id", awardId)
        .order("rank", { ascending: true });
      if (error) throw error;
      return enrichWinners(data || []);
    },
    enabled: !!awardId,
    staleTime: 60 * 1000,
  });
}

export function useCreateAward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { year: number; title: string; description?: string }) => {
      const res = await fetch("/api/awards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awards"] });
    },
  });
}

export function useUpdateAward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number; title?: string; description?: string }) => {
      const res = await fetch(`/api/awards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awards"] });
    },
  });
}

export function usePublishAward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, publish }: { id: number; publish: boolean }) => {
      const res = await fetch(`/api/awards/${id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awards"] });
    },
  });
}

export function useDeleteAward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/awards/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awards"] });
    },
  });
}

export function useUpsertWinners() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ awardId, winners }: { awardId: number; winners: Partial<AwardWinner>[] }) => {
      const res = await fetch(`/api/awards/${awardId}/winners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winners }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (_data, { awardId }) => {
      queryClient.invalidateQueries({ queryKey: ["award-winners", awardId] });
    },
  });
}

export function useDeleteWinner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ winnerId, awardId }: { winnerId: number; awardId: number }) => {
      const res = await fetch(`/api/awards/winners/${winnerId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: (_data, { awardId }) => {
      queryClient.invalidateQueries({ queryKey: ["award-winners", awardId] });
    },
  });
}

// ============================================================
// Hall of Fame Queries
// ============================================================

export function useHallOfFame() {
  return useQuery({
    queryKey: ["hall-of-fame"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hall_of_fame_writers")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;

      if (!data || data.length === 0) return [];

      const writerIds = data.map((h: any) => h.writer_id);
      const { data: writers } = await supabase
        .from("users")
        .select("id, username, display_name, avatar_url, banner_url, bio, is_verified, role")
        .in("id", writerIds);

      const writerMap: Record<string, any> = {};
      (writers || []).forEach((w: any) => {
        writerMap[w.id] = {
          id: w.id,
          username: w.username,
          displayName: w.display_name,
          avatarUrl: w.avatar_url,
          bannerUrl: w.banner_url,
          bio: w.bio,
          isVerified: w.is_verified,
          role: w.role,
        };
      });

      return data.map((h: any) => ({
        id: h.id,
        writerId: h.writer_id,
        featuredReason: h.featured_reason,
        achievementNote: h.achievement_note,
        badgeLabel: h.badge_label,
        displayOrder: h.display_order,
        addedAt: h.added_at,
        writer: writerMap[h.writer_id],
      })) as HallOfFameWriter[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddToHallOfFame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { writerId: string; featuredReason?: string; achievementNote?: string; badgeLabel?: string }) => {
      const res = await fetch("/api/hall-of-fame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hall-of-fame"] });
    },
  });
}

export function useRemoveFromHallOfFame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/hall-of-fame/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hall-of-fame"] });
    },
  });
}

export function useUpdateHallOfFame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number; featuredReason?: string; achievementNote?: string; badgeLabel?: string; displayOrder?: number }) => {
      const res = await fetch(`/api/hall-of-fame/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hall-of-fame"] });
    },
  });
}

// ============================================================
// Badge check hooks (for profile pages)
// ============================================================

export function useWriterAwardBadges(writerId: string | undefined) {
  return useQuery({
    queryKey: ["writer-badges", writerId],
    queryFn: async () => {
      if (!writerId) return { awards: [], isHOF: false, hofBadge: "" };

      const [winnersRes, hofRes] = await Promise.all([
        supabase
          .from("hekayaty_award_winners")
          .select("*, hekayaty_awards!inner(year, status)")
          .eq("winner_user_id", writerId)
          .eq("hekayaty_awards.status", "published")
          .order("rank", { ascending: true }),
        supabase
          .from("hall_of_fame_writers")
          .select("badge_label")
          .eq("writer_id", writerId)
          .maybeSingle(),
      ]);

      return {
        awards: (winnersRes.data || []).map((w: any) => ({
          year: w.hekayaty_awards?.year,
          category: w.category,
          rank: w.rank,
          badgeLabel: w.badge_label,
        })),
        isHOF: !!hofRes.data,
        hofBadge: hofRes.data?.badge_label || "كاتب نخبة",
      };
    },
    enabled: !!writerId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useProductAwardBadge(productId: number | undefined) {
  return useQuery({
    queryKey: ["product-badge", productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data } = await supabase
        .from("hekayaty_award_winners")
        .select("rank, badge_label, special_note, hekayaty_awards!inner(year, status)")
        .eq("winner_product_id", productId)
        .eq("hekayaty_awards.status", "published")
        .order("rank", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!data) return null;
      return {
        year: (data as any).hekayaty_awards?.year,
        rank: (data as any).rank,
        badgeLabel: (data as any).badge_label,
      };
    },
    enabled: !!productId,
    staleTime: 10 * 60 * 1000,
  });
}
