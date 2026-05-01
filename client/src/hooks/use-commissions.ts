import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Portfolio, InsertPortfolio, DesignRequest, InsertDesignRequest, DesignMessage, InsertDesignMessage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// --- Portfolio Hooks ---
export function usePortfolios(artistId?: string, category?: string, page: number = 1) {
    return useQuery<{ data: Portfolio[], total: number, page: number }>({
        queryKey: ["/api/portfolios", artistId, category, page],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "12"
            });
            if (artistId) params.append("artistId", artistId);
            if (category) params.append("category", category);

            const res = await fetch(`/api/portfolios?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch portfolios");
            return res.json();
        }
    });
}

export function useCreatePortfolio() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: InsertPortfolio) => {
            const res = await apiRequest("POST", "/api/portfolios", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
            toast({ title: "Portfolio Item Added", description: "Your work has been added to your portfolio." });
        }
    });
}

export function useDeletePortfolio() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiRequest("DELETE", `/api/portfolios/${id}`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
            toast({ title: "Portfolio Item Deleted", description: "The work has been removed from your portfolio." });
        },
        onError: (err: any) => {
            toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
        }
    });
}

// --- Commission / Design Request Hooks ---
export function useDesignRequests(params: { clientId?: string; artistId?: string; status?: string; page?: number }) {
    const page = params.page || 1;
    const limit = 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    return useQuery<{ data: DesignRequest[], total: number, page: number }>({
        queryKey: ["/api/design-requests", params],
        queryFn: async () => {
            // Use Supabase directly — the Express server uses Passport session auth
            // which is NOT available on Vercel (we use Supabase JWT instead)
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Fetch design_requests WITHOUT FK joins (having 2 FKs to same table
            // causes PostgREST 400 with the users!client_id syntax)
            let query = supabase
                .from('design_requests')
                .select('*', { count: 'exact' });

            // Filter: show only requests where user is client or artist
            if (params.clientId) {
                query = query.eq('client_id', params.clientId);
            } else if (params.artistId) {
                query = query.eq('artist_id', params.artistId);
            } else {
                query = query.or(`client_id.eq.${user.id},artist_id.eq.${user.id}`);
            }

            if (params.status) query = query.eq('status', params.status);

            const { data: rawData, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw new Error(error.message);

            // Enrich with user names via a single lookup
            const rawIds = [
                ...(rawData || []).map((r: any) => r.client_id),
                ...(rawData || []).map((r: any) => r.artist_id)
            ].filter(Boolean);
            const allUserIds = Array.from(new Set(rawIds));

            let usersMap: Record<string, { id: string; display_name: string; avatar_url: string | null }> = {};
            if (allUserIds.length > 0) {
                const { data: usersData } = await supabase
                    .from('users')
                    .select('id, display_name, avatar_url')
                    .in('id', allUserIds);
                (usersData || []).forEach((u: any) => { usersMap[u.id] = u; });
            }

            const data = (rawData || []).map((r: any) => ({
                ...r,
                client: usersMap[r.client_id] || null,
                artist: usersMap[r.artist_id] || null,
            }));

            return { data, total: count || 0, page };
        }
    });
}

export function useDesignRequest(id: string) {
    return useQuery<DesignRequest & { messages: DesignMessage[] }>({
        queryKey: ["/api/design-requests", id],
        queryFn: async () => {
            const res = await fetch(`/api/design-requests/${id}`);
            if (!res.ok) throw new Error("Failed to fetch design request details");
            return res.json();
        },
        enabled: !!id
    });
}

export function useCreateDesignRequest() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: InsertDesignRequest) => {
            const res = await apiRequest("POST", "/api/design-requests", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/design-requests"] });
            toast({ title: "Request Sent", description: "The artist has been notified of your request." });
        },
        onError: (err: any) => {
            console.error("Commission Error:", err);
            toast({
                title: "Failed to start request",
                description: err.message || "An unexpected error occurred",
                variant: "destructive"
            });
        }
    });
}

export function useUpdateRequestStatus() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ requestId, status, escrowLocked, finalFileUrl }: { requestId: string; status: string; escrowLocked?: boolean, finalFileUrl?: string }) => {
            const res = await apiRequest("PATCH", `/api/design-requests/${requestId}`, { status, escrowLocked, finalFileUrl });
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/design-requests"] });
            toast({ title: "Status Updated", description: `Request status changed to ${data.status.replace('_', ' ')}` });
        },
        onError: (err: any) => {
            toast({ title: "Update Failed", description: err.message, variant: "destructive" });
        }
    });
}

export function useUpdateRequestDetails() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ requestId, ...data }: { requestId: string; title?: string; description?: string; budget?: number; status?: string; paymentProofUrl?: string; paymentReference?: string }) => {
            const res = await apiRequest("PATCH", `/api/design-requests/${requestId}`, data);
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/design-requests"] });
            toast({ title: "Details Updated", description: "The project terms have been updated." });
        },
        onError: (err: any) => {
            toast({ title: "Update Failed", description: err.message, variant: "destructive" });
        }
    });
}

export function useArtistAnalytics() {
    return useQuery<{ totalCommissions: number, revenue: number, completionRate: number, activeProject: number }>({
        queryKey: ["/api/artist/analytics"],
        queryFn: async () => {
            const res = await fetch("/api/artist/analytics");
            if (!res.ok) throw new Error("Failed to fetch analytics");
            return res.json();
        }
    });
}

export function useSendDesignMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: InsertDesignMessage) => {
            const res = await apiRequest("POST", "/api/design-messages", data);
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["/api/design-requests", variables.requestId] });
        }
    });
}
