import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader2, Lock } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useBilingual } from '@/lib/bilingual';

const PASSWORD_MIN_LENGTH = 8;

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isLockError(error: unknown) {
  const message = error instanceof Error ? error.message : String((error as any)?.message ?? error ?? '');
  return /lock|navigatorlock|acquire/i.test(message);
}

function currentUrlLooksLikeRecoveryLink() {
  const url = window.location.href;
  return /access_token=|refresh_token=|type=recovery|code=/.test(url);
}

async function updatePasswordWithRetry(password: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) return;

    lastError = error;
    if (!isLockError(error) || attempt === 2) break;
    await delay(350 * (attempt + 1));
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to reset password.');
}

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  const navigate = useNavigate();
  const { bt } = useBilingual();
  const submittingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let recoveryEventReceived = false;

    const verifySession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!mounted) return;

        if (data.session) {
          setHasValidSession(true);
          setIsLoading(false);
          return;
        }

        if (!currentUrlLooksLikeRecoveryLink()) {
          setError(
            bt(
              'Invalid or expired reset link. Please request a new password reset from the login page.',
              'Reset link သည် မမှန်ကန်ပါ သို့မဟုတ် သက်တမ်းကုန်သွားပါပြီ။ Login page မှ password reset အသစ်တောင်းခံပါ။'
            )
          );
          setIsLoading(false);
          return;
        }

        await delay(1200);

        const retry = await supabase.auth.getSession();
        if (!mounted) return;

        if (retry.data.session || recoveryEventReceived) {
          setHasValidSession(true);
          setIsLoading(false);
          return;
        }

        setError(
          bt(
            'The reset link could not be verified. Please open the latest reset email or request a new link.',
            'Reset link ကို အတည်မပြုနိုင်ပါ။ နောက်ဆုံးရ reset email ကိုဖွင့်ပါ သို့မဟုတ် link အသစ်တောင်းခံပါ။'
          )
        );
        setIsLoading(false);
      } catch {
        if (!mounted) return;
        setError(bt('An error occurred. Please try again.', 'အမှားတစ်ခု ဖြစ်ပွားခဲ့သည်။ ထပ်မံကြိုးစားပါ။'));
        setIsLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        recoveryEventReceived = true;
        setHasValidSession(Boolean(session));
        setIsLoading(false);
      }
    });

    void verifySession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [bt]);

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    setError('');

    if (password !== confirmPassword) {
      setError(bt('Passwords do not match', 'စကားဝှက်နှစ်ခု မကိုက်ညီပါ'));
      return;
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(
        bt(
          `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
          `စကားဝှက်သည် အနည်းဆုံး ${PASSWORD_MIN_LENGTH} လုံး ရှိရမည်`
        )
      );
      return;
    }

    submittingRef.current = true;
    setIsLoading(true);

    try {
      await updatePasswordWithRetry(password);
      setSuccess(true);
      await supabase.auth.signOut().catch(() => undefined);
      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1200);
    } catch (err: any) {
      setError(
        err?.message ||
          bt(
            'Failed to reset password. Please try again.',
            'စကားဝှက်ပြန်သတ်မှတ်မှု မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။'
          )
      );
      setIsLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center mb-2">
              <h1 className="text-3xl font-black tracking-widest text-primary uppercase">BRITIUM EXPRESS</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              {bt('Reset Your Password', 'သင့်စကားဝှက်ကို ပြန်လည်သတ်မှတ်ပါ')}
            </p>
          </div>

          <Card className="shadow-lg border-primary/10">
            <CardHeader>
              <CardTitle>{bt('Create New Password', 'စကားဝှက်အသစ် ဖန်တီးရန်')}</CardTitle>
              <CardDescription>{bt('Enter your new password below', 'အောက်တွင် စကားဝှက်အသစ် ထည့်ပါ')}</CardDescription>
            </CardHeader>

            <CardContent>
              {isLoading && !success ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 font-medium text-muted-foreground">
                    {bt('Verifying reset link...', 'Reset link ကို စစ်ဆေးနေသည်...')}
                  </span>
                </div>
              ) : !hasValidSession && !success ? (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                  <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/login', { replace: true })}>
                    {bt('Back to Login', 'Login သို့ ပြန်သွားမည်')}
                  </Button>
                </div>
              ) : success ? (
                <Alert className="border-green-500 bg-green-50 text-green-900">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="font-medium">
                    {bt('Password reset successful. Redirecting to login...', 'စကားဝှက်ပြန်သတ်မှတ်မှု အောင်မြင်ပါသည်။ Login သို့ ပြန်လည်ပို့ဆောင်နေသည်...')}
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">{bt('New Password', 'စကားဝှက်အသစ်')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder={bt('Enter new password', 'စကားဝှက်အသစ် ထည့်ပါ')}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="pl-10"
                        required
                        minLength={PASSWORD_MIN_LENGTH}
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{bt('Confirm Password', 'စကားဝှက်ကို ထပ်မံအတည်ပြုပါ')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder={bt('Confirm new password', 'စကားဝှက်အသစ်ကို ထပ်မံထည့်ပါ')}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className="pl-10"
                        required
                        minLength={PASSWORD_MIN_LENGTH}
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {bt(
                        `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
                        `စကားဝှက်သည် အနည်းဆုံး ${PASSWORD_MIN_LENGTH} လုံး ရှိရမည်`
                      )}
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {bt('Resetting password...', 'စကားဝှက်ပြန်သတ်မှတ်နေသည်...')}
                      </>
                    ) : (
                      bt('Reset Password', 'စကားဝှက်ပြန်သတ်မှတ်ရန်')
                    )}
                  </Button>

                  <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/login', { replace: true })}>
                    {bt('Back to Login', 'Login သို့ ပြန်သွားမည်')}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-slate-900">
        <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover">
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/60" />

        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
            <h2 className="text-4xl font-bold mb-6">
              {bt('Secure Password Reset', 'လုံခြုံသော စကားဝှက်ပြန်သတ်မှတ်မှု')}
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-lg">
              {bt(
                'Your account security is our priority. Create a strong password to protect your data.',
                'သင့်အကောင့်လုံခြုံရေးသည် အရေးကြီးပါသည်။ သင့်ဒေတာကို ကာကွယ်ရန် ခိုင်မာသော စကားဝှက်ကို အသုံးပြုပါ။'
              )}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
