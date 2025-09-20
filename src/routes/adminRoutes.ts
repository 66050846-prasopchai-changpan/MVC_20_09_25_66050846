import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const adminController = new AdminController();
const authController = new AuthController();

// Admin dashboard routes
router.get('/', authController.requireAuth, adminController.showDashboard);
router.get('/dashboard', authController.requireAuth, adminController.showDashboard);

// Admin student management routes
router.get('/students', authController.requireAuth, adminController.showStudents);
router.get('/students/add', authController.requireAuth, adminController.showAddStudent);
router.post('/students/add', authController.requireAuth, adminController.addStudent);
router.get('/students/edit/:id', authController.requireAuth, adminController.showEditStudent);
router.post('/students/edit/:id', authController.requireAuth, adminController.updateStudent);
router.post('/students/delete/:id', authController.requireAuth, adminController.deleteStudent);

// Admin subject management routes
router.get('/subjects', authController.requireAuth, adminController.showSubjects);
router.get('/subjects/add', authController.requireAuth, adminController.showAddSubject);
router.post('/subjects/add', authController.requireAuth, adminController.addSubject);
router.get('/subjects/edit/:id', authController.requireAuth, adminController.showEditSubject);
router.post('/subjects/edit/:id', authController.requireAuth, adminController.updateSubject);
router.post('/subjects/delete/:id', authController.requireAuth, adminController.deleteSubject);

// Admin grade management routes
router.get('/grades', authController.requireAuth, adminController.showGrades);
router.get('/grades/add/:studentId', authController.requireAuth, adminController.showAddGrade);
router.post('/grades/add/:studentId', authController.requireAuth, adminController.addGrade);
router.get('/grades/edit/:studentId/:subjectId', authController.requireAuth, adminController.showEditGrade);
router.post('/grades/edit/:studentId/:subjectId', authController.requireAuth, adminController.updateGrade);
router.post('/grades/delete/:studentId/:subjectId', authController.requireAuth, adminController.deleteGrade);

// Admin grade management by subject routes
router.get('/grades/subject/:subjectId', authController.requireAuth, adminController.showSubjectGrades);
router.post('/grades/subject/:subjectId', authController.requireAuth, adminController.updateSubjectGrades);

export { router as adminRoutes };