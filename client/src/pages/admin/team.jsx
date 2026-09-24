import Head from 'next/head';
import { TeamView } from '@/components/team/TeamView';
import { adminLayout } from '@/components/layout/layouts';

export default function AdminTeamPage() {
  return (
    <>
      <Head>
        <title>Team · Plotline CRM</title>
      </Head>
      <TeamView />
    </>
  );
}

AdminTeamPage.getLayout = adminLayout;
