import Head from 'next/head';
import { BookingsView } from '@/components/bookings/BookingsView';
import { salesLayout } from '@/components/layout/layouts';

export default function SalesBookingsPage() {
  return (
    <>
      <Head>
        <title>Bookings · Plotline CRM</title>
      </Head>
      <BookingsView portal="sales" />
    </>
  );
}

SalesBookingsPage.getLayout = salesLayout;
