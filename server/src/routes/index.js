import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';
import authRoutes from './auth.routes.js';
import bookingRoutes from './booking.routes.js';
import leadRoutes from './lead.routes.js';
import { buildingRoutes, projectRoutes, unitRoutes } from './property.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);

// Everything below requires a signed-in user.
router.use(authenticate);
router.get('/dashboard', getDashboard);
router.use('/leads', leadRoutes);
router.use('/projects', projectRoutes);
router.use('/buildings', buildingRoutes);
router.use('/units', unitRoutes);
router.use('/bookings', bookingRoutes);
router.use('/users', userRoutes);

export default router;
