import Head from 'next/head';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { adminLayout } from '@/components/layout/layouts';

export default function AdminOverviewPage() {
  return (
    <>
      <Head>
        <title>Overview · Plotline CRM</title>
      </Head>
      <DashboardView portal="admin" />
    </>
  );
}

AdminOverviewPage.getLayout = adminLayout;
