import Head from 'next/head';
import { LeadDetailView } from '@/components/leads/LeadDetailView';
import { adminLayout } from '@/components/layout/layouts';

export default function AdminLeadPage() {
  return (
    <>
      <Head>
        <title>Lead · Plotline CRM</title>
      </Head>
      <LeadDetailView portal="admin" />
    </>
  );
}

AdminLeadPage.getLayout = adminLayout;
