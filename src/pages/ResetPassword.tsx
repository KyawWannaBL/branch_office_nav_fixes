import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ROUTE_PATHS } from '@/lib/index';
import { supabase } from '@/integrations/supabase/client';
import { useBilingual } from '@/lib/bilingual';
import { getStableBackground } from '@/lib/screenBackground';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  const navigate = useNavigate();
  const { bt } = useBilingual();
  const heroBackground = getStableBackground('/reset-password');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const hash = window.location.hash;
        let tokenParams = '';

        if (hash.includes('access_token=')) {
          tokenParams = hash.substring(hash.indexOf('access_token='));
        }

        const hashParams = new URLSearchParams(tokenParams);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken && type === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            setError(
              bt(
                'Failed to verify reset link. Please request a new password reset.',
                'Reset link ကို အတည်မပြုနိုင်ပါ။ Password reset အသစ်တောင်းခံပါ။'
              )
            );
            setIsLoading(false);
            return;
          }

          setHasValidSession(true);
          setIsLoading(false);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setHasValidSession(true);
        } else {
          setError(
            bt(
              'Invalid or expired reset link. Please request a new password reset from the login page.',
              'Reset link သည် မမှန်ကန်ပါ သို့မဟုတ် သက်တမ်းကုန်သွားပါပြီ။ Login page မှ password reset အသစ်တောင်းခံပါ။'
            )
          );
        }
      } catch {
        setError(bt('An error occurred. Please try again.', 'အမှားတစ်ခု ဖြစ်ပွားခဲ့သည်။ ထပ်မံကြိုးစားပါ။'));
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [bt]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(bt('Passwords do not match', 'စကားဝှက်နှစ်ခု မကိုက်ညီပါ'));
      return;
    }

    if (password.length < 6) {
      setError(bt('Password must be at least 6 characters long', 'စကားဝှက်သည် အနည်းဆုံး ၆ လုံး ရှိရမည်'));
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccess(true);

      setTimeout(() => {
        navigate(ROUTE_PATHS.LOGIN || '/login');
      }, 2500);
    } catch (err: any) {
      setError(err?.message || bt('Failed to reset password. Please try again.', 'စကားဝှက်ပြန်သတ်မှတ်မှု မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။'));
    } finally {
      setIsLoading(false);
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
            <div className="inline-flex items-center justify-center mb-4">
              <img src="/logo.png" alt="Britium Express" className="h-16 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Britium Express</h1>
            <p className="text-muted-foreground">
              {bt('Reset Your Password', 'သင့်စကားဝှက်ကို ပြန်လည်သတ်မှတ်ပါ')}
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{bt('Create New Password', 'စကားဝှက်အသစ် ဖန်တီးရန်')}</CardTitle>
              <CardDescription>{bt('Enter your new password below', 'အောက်တွင် စကားဝှက်အသစ် ထည့်ပါ')}</CardDescription>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">
                    {bt('Verifying reset link...', 'Reset link ကို စစ်ဆေးနေသည်...')}
                  </span>
                </div>
              ) : !hasValidSession ? (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                  <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/login')}>
                    {bt('Back to Login', 'Login သို့ ပြန်သွားမည်')}
                  </Button>
                </div>
              ) : success ? (
                <Alert className="border-green-500 bg-green-50 text-green-900">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
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
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                        disabled={isLoading}
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
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {bt('Password must be at least 6 characters long', 'စကားဝှက်သည် အနည်းဆုံး ၆ လုံး ရှိရမည်')}
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

                  <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/login')}>
                    {bt('Back to Login', 'Login သို့ ပြန်သွားမည်')}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div
        className="hidden lg:flex flex-1 relative bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/88 to-primary/62" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <h2 className="text-4xl font-bold mb-6">
              {bt('Secure Password Reset', 'လုံခြုံသော စကားဝှက်ပြန်သတ်မှတ်မှု')}
            </h2>
            <p className="text-xl mb-8 text-white/90">
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
