import Head from 'next/head';
import { LeadsListView } from '@/components/leads/LeadsListView';
import { adminLayout } from '@/components/layout/layouts';

export default function AdminLeadsPage() {
  return (
    <>
      <Head>
        <title>Leads · Plotline CRM</title>
      </Head>
      <LeadsListView portal="admin" />
    </>
  );
}

AdminLeadsPage.getLayout = adminLayout;
