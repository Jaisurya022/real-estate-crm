const KEY = 'estate-crm-token';

/** Thin wrapper so SSR (no `window`) and private-mode storage errors never crash the app. */
export const tokenStorage = {
  get() {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      window.localStorage.setItem(KEY, token);
    } catch {
      /* storage unavailable: the session simply won't persist */
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};
