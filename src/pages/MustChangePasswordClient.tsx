import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function updatePasswordWithRetry(password: string, retriesLeft = 2): Promise<void> {
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  } catch (error: any) {
    const message = String(error?.message || '');
    const isLockCollision = /lock|navigatorlock|already.*acquired|timeout/i.test(message);

    if (isLockCollision && retriesLeft > 0) {
      await sleep(500);
      return updatePasswordWithRetry(password, retriesLeft - 1);
    }

    throw error;
  }
}

async function completePasswordChangeFlag(): Promise<void> {
  try {
    const response = await fetch('/api/auth/complete-password-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.error || 'Password was updated, but the profile flag could not be cleared.');
    }
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Password was updated, but the profile flag could not be cleared.');
  }
}

export default function MustChangePasswordClient() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const nextPath = useMemo(() => {
    const value = searchParams.get('next');
    return value && value.startsWith('/') && !value.startsWith('//') ? value : '/create-delivery';
  }, [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    try {
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      await updatePasswordWithRetry(password);
      await completePasswordChangeFlag();

      setInfo('Password changed successfully. Redirecting...');
      window.setTimeout(() => navigate(nextPath, { replace: true }), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <Card className="w-full border-border/70 shadow-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">
                Britium Express Delivery
              </div>
              <CardTitle className="text-2xl">Change Your Password</CardTitle>
              <CardDescription className="mt-2">
                You must set a new password before continuing to the operations console.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              {info ? (
                <Alert className="border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{info}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter new password"
                    className="pl-10"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm new password"
                    className="pl-10"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use at least 8 characters. Avoid reusing an old password.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
