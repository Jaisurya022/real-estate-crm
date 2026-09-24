import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** Label + control + hint/error, wired up for screen readers. */
export function FormField({ id, label, error, hint, optional, className, children }) {
  return (
    <div className={cn('grid content-start gap-1.5', className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
        </Label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/** Props that link a control to its FormField error. */
export const fieldProps = (id, error) => ({
  id,
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error ? `${id}-error` : undefined,
});
