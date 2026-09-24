import '@/styles/globals.css';
import { MotionConfig } from 'motion/react';
import Head from 'next/head';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

export default function App({ Component, pageProps }) {
  // Pages opt into a portal layout with `Page.getLayout = adminLayout` (or salesLayout).
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Respect the OS "reduce motion" setting for every animation. */}
        <MotionConfig reducedMotion="user">
          <Head>
            <title>Plotline CRM</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </Head>
          {getLayout(<Component {...pageProps} />)}
          <Toaster />
        </MotionConfig>
      </AuthProvider>
    </ThemeProvider>
  );
}
