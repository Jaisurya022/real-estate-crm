import { Menu } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { PORTAL_HOME } from '@/lib/constants';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

/**
 * Shared frame for both portals. It also guards the route:
 *  - signed out            -> /login?next=<this page>
 *  - wrong portal for role -> that role's own home (/admin or /sales)
 */
export function AppShell({ portal, children }) {
  const router = useRouter();
  const { user, status } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = useCallback(() => setNavOpen(false), []);

  // Portal accent colours are CSS variables keyed off <html data-portal>, so
  // dialogs and menus rendered in portals pick them up too.
  useEffect(() => {
    document.documentElement.dataset.portal = portal;
  }, [portal]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace({ pathname: '/login', query: { next: router.asPath } });
    } else if (status === 'authenticated' && user.role !== portal) {
      router.replace(PORTAL_HOME[user.role]);
    }
  }, [status, user, portal, router]);

  useEffect(() => closeNav(), [router.asPath, closeNav]);

  if (status !== 'authenticated' || user.role !== portal) return <LoadingScreen />;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:block">
        <div className="sticky top-0 h-dvh">
          <Sidebar portal={portal} />
        </div>
      </aside>
      <MobileNav open={navOpen} onClose={closeNav} portal={portal} />

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open navigation">
            <Menu className="size-5" />
          </Button>
          <span className="font-display font-semibold lg:hidden">Plotline</span>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <motion.main
          key={router.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
