import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export type SellerOrderItem = {
    id: number;
    order_id: number;
    product_id: number;
    quantity: number;
    price: number;
    fulfillment_status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
    tracking_number?: string;
    shipped_at?: string;
    order: {
        id: number;
        created_at: string;
        status: string;
        shipping_address: {
            fullName: string;
            phoneNumber: string;
            city: string;
            addressLine: string;
        };
        user: {
            display_name: string;
            email: string;
        };
    };
    product: {
        title: string;
        cover_url: string;
        type: string;
    };
};

export function useSellerOrders() {
    return useQuery<SellerOrderItem[]>({
        queryKey: ["/api/orders/seller"],
        queryFn: async () => {
            const res = await fetch("/api/orders/seller");
            if (!res.ok) throw new Error("Failed to fetch orders");
            return res.json();
        }
    });
}

export function useFulfillOrder() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { orderId: number, itemIds: number[], trackingNumber: string, status?: string }) => {
            const res = await fetch(`/api/orders/${data.orderId}/items/fulfill`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Fulfillment failed");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/orders/seller"] });
            toast({ title: "Order Updated", description: "Fulfillment status updated." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to update order.", variant: "destructive" });
        }
    });
}
