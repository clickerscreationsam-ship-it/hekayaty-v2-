import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { callEdgeFunction } from "./use-edge-functions";

// Deployment Trigger: 2026-02-24 - Library Fixes

export function useUserOrders() {
    return useQuery({
        queryKey: ["/api/orders/user"],
        queryFn: async () => {
            try {
                const data = await callEdgeFunction('get-user-orders', {});
                return mapOrders(data?.orders || []);
            } catch (error) {
                console.error('[useUserOrders] Error fetching orders:', error);
                return [];
            }
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
    if (!Array.isArray(orders)) return [];

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
            productId: item.productId,
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
                title: item.productTitle || 'Unknown Product',
                coverUrl: item.productCoverUrl || '',
                type: item.productType || 'unknown',
                genre: null,
                description: null
            }
        }))
    }));
}
