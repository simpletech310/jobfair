"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User as SupabaseUser } from "@supabase/supabase-js";

// Extended user type if we need to merge with public.users later
// For now, we wrap the Supabase user
interface User {
    id: string;
    email?: string;
    role?: "seeker" | "employer"; // We will drag this from metadata or database
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    signUp: (email: string, pass: string, role: "seeker" | "employer", metadata?: any) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // Check active session
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Determine role from metadata or DB.
                // For MVP, we'll trust metadata set during signup.
                const role = session.user.user_metadata.role as "seeker" | "employer";
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    role
                });
            }
            setLoading(false);
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const role = session.user.user_metadata.role as "seeker" | "employer";
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    role
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        initSession();

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, pass: string) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });

        if (error) {
            setLoading(false);
            throw error;
        }

        // redirect handled by consumer or auth state change?
        // auth state change is safer but a bit delayed.
        // We will let the component handle redirect after await login() if it wants,
        // or we can do it here.
        // Legacy context did local redirect. Let's keep it clean.
    };

    const signUp = async (email: string, pass: string, role: "seeker" | "employer", metadata: any = {}) => {
        setLoading(true);
        // Add role to user_metadata so it persists in the session
        const { error } = await supabase.auth.signUp({
            email,
            password: pass,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: {
                    role,
                    ...metadata
                }
            }
        });

        if (error) {
            setLoading(false);
            throw error;
        }

        // With email confirmation off, we should be logged in immediately.
        // If confirmation is on, we'd fall into a different state.

        if (role === 'employer') router.push('/employer');
        else router.push('/jobs');
    };

    const logout = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        router.push('/');
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signUp, logout }}>
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
