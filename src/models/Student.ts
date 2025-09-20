// Interface สำหรับนักเรียน
export interface Student {
  studentId: string;        // เลข 8 หลัก โดยตัวเลข 2 ตัวแรกเริ่มต้นด้วย 69
  title: string;            // คำนำหน้า (นาย, นางสาว, เด็กชาย, เด็กหญิง)
  firstName: string;        // ชื่อ
  lastName: string;         // นามสกุล
  birthDate: string;        // วันเกิด (ISO date format)
  school: string;           // โรงเรียนปัจจุบัน
  email: string;            // อีเมลที่ใช้ติดต่อ
  curriculumId: string;     // รหัสหลักสูตรที่ลงทะเบียน
  fullName?: string;        // เพิ่ม fullName เพื่อรวม firstName และ lastName
}

// ฟังก์ชันช่วยคำนวณอายุ
export function calculateAge(birthDateString: string): number {
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}