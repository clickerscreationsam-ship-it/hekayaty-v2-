import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export async function callEdgeFunction(
    functionName: string,
    data?: any,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'POST'
) {
    console.log(`🚀 callEdgeFunction: Calling ${functionName} [${method}]`, data);

    const performRetryWithFetch = async () => {
        console.log(`🔄 Attempting clean fetch fallback for ${functionName}...`);
        try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
            };

            if (currentSession?.access_token) {
                headers['Authorization'] = `Bearer ${currentSession.access_token}`;
            }

            const fetchOptions: RequestInit = {
                method,
                headers
            };
            if (data && method !== 'GET') {
                fetchOptions.body = JSON.stringify(data);
            }
            const response = await fetch(url, fetchOptions);
            if (response.ok) {
                console.log(`✅ Clean fetch fallback success for ${functionName}`);
                return await response.json();
            }
            console.error(`❌ Clean fetch fallback failed (${response.status}) for ${functionName}`);
        } catch (e) {
            console.error(`❌ Exception in clean fetch fallback:`, e);
        }
        return null;
    };

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

        if (data && method !== 'GET') {
            invokeOptions.body = data;
        }

        const { data: responseData, error } = await supabase.functions.invoke(functionName, invokeOptions);

        if (error) {
            console.error(`❌ Edge Function Error [${functionName}]:`, error);

            const status = (error as any).status || (error as any).context?.status;
            const errorMessage = error.message?.toLowerCase() || "";
            const isUnauthorized = status === 401 || status === 403 ||
                errorMessage.includes("unauthorized") ||
                errorMessage.includes("jwt") ||
                errorMessage.includes("invalid session");

            if (isUnauthorized) {
                console.log(`🔄 401/Unauthorized detected for ${functionName}. Attempting session refresh...`);

                // Strategy 1: Refresh Session
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

                if (!refreshError && refreshData.session) {
                    console.log(`✅ Session refreshed. Retrying ${functionName} with new token...`);
                    const { data: retryData, error: retryError } = await supabase.functions.invoke(functionName, {
                        method,
                        body: data,
                        headers: {
                            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${refreshData.session.access_token}`
                        }
                    });
                    if (!retryError) return retryData;
                    console.error(`❌ Retry with new token failed:`, retryError);

                    // If retry failed, try to get specific error from body
                    if ((retryError as any).context) {
                        try {
                            const body = await (retryError as any).context.json();
                            if (body.error || body.details) {
                                throw new Error(`${body.error}${body.details ? `: ${body.details}` : ''}`);
                            }
                        } catch (e) { }
                    }
                }

                // Strategy 2: Clean Fetch Fallback (Last resort)
                const fallbackData = await performRetryWithFetch();
                if (fallbackData) return fallbackData;
            }

            // Extract more details if possible from the error object
            let finalMessage = error.message;
            if ((error as any).context && (error as any).context.status) {
                try {
                    // Try to get the actual error message from the response if available
                    // Note: Supabase FunctionsHttpError doesn't always expose the body easily here
                } catch (e) { }
            }

            throw new Error(finalMessage || `Failed to call ${functionName}`);
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

// Calculate Shipping
export function useCalculateShippingEdge() {
    return useMutation({
        mutationFn: async (data: { items: any[], city: string }) => {
            return callEdgeFunction('calculate-shipping', data);
        }
    });
}

// Checkout
export function useCheckoutEdge() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: {
            items: any[],
            totalAmount: number,
            paymentMethod?: string,
            paymentProofUrl?: string | null,
            paymentReference?: string | null,
            shippingAddress?: any,
            shippingCost?: number,
            shippingBreakdown?: any[]
        }) => {
            return callEdgeFunction('checkout', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
            queryClient.invalidateQueries({ queryKey: ["/api/orders/user"] });
            toast({ title: "Order Successful", description: "Thank you for your purchase!" });
        },
        onError: (error: Error) => {
            toast({
                title: "Checkout Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    });
}

// Request Payout
export function useRequestPayoutEdge() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { amount: number, method?: string }) => {
            return callEdgeFunction('request-payout', data);
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

// Earnings Overview
export function useEarningsOverviewEdge() {
    return useQuery({
        queryKey: ['earnings-overview'],
        queryFn: async () => {
            return callEdgeFunction('earnings-overview', undefined, 'GET');
        },
    });
}

// Seller Orders
export function useSellerOrdersEdge() {
    return useQuery({
        queryKey: ['seller-orders'],
        queryFn: async () => {
            return callEdgeFunction('seller-orders', undefined, 'GET');
        },
    });
}

// Update Fulfillment
export function useUpdateFulfillmentEdge() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: {
            orderItemId: number,
            status: string,
            trackingNumber?: string
        }) => {
            return callEdgeFunction('update-fulfillment', data);
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

// Admin: Verify Payment
export function useVerifyPaymentEdge() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { orderId: number }) => {
            return callEdgeFunction('verify-payment', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
            toast({ title: "Payment Verified", description: "Order has been verified and earnings created." });
        },
        onError: (error: Error) => {
            toast({
                title: "Verification Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    });
}
