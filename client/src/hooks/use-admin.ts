import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";


// Get pending orders via Edge Function
export function usePendingOrders() {
    return useQuery({
        queryKey: ['pending-orders'],
        queryFn: async () => {
            try {
                console.log("🔍 usePendingOrders: Starting...");

                // Force refresh session to ensure valid JWT for Gateway
                console.log("🔍 usePendingOrders: Attempting refreshSession...");
                const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
                if (refreshError) console.warn("⚠️ Session refresh warning:", refreshError);
                console.log("🔍 usePendingOrders: Session after refresh:", session?.user?.id);

                let userId = session?.user?.id;

                if (!userId) {
                    // Fallback attempt
                    console.log("🔍 usePendingOrders: No userId from refresh, trying getSession...");
                    const { data: sessionData } = await supabase.auth.getSession();
                    userId = sessionData.session?.user?.id;
                    console.log("🔍 usePendingOrders: UserId from getSession:", userId);
                }

                if (!userId) {
                    console.warn("⚠️ usePendingOrders: No session found, trying getUser()...");
                    const { data: userData } = await supabase.auth.getUser();
                    userId = userData.user?.id;
                    console.log("🔍 usePendingOrders: UserId from getUser:", userId);
                }

                console.log("✅ usePendingOrders: Final userId:", userId);
                const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-pending-orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`,
                    },
                    body: JSON.stringify({ status: 'pending' })
                });

                console.log("📡 usePendingOrders: Response status:", response.status);

                if (!response.ok) {
                    const errText = await response.text();
                    console.error("❌ usePendingOrders Error Response:", errText);
                    throw new Error(`Edge Function failed: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                console.log("📦 usePendingOrders: Received data:", data);

                if (data && data.debug_info && data.data) {
                    console.log("🐛 Debug Info:", data.debug_info);
                    return data.data;
                }

                console.log("✅ usePendingOrders: Returning data array, length:", data?.length);
                return data;
            } catch (error: any) {
                console.error("💥 usePendingOrders: FATAL ERROR:", error);
                console.error("💥 Error details:", {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                throw error; // Re-throw so React Query knows it failed
            }
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
            // Get current user ID
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ orderId })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Verification failed: ${response.status}`);
            }

            const data = await response.json();
            if (data?.error) throw new Error(data.error);
            return data;
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
            // Get current user ID
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reject-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ orderId })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Reject failed: ${response.status}`);
            }

            const data = await response.json();
            return data;
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
            // Force refresh session to ensure valid JWT for Gateway
            const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) console.warn("Session refresh warning:", refreshError);

            let userId = session?.user?.id;

            if (!userId) {
                // Fallback attempt
                const { data: sessionData } = await supabase.auth.getSession();
                userId = sessionData.session?.user?.id;
            }

            if (!userId) {
                console.warn("useAdminSellers: No session found, trying getUser()...");
                const { data: userData } = await supabase.auth.getUser();
                userId = userData.user?.id;
            }

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-sellers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("useAdminSellers Error Response:", errText);
                throw new Error(`Edge Function failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data && data.debug_info && data.data) {
                console.log("Debug Info:", data.debug_info);
                return data.data;
            }

            return data;
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
            const { data, error } = await supabase.functions.invoke('freeze-seller', {
                body: { userId, isActive }
            });
            if (error) throw new Error(error.message || "Freeze failed");
            return data;
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
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-all-payouts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({})
            });

            if (!response.ok) throw new Error("Failed to fetch payouts");
            return response.json();
        }
    });
}

// Approve/Reject Payout
export function useApprovePayout() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ payoutId, status }: { payoutId: number, status: 'processed' | 'rejected' }) => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-payout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ payoutId, status })
            });

            if (!response.ok) throw new Error("Update failed");
            return response.json();
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
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-all-payouts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ status: 'all' })
            });

            if (!response.ok) throw new Error("Failed to fetch payout history");
            const data = await response.json();
            return data.filter((p: any) => p.status !== 'pending');
        }
    });
}

// Get Order History (Paid/Rejected)
export function useAdminOrderHistory() {
    return useQuery({
        queryKey: ['admin-order-history'],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-pending-orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ status: 'all' })
            });

            if (!response.ok) throw new Error("Failed to fetch order history");
            const data = await response.json();
            return data.filter((o: any) => o.status !== 'pending');
        }
    });
}

// Export aliases
export const useAdminOrders = usePendingOrders;
export const useVerifyOrder = useVerifyPayment;
