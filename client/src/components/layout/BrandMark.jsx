import { cn } from '@/lib/utils';

/** Two stacked towers: the product mark. Colours follow the current portal. */
export function BrandMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden>
      <rect width="32" height="32" rx="7" className="fill-sidebar-active" />
      <rect x="7" y="11" width="7" height="14" rx="1" className="fill-sidebar-indicator" opacity="0.55" />
      <rect x="16" y="6" width="9" height="19" rx="1" className="fill-sidebar-indicator" />
    </svg>
  );
}
