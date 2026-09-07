'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn } from '@/lib/auth-hooks';
import { useAuth } from '@/lib/auth-context';
import {
  StandaloneShell,
  cardClass,
  fieldClass,
  pageSubClass,
  pageTitleClass,
  primaryBtnClass,
} from '@/components/app-shell';
import { Ticket } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { signIn, loading } = useSignIn();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isResponseRecieved, setIsResponseRecieved] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      const redirectPath =
        user.role === 'complainer'
          ? '/complainer'
          : user.role === 'technician'
            ? '/technician'
            : user.role === 'staff'
              ? '/staff'
              : '/admin';
      router.push(redirectPath);
    }
  }, [user, authLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await signIn(formData.email, formData.password);
      setIsResponseRecieved(true);
      router.push('/dashboard');
    } catch (error) {
      console.error('[v0] Sign in error:', error);
      setIsResponseRecieved(false);
    }
  }

  if (authLoading || isResponseRecieved) {
    return (
      <StandaloneShell>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-foreground/20 border-t-foreground mx-auto" />
          <p className="mt-4 text-foreground/60 text-sm">
            {isResponseRecieved ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </StandaloneShell>
    );
  }

  return (
    <StandaloneShell>
      <div className={`${cardClass} w-full max-w-md`}>
        <div className="flex items-center gap-3 mb-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Ticket className="w-5 h-5" />
          </span>
          <div>
            <h1 className={pageTitleClass}>Sign In</h1>
            <p className={pageSubClass}>Enter your credentials to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className={fieldClass}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className={fieldClass}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className={`w-full ${primaryBtnClass} py-3`}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </StandaloneShell>
  );
}
