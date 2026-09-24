import { Building2, CalendarCheck, Handshake, LayoutDashboard, Sun, Users, UsersRound } from 'lucide-react';

/** Sidebar items per portal. `exact` marks items that shouldn't match sub-paths. */
export const NAVIGATION = {
  admin: {
    title: 'Admin console',
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/admin/leads', label: 'Leads', icon: UsersRound },
      { href: '/admin/properties', label: 'Properties', icon: Building2 },
      { href: '/admin/bookings', label: 'Bookings', icon: Handshake },
      { href: '/admin/team', label: 'Team', icon: Users },
    ],
  },
  sales: {
    title: 'Sales workspace',
    items: [
      { href: '/sales', label: 'My day', icon: Sun, exact: true },
      { href: '/sales/leads', label: 'My leads', icon: UsersRound },
      { href: '/sales/inventory', label: 'Inventory', icon: Building2 },
      { href: '/sales/bookings', label: 'Bookings', icon: CalendarCheck },
    ],
  },
};
