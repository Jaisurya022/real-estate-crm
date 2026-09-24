export const ROLES = Object.freeze({ ADMIN: 'admin', SALES: 'sales' });

export const LEAD_STAGES = Object.freeze([
  'New',
  'Contacted',
  'Site Visit',
  'Interested',
  'Negotiation',
  'Booked',
  'Lost',
]);

/** Stages where the lead is no longer being worked on. */
export const CLOSED_STAGES = Object.freeze(['Booked', 'Lost']);

export const LEAD_SOURCES = Object.freeze([
  'Website',
  'Walk-in',
  'Referral',
  'Property portal',
  'Social media',
  'Channel partner',
  'Other',
]);

export const UNIT_TYPES = Object.freeze(['1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Plot', 'Commercial']);

export const UNIT_STATUS = Object.freeze({
  AVAILABLE: 'available',
  BOOKED: 'booked',
  BLOCKED: 'blocked',
});

export const PROJECT_STATUS = Object.freeze(['Pre-launch', 'Under construction', 'Ready to move']);

export const BOOKING_STATUS = Object.freeze({ CONFIRMED: 'confirmed', CANCELLED: 'cancelled' });

export const ACTIVITY_TYPES = Object.freeze([
  'created',
  'updated',
  'note',
  'stage_change',
  'assignment',
  'booking',
  'booking_cancelled',
]);

/**
 * Pricing guardrails for bookings.
 * - Sales employees can agree a price up to 5% below list; bigger discounts need an admin.
 * - RERA (Real Estate Regulation Act, 2016, section 13) caps the advance a developer may take
 *   before a registered agreement for sale at 10% of the unit cost.
 */
export const BOOKING_RULES = Object.freeze({
  MAX_SALES_DISCOUNT: 0.05,
  MAX_BOOKING_AMOUNT_SHARE: 0.1,
});
