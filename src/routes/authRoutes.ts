import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

// Default route - redirect to login
router.get('/', (req, res) => {
  if ((req.session as any)?.user) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// Authentication routes
router.get('/login', authController.showLogin);
router.post('/login', authController.processLogin);
router.get('/logout', authController.logout);
router.get('/dashboard', authController.requireAuth, authController.showDashboard);

// API routes
router.get('/api/auth/status', authController.checkAuthStatus);
router.post('/api/auth/change-password', authController.requireAuth, authController.changePassword);

export { router as authRoutes };