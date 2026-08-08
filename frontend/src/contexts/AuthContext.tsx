import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, rawFrom } from '@/services/supabase';

// ─── Types ──────────────────────────────────────────────────
export interface Profile {
  id: string;
  full_name: string | null;
  bio: string | null;
  school: string | null;
  avatar_url: string | null;
  study_streak: number;
  role: 'user' | 'admin';
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
  signInWithGoogle: () => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: { message: string } | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: { message: string } | null }>;
  updateProfile: (fields: { full_name?: string; bio?: string; school?: string; avatar_url?: string }) => Promise<{ error: { message: string } | null }>;
  /** @deprecated use updateProfile instead */
  updateProfileName: (fullName: string) => Promise<{ error: { message: string } | null }>;
  refreshProfile: () => Promise<void>;
}

// ─── LocalStorage Cache Helpers ──────────────────────────────
const CACHE_KEY = 'studyos_profile_cache';

function getCachedProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedProfile(prof: Profile | null) {
  try {
    if (prof) localStorage.setItem(CACHE_KEY, JSON.stringify(prof));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

// ─── Context ────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(() => getCachedProfile());
  const [loading, setLoading] = useState(true);

  const setProfile = useCallback((newProf: Profile | null | ((prev: Profile | null) => Profile | null)) => {
    setProfileState((prev) => {
      const next = typeof newProf === 'function' ? newProf(prev) : newProf;
      setCachedProfile(next);
      return next;
    });
  }, []);

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
        .maybeSingle();

      if (!error && data) {
        const prof = data as Profile;
        if (!prof.full_name) {
          const patched = { ...prof, full_name: fallbackName };
          await rawFrom('profiles').upsert({ id: authUser.id, full_name: fallbackName });
          setProfile(patched);
        } else {
          setProfile(prof);
        }
      } else {
        const newProfile: Profile = {
          id: authUser.id,
          full_name: fallbackName,
          bio: '',
          school: '',
          avatar_url: authUser.user_metadata?.avatar_url || null,
          study_streak: 1,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { error: insertErr } = await rawFrom('profiles').upsert(newProfile);
        if (insertErr) console.error('Error creating profile row in cloud:', insertErr);
        setProfile(newProfile);
      }
    } catch (e) {
      console.error('fetchProfile error:', e);
      setProfile((prev) => prev || {
        id: authUser.id,
        full_name: fallbackName,
        bio: '',
        school: '',
        avatar_url: null,
        study_streak: 1,
        role: 'user',
        created_at: new Date().toISOString(),
      });
    }
  }, [setProfile]);

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
  }, [fetchProfile, setProfile]);

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

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) return { error: { message: error.message } };
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

  /** Save any subset of profile fields to Supabase cloud */
  const updateProfile = async (fields: { full_name?: string; bio?: string; school?: string; avatar_url?: string }) => {
    if (!user) return { error: { message: 'No authenticated user.' } };

    const payload = {
      id: user.id,
      ...fields,
      updated_at: new Date().toISOString(),
    };

    // Optimistic UI update immediately
    setProfile((prev) => {
      if (prev) return { ...prev, ...fields, updated_at: payload.updated_at };
      return {
        id: user.id,
        full_name: fields.full_name || user.email?.split('@')[0] || 'Student',
        bio: fields.bio || '',
        school: fields.school || '',
        avatar_url: fields.avatar_url || null,
        study_streak: 1,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: payload.updated_at,
      };
    });

    // Try UPDATE first (profile row should exist from signup trigger)
    const { data: updatedRows, error } = await rawFrom('profiles')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select();

    if (error) {
      console.error('Supabase profile update error:', error);
      // Revert optimistic update on failure
      setProfile((prev) => prev ? { ...prev } : prev);
      return { error: { message: error.message } };
    }

    // If UPDATE returned 0 rows, profile row doesn't exist yet — INSERT it
    if (!updatedRows || updatedRows.length === 0) {
      const { error: insertError } = await rawFrom('profiles').insert({
        id: user.id,
        full_name: fields.full_name || user.email?.split('@')[0] || 'Student',
        bio: fields.bio ?? '',
        school: fields.school ?? '',
        avatar_url: fields.avatar_url ?? null,
        study_streak: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (insertError) {
        console.error('Supabase profile insert error:', insertError);
        return { error: { message: insertError.message } };
      }
    }

    // After DB write, confirm by fetching fresh data (controlled — avoids race with auth state changes)
    // Small delay to ensure PostgREST read-after-write consistency
    setTimeout(() => fetchProfile(user), 300);

    // NOTE: We intentionally do NOT call auth.updateUser here.
    // That would trigger onAuthStateChange → fetchProfile immediately,
    // creating a race condition that overwrites the saved data with stale reads.

    return { error: null };
  };



  /** @deprecated prefer updateProfile */
  const updateProfileName = async (fullName: string) => updateProfile({ full_name: fullName });

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
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
