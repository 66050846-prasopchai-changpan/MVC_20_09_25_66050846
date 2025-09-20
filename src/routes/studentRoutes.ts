import { Router } from 'express';
import { StudentController } from '../controllers/StudentController';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const studentController = new StudentController();
const authController = new AuthController();

// Student routes - all require authentication
router.get('/profile', authController.requireAuth, studentController.showProfile);
router.get('/register', authController.requireAuth, studentController.showRegistration);
router.post('/register', authController.requireAuth, studentController.processRegistration);
router.post('/cancel', authController.requireAuth, studentController.cancelRegistration);
router.get('/grades', authController.requireAuth, studentController.showGrades);

export { router as studentRoutes };