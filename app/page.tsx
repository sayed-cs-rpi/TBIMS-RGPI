'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LoadingScreen } from '@/components/app-shell';

export default function Page() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        const redirectPath =
          user.role === 'complainer'
            ? '/complainer'
            : user.role === 'technician'
              ? '/technician'
              : user.role === 'staff'
                ? '/staff'
                : '/admin';
        router.push(redirectPath);
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  return null;
}
