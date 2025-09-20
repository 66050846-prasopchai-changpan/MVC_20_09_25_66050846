// Interface สำหรับรายวิชา
export interface Subject {
  subjectId: string;        // เลข 8 หลัก (05500xxx สำหรับวิชาคณะ หรือ 9069xxxx สำหรับวิชาศึกษาทั่วไป)
  subjectName: string;      // ชื่อวิชา
  credits: number;          // หน่วยกิต (ตัวเลข > 0)
  instructor: string;       // อาจารย์ผู้สอน (เก็บเป็นชื่อผู้สอน)
  prerequisiteId?: string;  // รหัสวิชาบังคับก่อน (ถ้ามี)
  schedule?: string;        // ตารางเรียน (ถ้ามี)
  room?: string;           // ห้องเรียน (ถ้ามี)
}

// ฟังก์ชันตรวจสอบประเภทวิชา
export function getSubjectType(subjectId: string): 'faculty' | 'general' | 'unknown' {
  if (subjectId.startsWith('05500')) {
    return 'faculty';
  } else if (subjectId.startsWith('9069')) {
    return 'general';
  }
  return 'unknown';
}

// ฟังก์ชันตรวจสอบรูปแบบรหัสวิชา
export function isValidSubjectId(subjectId: string): boolean {
  // ตรวจสอบว่าเป็นเลข 8 หลักและขึ้นต้นด้วย '0550' หรือ '9069'
  if (subjectId.length !== 8) {
    return false;
  }
  return subjectId.startsWith('0550') || subjectId.startsWith('9069');
}