import { z } from 'zod';
import { PROJECT_STATUS, UNIT_STATUS, UNIT_TYPES } from '../constants.js';
import { objectId, optionalNumber, positiveNumber, searchText } from './common.js';

const projectFields = {
  name: z.string().trim().min(2, 'Project name must be at least 2 characters.').max(100),
  city: z.string().trim().min(2, 'City is required.').max(60),
  location: z.string().trim().max(160).optional(),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(PROJECT_STATUS, { error: 'Pick a project status.' }),
};

export const createProjectSchema = z.object({
  ...projectFields,
  status: projectFields.status.default('Under construction'),
});

export const updateProjectSchema = z.object(projectFields).partial();

export const buildingSchema = z.object({
  name: z.string().trim().min(1, 'Building name is required.').max(60),
  totalFloors: z.coerce.number().int().min(1, 'At least 1 floor.').max(100, 'Up to 100 floors.'),
});

export const updateBuildingSchema = buildingSchema.partial();

const floor = z.coerce.number().int().min(0, 'Floor must be 0 (ground) or higher.');

/** Admins can block/unblock a unit. "booked" is only ever set by the booking flow. */
const manualUnitStatus = z.enum([UNIT_STATUS.AVAILABLE, UNIT_STATUS.BLOCKED], {
  error: 'Units become booked only through a booking.',
});

const unitFields = {
  unitNumber: z.string().trim().min(1, 'Unit number is required.').max(20),
  floor,
  type: z.enum(UNIT_TYPES, { error: 'Pick a unit type.' }),
  areaSqft: positiveNumber('Area'),
  price: positiveNumber('Price'),
  status: manualUnitStatus,
};

export const createUnitSchema = z.object({
  ...unitFields,
  building: objectId,
  status: manualUnitStatus.default(UNIT_STATUS.AVAILABLE),
});

export const updateUnitSchema = z
  .object(unitFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update.');

export const generateUnitsSchema = z
  .object({
    fromFloor: floor,
    toFloor: floor,
    unitsPerFloor: z.coerce.number().int().min(1).max(20, 'Up to 20 units per floor.'),
    type: z.enum(UNIT_TYPES, { error: 'Pick a unit type.' }),
    areaSqft: positiveNumber('Area'),
    basePrice: positiveNumber('Base price'),
    // "Floor rise": the per-floor premium Indian developers charge for higher floors.
    floorRise: optionalNumber.transform((value) => value ?? 0),
  })
  .refine((data) => data.toFloor >= data.fromFloor, {
    message: '"To floor" must be the same as or above "From floor".',
    path: ['toFloor'],
  });

export const listUnitsQuery = z.object({
  project: objectId.optional(),
  building: objectId.optional(),
  status: z.enum(Object.values(UNIT_STATUS)).optional(),
  type: z.enum(UNIT_TYPES).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  q: searchText,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});
