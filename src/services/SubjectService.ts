import { DataService } from './DataService';
import { Subject, getSubjectType, isValidSubjectId } from '../models/Subject';

export class SubjectService {
  private dataService: DataService<Subject>;

  constructor() {
    this.dataService = new DataService<Subject>('subjects.json');
  }

  /**
   * ดึงรายวิชาทั้งหมด
   */
  getAllSubjects(): Subject[] {
    return this.dataService.getAll();
  }

  /**
   * ค้นหารายวิชาตาม ID
   */
  getSubjectById(subjectId: string): Subject | undefined {
    return this.dataService.getById(subjectId, 'subjectId');
  }

  /**
   * ค้นหารายวิชาตามชื่อหรืออาจารย์ผู้สอน
   */
  searchSubjects(keyword: string): Subject[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.dataService.find(subject => 
      subject.subjectName.toLowerCase().includes(lowerKeyword) ||
      subject.instructor.toLowerCase().includes(lowerKeyword) ||
      subject.subjectId.includes(keyword)
    );
  }

  /**
   * ดึงวิชาคณะ (รหัสขึ้นต้นด้วย 05500)
   */
  getFacultySubjects(): Subject[] {
    return this.dataService.find(subject => getSubjectType(subject.subjectId) === 'faculty');
  }

  /**
   * ดึงวิชาศึกษาทั่วไป (รหัสขึ้นต้นด้วย 9069)
   */
  getGeneralSubjects(): Subject[] {
    return this.dataService.find(subject => getSubjectType(subject.subjectId) === 'general');
  }

  /**
   * ดึงวิชาตามหลักสูตร
   */
  getSubjectsByCurrentCurriculum(curriculumId: string): Subject[] {
    // ส่งคืนวิชาทั้งหมด (ในระบบจริงควรกรองตามหลักสูตร)
    return this.dataService.getAll();
  }

  /**
   * ดึงรายวิชาที่มีวิชาบังคับก่อน
   */
  getSubjectsWithPrerequisites(): Subject[] {
    return this.dataService.find(subject => subject.prerequisiteId !== undefined);
  }

  /**
   * ดึงรายวิชาที่ไม่มีวิชาบังคับก่อน
   */
  getSubjectsWithoutPrerequisites(): Subject[] {
    return this.dataService.find(subject => !subject.prerequisiteId);
  }

  /**
   * ดึงรายวิชาตามจำนวนหน่วยกิต
   */
  getSubjectsByCredits(credits: number): Subject[] {
    return this.dataService.find(subject => subject.credits === credits);
  }

  /**
   * ดึงรายวิชาตามอาจารย์ผู้สอน
   */
  getSubjectsByInstructor(instructor: string): Subject[] {
    return this.dataService.find(subject => 
      subject.instructor.toLowerCase().includes(instructor.toLowerCase())
    );
  }

  /**
   * ตรวจสอบว่ามีวิชาบังคับก่อนหรือไม่
   */
  hasPrerequisite(subjectId: string): boolean {
    const subject = this.getSubjectById(subjectId);
    return subject ? !!subject.prerequisiteId : false;
  }

  /**
   * ดึงข้อมูลวิชาบังคับก่อน
   */
  getPrerequisite(subjectId: string): Subject | undefined {
    const subject = this.getSubjectById(subjectId);
    if (!subject || !subject.prerequisiteId) {
      return undefined;
    }
    return this.getSubjectById(subject.prerequisiteId);
  }

  /**
   * ดึงรายวิชาที่ใช้วิชานี้เป็นวิชาบังคับก่อน
   */
  getSubjectsThatRequire(subjectId: string): Subject[] {
    return this.dataService.find(subject => subject.prerequisiteId === subjectId);
  }

  /**
   * เพิ่มรายวิชาใหม่
   */
  addSubject(subject: Subject): Subject | null {
    console.log('Adding subject:', subject);
    
    // ตรวจสอบรูปแบบรหัสวิชา
    if (!isValidSubjectId(subject.subjectId)) {
      console.log('Invalid subject ID:', subject.subjectId);
      return null;
    }

    // ตรวจสอบว่าหน่วยกิตต้องมากกว่า 0
    if (subject.credits <= 0) {
      console.log('Invalid credits:', subject.credits);
      return null;
    }

    // ตรวจสอบว่ารหัสวิชาซ้ำหรือไม่
    if (this.subjectExists(subject.subjectId)) {
      console.log('Subject already exists:', subject.subjectId);
      return null;
    }

    console.log('Subject validation passed, adding to database...');
    const result = this.dataService.add(subject);
    console.log('Add result:', result);
    return result;
  }

  /**
   * อัปเดตข้อมูลรายวิชา
   */
  updateSubject(subjectId: string, updatedSubject: Subject): Subject | null {
    return this.dataService.update(subjectId, 'subjectId', updatedSubject);
  }

  /**
   * ลบรายวิชา
   */
  deleteSubject(subjectId: string): boolean {
    return this.dataService.delete(subjectId, 'subjectId');
  }

  /**
   * ตรวจสอบว่ามีรายวิชานี้หรือไม่
   */
  subjectExists(subjectId: string): boolean {
    return this.dataService.exists(subject => subject.subjectId === subjectId);
  }

  /**
   * ดึงรายชื่ออาจารย์ทั้งหมด (ไม่ซ้ำ)
   */
  getAllInstructors(): string[] {
    const subjects = this.getAllSubjects();
    const instructors = subjects.map(subject => subject.instructor);
    return [...new Set(instructors)].sort();
  }
}