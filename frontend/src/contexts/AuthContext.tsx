import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';

// ─── Types ──────────────────────────────────────────────────
interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  study_streak: number;
  created_at: string;
}

interface RegisteredUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  createdAt: string;
}

interface AuthContextValue {
  // State
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  // Actions
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: { message: string } | null }>;
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: { message: string } | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: { message: string } | null }>;
  updateProfileName: (fullName: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const REGISTERED_USERS_KEY = 'studyos_registered_accounts';
const ACTIVE_SESSION_KEY = 'studyos_current_active_user';

function getRegisteredAccounts(): RegisteredUser[] {
  try {
    return JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRegisteredAccounts(accounts: RegisteredUser[]) {
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(accounts));
}

function getActiveSession(): { user: User; profile: Profile } | null {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function setActiveSession(user: User | null, profile: Profile | null) {
  if (user && profile) {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify({ user, profile }));
  } else {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}

// ─── Context ────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from Supabase
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  // Bootstrap auth state on mount
  useEffect(() => {
    const isSupabaseConfigured =
      import.meta.env.VITE_SUPABASE_URL &&
      !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    } else {
      // Local Auth Store (Real Credential Validation)
      const savedSession = getActiveSession();
      if (savedSession) {
        setUser(savedSession.user);
        setProfile(savedSession.profile);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    }
  }, [fetchProfile]);

  // ─── Real Credential Auth Actions ─────────────────────────

  const isSupabaseConfigured = () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    return url && !url.includes('placeholder') && !url.includes('your-supabase');
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) return { error: { message: error.message } };
        return { error: null };
      } catch (e: any) {
        return { error: { message: e?.message || 'Failed to sign up with Supabase.' } };
      }
    }

    // Real Local Account Registration
    const accounts = getRegisteredAccounts();
    const existing = accounts.find((a) => a.email === cleanEmail);
    if (existing) {
      return { error: { message: 'An account with this email address already exists. Please log in.' } };
    }

    const userId = `usr-${Date.now()}`;
    const newAccount: RegisteredUser = {
      id: userId,
      email: cleanEmail,
      passwordHash: btoa(password), // Store encoded password for exact matching
      fullName,
      createdAt: new Date().toISOString(),
    };

    accounts.push(newAccount);
    saveRegisteredAccounts(accounts);

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      user_metadata: { full_name: fullName },
      app_metadata: {},
      aud: 'authenticated',
      created_at: newAccount.createdAt,
    } as unknown as User;

    const newProfile: Profile = {
      id: userId,
      full_name: fullName,
      avatar_url: null,
      study_streak: 1,
      created_at: newAccount.createdAt,
    };

    setUser(newUser);
    setProfile(newProfile);
    setActiveSession(newUser, newProfile);

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) return { error: { message: error.message } };
        return { error: null };
      } catch (e: any) {
        return { error: { message: e?.message || 'Failed to sign in.' } };
      }
    }

    // Real Credential Verification
    const accounts = getRegisteredAccounts();
    const account = accounts.find((a) => a.email === cleanEmail);

    if (!account) {
      return {
        error: { message: 'No account found with this email address. Please check your email or sign up first.' },
      };
    }

    const encodedPassword = btoa(password);
    if (account.passwordHash !== encodedPassword) {
      return {
        error: { message: 'Invalid password. Please check your password and try again.' },
      };
    }

    // Credentials match 100%!
    const authenticatedUser: User = {
      id: account.id,
      email: account.email,
      user_metadata: { full_name: account.fullName },
      app_metadata: {},
      aud: 'authenticated',
      created_at: account.createdAt,
    } as unknown as User;

    const authenticatedProfile: Profile = {
      id: account.id,
      full_name: account.fullName,
      avatar_url: null,
      study_streak: 3,
      created_at: account.createdAt,
    };

    setUser(authenticatedUser);
    setProfile(authenticatedProfile);
    setActiveSession(authenticatedUser, authenticatedProfile);

    return { error: null };
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      try { await supabase.auth.signOut(); } catch {}
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setActiveSession(null, null);
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error: error ? { message: error.message } : null };
    }
    const accounts = getRegisteredAccounts();
    const account = accounts.find((a) => a.email === email.trim().toLowerCase());
    if (!account) {
      return { error: { message: 'No account registered with this email address.' } };
    }
    return { error: null };
  };

  const updatePassword = async (newPassword: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error: error ? { message: error.message } : null };
    }
    if (user?.email) {
      const accounts = getRegisteredAccounts();
      const idx = accounts.findIndex((a) => a.email === user.email);
      if (idx !== -1) {
        accounts[idx].passwordHash = btoa(newPassword);
        saveRegisteredAccounts(accounts);
      }
    }
    return { error: null };
  };

  const updateProfileName = async (fullName: string) => {
    if (!user) return;
    const updated: Profile = {
      id: user.id,
      full_name: fullName,
      avatar_url: profile?.avatar_url || null,
      study_streak: profile?.study_streak || 1,
      created_at: profile?.created_at || new Date().toISOString(),
    };

    setProfile(updated);

    if (isSupabaseConfigured()) {
      await supabase.from('profiles').upsert(updated as any);
    } else {
      setActiveSession(user, updated);
      const accounts = getRegisteredAccounts();
      const idx = accounts.findIndex((a) => a.id === user.id || a.email === user.email);
      if (idx !== -1) {
        accounts[idx].fullName = fullName;
        saveRegisteredAccounts(accounts);
      }
    }
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const useAuthContext = useAuth;
