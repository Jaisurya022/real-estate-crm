import { AppShell } from './AppShell';

/**
 * Per-page layouts (Next.js `getLayout` pattern). Because the same AppShell
 * element is returned for every page in a portal, the sidebar stays mounted
 * between navigations and only the page content changes.
 */
export const adminLayout = (page) => <AppShell portal="admin">{page}</AppShell>;
export const salesLayout = (page) => <AppShell portal="sales">{page}</AppShell>;
