import Head from 'next/head';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { salesLayout } from '@/components/layout/layouts';

export default function SalesMyDayPage() {
  return (
    <>
      <Head>
        <title>My day · Plotline CRM</title>
      </Head>
      <DashboardView portal="sales" />
    </>
  );
}

SalesMyDayPage.getLayout = salesLayout;
