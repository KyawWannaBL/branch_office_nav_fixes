import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  User,
  CheckCircle,
  ShieldCheck,
  Download,
  ArrowRight,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase/client";

type AuthTab = "login" | "signup";
type LoginMethod = "password" | "emailLink";
type UiLang = "en" | "my";

const asset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
};

export default function Login() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<AuthTab>("login");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [existingSessionUser, setExistingSessionUser] = useState<any>(null);
  const [lang] = useState<UiLang>(() => {
    if (typeof window === "undefined") return "en";
    const saved =
      localStorage.getItem("language") ||
      localStorage.getItem("lang") ||
      localStorage.getItem("locale");
    return saved === "my" || saved === "mm" ? "my" : "en";
  });

  const bt = (en: string, mm: string) => (lang === "my" ? mm : en);
  const apkUrl = (import.meta.env.VITE_ANDROID_APK_URL as string | undefined)?.trim();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedLoginEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function readSessionOnly() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;

        setExistingSessionUser(session?.user ?? null);

        if (session?.user?.email && !email) {
          setEmail(session.user.email);
        }
      } catch {
        if (active) setExistingSessionUser(null);
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    void readSessionOnly();

    return () => {
      active = false;
    };
  }, [email]);

  useEffect(() => {
    if (!rememberMe) {
      localStorage.removeItem("rememberedLoginEmail");
    }
  }, [rememberMe]);

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const persistRememberedEmail = (value: string) => {
    const trimmed = value.trim();
    if (rememberMe && trimmed) {
      localStorage.setItem("rememberedLoginEmail", trimmed);
    } else {
      localStorage.removeItem("rememberedLoginEmail");
    }
  };

  const getSiteBaseUrl = () =>
    new URL(import.meta.env.BASE_URL || "/", window.location.origin).toString();

  const getResetUrl = () =>
    new URL("reset-password", getSiteBaseUrl()).toString();

  async function continueWithExistingSession() {
    navigate("/dashboard", { replace: true });
  }

  async function switchAccount() {
    clearMessages();
    setIsLoading(true);

    try {
      await supabase.auth.signOut();
      setExistingSessionUser(null);
      setPassword("");
      setShowForgotPassword(false);
      setTab("login");
      setSuccessMessage(bt("Signed out. Please sign in.", "ထွက်ပြီးပါပြီ။ ပြန်လည်ဝင်ပါ။"));
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          bt("Unable to sign out current session.", "လက်ရှိ session မှ ထွက်မရပါ။")
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const loginEmail = email.trim();

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) throw error;

      persistRememberedEmail(loginEmail);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          bt(
            "Invalid email or password. Please try again.",
            "အီးမေးလ် သို့မဟုတ် စကားဝှက် မမှန်ပါ။ ထပ်မံကြိုးစားပါ။"
          )
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const loginEmail = email.trim();

      const { error } = await supabase.auth.signInWithOtp({
        email: loginEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      persistRememberedEmail(loginEmail);
      setSuccessMessage(
        bt(
          "Magic link sent. Please check your email.",
          "အီးမေးလ်ဝင်ရန် link ပို့ပြီးပါပြီ။ သင့် inbox ကိုစစ်ဆေးပါ။"
        )
      );
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          bt(
            "Unable to send email link. Please try again.",
            "Email link ပို့မရပါ။ ထပ်မံကြိုးစားပါ။"
          )
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const signupEmail = email.trim();
      const signupName = fullName.trim();

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password,
        options: {
          data: {
            full_name: signupName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      persistRememberedEmail(signupEmail);

      if (data.session) {
        navigate("/dashboard", { replace: true });
      } else {
        setSuccessMessage(
          bt(
            "Account created. Please check your email to confirm your account.",
            "အကောင့်ဖန်တီးပြီးပါပြီ။ အတည်ပြုရန် email ကိုစစ်ဆေးပါ။"
          )
        );
        setTab("login");
      }
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          bt(
            "Failed to create account. Please try again.",
            "အကောင့်ဖန်တီးမှု မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။"
          )
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: getResetUrl(),
      });

      if (error) throw error;

      setSuccessMessage(
        bt(
          "Password reset email sent. Please check your inbox.",
          "စကားဝှက်ပြန်လည်သတ်မှတ်ရန် အီးမေးလ်ပို့ပြီးပါပြီ။ Inbox ကိုစစ်ဆေးပါ။"
        )
      );
      setResetEmail("");
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          bt(
            "Failed to send reset email. Please try again.",
            "Reset email ပို့မရပါ။ ထပ်မံကြိုးစားပါ။"
          )
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const darkInputClass =
    "h-14 w-full rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder:text-slate-500 pl-12 pr-4 text-sm font-medium backdrop-blur-md transition-all focus:bg-white/[0.08] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none";

  const labelClass =
    "text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1 block";

  const loginTitle = useMemo(() => {
    if (showForgotPassword) return bt("RESET PASSWORD", "စကားဝှက် ပြန်သတ်မှတ်ရန်");
    if (tab === "login") return bt("SECURE LOGIN", "အကောင့် ဝင်ရန်");
    return bt("CREATE ACCOUNT", "အကောင့် ဖွင့်ရန်");
  }, [showForgotPassword, tab, lang]);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020813]">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white backdrop-blur-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          {bt("Checking session...", "Session စစ်ဆေးနေသည်...")}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#020813] selection:bg-emerald-500/30">
      <div className="relative flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-hidden z-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px]" />
        </div>

        <div className="w-full max-w-[440px] relative z-20">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center text-center mb-10"
          >
            <div className="mb-6 flex h-36 w-36 items-center justify-center rounded-3xl bg-white/95 p-4 shadow-2xl">
              {!logoFailed ? (
                <img
                  src={asset("/logo.png")}
                  alt="Britium Express Logo"
                  className="max-h-full max-w-full object-contain"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <span className="text-2xl font-black tracking-wider text-slate-900">
                  BRITIUM
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-[0.15em] text-white drop-shadow-lg">
              BRITIUM
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-400 font-medium">
              {bt("Welcome to the Enterprise Portal", "Britium Portal မှ ကြိုဆိုပါသည်")}
            </p>
          </motion.div>

          {existingSessionUser ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[32px] border border-white/10 bg-black/40 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            >
              <div className="mb-6 flex items-center gap-3">
                <LogIn className="h-6 w-6 text-emerald-400" />
                <h2 className="text-2xl font-black tracking-wide text-white">
                  {bt("SESSION DETECTED", "SESSION တွေ့ရှိပါသည်")}
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white">
                <div className="text-sm text-slate-400">
                  {bt("Signed in as", "လက်ရှိဝင်ထားသောအကောင့်")}
                </div>
                <div className="mt-2 text-lg font-black">
                  {existingSessionUser.email || bt("Current User", "လက်ရှိအသုံးပြုသူ")}
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <Button
                  type="button"
                  onClick={() => void continueWithExistingSession()}
                  className="h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-black tracking-widest text-white hover:from-emerald-400 hover:to-teal-400"
                >
                  {bt("CONTINUE TO DASHBOARD", "DASHBOARD သို့ ဆက်သွားမည်")}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void switchAccount()}
                  disabled={isLoading}
                  className="h-14 rounded-xl border-white/20 bg-white/5 text-sm font-black tracking-widest text-white hover:bg-white/10"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    bt("SIGN OUT AND USE ANOTHER ACCOUNT", "ထွက်ပြီး အခြားအကောင့်အသုံးပြုမည်")
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-[32px] border border-white/10 bg-black/40 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-teal-500" />

              <div className="mb-8 flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
                <h2 className="text-2xl font-black tracking-wide text-white">
                  {loginTitle}
                </h2>
              </div>

              <AnimatePresence mode="wait">
                {error ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert
                      variant="destructive"
                      className="mb-6 border-red-500/30 bg-red-500/10 text-rose-200"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm font-medium ml-2">
                        {error}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                ) : null}

                {successMessage ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert className="mb-6 border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <AlertDescription className="text-sm font-medium ml-2">
                        {successMessage}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {showForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <label className={labelClass}>
                      {bt("Corporate Email", "ကုမ္ပဏီ အီးမေးလ်")}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        placeholder="admin@britiumexpress.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className={darkInputClass}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-14 w-full mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-black tracking-widest text-white hover:from-emerald-400 hover:to-teal-400 shadow-[0_10px_30px_rgba(16,185,129,0.2)] transition-all hover:-translate-y-0.5"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      bt("SEND RESET LINK", "RESET LINK ပို့မည်")
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        clearMessages();
                      }}
                      className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                    >
                      {bt("Back to Sign In", "အကောင့်ဝင်ရန် ပြန်သွားမည်")}
                    </button>
                  </div>
                </form>
              ) : tab === "login" ? (
                <form
                  onSubmit={
                    loginMethod === "password"
                      ? handlePasswordLogin
                      : handleEmailLinkLogin
                  }
                  className="space-y-5"
                >
                  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.02] p-1.5 mb-6 border border-white/5">
                    <button
                      type="button"
                      onClick={() => setLoginMethod("password")}
                      className={`h-10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        loginMethod === "password"
                          ? "bg-emerald-500 text-white shadow-md"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {bt("Password", "စကားဝှက်")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginMethod("emailLink")}
                      className={`h-10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        loginMethod === "emailLink"
                          ? "bg-emerald-500 text-white shadow-md"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {bt("Email Link", "အီးမေးလ် လင့်ခ်")}
                    </button>
                  </div>

                  <div>
                    <label className={labelClass}>
                      {bt("Corporate Email", "ကုမ္ပဏီ အီးမေးလ်")}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        placeholder="admin@britiumexpress.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={darkInputClass}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {loginMethod === "password" ? (
                    <div>
                      <label className={labelClass}>{bt("Password", "စကားဝှက်")}</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={darkInputClass}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <Checkbox
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                        className="h-5 w-5 rounded border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 transition-colors"
                      />
                      <span className="text-sm font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">
                        {bt("Remember me", "မှတ်ထားမည်")}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        clearMessages();
                        setResetEmail(email);
                      }}
                      className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                    >
                      {bt("Forgot Password?", "စကားဝှက် မေ့နေပါသလား?")}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-14 w-full mt-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-black tracking-widest text-white hover:from-emerald-400 hover:to-teal-400 shadow-[0_10px_30px_rgba(16,185,129,0.2)] transition-all hover:-translate-y-0.5"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        {loginMethod === "password"
                          ? bt("ACCESS PORTAL", "ဝင်မည်")
                          : bt("SEND MAGIC LINK", "LINK ပို့မည်")}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 pt-6 border-t border-white/5">
                    <span className="text-sm text-slate-500">
                      {bt("Don't have an account?", "အကောင့်မရှိသေးဘူးလား?")}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTab("signup");
                        clearMessages();
                      }}
                      className="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      {bt("Sign Up", "အကောင့်ဖွင့်ရန်")}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-5">
                  <div>
                    <label className={labelClass}>
                      {bt("Full Name", "အမည်အပြည့်အစုံ")}
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={darkInputClass}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      {bt("Corporate Email", "ကုမ္ပဏီ အီးမေးလ်")}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        placeholder="admin@britiumexpress.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={darkInputClass}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{bt("Password", "စကားဝှက်")}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={darkInputClass}
                        required
                        minLength={6}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-14 w-full mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-black tracking-widest text-white hover:from-emerald-400 hover:to-teal-400 shadow-[0_10px_30px_rgba(16,185,129,0.2)] transition-all hover:-translate-y-0.5"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      bt("CREATE ACCOUNT", "အကောင့် ဖန်တီးမည်")
                    )}
                  </Button>

                  <div className="text-center pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setTab("login");
                        clearMessages();
                      }}
                      className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                    >
                      {bt("Back to Sign In", "အကောင့်ဝင်ရန် ပြန်သွားမည်")}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}

          <p className="mt-8 text-center text-xs font-bold uppercase tracking-widest text-slate-600">
            © {new Date().getFullYear()} Britium Enterprise
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#01050a]">
        <img
          src={asset("/create_animated_video.gif")}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-luminosity"
        />

        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#020813]/80 to-[#020813]" />

        <div className="relative z-10 flex flex-col justify-center p-16 max-w-2xl text-white">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold tracking-widest text-emerald-100 uppercase">
                System Active
              </span>
            </div>

            <h2 className="text-5xl font-black mb-6 leading-tight">
              {bt("Intelligent Logistics,", "ခေတ်မီ ထောက်ပံ့ပို့ဆောင်ရေး၊")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                {bt("Simplified.", "ရိုးရှင်းလွယ်ကူစွာ။")}
              </span>
            </h2>

            <p className="text-lg mb-10 text-slate-300 font-medium leading-relaxed">
              {bt(
                "Enterprise-grade route optimization, real-time fleet tracking, and automated financial settlements all in one unified portal.",
                "ခေတ်မီ logistics လုပ်ငန်းအတွက် real-time tracking, route optimization နှင့် analytics အပြည့်အစုံ ပါဝင်သော စနစ်တစ်ခု။"
              )}
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    {bt("Role-Based Access", "Portal မျိုးစုံ အသုံးပြုခွင့်")}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {bt(
                      "Specialized interfaces for supervisors, drivers, warehouse staff, and finance modules.",
                      "Supervisor, Driver, Warehouse Staff နှင့် Customer Service အတွက် သီးသန့် interface များ။"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <ArrowRight className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    {bt("Real-Time Telemetry", "အချိန်နှင့်တပြေးညီ ခြေရာခံခြင်း")}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {bt(
                      "Live tracking of delivery status, fleet mobility, and linehaul progress.",
                      "Delivery status, driver location နှင့် route progress ကို live update ဖြင့် ကြည့်ရှုနိုင်ပါသည်။"
                    )}
                  </p>
                </div>
              </div>
            </div>

            {apkUrl ? (
              <div className="mt-12 pt-8 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    window.open(apkUrl, "_blank", "noopener,noreferrer")
                  }
                  className="h-14 px-8 rounded-xl border-white/20 bg-white/5 text-sm font-bold tracking-widest text-white hover:bg-white/10 backdrop-blur-md transition-all"
                >
                  <Download className="mr-3 h-5 w-5 text-emerald-400" />
                  {bt("DOWNLOAD MOBILE APP", "MOBILE APP ဒေါင်းလုဒ်")}
                </Button>
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </div>
  );
}