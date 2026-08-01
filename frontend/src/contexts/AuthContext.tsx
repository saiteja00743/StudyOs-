import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, rawFrom } from '@/services/supabase';

// ─── Types ──────────────────────────────────────────────────
export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  study_streak: number;
  created_at: string;
  updated_at?: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: { message: string } | null }>;
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: { message: string } | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: { message: string } | null }>;
  updateProfileName: (fullName: string) => Promise<{ error: { message: string } | null }>;
  refreshProfile: () => Promise<void>;
}

// ─── Context ────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch user profile from Supabase cloud ────────────────
  const fetchProfile = useCallback(async (authUser: User) => {
    const fallbackName =
      authUser.user_metadata?.full_name ||
      authUser.email?.split('@')[0] ||
      'Student';

    try {
      const { data, error } = await rawFrom('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!error && data) {
        const prof = data as Profile;
        if (!prof.full_name) {
          const patched = { ...prof, full_name: fallbackName };
          await rawFrom('profiles').update({ full_name: fallbackName }).eq('id', authUser.id);
          setProfile(patched);
        } else {
          setProfile(prof);
        }
      } else {
        const newProfile: Profile = {
          id: authUser.id,
          full_name: fallbackName,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          study_streak: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { error: insertErr } = await rawFrom('profiles').upsert(newProfile);
        if (!insertErr) setProfile(newProfile);
      }
    } catch (e) {
      console.error('fetchProfile error:', e);
      setProfile({
        id: authUser.id,
        full_name: fallbackName,
        avatar_url: null,
        study_streak: 1,
        created_at: new Date().toISOString(),
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user);
  }, [user, fetchProfile]);

  // ── Bootstrap: subscribe to Supabase auth state changes ───
  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes (login, logout, token refresh, cross-device)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ── Auth Actions ──────────────────────────────────────────

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) return { error: { message: error.message } };
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      let msg = error.message;
      if (msg.toLowerCase().includes('invalid login')) {
        msg = 'Invalid email or password. Please check your credentials and try again.';
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        msg = 'Please verify your email address before logging in. Check your inbox.';
      }
      return { error: { message: msg } };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );
    if (error) return { error: { message: error.message } };
    return { error: null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: { message: error.message } };
    return { error: null };
  };

  const updateProfileName = async (fullName: string) => {
    if (!user) return { error: { message: 'No authenticated user.' } };

    // Optimistic UI update
    setProfile((prev) => prev ? { ...prev, full_name: fullName } : prev);

    // Persist to Supabase cloud
    const { error } = await rawFrom('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      // Revert if failed
      await fetchProfile(user);
      return { error: { message: error.message } };
    }

    // Also update Supabase auth user metadata
    await supabase.auth.updateUser({ data: { full_name: fullName } });

    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        updateProfileName,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export const useAuthContext = useAuth;
