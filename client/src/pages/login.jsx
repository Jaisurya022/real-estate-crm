import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FormAlert } from '@/components/common/FormAlert';
import { FormField } from '@/components/common/FormField';
import { TowerElevation } from '@/components/common/TowerElevation';
import { BrandMark } from '@/components/layout/BrandMark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { PORTAL_HOME } from '@/lib/constants';

const DEMO_ACCOUNTS = [
  { role: 'Admin', name: 'Meera Iyer', email: 'admin@plotline.dev', password: 'Admin@123' },
  { role: 'Sales', name: 'Arjun Mehta', email: 'arjun@plotline.dev', password: 'Sales@123' },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, status, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Only follow ?next= into the signed-in user's own portal.
  const goHome = (signedIn) => {
    const next = router.query.next;
    const home = PORTAL_HOME[signedIn.role];
    router.replace(typeof next === 'string' && next.startsWith(home) ? next : home);
  };

  // The sign-in screen always uses the neutral (admin) accent, even after a sales user signs out.
  useEffect(() => {
    document.documentElement.dataset.portal = 'admin';
  }, []);

  useEffect(() => {
    if (status === 'authenticated') goHome(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const signIn = async (credentials) => {
    setError('');
    setSubmitting(true);
    try {
      const signedIn = await login(credentials.email, credentials.password);
      goHome(signedIn);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    signIn({ email, password });
  };

  const signInAsDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    signIn(account);
  };

  return (
    <>
      <Head>
        <title>Sign in · Plotline CRM</title>
      </Head>
      <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
        <aside className="hidden flex-col bg-[#15232c] p-12 text-[#c5d0d7] lg:flex">
          <div className="flex items-center gap-3">
            <BrandMark />
            <span className="font-display text-lg font-semibold text-white">Plotline</span>
          </div>
          <div className="flex min-h-0 flex-1 items-end justify-end py-10">
            <TowerElevation className="h-full max-h-[26rem]" />
          </div>
          <div className="max-w-md">
            <h2 className="font-display text-4xl leading-[1.1] font-semibold text-white">
              Know which flats are still open before the customer asks.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[#9fb0bb]">
              Leads, site visits, follow-ups and bookings for your sales team, with live inventory for every tower.
            </p>
          </div>
        </aside>

        <main className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <BrandMark />
              <span className="font-display text-lg font-semibold">Plotline</span>
            </div>
            <h1 className="text-2xl font-semibold">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Use your work email and password.</p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-4" noValidate>
              <FormAlert message={error} />
              <FormField id="email" label="Email">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </FormField>
              <FormField id="password" label="Password">
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </FormField>
              <Button type="submit" size="lg" loading={submitting} disabled={!email || !password}>
                Sign in
              </Button>
            </form>

            <div className="mt-10 border-t pt-6">
              <p className="text-sm font-medium">Try a demo account</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Each role opens its own workspace.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <Button
                    key={account.email}
                    type="button"
                    variant="outline"
                    className="h-auto flex-col items-start gap-0 px-3 py-2 text-left"
                    onClick={() => signInAsDemo(account)}
                    disabled={submitting}
                  >
                    <span className="text-sm font-medium">{account.role}</span>
                    <span className="text-xs font-normal text-muted-foreground">{account.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
