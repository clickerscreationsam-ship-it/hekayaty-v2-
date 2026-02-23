import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export async function callEdgeFunction(
    functionName: string,
    data?: any,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'POST'
) {
    console.log(`🚀 callEdgeFunction: ${functionName} [${method}]`, data);

    const performRequest = async (token?: string) => {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }
        }

        const options: RequestInit = { method, headers };
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        const responseText = await response.text();

        let responseData: any;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = { error: responseText || `Status ${response.status}` };
        }

        if (!response.ok) {
            const errorMsg = responseData.error || responseData.details || `Error ${response.status}`;
            throw { message: errorMsg, status: response.status, body: responseData };
        }

        return responseData;
    };

    try {
        return await performRequest();
    } catch (err: any) {
        // Handle 401/403 with a refresh attempt
        if (err.status === 401 || err.status === 403) {
            console.warn(`🔄 401 detected for ${functionName}. Refreshing session...`);
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

            if (!refreshError && refreshData.session) {
                console.log(`✅ Session refreshed. Retrying ${functionName}...`);
                try {
                    return await performRequest(refreshData.session.access_token);
                } catch (retryErr: any) {
                    const finalMsg = retryErr.body?.details || retryErr.message;
                    throw new Error(finalMsg);
                }
            }
        }

        throw new Error(err.message || `Failed to call ${functionName}`);
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
