import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

async function callEdgeFunction(
    functionName: string,
    data?: any,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'POST'
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

        const { data: responseData, error } = await supabase.functions.invoke(functionName, {
            method,
            body: data,
            headers
        });

        if (error) {
            console.error(`❌ Edge Function Error [${functionName}]:`, error);

            // Log full error details for debugging
            console.error('Full error:', JSON.stringify(error, null, 2));

            // Only retry on ACTUAL 401 unauthorized errors
            const status = (error as any).status || (error as any).context?.status;
            const isUnauthorized =
                status === 401 ||
                error.message?.toLowerCase().includes('jwt') ||
                error.message?.toLowerCase().includes('unauthorized');

            if (isUnauthorized) {
                console.log("🔄 401 detected in invoke (physical), refreshing session...");
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

// Fetch maker's physical product orders
export function useMakerOrders(status?: string) {
    return useQuery({
        queryKey: ['maker-orders', status],
        queryFn: async () => {
            const data = await callEdgeFunction('get-maker-orders', { status });
            return data.orders || [];
        },
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always'
    });
}

// Accept order mutation
export function useAcceptOrder() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { orderItemId: number; estimatedDeliveryDays: number }) => {
            return callEdgeFunction('accept-order', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maker-orders'] });
            toast({
                title: "Order Accepted",
                description: "Order has been accepted successfully"
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    });
}

// Reject order mutation
export function useRejectOrderItem() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { orderItemId: number; reason: string }) => {
            return callEdgeFunction('reject-order-item', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maker-orders'] });
            toast({
                title: "Order Rejected",
                description: "Order has been rejected"
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    });
}

// Update shipment mutation
export function useUpdateShipment() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { orderItemId: number; trackingNumber: string; carrier?: string }) => {
            return callEdgeFunction('update-shipment', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maker-orders'] });
            toast({
                title: "Shipment Updated",
                description: "Order marked as shipped with tracking number"
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    });
}

// TypeScript interfaces
export interface MakerOrder {
    orderItemId: number;
    orderId: number;
    productId: number;
    productTitle: string;
    productCoverUrl: string;
    price: number;
    quantity: number;
    fulfillmentStatus: string;
    trackingNumber: string | null;
    shippingAddress: {
        fullName: string;
        phoneNumber: string;
        city: string;
        addressLine: string;
    } | null;
    buyerName: string;
    buyerId: string;
    orderDate: string;
    acceptedAt: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    preparingAt: string | null;
    rejectedAt: string | null;
    rejectionReason: string | null;
    estimatedDeliveryDays: number | null;
    isVerified: boolean;
    orderStatus: string;
}

// === USER ORDER TRACKING HOOKS ===

// Fetch user's physical product orders
export function useUserOrders() {
    return useQuery({
        queryKey: ['user-orders'],
        queryFn: async () => {
            const data = await callEdgeFunction('get-user-orders', {});
            return data.orders || [];
        },
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always'
    });
}

// Fetch order notifications
export function useOrderNotifications(onlyUnread: boolean = false) {
    return useQuery({
        queryKey: ['order-notifications', onlyUnread],
        queryFn: async () => {
            const data = await callEdgeFunction('get-order-notifications', { onlyUnread });
            return data.notifications || [];
        },
        staleTime: 30000, // Refetch every 30 seconds
        refetchInterval: 30000
    });
}

// User order interfaces
export interface UserOrderItem {
    orderItemId: number;
    productTitle: string;
    productCoverUrl: string;
    productType: string;
    price: number;
    quantity: number;
    fulfillmentStatus: string;
    trackingNumber: string | null;
    estimatedDeliveryDays: number | null;
    makerName: string;
    makerId: string;
    shippedAt: string | null;
    deliveredAt: string | null;
    acceptedAt: string | null;
    preparingAt: string | null;
    rejectedAt: string | null;
    rejectionReason: string | null;
    statusHistory: Array<{
        status: string;
        note: string;
        timestamp: string;
    }>;
}

export interface UserOrder {
    orderId: number;
    orderDate: string;
    totalAmount: number;
    status: string;
    isVerified: boolean;
    paymentMethod: string;
    shippingAddress: {
        fullName: string;
        phoneNumber: string;
        city: string;
        addressLine: string;
    } | null;
    shippingCost: number;
    items: UserOrderItem[];
}

export interface OrderNotification {
    id: number;
    orderId: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

