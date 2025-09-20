import { Router } from 'express';
import { authRoutes } from './authRoutes';
import { studentRoutes } from './studentRoutes';
import { adminRoutes } from './adminRoutes';

const router = Router();

// Mount route modules
router.use('/', authRoutes);
router.use('/student', studentRoutes);
router.use('/admin', adminRoutes);

export { router as routes };