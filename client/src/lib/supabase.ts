import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// Type helper for database types
export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    username: string;
                    display_name: string;
                    role: 'reader' | 'writer' | 'artist' | 'admin';
                    bio: string | null;
                    avatar_url: string | null;
                    banner_url: string | null;
                    store_settings: any;
                    stripe_account_id: string | null;
                    subscription_tier: string;
                    commission_rate: number;
                    is_active: boolean;
                    shipping_policy: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    email: string;
                    username: string;
                    display_name: string;
                    role?: 'reader' | 'writer' | 'artist' | 'admin';
                    bio?: string | null;
                    avatar_url?: string | null;
                    banner_url?: string | null;
                    store_settings?: any;
                    stripe_account_id?: string | null;
                };
                Update: {
                    username?: string;
                    display_name?: string;
                    role?: 'reader' | 'writer' | 'artist' | 'admin';
                    bio?: string | null;
                    avatar_url?: string | null;
                    banner_url?: string | null;
                    store_settings?: any;
                };
            };
            products: {
                Row: {
                    id: number;
                    writer_id: string;
                    title: string;
                    description: string;
                    cover_url: string;
                    file_url: string | null;
                    content: string | null;
                    type: 'ebook' | 'asset' | 'bundle' | 'physical';
                    genre: string;
                    is_published: boolean;
                    rating: number;
                    review_count: number;
                    price: number;
                    license_type: string;
                    stock_quantity: number | null;
                    weight: number | null;
                    requires_shipping: boolean | null;
                    appearance_settings: any;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    writer_id: string;
                    title: string;
                    description: string;
                    cover_url: string;
                    file_url?: string | null;
                    content?: string | null;
                    type?: 'ebook' | 'asset' | 'bundle' | 'physical';
                    genre: string;
                    is_published?: boolean;
                    price: number;
                    license_type?: string;
                    stock_quantity?: number | null;
                    weight?: number | null;
                    requires_shipping?: boolean | null;
                    appearance_settings?: any;
                };
                Update: {
                    title?: string;
                    description?: string;
                    cover_url?: string;
                    file_url?: string | null;
                    content?: string | null;
                    type?: 'ebook' | 'asset' | 'bundle' | 'physical';
                    genre?: string;
                    is_published?: boolean;
                    price?: number;
                    license_type?: string;
                    stock_quantity?: number | null;
                    weight?: number | null;
                    requires_shipping?: boolean | null;
                    appearance_settings?: any;
                };
            };
            shipping_rates: {
                Row: {
                    id: number;
                    creator_id: string;
                    region_name: string;
                    amount: number;
                    delivery_time_min: number | null;
                    delivery_time_max: number | null;
                    created_at: string;
                };
                Insert: {
                    creator_id: string;
                    region_name: string;
                    amount: number;
                    delivery_time_min?: number | null;
                    delivery_time_max?: number | null;
                };
                Update: {
                    region_name?: string;
                    amount?: number;
                    delivery_time_min?: number | null;
                    delivery_time_max?: number | null;
                };
            };
            shipping_addresses: {
                Row: {
                    id: number;
                    user_id: string;
                    full_name: string;
                    phone_number: string;
                    city: string;
                    address_line: string;
                    created_at: string;
                };
                Insert: {
                    user_id: string;
                    full_name: string;
                    phone_number: string;
                    city: string;
                    address_line: string;
                };
                Update: {
                    full_name?: string;
                    phone_number?: string;
                    city?: string;
                    address_line?: string;
                };
            };
            chat_messages: {
                Row: {
                    id: string;
                    store_id: string;
                    sender_id: string;
                    content: string;
                    reply_to_id: string | null;
                    is_pinned: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    store_id: string;
                    sender_id: string;
                    content: string;
                    reply_to_id?: string | null;
                    is_pinned?: boolean;
                    created_at?: string;
                };
                Update: {
                    content?: string;
                    reply_to_id?: string | null;
                    is_pinned?: boolean;
                };
            };
            // Add more table types as needed
        };
    };
};
