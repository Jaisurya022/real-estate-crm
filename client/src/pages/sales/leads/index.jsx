import Head from 'next/head';
import { LeadsListView } from '@/components/leads/LeadsListView';
import { salesLayout } from '@/components/layout/layouts';

export default function SalesLeadsPage() {
  return (
    <>
      <Head>
        <title>My leads · Plotline CRM</title>
      </Head>
      <LeadsListView portal="sales" />
    </>
  );
}

SalesLeadsPage.getLayout = salesLayout;
