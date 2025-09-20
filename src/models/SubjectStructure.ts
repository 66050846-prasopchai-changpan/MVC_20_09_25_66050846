// Interface สำหรับโครงสร้างหลักสูตรที่บังคับในแต่ละหลักสูตร (เฉพาะปี 1)
export interface SubjectStructure {
  curriculumId: string;       // รหัสหลักสูตร (เลข 8 หลัก โดยตัวแรกไม่ขึ้นต้นด้วย 0)
  curriculumName: string;     // ชื่อหลักสูตร
  departmentName: string;     // ชื่อภาควิชา
  requiredSubjectId: string;  // รหัสวิชาที่บังคับ
  semester: number;           // เทอมที่เปิดสอน (1 หรือ 2)
}

// ฟังก์ชันตรวจสอบรูปแบบรหัสหลักสูตร
export function isValidCurriculumId(curriculumId: string): boolean {
  // ตรวจสอบว่าเป็นเลข 8 หลักและตัวแรกไม่ขึ้นต้นด้วย 0
  if (curriculumId.length !== 8) {
    return false;
  }
  
  // ตรวจสอบว่าเป็นตัวเลขทั้งหมด
  if (!/^\d{8}$/.test(curriculumId)) {
    return false;
  }
  
  // ตรวจสอบว่าตัวแรกไม่ใช่ 0
  return !curriculumId.startsWith('0');
}

// ฟังก์ชันตรวจสอบเทอม
export function isValidSemester(semester: number): boolean {
  return semester === 1 || semester === 2;
}