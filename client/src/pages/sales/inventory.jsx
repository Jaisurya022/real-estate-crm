import Head from 'next/head';
import { InventoryView } from '@/components/properties/InventoryView';
import { salesLayout } from '@/components/layout/layouts';

export default function SalesInventoryPage() {
  return (
    <>
      <Head>
        <title>Inventory · Plotline CRM</title>
      </Head>
      <InventoryView />
    </>
  );
}

SalesInventoryPage.getLayout = salesLayout;
