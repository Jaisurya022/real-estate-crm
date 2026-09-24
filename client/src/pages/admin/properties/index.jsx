import Head from 'next/head';
import { ProjectsView } from '@/components/properties/ProjectsView';
import { adminLayout } from '@/components/layout/layouts';

export default function AdminPropertiesPage() {
  return (
    <>
      <Head>
        <title>Properties · Plotline CRM</title>
      </Head>
      <ProjectsView />
    </>
  );
}

AdminPropertiesPage.getLayout = adminLayout;
