import { Loader2 } from 'lucide-react';

export function LoadingScreen({ label = 'Loading' }) {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
