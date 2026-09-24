import { Router } from 'express';
import * as properties from '../controllers/property.controller.js';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validators/common.js';
import {
  buildingSchema,
  createProjectSchema,
  createUnitSchema,
  generateUnitsSchema,
  listUnitsQuery,
  updateBuildingSchema,
  updateProjectSchema,
  updateUnitSchema,
} from '../validators/property.validators.js';

const adminOnly = authorize('admin');

// Everyone can browse inventory; only admins can change it.
export const projectRoutes = Router()
  .get('/', properties.listProjects)
  .post('/', adminOnly, validate({ body: createProjectSchema }), properties.createProject)
  .get('/:id', validate({ params: idParams }), properties.getProject)
  .patch('/:id', adminOnly, validate({ params: idParams, body: updateProjectSchema }), properties.updateProject)
  .post('/:id/buildings', adminOnly, validate({ params: idParams, body: buildingSchema }), properties.createBuilding);

export const buildingRoutes = Router()
  .patch('/:id', adminOnly, validate({ params: idParams, body: updateBuildingSchema }), properties.updateBuilding)
  .post(
    '/:id/units/generate',
    adminOnly,
    validate({ params: idParams, body: generateUnitsSchema }),
    properties.generateUnits,
  );

export const unitRoutes = Router()
  .get('/', validate({ query: listUnitsQuery }), properties.listUnits)
  .post('/', adminOnly, validate({ body: createUnitSchema }), properties.createUnit)
  .get('/:id', validate({ params: idParams }), properties.getUnit)
  .patch('/:id', adminOnly, validate({ params: idParams, body: updateUnitSchema }), properties.updateUnit);
