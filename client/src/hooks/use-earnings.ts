import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

async function callEdgeFunction(
    functionName: string,
    data?: any,
    method: 'GET' | 'POST' = 'GET'
) {
    console.log(`🚀 callEdgeFunction: Calling ${functionName} [${method}]`, data);

    try {
        const { data: { session } } = await supabase.auth.getSession();

        const headers: Record<string, string> = {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        };

        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const invokeOptions: any = {
            method,
            headers
        };

        if (method !== 'GET') {
            invokeOptions.body = data;
        }

        const { data: responseData, error } = await supabase.functions.invoke(functionName, invokeOptions);

        if (error) {
            console.error(`❌ Edge Function Error [${functionName}]:`, error);
            console.error('Full error:', JSON.stringify(error, null, 2));

            // Only retry on ACTUAL 401 unauthorized errors
            const status = (error as any).status || (error as any).context?.status;
            const isUnauthorized =
                status === 401 ||
                error.message?.toLowerCase().includes('jwt') ||
                error.message?.toLowerCase().includes('unauthorized');

            if (isUnauthorized) {
                console.log("🔄 401 detected in invoke (earnings), refreshing session...");
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

                if (!refreshError && refreshData.session) {
                    console.log("✅ Session refreshed, retrying invoke...");

                    const retryHeaders: Record<string, string> = {
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${refreshData.session.access_token}`
                    };

                    const { data: retryData, error: retryError } = await supabase.functions.invoke(functionName, {
                        method,
                        body: data,
                        headers: retryHeaders
                    });

                    if (!retryError) return retryData;
                }
            }
            throw new Error(error.message || `Failed to call ${functionName}`);
        }

        if (responseData && responseData.error) {
            console.error(`❌ Edge Function returned logical error [${functionName}]:`, responseData.error);
            throw new Error(responseData.error);
        }

        console.log(`✅ callEdgeFunction Success [${functionName}]:`, responseData);
        return responseData;
    } catch (err: any) {
        console.error(`❌ callEdgeFunction Exception [${functionName}]:`, err);
        throw err;
    }
}

// Get earnings overview using Edge Function
export function useEarnings(user: any) {
    console.log("🛠️ useEarnings Hook Render:", { hasUser: !!user, userId: user?.id });

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['earnings-overview', user?.id],
        queryFn: async () => {
            console.log(`🚀 useEarnings: STARTING FETCH for ${user?.id}...`);
            return callEdgeFunction('earnings-overview', {}, 'GET');
        },
        enabled: !!user?.id,
        staleTime: 0, // Always fetch fresh
        initialData: {
            totalEarnings: 0,
            totalGross: 0,
            totalUnitsSold: 0,
            totalCommission: 0,
            totalPaidOut: 0,
            pendingPayouts: 0,
            availableBalance: 0,
            recentEarnings: [],
            payoutHistory: []
        }
    });

    return {
        totalEarnings: data?.totalEarnings || 0,
        totalGross: data?.totalGross || 0,
        totalUnitsSold: data?.totalUnitsSold || 0,
        totalCommission: data?.totalCommission || 0,
        totalPaid: data?.totalPaidOut || 0,
        currentBalance: data?.availableBalance || 0,
        recentEarnings: data?.recentEarnings || [],
        payoutHistory: data?.payoutHistory || [],
        isLoading,
        error,
        refetch
    };
}

// Get seller orders using Edge Function
export function useSellerOrders() {
    return useQuery({
        queryKey: ['seller-orders'],
        queryFn: async () => {
            return callEdgeFunction('seller-orders');
        },
    });
}

// Request payout using Edge Function
export function useRequestPayout() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (vars: { amount: number, method: string, methodDetails: string }) => {
            return callEdgeFunction('request-payout', vars, 'POST');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['earnings-overview'] });
            queryClient.invalidateQueries({ queryKey: ['payouts'] });
            toast({ title: "Payout Requested", description: "Your payout will be processed soon." });
        },
        onError: (error: Error) => {
            toast({
                title: "Payout Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    });
}

// Update order fulfillment using Edge Function
export function useUpdateFulfillment() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: {
            orderItemId: number,
            status: string,
            trackingNumber?: string
        }) => {
            return callEdgeFunction('update-fulfillment', data, 'POST');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
            toast({ title: "Order Updated", description: "Fulfillment status updated successfully." });
        },
        onError: (error: Error) => {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    });
}

// Get payouts from Supabase (direct query with RLS)
export function usePayouts() {
    return useQuery({
        queryKey: ['payouts'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('payouts')
                .select('*')
                .eq('user_id', user.id)
                .order('requested_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(p => ({
                ...p,
                requestedAt: p.requested_at,
                processedAt: p.processed_at
            }));
        },
        initialData: []
    });
}
