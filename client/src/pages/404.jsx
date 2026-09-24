import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-6xl font-semibold text-muted-foreground/40">404</p>
      <h1 className="mt-3 text-xl font-semibold">This page doesn&apos;t exist</h1>
      <p className="mt-1 text-sm text-muted-foreground">The link may be old, or the address has a typo.</p>
      <Button asChild className="mt-6">
        <Link href="/">Go to my dashboard</Link>
      </Button>
    </main>
  );
}
