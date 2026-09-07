'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LoadingScreen } from '@/components/app-shell';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

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

  if (authLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  return <LoadingScreen message="Redirecting..." />;
}
