import Head from 'next/head';
import { LeadDetailView } from '@/components/leads/LeadDetailView';
import { salesLayout } from '@/components/layout/layouts';

export default function SalesLeadPage() {
  return (
    <>
      <Head>
        <title>Lead · Plotline CRM</title>
      </Head>
      <LeadDetailView portal="sales" />
    </>
  );
}

SalesLeadPage.getLayout = salesLayout;
