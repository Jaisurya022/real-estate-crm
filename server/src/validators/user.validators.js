import { z } from 'zod';
import { ROLES } from '../constants.js';
import { booleanString, email } from './common.js';

const password = z.string().min(8, 'Password must be at least 8 characters.').max(72);

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80),
  email,
  password,
  role: z.enum(Object.values(ROLES)).default(ROLES.SALES),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    role: z.enum(Object.values(ROLES)),
    isActive: z.boolean(),
    password,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update.');

export const listUsersQuery = z.object({
  role: z.enum(Object.values(ROLES)).optional(),
  active: booleanString.optional(),
});
