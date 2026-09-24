import { cn } from '@/lib/utils';

/**
 * A titled section on a page. Borders only, no shadows, so dense screens stay calm.
 * `flush` removes body padding for edge-to-edge lists and tables.
 */
export function Panel({ title, description, actions, children, className, bodyClassName, flush = false }) {
  return (
    <section className={cn('rounded-xl border bg-card', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(!flush && 'p-4 sm:p-5', bodyClassName)}>{children}</div>
    </section>
  );
}
