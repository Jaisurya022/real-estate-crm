import { z } from 'zod';
import { LEAD_SOURCES, LEAD_STAGES, UNIT_TYPES } from '../constants.js';
import {
  followUpDate,
  objectId,
  optionalEmail,
  optionalEnum,
  optionalNumber,
  optionalObjectId,
  pagination,
  phone,
  searchText,
} from './common.js';

const leadFields = {
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  phone,
  email: optionalEmail,
  source: z.enum(LEAD_SOURCES, { error: 'Pick a lead source.' }),
  budget: optionalNumber,
  preferredUnitType: optionalEnum(UNIT_TYPES),
  nextFollowUpAt: followUpDate,
};

export const createLeadSchema = z.object({
  ...leadFields,
  source: leadFields.source.default('Other'),
  assignedTo: optionalObjectId,
  note: z.string().trim().max(2000).optional(),
});

export const updateLeadSchema = z
  .object(leadFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update.');

export const changeStageSchema = z
  .object({
    stage: z.enum(LEAD_STAGES, { error: 'Pick a valid stage.' }),
    lostReason: z.string().trim().max(300).optional(),
  })
  .refine((data) => data.stage !== 'Lost' || (data.lostReason?.length ?? 0) >= 3, {
    message: 'Add a short reason for losing this lead.',
    path: ['lostReason'],
  });

export const assignLeadSchema = z.object({
  assignedTo: z.preprocess((v) => (v === '' ? null : v), objectId.nullable()),
});

export const addNoteSchema = z.object({
  message: z.string().trim().min(1, 'Write a note first.').max(2000),
  nextFollowUpAt: followUpDate,
});

export const listLeadsQuery = z.object({
  q: searchText,
  stage: z.enum(LEAD_STAGES).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  assignedTo: z.union([objectId, z.literal('unassigned')]).optional(),
  followUp: z.enum(['overdue', 'today', 'upcoming', 'none']).optional(),
  sort: z.enum(['recent', 'followUp', 'name']).optional(),
  ...pagination,
});
