// Export ทุก Model เพื่อให้ใช้งานง่าย
export * from './Student';
export * from './Subject';
export * from './SubjectStructure';
export * from './RegisteredSubject';
export * from './User';

// Interface สำหรับ Response ทั่วไป
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Interface สำหรับการตรวจสอบ Business Rules
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}