"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isGuest: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        // Check for guest mode in localStorage
        const guestMode = localStorage.getItem("kyohansha_guest_mode");
        if (guestMode === "true") {
            setIsGuest(true);
            setIsLoading(false);
            return;
        }

        // Check for existing Supabase session
        const supabase = getSupabaseClient();

        // Get initial session using async IIFE
        const initSession = async () => {
            const { data } = await supabase.auth.getSession();
            setSession(data.session);
            setUser(data.session?.user ?? null);
            setIsLoading(false);
        };
        initSession();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((
            _event: "INITIAL_SESSION" | "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED" | "USER_UPDATED" | "PASSWORD_RECOVERY",
            newSession: Session | null
        ) => {
            setSession(newSession);
            setUser(newSession?.user ?? null);
            // If user logs in, disable guest mode
            if (newSession?.user) {
                setIsGuest(false);
                localStorage.removeItem("kyohansha_guest_mode");
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error: error ? new Error(error.message) : null };
    };

    const signUp = async (email: string, password: string) => {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        return { error: error ? new Error(error.message) : null };
    };

    const signOut = async () => {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    };

    const continueAsGuest = () => {
        localStorage.setItem("kyohansha_guest_mode", "true");
        setIsGuest(true);
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                isLoading,
                isGuest,
                signIn,
                signUp,
                signOut,
                continueAsGuest,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
