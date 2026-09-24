import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { NAVIGATION } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { BrandMark } from './BrandMark';

function isActive(pathname, item) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** `variant` keeps the desktop and mobile active-indicator animations separate. */
export function Sidebar({ portal, variant = 'desktop' }) {
  const { pathname } = useRouter();
  const nav = NAVIGATION[portal];

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 pt-5 pb-6">
        <BrandMark />
        <div className="leading-tight">
          <p className="font-display text-[15px] font-semibold text-sidebar-active-foreground">Plotline</p>
          <p className="text-xs text-sidebar-muted">{nav.title}</p>
        </div>
      </div>

      <nav className="flex-1 px-3" aria-label="Main">
        <ul className="grid gap-0.5">
          {nav.items.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-indicator',
                    active
                      ? 'font-medium text-sidebar-active-foreground'
                      : 'hover:text-sidebar-active-foreground',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId={`nav-active-${variant}`}
                      className="absolute inset-0 rounded-md bg-sidebar-active"
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    >
                      <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-sidebar-indicator" />
                    </motion.span>
                  )}
                  <Icon className="relative size-4" />
                  <span className="relative">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
