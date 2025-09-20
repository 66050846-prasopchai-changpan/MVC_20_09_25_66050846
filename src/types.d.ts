import 'express-session';

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      password: string;
      role: 'admin' | 'teacher' | 'student';
      fullName: string;
      studentId?: string;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    user?: Express.User;
    isLoggedIn?: boolean;
    userId?: string;
    role?: string;
    studentId?: string;
  }
}