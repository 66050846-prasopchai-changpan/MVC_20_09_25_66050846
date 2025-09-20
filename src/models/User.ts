// Interface สำหรับผู้ใช้ระบบ (นักเรียน, ครู และแอดมิน)
export interface User {
  id: string;               // รหัสผู้ใช้ (unique ID)
  username: string;         // ชื่อผู้ใช้ (สำหรับแอดมินจะเป็นชื่อที่กำหนด, สำหรับนักเรียนจะเป็นรหัสนักเรียน)
  password: string;         // รหัสผ่าน (ในโปรเจคจริงควรเข้ารหัส)
  role: UserRole;           // บทบาทของผู้ใช้
  fullName: string;         // ชื่อ-นามสกุล
  studentId?: string;       // รหัสนักเรียน (สำหรับผู้ใช้ที่เป็นนักเรียน)
}

// ประเภทของผู้ใช้
export type UserRole = 'admin' | 'teacher' | 'student';

// Interface สำหรับ Session
export interface UserSession {
  isLoggedIn: boolean;
  userId: string;
  role: UserRole;
  studentId?: string;
}

// ฟังก์ชันตรวจสอบว่าเป็นแอดมินหรือไม่
export function isAdmin(user: User): boolean {
  return user.role === 'admin';
}

// ฟังก์ชันตรวจสอบว่าเป็นนักเรียนหรือไม่
export function isStudent(user: User): boolean {
  return user.role === 'student';
}