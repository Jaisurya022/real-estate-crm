import Head from 'next/head';
import { BookingsView } from '@/components/bookings/BookingsView';
import { adminLayout } from '@/components/layout/layouts';

export default function AdminBookingsPage() {
  return (
    <>
      <Head>
        <title>Bookings · Plotline CRM</title>
      </Head>
      <BookingsView portal="admin" />
    </>
  );
}

AdminBookingsPage.getLayout = adminLayout;
