import { Router } from 'express';
import * as leads from '../controllers/lead.controller.js';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validators/common.js';
import {
  addNoteSchema,
  assignLeadSchema,
  changeStageSchema,
  createLeadSchema,
  listLeadsQuery,
  updateLeadSchema,
} from '../validators/lead.validators.js';

const router = Router();

router.get('/', validate({ query: listLeadsQuery }), leads.listLeads);
router.post('/', validate({ body: createLeadSchema }), leads.createLead);
router.get('/:id', validate({ params: idParams }), leads.getLead);
router.patch('/:id', validate({ params: idParams, body: updateLeadSchema }), leads.updateLead);
router.patch('/:id/stage', validate({ params: idParams, body: changeStageSchema }), leads.changeStage);
router.patch(
  '/:id/assign',
  authorize('admin'),
  validate({ params: idParams, body: assignLeadSchema }),
  leads.assignLead,
);
router.post('/:id/notes', validate({ params: idParams, body: addNoteSchema }), leads.addNote);

export default router;
