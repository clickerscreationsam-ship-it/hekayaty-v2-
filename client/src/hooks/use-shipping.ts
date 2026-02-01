import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface ShippingRate {
    id: number;
    creatorId: string;
    regionName: string;
    amount: number;
    deliveryTimeMin?: number;
    deliveryTimeMax?: number;
    createdAt: string;
}

function mapRate(r: any): ShippingRate {
    return {
        id: r.id,
        creatorId: r.creator_id,
        regionName: r.region_name,
        amount: r.amount,
        deliveryTimeMin: r.delivery_time_min,
        deliveryTimeMax: r.delivery_time_max,
        createdAt: r.created_at,
    };
}

export function useShippingRates(creatorId?: string) {
    return useQuery({
        queryKey: ["shipping-rates", creatorId],
        queryFn: async () => {
            if (!creatorId) return [];
            const { data, error } = await supabase
                .from('shipping_rates')
                .select('*')
                .eq('creator_id', creatorId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data.map(mapRate);
        },
        enabled: !!creatorId,
    });
}

export function useCreateShippingRate() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: Partial<ShippingRate>) => {
            const dbData = {
                creator_id: data.creatorId,
                region_name: data.regionName,
                amount: data.amount,
                delivery_time_min: data.deliveryTimeMin,
                delivery_time_max: data.deliveryTimeMax
            };

            const { data: newRate, error } = await supabase
                .from('shipping_rates')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;
            return mapRate(newRate);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["shipping-rates", variables.creatorId] });
            toast({ title: "Shipping rate added" });
        },
        onError: (err) => {
            toast({ title: "Failed to add rate", description: err.message, variant: "destructive" });
        }
    });
}

export function useDeleteShippingRate() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, creatorId }: { id: number; creatorId: string }) => {
            const { error } = await supabase
                .from('shipping_rates')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["shipping-rates", variables.creatorId] });
            toast({ title: "Shipping rate removed" });
        },
    });
}
