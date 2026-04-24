import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthProfile = {
  id: string;
  role: string | null;
  mustChangePassword: boolean;
  raw: Record<string, any>;
} | null;

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: AuthProfile;
  loading: boolean;
  refresh: () => Promise<AuthProfile>;
  signIn: (email: string, password: string) => Promise<AuthProfile>;
  signUp: (email: string, password: string, fullName?: string) => Promise<AuthProfile>;
  sendMagicLink: (email: string, redirectTo: string) => Promise<void>;
  sendPasswordReset: (email: string, redirectTo: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeRole(role?: string | null) {
  return String(role ?? '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
}

export function getDefaultRouteForRole(
  role?: string | null,
  mustChangePassword = false
) {
  if (mustChangePassword) return '/reset-password';

  switch (normalizeRole(role)) {
    case 'super-admin':
    case 'admin':
      return '/dashboard';
    case 'branch-office':
      return '/branch-office';
    case 'warehouse-staff':
      return '/warehouse';
    case 'customer-service':
      return '/customer-service';
    case 'rider':
      return '/rider';
    case 'driver':
      return '/driver';
    case 'finance':
      return '/finance';
    case 'merchant':
      return '/merchant';
    case 'marketing':
      return '/marketing';
    case 'hr':
      return '/hr';
    case 'customer':
      return '/customer';
    case 'data-entry':
      return '/data-entry';
    case 'supervisor':
      return '/supervisor';
    case 'wayplan':
      return '/wayplan';
    default:
      return '/dashboard';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile>(null);
  const [loading, setLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  const loadProfile = useCallback(
    async (userId: string, strict = false): Promise<AuthProfile> => {
      let response = await supabase
        .from('profiles')
        .select(
          'id, role, role_code, app_role, user_role, must_change_password, requires_password_change'
        )
        .eq('id', userId)
        .maybeSingle();

      if (response.error && (response.error as any)?.code === '42703') {
        response = await supabase
          .from('profiles')
          .select('id, role, must_change_password')
          .eq('id', userId)
          .maybeSingle();
      }

      if (response.error) {
        if (!strict) return null;
        throw new Error(`Profile lookup failed: ${response.error.message}`);
      }

      if (!response.data) {
        if (!strict) return null;
        throw new Error('No profile found for this authenticated user.');
      }

      const row = response.data as Record<string, any>;
      const resolvedRole =
        row.role ?? row.app_role ?? row.user_role ?? row.role_code ?? null;

      if (!resolvedRole && strict) {
        throw new Error('Profile found, but no role is assigned.');
      }

      return {
        id: String(row.id),
        role: normalizeRole(resolvedRole),
        mustChangePassword:
          Boolean(row.must_change_password) ||
          Boolean(row.requires_password_change),
        raw: row,
      };
    },
    []
  );

  const syncFromSession = useCallback(
    async (nextSession: Session | null, strictProfile = false) => {
      if (!nextSession) {
        clearAuthState();
        return null;
      }

      setSession(nextSession);
      setUser(nextSession.user);

      const nextProfile = await loadProfile(nextSession.user.id, strictProfile);
      setProfile(nextProfile);

      return nextProfile;
    },
    [clearAuthState, loadProfile]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return await syncFromSession(data.session ?? null, false);
    } finally {
      setLoading(false);
    }
  }, [syncFromSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        try {
          return await syncFromSession(data.session ?? null, true);
        } catch (profileError) {
          await supabase.auth.signOut();
          clearAuthState();
          throw profileError;
        }
      } finally {
        setLoading(false);
      }
    },
    [clearAuthState, syncFromSession]
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName?.trim() || '',
            },
          },
        });

        if (error) throw error;
        return await syncFromSession(data.session ?? null, false);
      } finally {
        setLoading(false);
      }
    },
    [syncFromSession]
  );

  const sendMagicLink = useCallback(async (email: string, redirectTo: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
  }, []);

  const sendPasswordReset = useCallback(
    async (email: string, redirectTo: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
    },
    []
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      clearAuthState();
    } finally {
      setLoading(false);
    }
  }, [clearAuthState]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;
        await syncFromSession(data.session ?? null, false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      await syncFromSession(nextSession ?? null, false);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncFromSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      refresh,
      signIn,
      signUp,
      sendMagicLink,
      sendPasswordReset,
      signOut,
    }),
    [
      user,
      session,
      profile,
      loading,
      refresh,
      signIn,
      signUp,
      sendMagicLink,
      sendPasswordReset,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
