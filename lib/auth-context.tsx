'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from './supabase-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  configError?: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [configError, setConfigError] = useState<string>();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isSupabaseConfigured()) {
      setConfigError('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
      setLoading(false);
      return;
    }

    let supabase;
    try {
      supabase = createClient();
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : 'Failed to initialize Supabase');
      setLoading(false);
      return;
    }

    // Check current session
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);
      setLoading(false);

      // Redirect logic - only after initial session check
      if (!pathname) return;

      const isAuthPage = pathname.startsWith('/auth');
      const isPublicPage = pathname === '/' || pathname.startsWith('/help') || pathname.startsWith('/settings');

      if (session?.user && isAuthPage) {
        router.push('/terminal');
      } else if (!session?.user && !isAuthPage && !isPublicPage) {
        router.push('/auth/login');
      }
    })();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (event === 'SIGNED_OUT') {
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/auth') && currentPath !== '/') {
          router.push('/auth/login');
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, pathname, mounted]);

  const signOut = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, configError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
