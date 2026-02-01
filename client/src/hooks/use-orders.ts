import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Order } from "@shared/schema";

// Helper to fetch user orders with strict typing
export function useUserOrders() {
    return useQuery({
        queryKey: ["/api/orders/user"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          order_items (
            *,
            product:products (*)
          )
        `)
                .eq('user_id', user.id)
                .eq('status', 'paid') // Only show paid/approved orders
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map to camelCase
            return data.map(order => ({
                id: order.id,
                userId: order.user_id,
                totalAmount: order.total_amount,
                status: order.status,
                paymentMethod: order.payment_method,
                paymentProofUrl: order.payment_proof_url,
                paymentReference: order.payment_reference,
                isVerified: order.is_verified,
                shippingAddress: order.shipping_address,
                shippingCost: order.shipping_cost,
                createdAt: order.created_at,
                order_items: order.order_items.map((item: any) => ({
                    id: item.id,
                    orderId: item.order_id,
                    productId: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                    fulfillmentStatus: item.fulfillment_status,
                    product: item.product ? {
                        id: item.product.id,
                        title: item.product.title,
                        coverUrl: item.product.cover_url,
                        type: item.product.type,
                        genre: item.product.genre,
                        description: item.product.description
                    } : null
                }))
            }));
        }
    });
}
