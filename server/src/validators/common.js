import { z } from 'zod';
import { normalizePhone } from '../utils/phone.js';

/**
 * Forms send "" for a cleared field. Treat it as an explicit `null` (clear the
 * value) while leaving `undefined` alone, so absent keys stay absent.
 */
const emptyToNull = (value) => (value === '' ? null : value);

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id.');

export const idParams = z.object({ id: objectId });

export const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const searchText = z.string().trim().max(100).optional();

export const phone = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((digits) => digits.length >= 10 && digits.length <= 13, 'Enter a valid phone number.');

export const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email.'));

export const optionalEmail = z.preprocess(emptyToNull, email.nullable().optional());

export const optionalNumber = z.preprocess(
  emptyToNull,
  z.coerce.number().min(0, 'Must be zero or more.').nullable().optional(),
);

export const positiveNumber = (label) =>
  z.coerce.number({ error: `${label} is required.` }).positive(`${label} must be more than zero.`);

/** A follow-up date must be in the future (a few minutes of grace for slow forms). */
export const followUpDate = z.preprocess(
  emptyToNull,
  z.coerce
    .date({ error: 'Pick a valid date.' })
    .refine((date) => date.getTime() > Date.now() - 5 * 60 * 1000, 'Follow-up must be in the future.')
    .nullable()
    .optional(),
);

export const optionalEnum = (values) => z.preprocess(emptyToNull, z.enum(values).nullable().optional());

export const optionalObjectId = z.preprocess(emptyToNull, objectId.nullable().optional());

export const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');
