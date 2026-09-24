import { useRouter } from 'next/router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { setUnauthorizedHandler } from '@/lib/api';
import { tokenStorage } from '@/lib/token';
import { authService } from '@/services/auth.service';

const AuthContext = createContext(null);

/**
 * Holds the signed-in user for the whole app.
 * status: 'loading' (checking a saved session) | 'authenticated' | 'unauthenticated'
 */
export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  const logout = useCallback(
    (message) => {
      tokenStorage.clear();
      setUser(null);
      setStatus('unauthenticated');
      if (message) toast.info(message);
      router.replace('/login');
    },
    [router],
  );

  // Any 401 from the API (expired token, deactivated account) signs the user out.
  useEffect(() => {
    setUnauthorizedHandler(() => logout('Your session has ended. Please sign in again.'));
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Restore the session from a saved token on first load.
  useEffect(() => {
    if (!tokenStorage.get()) {
      setStatus('unauthenticated');
      return;
    }

    let active = true;
    (async () => {
      try {
        const { user: me } = await authService.me();
        if (!active) return;
        setUser(me);
        setStatus('authenticated');
      } catch (error) {
        if (!active) return;
        if (error.status === 401) tokenStorage.clear();
        setStatus('unauthenticated');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: signedIn } = await authService.login({ email, password });
    tokenStorage.set(token);
    setUser(signedIn);
    setStatus('authenticated');
    return signedIn;
  }, []);

  const value = useMemo(
    () => ({ user, status, isAdmin: user?.role === 'admin', login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
