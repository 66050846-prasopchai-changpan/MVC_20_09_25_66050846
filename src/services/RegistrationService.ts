import { DataService } from './DataService';
import { RegisteredSubject, isValidGrade, isPassingGrade } from '../models/RegisteredSubject';
import { StudentService } from './StudentService';
import { SubjectService } from './SubjectService';

export class RegistrationService {
  private dataService: DataService<RegisteredSubject>;
  private studentService: StudentService;
  private subjectService: SubjectService;

  constructor() {
    this.dataService = new DataService<RegisteredSubject>('registeredSubjects.json');
    this.studentService = new StudentService();
    this.subjectService = new SubjectService();
  }

  /**
   * ดึงการลงทะเบียนทั้งหมด
   */
  getAllRegistrations(): RegisteredSubject[] {
    return this.dataService.getAll();
  }

  /**
   * ดึงการลงทะเบียนของนักเรียนคนหนึ่ง
   */
  getRegistrationsByStudent(studentId: string): RegisteredSubject[] {
    return this.dataService.find(reg => reg.studentId === studentId);
  }

  /**
   * ดึงการลงทะเบียนของรายวิชาหนึ่ง
   */
  getRegistrationsBySubject(subjectId: string): RegisteredSubject[] {
    return this.dataService.find(reg => reg.subjectId === subjectId);
  }

  /**
   * ตรวจสอบว่านักเรียนลงทะเบียนรายวิชานี้หรือไม่
   */
  isStudentRegistered(studentId: string, subjectId: string): boolean {
    return this.dataService.exists(reg => 
      reg.studentId === studentId && reg.subjectId === subjectId
    );
  }

  /**
   * ดึงข้อมูลการลงทะเบียนเฉพาะ
   */
  getRegistration(studentId: string, subjectId: string): RegisteredSubject | undefined {
    return this.dataService.findOne(reg => 
      reg.studentId === studentId && reg.subjectId === subjectId
    );
  }

  /**
   * นับจำนวนคนที่ลงทะเบียนในรายวิชา
   */
  countRegistrationsForSubject(subjectId: string): number {
    return this.dataService.count(reg => reg.subjectId === subjectId);
  }

  /**
   * ลงทะเบียนรายวิชา (พร้อมตรวจสอบ Business Rules)
   */
  registerSubject(studentId: string, subjectId: string): { success: boolean; message: string } {
    try {
      // ตรวจสอบว่านักเรียนมีอยู่จริง
      if (!this.studentService.studentExists(studentId)) {
        return { success: false, message: 'ไม่พบข้อมูลนักเรียน' };
      }

      // ตรวจสอบว่ารายวิชามีอยู่จริง
      if (!this.subjectService.subjectExists(subjectId)) {
        return { success: false, message: 'ไม่พบรายวิชานี้' };
      }

      // ตรวจสอบอายุนักเรียน (ต้องอย่างน้อย 15 ปี)
      if (!this.studentService.isStudentEligible(studentId)) {
        return { success: false, message: 'นักเรียนต้องมีอายุอย่างน้อย 15 ปี' };
      }

      // ตรวจสอบว่าไม่ได้ลงทะเบียนรายวิชานี้แล้ว
      if (this.isStudentRegistered(studentId, subjectId)) {
        return { success: false, message: 'คุณได้ลงทะเบียนรายวิชานี้แล้ว' };
      }

      // ตรวจสอบวิชาบังคับก่อน
      const prerequisiteCheck = this.checkPrerequisites(studentId, subjectId);
      if (!prerequisiteCheck.success) {
        return prerequisiteCheck;
      }

      // ลงทะเบียน
      const registration: RegisteredSubject = {
        studentId,
        subjectId,
        registrationDate: new Date().toISOString(),
        grade: undefined // ยังไม่มีเกรด
      };

      this.dataService.add(registration);

      return { success: true, message: 'ลงทะเบียนสำเร็จ' };

    } catch (error) {
      return { success: false, message: 'เกิดข้อผิดพลาดในการลงทะเบียน' };
    }
  }

  /**
   * ตรวจสอบวิชาบังคับก่อน
   */
  private checkPrerequisites(studentId: string, subjectId: string): { success: boolean; message: string } {
    const subject = this.subjectService.getSubjectById(subjectId);
    if (!subject || !subject.prerequisiteId) {
      return { success: true, message: 'ไม่มีวิชาบังคับก่อน' };
    }

    // ตรวจสอบว่าได้ลงทะเบียนวิชาบังคับก่อนหรือไม่
    const prerequisiteRegistration = this.getRegistration(studentId, subject.prerequisiteId);
    if (!prerequisiteRegistration) {
      return { success: false, message: 'คุณยังไม่ได้ลงทะเบียนวิชาบังคับก่อน' };
    }

    // ตรวจสอบว่าผ่านวิชาบังคับก่อนหรือไม่
    if (!prerequisiteRegistration.grade || !isPassingGrade(prerequisiteRegistration.grade)) {
      return { success: false, message: 'คุณยังไม่ผ่านวิชาบังคับก่อน' };
    }

    return { success: true, message: 'ผ่านการตรวจสอบวิชาบังคับก่อน' };
  }

  /**
   * ยกเลิกการลงทะเบียน
   */
  unregisterSubject(studentId: string, subjectId: string): { success: boolean; message: string } {
    if (!this.isStudentRegistered(studentId, subjectId)) {
      return { success: false, message: 'คุณไม่ได้ลงทะเบียนรายวิชานี้' };
    }

    const deletedCount = this.dataService.deleteMany(reg => 
      reg.studentId === studentId && reg.subjectId === subjectId
    );

    if (deletedCount > 0) {
      return { success: true, message: 'ยกเลิกการลงทะเบียนสำเร็จ' };
    } else {
      return { success: false, message: 'เกิดข้อผิดพลาดในการยกเลิกการลงทะเบียน' };
    }
  }

  /**
   * กรอกเกรด (สำหรับแอดมิน)
   */
  setGrade(studentId: string, subjectId: string, grade: string): { success: boolean; message: string } {
    if (!isValidGrade(grade)) {
      return { success: false, message: 'เกรดไม่ถูกต้อง (ต้องเป็น A, B+, B, C+, C, D+, D, F)' };
    }

    const registration = this.getRegistration(studentId, subjectId);
    if (!registration) {
      return { success: false, message: 'ไม่พบการลงทะเบียนรายวิชานี้' };
    }

    const updatedRegistration: RegisteredSubject = {
      ...registration,
      grade: grade
    };

    const updated = this.dataService.updateMany(
      reg => reg.studentId === studentId && reg.subjectId === subjectId,
      () => updatedRegistration
    );

    if (updated.length > 0) {
      return { success: true, message: 'บันทึกเกรดสำเร็จ' };
    } else {
      return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกเกรด' };
    }
  }

  /**
   * ดึงรายวิชาที่นักเรียนยังไม่ได้ลงทะเบียน (ในหลักสูตรของตน)
   */
  getAvailableSubjectsForStudent(studentId: string): { subject: any; canRegister: boolean; reason?: string }[] {
    const student = this.studentService.getStudentById(studentId);
    if (!student) return [];

    const allSubjects = this.subjectService.getAllSubjects();
    const studentRegistrations = this.getRegistrationsByStudent(studentId);
    const registeredSubjectIds = studentRegistrations.map(reg => reg.subjectId);

    return allSubjects
      .filter(subject => !registeredSubjectIds.includes(subject.subjectId))
      .map(subject => {
        // ตรวจสอบว่าสามารถลงทะเบียนได้หรือไม่
        const prerequisiteCheck = this.checkPrerequisites(studentId, subject.subjectId);
        
        return {
          subject,
          canRegister: prerequisiteCheck.success,
          reason: prerequisiteCheck.success ? undefined : prerequisiteCheck.message
        };
      });
  }

  /**
   * ดึงสถิติการลงทะเบียนของรายวิชา
   */
  getSubjectRegistrationStats(subjectId: string): {
    totalRegistrations: number;
    studentsWithGrades: number;
    studentsWithoutGrades: number;
    gradeDistribution: { [grade: string]: number };
  } {
    const registrations = this.getRegistrationsBySubject(subjectId);
    const withGrades = registrations.filter(reg => reg.grade);
    const withoutGrades = registrations.filter(reg => !reg.grade);

    const gradeDistribution: { [grade: string]: number } = {};
    withGrades.forEach(reg => {
      if (reg.grade) {
        gradeDistribution[reg.grade] = (gradeDistribution[reg.grade] || 0) + 1;
      }
    });

    return {
      totalRegistrations: registrations.length,
      studentsWithGrades: withGrades.length,
      studentsWithoutGrades: withoutGrades.length,
      gradeDistribution
    };
  }

  /**
   * ดึงการลงทะเบียนที่ยังไม่มีเกรด
   */
  getRegistrationsWithoutGrades(): RegisteredSubject[] {
    return this.dataService.find(reg => !reg.grade);
  }

  /**
   * ดึงการลงทะเบียนที่มีเกรดแล้ว
   */
  getRegistrationsWithGrades(): RegisteredSubject[] {
    return this.dataService.find(reg => !!reg.grade);
  }
}