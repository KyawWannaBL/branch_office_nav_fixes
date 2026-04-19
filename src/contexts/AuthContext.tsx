import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  roleCode: string;
  isSuperAdmin: boolean;
  refreshUser: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithOtp: (email: string, redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeToken(value?: string | null) {
  return (value ?? "").trim().replace(/[\s-]+/g, "_").toUpperCase();
}

async function resolveRoleCode(user: User | null): Promise<string> {
  if (!user) return "";

  const directRole =
    normalizeToken((user.app_metadata as any)?.role_code) ||
    normalizeToken((user.app_metadata as any)?.role) ||
    normalizeToken((user.user_metadata as any)?.role_code) ||
    normalizeToken((user.user_metadata as any)?.role);

  if (directRole) return directRole;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, role_code, app_role, user_role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) return "";

    const row: any = data || {};
    return (
      normalizeToken(row.role_code) ||
      normalizeToken(row.role) ||
      normalizeToken(row.app_role) ||
      normalizeToken(row.user_role) ||
      ""
    );
  } catch {
    return "";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roleCode, setRoleCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const hydrate = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session: nextSession },
      } = await supabase.auth.getSession();

      const nextUser = nextSession?.user ?? null;
      setSession(nextSession ?? null);
      setUser(nextUser);

      const nextRoleCode = await resolveRoleCode(nextUser);
      setRoleCode(nextRoleCode);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      if (!active) return;
      await hydrate();
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return;

      const nextUser = nextSession?.user ?? null;
      setSession(nextSession ?? null);
      setUser(nextUser);

      const nextRoleCode = await resolveRoleCode(nextUser);
      if (!active) return;
      setRoleCode(nextRoleCode);
      setLoading(false);
      setInitialized(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [hydrate]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signInWithOtp = useCallback(async (email: string, redirectTo?: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const refreshUser = useCallback(async () => {
    await hydrate();
  }, [hydrate]);

  const value = useMemo<AuthContextValue>(() => {
    const email = (user?.email ?? "").toLowerCase();
    const isSuperAdmin =
      email === "md@britiumexpress.com" ||
      ["SYS", "SUPER_ADMIN", "ADMIN"].includes(roleCode);

    return {
      session,
      user,
      loading,
      initialized,
      roleCode,
      isSuperAdmin,
      refreshUser,
      signInWithPassword,
      signInWithOtp,
      signOut,
    };
  }, [
    session,
    user,
    loading,
    initialized,
    roleCode,
    refreshUser,
    signInWithPassword,
    signInWithOtp,
    signOut,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
