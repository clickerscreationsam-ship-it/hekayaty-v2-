import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { callEdgeFunction } from "./use-edge-functions";

// Get pending orders via Edge Function
export function usePendingOrders() {
    return useQuery({
        queryKey: ['pending-orders'],
        queryFn: async () => {
            return callEdgeFunction('get-pending-orders', { status: 'pending' });
        },
        initialData: [],
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: false
    });
}

// Verify payment via Edge Function
export function useVerifyPayment() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (orderId: number) => {
            return callEdgeFunction('verify-payment', { orderId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
            toast({
                title: "Payment Verified",
                description: "Order has been verified and earnings created."
            });
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

// Reject Order
export function useRejectOrder() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (orderId: number) => {
            return callEdgeFunction('reject-order', { orderId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
            toast({ title: "Order Rejected" });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to reject", variant: "destructive" });
        }
    });
}

// Get Sellers
export function useAdminSellers() {
    return useQuery({
        queryKey: ['admin-sellers'],
        queryFn: async () => {
            return callEdgeFunction('get-sellers', {});
        },
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: false
    });
}

// Freeze Seller
export function useFreezeSeller() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ userId, isActive }: { userId: string, isActive: boolean }) => {
            return callEdgeFunction('freeze-seller', { userId, isActive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
            toast({ title: "Seller Status Updated" });
        },
        onError: (error: Error) => {
            toast({ title: "Update Failed", variant: "destructive" });
        }
    });
}

// Get Payout Requests
export function useAdminPayouts() {
    return useQuery({
        queryKey: ['admin-payouts'],
        queryFn: async () => {
            return callEdgeFunction('get-all-payouts', {});
        }
    });
}

// Approve/Reject Payout
export function useApprovePayout() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ payoutId, status }: { payoutId: number, status: 'processed' | 'rejected' }) => {
            return callEdgeFunction('approve-payout', { payoutId, status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
            toast({ title: "Payout status updated" });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to update payout", description: error.message, variant: "destructive" });
        }
    });
}

// Get Payout History (Processed/Rejected)
export function useAdminPayoutHistory() {
    return useQuery({
        queryKey: ['admin-payout-history'],
        queryFn: async () => {
            const data = await callEdgeFunction('get-all-payouts', { status: 'all' });
            return data.filter((p: any) => p.status !== 'pending');
        }
    });
}

// Get Order History (Paid/Rejected)
export function useAdminOrderHistory() {
    return useQuery({
        queryKey: ['admin-order-history'],
        queryFn: async () => {
            const data = await callEdgeFunction('get-pending-orders', { status: 'all' });
            return data.filter((o: any) => o.status !== 'pending');
        }
    });
}

// Export aliases
export const useAdminOrders = usePendingOrders;
export const useVerifyOrder = useVerifyPayment;
