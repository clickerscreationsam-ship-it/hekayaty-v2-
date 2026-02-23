import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Fetches the current user's orders via the get-user-orders Edge Function.
 * We use the Edge Function (service role) instead of querying Supabase directly
 * because the orders.user_id column is TEXT while auth.uid() returns UUID —
 * the RLS type mismatch causes direct queries to silently return empty results.
 */
export function useUserOrders() {
    return useQuery({
        queryKey: ["/api/orders/user"],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return [];

            const { data, error } = await supabase.functions.invoke('get-user-orders', {
                method: 'POST',
                body: {},
            });

            if (error) {
                console.error('[useUserOrders] Edge function error:', error);
                // Attempt session refresh and retry once
                const { data: refreshed } = await supabase.auth.refreshSession();
                if (refreshed.session) {
                    const { data: retryData } = await supabase.functions.invoke('get-user-orders', {
                        method: 'POST',
                        body: {},
                    });
                    if (retryData?.orders) return mapOrders(retryData.orders);
                }
                return [];
            }

            if (data?.error) {
                console.error('[useUserOrders] Logical error:', data.error);
                return [];
            }

            return mapOrders(data?.orders || []);
        },
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always'
    });
}

/**
 * Maps the edge function response format to the shape used by Dashboard components.
 * Edge function returns: { orderId, orderDate, totalAmount, items: [{orderItemId, productTitle, ...}] }
 * Dashboard expects:     { id, createdAt, totalAmount, isVerified, order_items: [{product: {title, coverUrl}}] }
 */
function mapOrders(orders: any[]) {
    return orders.map(order => ({
        id: order.orderId,
        userId: null,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentProofUrl: null,
        paymentReference: null,
        isVerified: order.isVerified,
        shippingAddress: order.shippingAddress,
        shippingCost: order.shippingCost,
        createdAt: order.orderDate,
        order_items: (order.items || []).map((item: any) => ({
            id: item.orderItemId,
            orderId: order.orderId,
            productId: item.makerId,
            quantity: item.quantity,
            price: item.price,
            fulfillmentStatus: item.fulfillmentStatus,
            trackingNumber: item.trackingNumber,
            estimatedDeliveryDays: item.estimatedDeliveryDays,
            makerName: item.makerName,
            shippedAt: item.shippedAt,
            acceptedAt: item.acceptedAt,
            product: {
                id: item.productId,
                collectionId: item.collectionId,
                title: item.productTitle,
                coverUrl: item.productCoverUrl,
                type: item.productType,
                genre: null,
                description: null
            }
        }))
    }));
}
