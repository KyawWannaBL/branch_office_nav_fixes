import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type NoticeTone = "info" | "error" | "success";

function Notice({
  tone,
  message,
}: {
  tone: NoticeTone;
  message: string;
}) {
  const cls =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-sky-200 bg-sky-50 text-sky-700";

  return <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${cls}`}>{message}</div>;
}

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const recoveryHint = useMemo(() => {
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    return hash.includes("type=recovery") || hash.includes("access_token=") || search.includes("code=");
  }, []);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete("code");
          window.history.replaceState({}, document.title, `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
        }

        for (let i = 0; i < 6; i += 1) {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) throw error;

          if (session) {
            if (!active) return;
            setSessionReady(true);
            setNotice({
              tone: "info",
              message: "Recovery session verified. Enter your new password below.",
            });
            setInitializing(false);
            return;
          }

          await new Promise((resolve) => window.setTimeout(resolve, 350));
        }

        if (!active) return;

        setSessionReady(false);
        setNotice({
          tone: "error",
          message: recoveryHint
            ? "Recovery session could not be established. Please reopen the latest reset link from your email."
            : "Auth session missing. Open this page only from the Supabase reset email link.",
        });
        setInitializing(false);
      } catch (error) {
        if (!active) return;

        const message = error instanceof Error ? error.message : "Unable to verify recovery session.";
        setSessionReady(false);
        setNotice({
          tone: "error",
          message,
        });
        setInitializing(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setSessionReady(Boolean(session));
        setInitializing(false);

        if (session) {
          setNotice({
            tone: "info",
            message: "Recovery session verified. Enter your new password below.",
          });
        }
      }
    });

    void bootstrap();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [recoveryHint]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionReady) {
      setNotice({
        tone: "error",
        message: "Recovery session is missing. Please open the reset link from your email again.",
      });
      return;
    }

    if (password.length < 8) {
      setNotice({
        tone: "error",
        message: "Password must be at least 8 characters long.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setNotice({
        tone: "error",
        message: "Passwords do not match.",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setNotice({
        tone: "success",
        message: "Password updated successfully. Redirecting to login...",
      });

      await supabase.auth.signOut();

      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update password.";
      setNotice({
        tone: "error",
        message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#08213a_0%,#020817_55%,#01040c_100%)] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[85vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-[32px] border border-white/10 bg-black/55 p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white">BRITIUM L5</h1>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">
              Secure Reset
            </p>
          </div>

          {notice ? <div className="mt-8"><Notice tone={notice.tone} message={notice.message} /></div> : null}

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <div>
              <label htmlFor="new-password" className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-300">
                New Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  id="new-password"
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={initializing || submitting}
                  className="h-14 w-full rounded-2xl border border-cyan-400/20 bg-[#021025] pl-12 pr-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10 disabled:opacity-70"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-300">
                Confirm Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  disabled={initializing || submitting}
                  className="h-14 w-full rounded-2xl border border-cyan-400/20 bg-[#021025] pl-12 pr-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10 disabled:opacity-70"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={initializing || submitting || !sessionReady}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-lg font-black text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {initializing || submitting ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  {initializing ? "Verifying Session" : "Confirming Change"}
                </>
              ) : (
                "Confirm Change"
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
