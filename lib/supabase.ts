/**
 * Supabase Client Configuration
 * Browser-side client for authentication and data operations
 */

import { createBrowserClient } from '@supabase/ssr';

// Database types for type safety
export interface UserProfile {
    id: string;
    karma: number;
    selected_persona: string;
    created_at: string;
    updated_at: string;
}

export interface UserStreak {
    id: string;
    current_streak: number;
    last_chat_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface UserInventoryItem {
    id: number;
    user_id: string;
    item_id: string;
    obtained_at: string;
}

export interface UserEquipped {
    id: string;
    equipped_skin: string | null;
    updated_at: string;
}

// Create browser client
export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
        );
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Singleton instance for client-side usage
let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
    if (!clientInstance) {
        clientInstance = createClient();
    }
    return clientInstance;
}
