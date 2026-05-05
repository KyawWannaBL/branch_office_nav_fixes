import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Download,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDefaultRouteForRole, useAuth } from '@/contexts/AuthContext';
import { useBilingual } from '@/lib/bilingual';

type AuthTab = 'login' | 'signup';
type LoginMethod = 'password' | 'emailLink';

type AuthProfileLike = {
  role?: string | null;
  mustChangePassword?: boolean;
} | null;

const PASSWORD_MIN_LENGTH = 8;

function trimEmail(value: string) {
  return value.trim().toLowerCase();
}

function getSiteOrigin() {
  const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  const origin = configured && configured.length > 0 ? configured : window.location.origin;
  return origin.replace(/\/$/, '');
}

function getLandingRoute(role?: string | null) {
  const route = getDefaultRouteForRole(role, false) || '/dashboard';
  return route === '/reset-password' ? '/dashboard' : route;
}

function getPostLoginRoute(profile: AuthProfileLike) {
  const landing = getLandingRoute(profile?.role);
  if (profile?.mustChangePassword) {
    return `/must-change-password?next=${encodeURIComponent(landing)}`;
  }
  return landing;
}

export default function Login() {
  const [tab, setTab] = useState<AuthTab>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    user,
    profile,
    loading: authLoading,
    signIn,
    signUp,
    sendMagicLink,
    sendPasswordReset,
  } = useAuth();

  const { bt } = useBilingual();
  const navigate = useNavigate();

  const apkUrl = (import.meta.env.VITE_ANDROID_APK_URL as string | undefined)?.trim();
  const isBusy = submitting || authLoading;

  const darkInputClass = useMemo(
    () =>
      'h-12 w-full rounded-xl border border-white/10 bg-white/5 text-base text-white placeholder:text-white/40 pl-11 pr-4 backdrop-blur-md transition-all focus-visible:bg-white/10 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary',
    []
  );

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedLoginEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(getPostLoginRoute(profile), { replace: true });
    }
  }, [authLoading, navigate, profile, user]);

  const clearNotices = () => {
    setError('');
    setSuccessMessage('');
  };

  const persistRememberedEmail = (value: string) => {
    const normalized = trimEmail(value);
    if (rememberMe && normalized) {
      localStorage.setItem('rememberedLoginEmail', normalized);
    } else {
      localStorage.removeItem('rememberedLoginEmail');
    }
  };

  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearNotices();
    setSubmitting(true);

    try {
      const normalizedEmail = trimEmail(email);
      const nextProfile = await signIn(normalizedEmail, password);
      persistRememberedEmail(normalizedEmail);
      navigate(getPostLoginRoute(nextProfile), { replace: true });
    } catch (err: any) {
      setError(
        err?.message ||
          bt(
            'Invalid email or password. Please try again.',
            'အီးမေးလ် သို့မဟုတ် စကားဝှက် မမှန်ပါ။ ထပ်မံကြိုးစားပါ။'
          )
      );
      setSubmitting(false);
    }
  };

  const handleEmailLinkLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearNotices();
    setSubmitting(true);

    try {
      const normalizedEmail = trimEmail(email);
      await sendMagicLink(normalizedEmail, `${getSiteOrigin()}/#/dashboard`);
      persistRememberedEmail(normalizedEmail);
      setSuccessMessage(
        bt(
          'Magic link sent. Please check your email.',
          'အီးမေးလ်ဝင်ရန် link ပို့ပြီးပါပြီ။ သင့် inbox ကိုစစ်ဆေးပါ။'
        )
      );
    } catch (err: any) {
      setError(
        err?.message ||
          bt(
            'Unable to send email link. Please try again.',
            'Email link ပို့မရပါ။ ထပ်မံကြိုးစားပါ။'
          )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearNotices();
    setSubmitting(true);

    try {
      const normalizedEmail = trimEmail(email);
      const nextProfile = await signUp(normalizedEmail, password, fullName.trim());
      persistRememberedEmail(normalizedEmail);

      if (user || nextProfile) {
        navigate(getPostLoginRoute(nextProfile), { replace: true });
        return;
      }

      setSuccessMessage(
        bt(
          'Account request submitted. Please check your email if confirmation is required.',
          'အကောင့်ဖန်တီးမှု တင်သွင်းပြီးပါပြီ။ အတည်ပြုရန်လိုပါက အီးမေးလ်ကို စစ်ဆေးပါ။'
        )
      );
    } catch (err: any) {
      setError(
        err?.message ||
          bt(
            'Failed to create account. Please try again.',
            'အကောင့်ဖန်တီးမှု မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။'
          )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearNotices();
    setSubmitting(true);

    try {
      const normalizedResetEmail = trimEmail(resetEmail || email);
      await sendPasswordReset(normalizedResetEmail, `${getSiteOrigin()}/#/reset-password`);
      setSuccessMessage(
        bt(
          'Password reset email sent. Please check your inbox.',
          'စကားဝှက်ပြန်လည်သတ်မှတ်ရန် အီးမေးလ်ပို့ပြီးပါပြီ။ Inbox ကိုစစ်ဆေးပါ။'
        )
      );
      setResetEmail('');
    } catch (err: any) {
      setError(
        err?.message ||
          bt(
            'Failed to send reset email. Please try again.',
            'Reset email ပို့မရပါ။ ထပ်မံကြိုးစားပါ။'
          )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const showSignup = () => {
    setTab('signup');
    setShowForgotPassword(false);
    clearNotices();
  };

  const showLogin = () => {
    setTab('login');
    setShowForgotPassword(false);
    clearNotices();
  };

  return (
    <div className="dark relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center p-4 lg:grid lg:grid-cols-2 lg:gap-16 lg:p-8">
        <div className="w-full max-w-md mx-auto lg:max-w-none lg:mx-0 xl:w-[480px]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-card/40 p-8 shadow-2xl backdrop-blur-xl supports-[backdrop-filter]:bg-card/20">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="mb-8 text-center">
              <div className="mx-auto mb-6 flex items-center justify-center">
                <div className="relative flex h-[110px] w-[110px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <img
                    src="/logo.png"
                    alt="Britium Express"
                    className="absolute inset-0 m-auto max-h-[75%] max-w-[75%] object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="text-2xl font-black tracking-tight text-white/70">BX</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">BRITIUM EXPRESS</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {bt('Logistics Control Center', 'Britium Portal မှ ကြိုဆိုပါသည်')}
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6 border-destructive/50 bg-destructive/10 text-destructive-foreground">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="mb-6 border-success/50 bg-success/10 text-success">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    {bt('Reset Password', 'စကားဝှက် ပြန်သတ်မှတ်ရန်')}
                  </h2>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-sm font-medium text-muted-foreground">
                    {bt('Corporate Email', 'ကုမ္ပဏီ အီးမေးလ်')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="name@britium.com"
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                      className={darkInputClass}
                      required
                      disabled={isBusy}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isBusy} className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25">
                  {isBusy ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {bt('Sending Link...', 'ပို့နေသည်...')}
                    </>
                  ) : (
                    bt('Send Reset Link', 'RESET LINK ပို့မည်')
                  )}
                </Button>

                <div className="text-center pt-2">
                  <button type="button" onClick={showLogin} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    {bt('← Back to sign in', 'အကောင့်ဝင်ရန် ပြန်သွားမည်')}
                  </button>
                </div>
              </form>
            ) : tab === 'login' ? (
              <form onSubmit={loginMethod === 'password' ? handlePasswordLogin : handleEmailLinkLogin} className="space-y-5">
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/20 p-1 ring-1 ring-white/5">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('password')}
                    className={`flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                      loginMethod === 'password'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    {bt('Password', 'စကားဝှက်')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('emailLink')}
                    className={`flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                      loginMethod === 'emailLink'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    {bt('Magic Link', 'အီးမေးလ် လင့်ခ်')}
                  </button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium text-muted-foreground">
                    {bt('Corporate Email', 'ကုမ္ပဏီ အီးမေးလ်')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="name@britium.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={darkInputClass}
                      required
                      disabled={isBusy}
                    />
                  </div>
                </div>

                {loginMethod === 'password' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-sm font-medium text-muted-foreground">
                        {bt('Password', 'စကားဝှက်')}
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          clearNotices();
                          setResetEmail(email);
                        }}
                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        {bt('Forgot password?', 'မေ့နေပါသလား?')}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={darkInputClass}
                        required
                        disabled={isBusy}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <Checkbox
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                      className="h-4 w-4 rounded border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {bt('Remember my device', 'မှတ်ထားမည်')}
                    </span>
                  </label>

                  <button type="button" onClick={showSignup} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                    {bt('Create account', 'အကောင့်ဖွင့်ရန်')}
                  </button>
                </div>

                <Button type="submit" disabled={isBusy} className="h-12 w-full mt-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
                  {isBusy ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {loginMethod === 'password' ? bt('Authenticating...', 'ဝင်နေသည်...') : bt('Sending...', 'ပို့နေသည်...')}
                    </>
                  ) : (
                    <>
                      {loginMethod === 'password' ? bt('Sign In', 'ဝင်မည်') : bt('Send Magic Link', 'LINK ပို့မည်')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {apkUrl && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open(apkUrl, '_blank', 'noopener,noreferrer')}
                      className="h-11 w-full rounded-xl border-white/10 bg-transparent text-sm font-medium text-foreground hover:bg-white/5 transition-colors"
                    >
                      <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                      {bt('Download Rider App (APK)', 'ANDROID APP (APK) ဒေါင်းလုဒ်')}
                    </Button>
                  </div>
                )}
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    {bt('Create an Account', 'အကောင့် ဖွင့်ရန်')}
                  </h2>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-medium text-muted-foreground">
                    {bt('Full Name', 'အမည်အပြည့်အစုံ')}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder={bt('Kyaw Min Thu', 'အမည်အပြည့်အစုံ')}
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className={darkInputClass}
                      required
                      disabled={isBusy}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium text-muted-foreground">
                    {bt('Corporate Email', 'ကုမ္ပဏီ အီးမေးလ်')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@britium.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={darkInputClass}
                      required
                      disabled={isBusy}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium text-muted-foreground">
                    {bt('Password', 'စကားဝှက်')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={darkInputClass}
                      required
                      minLength={PASSWORD_MIN_LENGTH}
                      disabled={isBusy}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {bt('Use at least 8 characters.', 'အနည်းဆုံး ၈ လုံး အသုံးပြုပါ။')}
                  </p>
                </div>

                <Button type="submit" disabled={isBusy} className="h-12 w-full mt-4 rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
                  {isBusy ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {bt('Setting up workspace...', 'ဖန်တီးနေသည်...')}
                    </>
                  ) : (
                    bt('Create Account', 'အကောင့် ဖန်တီးမည်')
                  )}
                </Button>

                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    {bt('Already have an account? ', 'အကောင့်ရှိပြီးသားလား? ')}
                    <button type="button" onClick={showLogin} className="font-medium text-foreground hover:text-primary transition-colors">
                      {bt('Sign in instead', 'အကောင့်ဝင်ရန်')}
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="hidden lg:flex flex-col justify-center pl-8 xl:pl-16">
          <div className="space-y-8 max-w-lg">
            <div>
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
                🚀 System Operational
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {bt('Streamline Your Delivery Operations', 'သင့်ပို့ဆောင်မှုလုပ်ငန်းများကို ပိုမိုချောမွေ့စေပါ')}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {bt(
                  'Real-time tracking, intelligent route optimization, and comprehensive analytics purpose-built for modern logistics.',
                  'ခေတ်မီ logistics လုပ်ငန်းအတွက် real-time tracking, route optimization နှင့် analytics အပြည့်အစုံ'
                )}
              </p>
            </div>

            <div className="grid gap-6 pt-4">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card border border-white/5 shadow-sm">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {bt('Role-Based Access Control', 'Portal မျိုးစုံ အသုံးပြုခွင့်')}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {bt(
                      'Specialized, secure interfaces for supervisors, drivers, warehouse staff, clients, and branch offices.',
                      'Supervisor, Driver, Warehouse Staff, Customer Service နှင့် Branch Office အတွက် သီးသန့် interface များ'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card border border-white/5 shadow-sm">
                  <ArrowRight className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {bt('Live Global Telemetry', 'အချိန်နှင့်တပြေးညီ ခြေရာခံခြင်း')}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {bt(
                      'Instant updates on fleet statuses, linehaul locations, and final-mile route progress across Myanmar.',
                      'Delivery status, driver location နှင့် route progress ကို live update ဖြင့် ကြည့်ရှုနိုင်သည်'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
