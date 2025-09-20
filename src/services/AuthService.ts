import { DataService } from './DataService';
import { User, UserRole, isAdmin, isStudent } from '../models/User';

export class AuthService {
  private dataService: DataService<User>;

  constructor() {
    this.dataService = new DataService<User>('users.json');
  }

  /**
   * ตรวจสอบการเข้าสู่ระบบ
   */
  authenticate(username: string, password: string): { success: boolean; user?: User; message: string } {
    const user = this.dataService.findOne(u => u.username === username);
    
    if (!user) {
      return { success: false, message: 'ไม่พบผู้ใช้นี้' };
    }

    // ในโปรเจคจริงควรเข้ารหัสรหัสผ่าน
    if (user.password !== password) {
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
    }

    return { 
      success: true, 
      user: user,
      message: 'เข้าสู่ระบบสำเร็จ' 
    };
  }

  /**
   * ดึงข้อมูลผู้ใช้ตาม username
   */
  getUserByUsername(username: string): User | undefined {
    return this.dataService.findOne(u => u.username === username);
  }

  /**
   * ดึงข้อมูลผู้ใช้ตาม studentId (สำหรับนักเรียน)
   */
  getUserByStudentId(studentId: string): User | undefined {
    return this.dataService.findOne(u => u.studentId === studentId);
  }

  /**
   * ดึงผู้ใช้ทั้งหมด
   */
  getAllUsers(): User[] {
    return this.dataService.getAll();
  }

  /**
   * ดึงแอดมินทั้งหมด
   */
  getAllAdmins(): User[] {
    return this.dataService.find(u => isAdmin(u));
  }

  /**
   * ดึงนักเรียนทั้งหมด (ที่มี account)
   */
  getAllStudentUsers(): User[] {
    return this.dataService.find(u => isStudent(u));
  }

  /**
   * เพิ่มผู้ใช้ใหม่
   */
  createUser(user: User): { success: boolean; message: string } {
    // ตรวจสอบว่า username ซ้ำหรือไม่
    if (this.dataService.exists(u => u.username === user.username)) {
      return { success: false, message: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' };
    }

    // ตรวจสอบว่า studentId ซ้ำหรือไม่ (สำหรับนักเรียน)
    if (user.studentId && this.dataService.exists(u => u.studentId === user.studentId)) {
      return { success: false, message: 'รหัสนักเรียนนี้มีอยู่แล้ว' };
    }

    this.dataService.add(user);
    return { success: true, message: 'สร้างผู้ใช้สำเร็จ' };
  }

  /**
   * อัปเดตข้อมูลผู้ใช้
   */
  updateUser(username: string, updatedUser: User): { success: boolean; message: string } {
    const existing = this.getUserByUsername(username);
    if (!existing) {
      return { success: false, message: 'ไม่พบผู้ใช้นี้' };
    }

    const updated = this.dataService.update(username, 'username', updatedUser);
    if (updated) {
      return { success: true, message: 'อัปเดตข้อมูลสำเร็จ' };
    } else {
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัปเดต' };
    }
  }

  /**
   * เปลี่ยนรหัสผ่าน
   */
  changePassword(username: string, oldPassword: string, newPassword: string): { success: boolean; message: string } {
    const user = this.getUserByUsername(username);
    if (!user) {
      return { success: false, message: 'ไม่พบผู้ใช้นี้' };
    }

    if (user.password !== oldPassword) {
      return { success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' };
    }

    const updatedUser: User = {
      ...user,
      password: newPassword
    };

    const updated = this.dataService.update(username, 'username', updatedUser);
    if (updated) {
      return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
    } else {
      return { success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' };
    }
  }

  /**
   * ลบผู้ใช้
   */
  deleteUser(username: string): { success: boolean; message: string } {
    const deleted = this.dataService.delete(username, 'username');
    if (deleted) {
      return { success: true, message: 'ลบผู้ใช้สำเร็จ' };
    } else {
      return { success: false, message: 'เกิดข้อผิดพลาดในการลบผู้ใช้' };
    }
  }

  /**
   * ตรวจสอบว่าเป็นแอดมินหรือไม่
   */
  isUserAdmin(username: string): boolean {
    const user = this.getUserByUsername(username);
    return user ? isAdmin(user) : false;
  }

  /**
   * ตรวจสอบว่าเป็นนักเรียนหรือไม่
   */
  isUserStudent(username: string): boolean {
    const user = this.getUserByUsername(username);
    return user ? isStudent(user) : false;
  }

  /**
   * สร้าง account สำหรับนักเรียนโดยใช้รหัสนักเรียนเป็น username และ password
   */
  createStudentAccount(studentId: string): { success: boolean; message: string } {
    // ตรวจสอบว่ามี account แล้วหรือไม่
    if (this.dataService.exists(u => u.studentId === studentId)) {
      return { success: false, message: 'นักเรียนคนนี้มี account แล้ว' };
    }

    const user: User = {
      id: `student_${studentId}`,
      username: studentId,
      password: studentId, // ใช้รหัสนักเรียนเป็นรหัสผ่านเริ่มต้น
      role: 'student',
      fullName: `นักเรียน ${studentId}`,
      studentId: studentId
    };

    return this.createUser(user);
  }

  /**
   * สร้าง account แอดมิน
   */
  createAdminAccount(username: string, password: string): { success: boolean; message: string } {
    const user: User = {
      id: `admin_${username}`,
      username,
      password,
      role: 'admin',
      fullName: `แอดมิน ${username}`
    };

    return this.createUser(user);
  }
}