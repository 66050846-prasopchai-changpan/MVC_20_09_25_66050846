// Interface สำหรับวิชาที่เลือกลงแล้วเพื่อเก็บเกรด
export interface RegisteredSubject {
  studentId: string;        // รหัสนักเรียนที่ลงทะเบียน
  subjectId: string;        // รหัสวิชาที่ลงแล้ว
  grade?: string;           // เกรดที่ได้รับ (A, B+, B, C+, C, D+, D, F) - optional เพราะอาจยังไม่มีเกรด
  registrationDate: string; // วันที่ลงทะเบียน
}

// ประเภทของเกรดที่อนุญาต
export type Grade = 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F';

// ฟังก์ชันตรวจสอบเกรดที่ถูกต้อง
export function isValidGrade(grade: string): grade is Grade {
  const validGrades: Grade[] = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
  return validGrades.includes(grade as Grade);
}

// ฟังก์ชันตรวจสอบว่าผ่านวิชาหรือไม่
export function isPassingGrade(grade: string): boolean {
  return grade !== 'F' && isValidGrade(grade);
}

// ฟังก์ชันแปลงเกรดเป็นค่าคะแนน (สำหรับคำนวณ GPA ถ้าต้องการ)
export function gradeToPoint(grade: string): number {
  switch (grade) {
    case 'A': return 4.0;
    case 'B+': return 3.5;
    case 'B': return 3.0;
    case 'C+': return 2.5;
    case 'C': return 2.0;
    case 'D+': return 1.5;
    case 'D': return 1.0;
    case 'F': return 0.0;
    default: return 0.0;
  }
}