import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/lib/supabase";

// Manually extend the type until codegen is updated
type DbUser = Database['public']['Tables']['users']['Row'] & {
    subscription_tier?: string;
    commission_rate?: number;
};

export type User = DbUser & {
    displayName: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
    storeSettings: any;
    stripeAccountId: string | null;
    subscriptionTier: string;
    commissionRate: number;
};

interface SignUpData {
    email: string;
    password: string;
    username: string;
    displayName: string;
    role: 'reader' | 'writer' | 'artist';
}

export function useAuth() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Get current session and user
    const { data: session, isLoading } = useQuery({
        queryKey: ["/api/session"],
        queryFn: async () => {
            const { data } = await supabase.auth.getSession();
            return data.session;
        },
    });

    // Get user profile from users table
    const { data: user } = useQuery<User | null>({
        queryKey: ["/api/user", session?.user?.id],
        queryFn: async () => {
            if (!session?.user?.id) return null;

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching user profile:', error);
                return null;
            }

            const dbUser = data as unknown as DbUser;

            // Map snake_case to camelCase
            return {
                ...dbUser,
                displayName: dbUser.display_name,
                avatarUrl: dbUser.avatar_url,
                bannerUrl: dbUser.banner_url,
                storeSettings: dbUser.store_settings,
                stripeAccountId: dbUser.stripe_account_id,
                subscriptionTier: dbUser.subscription_tier || 'free',
                commissionRate: dbUser.commission_rate || 20,
            };
        },
        enabled: !!session?.user?.id,
    });

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: async ({ email, password }: { email: string; password: string }) => {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/session"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            toast({ title: "Welcome back!", description: "You have been logged in." });
        },
        onError: (error: Error) => {
            toast({
                title: "Login failed",
                description: error.message,
                variant: "destructive"
            });
        },
    });

    // Register mutation
    const registerMutation = useMutation({
        mutationFn: async (credentials: SignUpData) => {
            console.log("📝 Starting registration for:", credentials.email);

            // 1. Create auth user with metadata
            // The database trigger 'on_auth_user_created' will automatically 
            // create the public profile in the 'users' table using this metadata.
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: credentials.email,
                password: credentials.password,
                options: {
                    data: {
                        username: credentials.username,
                        display_name: credentials.displayName,
                        role: credentials.role,
                    }
                }
            });

            console.log("🔐 Auth signup result:", { authData, authError });

            if (authError) {
                // Handle common auth errors with better messages
                if (authError.message.includes("User already registered")) {
                    throw new Error("This email is already registered. Please login instead.");
                }
                throw authError;
            }

            if (!authData.user) throw new Error('User creation failed');

            // 2. Profile creation is now handled by the database trigger!
            // This prevents "Zombie Accounts" where auth exists but profile doesn't.
            console.log("👤 Profile creation handled by DB Trigger.");

            return authData;
        },
        onSuccess: (data) => {
            console.log("✅ Registration successful! Data:", data);
            console.log("📧 Session:", data.session);
            console.log("👤 User:", data.user);

            queryClient.invalidateQueries({ queryKey: ["/api/session"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            toast({ title: "Welcome!", description: "Account created successfully." });
        },
        onError: (error: Error) => {
            console.error("❌ Registration error:", error);
            toast({
                title: "Registration failed",
                description: error.message,
                variant: "destructive"
            });
        },
    });

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.setQueryData(["/api/session"], null);
            queryClient.setQueryData(["/api/user"], null);
            toast({ title: "Logged out" });
        },
    });

    return {
        user,
        session,
        isLoading,
        loginMutation,
        registerMutation,
        logoutMutation,
    };
}
