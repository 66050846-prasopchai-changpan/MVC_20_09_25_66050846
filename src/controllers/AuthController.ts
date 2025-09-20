import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { User } from '../models/User';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * แสดงหน้าเข้าสู่ระบบ
   */
  public showLogin = (req: Request, res: Response): void => {
    if ((req.session as any)?.user) {
      res.redirect('/dashboard');
      return;
    }
    res.render('auth/login', { 
      title: 'เข้าสู่ระบบ',
      error: null 
    });
  };

  /**
   * ประมวลผลการเข้าสู่ระบบ
   */
  public processLogin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.render('auth/login', {
          title: 'เข้าสู่ระบบ',
          error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
        });
        return;
      }

      console.log('Login attempt:', { username, password });
      const authResult = this.authService.authenticate(username, password);
      console.log('Auth result:', authResult);
      
      if (authResult.success && authResult.user) {
        (req.session as any)!.user = authResult.user;
        res.redirect('/dashboard');
      } else {
        res.render('auth/login', {
          title: 'เข้าสู่ระบบ',
          error: authResult.message
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.render('auth/login', {
        title: 'เข้าสู่ระบบ',
        error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
      });
    }
  };

  /**
   * ออกจากระบบ
   */
  public logout = (req: Request, res: Response): void => {
    (req.session as any)?.destroy((err: any) => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.redirect('/login');
    });
  };

  /**
   * แสดงหน้าแดชบอร์ด
   */
  public showDashboard = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    res.render('dashboard', {
      title: 'แดชบอร์ด',
      user: user
    });
  };

  /**
   * Middleware: ตรวจสอบการเข้าสู่ระบบ
   */
  public requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    if ((req.session as any)?.user) {
      next();
    } else {
      res.redirect('/login');
    }
  };

  /**
   * Middleware: ตรวจสอบสิทธิ์ Admin
   */
  public requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    const user = (req.session as any)?.user;
    if (user && user.role === 'admin') {
      next();
    } else {
      res.status(403).render('error', {
        title: 'ไม่มีสิทธิ์เข้าถึง',
        message: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
        error: { status: 403 }
      });
    }
  };

  /**
   * Middleware: ตรวจสอบสิทธิ์ Teacher
   */
  public requireTeacher = (req: Request, res: Response, next: NextFunction): void => {
    const user = (req.session as any)?.user;
    if (user && (user.role === 'admin' || user.role === 'teacher')) {
      next();
    } else {
      res.status(403).render('error', {
        title: 'ไม่มีสิทธิ์เข้าถึง',
        message: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
        error: { status: 403 }
      });
    }
  };

  /**
   * ตรวจสอบสถานะการเข้าสู่ระบบ (API)
   */
  public checkAuthStatus = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    res.json({
      authenticated: !!user,
      user: user ? {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName
      } : null
    });
  };

  /**
   * เปลี่ยนรหัสผ่าน
   */
  public changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req.session as any)?.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'ไม่ได้เข้าสู่ระบบ' });
        return;
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        res.status(400).json({ 
          success: false, 
          message: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        res.status(400).json({ 
          success: false, 
          message: 'รหัสผ่านใหม่ไม่ตรงกัน' 
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ 
          success: false, 
          message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' 
        });
        return;
      }

      // ตรวจสอบรหัสผ่านปัจจุบัน
      const authResult = this.authService.authenticate(user.username, currentPassword);
      if (!authResult.success) {
        res.status(400).json({ 
          success: false, 
          message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' 
        });
        return;
      }

      // เปลี่ยนรหัสผ่าน
      const result = this.authService.changePassword(user.username, currentPassword, newPassword);
      
      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(500).json({ 
          success: false, 
          message: result.message 
        });
      }
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'เกิดข้อผิดพลาดในระบบ' 
      });
    }
  };
}