export const ROLES = { ADMIN: 'admin', SALES: 'sales' };

/** Each role has its own portal (URL prefix + layout). */
export const PORTAL_HOME = { admin: '/admin', sales: '/sales' };

export const LEAD_STAGES = ['New', 'Contacted', 'Site Visit', 'Interested', 'Negotiation', 'Booked', 'Lost'];

/** The stages a salesperson moves a lead through by hand (Booked comes from a booking). */
export const PIPELINE_STAGES = LEAD_STAGES.slice(0, 5);

export const STAGE_STYLES = {
  New: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
  Contacted: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
  'Site Visit': 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300',
  Interested: 'bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300',
  Negotiation: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  Booked: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  Lost: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
};

/** Solid colours for pipeline bars (same hue family as the badges). */
export const STAGE_BAR = {
  New: 'bg-slate-400',
  Contacted: 'bg-sky-500',
  'Site Visit': 'bg-violet-500',
  Interested: 'bg-teal-500',
  Negotiation: 'bg-amber-500',
  Booked: 'bg-emerald-500',
  Lost: 'bg-rose-400',
};

export const LEAD_SOURCES = [
  'Website',
  'Walk-in',
  'Referral',
  'Property portal',
  'Social media',
  'Channel partner',
  'Other',
];

export const UNIT_TYPES = ['1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Plot', 'Commercial'];

export const UNIT_STATUS = {
  available: { label: 'Available', dot: 'bg-available', text: 'text-available', soft: 'bg-available-soft' },
  booked: { label: 'Booked', dot: 'bg-booked', text: 'text-booked', soft: 'bg-booked-soft' },
  blocked: { label: 'Blocked', dot: 'bg-blocked', text: 'text-blocked', soft: 'bg-blocked-soft' },
};

export const PROJECT_STATUS = ['Pre-launch', 'Under construction', 'Ready to move'];

export const FOLLOW_UP_FILTERS = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'none', label: 'Not scheduled' },
];

/** Mirrors the API's booking guardrails so the form can explain them up front. */
export const BOOKING_RULES = {
  MAX_SALES_DISCOUNT: 0.05,
  MAX_BOOKING_AMOUNT_SHARE: 0.1,
};

export const bookingLimits = (listPrice, agreedPrice, isAdmin) => ({
  minPrice: isAdmin ? 1 : Math.ceil(listPrice * (1 - BOOKING_RULES.MAX_SALES_DISCOUNT)),
  maxAdvance: Math.floor((agreedPrice || listPrice) * BOOKING_RULES.MAX_BOOKING_AMOUNT_SHARE),
});
