import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { PORTAL_HOME } from '@/lib/constants';

/** Sends people to their own portal, or to sign in. */
export default function Home() {
  const router = useRouter();
  const { user, status } = useAuth();

  useEffect(() => {
    if (status === 'authenticated') router.replace(PORTAL_HOME[user.role]);
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, user, router]);

  return <LoadingScreen />;
}
