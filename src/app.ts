import express from 'express';
import session from 'express-session';
import path from 'path';
import { routes } from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Express
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
  secret: 'student-registration-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
// Routes
app.use('/', routes);

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: 'ไม่พบหน้าที่ต้องการ',
    message: 'ขออภัย ไม่พบหน้าที่คุณต้องการ',
    error: { status: 404 }
  });
});

app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(error.status || 500).render('error', {
    title: 'เกิดข้อผิดพลาด',
    message: error.message || 'เกิดข้อผิดพลาดในระบบ',
    error: error
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 Student Registration System - MVC Architecture`);
  console.log(`👤 Default Admin: username=admin, password=admin123`);
  console.log(`👤 Default Teacher: username=teacher01, password=teacher123`);
  console.log(`👤 Default Student: username=69000001, password=69000001`);
});

export default app;