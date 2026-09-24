import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';

export function UserAvatar({ name, className }) {
  return (
    <span
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground',
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
