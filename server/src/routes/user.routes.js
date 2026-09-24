import { Router } from 'express';
import * as users from '../controllers/user.controller.js';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validators/common.js';
import { createUserSchema, listUsersQuery, updateUserSchema } from '../validators/user.validators.js';

const router = Router();

router.use(authorize('admin'));
router.get('/', validate({ query: listUsersQuery }), users.listUsers);
router.post('/', validate({ body: createUserSchema }), users.createUser);
router.patch('/:id', validate({ params: idParams, body: updateUserSchema }), users.updateUser);

export default router;
