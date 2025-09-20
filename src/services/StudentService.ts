import { DataService } from './DataService';
import { Student, calculateAge } from '../models/Student';

export class StudentService {
  private dataService: DataService<Student>;

  constructor() {
    this.dataService = new DataService<Student>('students.json');
  }

  /**
   * ดึงนักเรียนทั้งหมด
   */
  getAllStudents(): Student[] {
    return this.dataService.getAll();
  }

  /**
   * ค้นหานักเรียนตาม ID
   */
  getStudentById(studentId: string): Student | undefined {
    return this.dataService.getById(studentId, 'studentId');
  }

  /**
   * ค้นหานักเรียนตามชื่อหรือโรงเรียน
   */
  searchStudents(keyword: string): Student[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.dataService.find(student => 
      student.firstName.toLowerCase().includes(lowerKeyword) ||
      student.lastName.toLowerCase().includes(lowerKeyword) ||
      student.school.toLowerCase().includes(lowerKeyword) ||
      student.studentId.includes(keyword)
    );
  }

  /**
   * กรองนักเรียนตามโรงเรียน
   */
  getStudentsBySchool(school: string): Student[] {
    return this.dataService.find(student => student.school === school);
  }

  /**
   * เรียงลำดับนักเรียนตามชื่อ
   */
  getStudentsSortedByName(): Student[] {
    const students = this.getAllStudents();
    return students.sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  /**
   * เรียงลำดับนักเรียนตามอายุ
   */
  getStudentsSortedByAge(): Student[] {
    const students = this.getAllStudents();
    return students.sort((a, b) => {
      const ageA = calculateAge(a.birthDate);
      const ageB = calculateAge(b.birthDate);
      return ageA - ageB;
    });
  }

  /**
   * ดึงรายการโรงเรียนทั้งหมด (ไม่ซ้ำ)
   */
  getAllSchools(): string[] {
    const students = this.getAllStudents();
    const schools = students.map(student => student.school);
    return [...new Set(schools)].sort();
  }

  /**
   * ตรวจสอบอายุของนักเรียน
   */
  getStudentAge(studentId: string): number | null {
    const student = this.getStudentById(studentId);
    if (!student) return null;
    return calculateAge(student.birthDate);
  }

  /**
   * ตรวจสอบว่านักเรียนมีอายุตามเกณฑ์หรือไม่ (อย่างน้อย 15 ปี)
   */
  isStudentEligible(studentId: string): boolean {
    const age = this.getStudentAge(studentId);
    return age !== null && age >= 15;
  }

  /**
   * ดึงนักเรียนตามหลักสูตร
   */
  getStudentsByCurriculum(curriculumId: string): Student[] {
    return this.dataService.find(student => student.curriculumId === curriculumId);
  }

  /**
   * เพิ่มนักเรียนใหม่
   */
  addStudent(student: Student): Student {
    return this.dataService.add(student);
  }

  /**
   * อัปเดตข้อมูลนักเรียน
   */
  updateStudent(studentId: string, updatedStudent: Student): Student | null {
    return this.dataService.update(studentId, 'studentId', updatedStudent);
  }

  /**
   * ลบนักเรียน
   */
  deleteStudent(studentId: string): boolean {
    return this.dataService.delete(studentId, 'studentId');
  }

  /**
   * ตรวจสอบว่ามีนักเรียนนี้หรือไม่
   */
  studentExists(studentId: string): boolean {
    return this.dataService.exists(student => student.studentId === studentId);
  }

  /**
   * ดึงรายการวิชาที่นักเรียนลงทะเบียน
   */
  getRegisteredSubjects(studentId: string): any[] {
    try {
      const registeredSubjectsService = new DataService<any>('registered-subjects.json');
      return registeredSubjectsService.find(reg => reg.studentId === studentId);
    } catch {
      return [];
    }
  }

  /**
   * ดึงเกรดของนักเรียนในวิชาใดวิชาหนึ่ง
   */
  getGrade(studentId: string, subjectId: string): string | null {
    try {
      const gradesService = new DataService<any>('grades.json');
      const gradeRecord = gradesService.find(grade => 
        grade.studentId === studentId && grade.subjectId === subjectId
      );
      return gradeRecord.length > 0 ? gradeRecord[0].grade : null;
    } catch {
      return null;
    }
  }

  /**
   * ดึงเกรดทั้งหมดของนักเรียน
   */
  getAllGrades(studentId: string): any[] {
    try {
      const gradesService = new DataService<any>('grades.json');
      return gradesService.find(grade => grade.studentId === studentId);
    } catch {
      return [];
    }
  }

  /**
   * เพิ่มเกรด
   */
  addGrade(studentId: string, subjectId: string, grade: string): void {
    try {
      const gradesService = new DataService<any>('grades.json');
      const registeredSubjectsService = new DataService<any>('registeredSubjects.json');
      // ตรวจสอบว่ามีเกรดอยู่แล้วหรือไม่
      const existingGrades = gradesService.find(g => 
        g.studentId === studentId && g.subjectId === subjectId
      );

      if (existingGrades.length > 0) {
        // อัปเดตเกรดที่มีอยู่
        this.updateGrade(studentId, subjectId, grade);
      } else {
        // เพิ่มเกรดใหม่
        const newGrade = {
          id: Date.now().toString(),
          studentId,
          subjectId,
          grade,
          createdAt: new Date().toISOString()
        };
        gradesService.add(newGrade);
      }
      // sync เกรดไปยัง registeredSubjects.json
      const regSubjects = registeredSubjectsService.getAll();
      const regIndex = regSubjects.findIndex((reg: any) => reg.studentId === studentId && reg.subjectId === subjectId);
      if (regIndex !== -1) {
        regSubjects[regIndex].grade = grade;
        registeredSubjectsService.save(regSubjects);
      }
    } catch (error) {
      console.error('Error adding grade:', error);
      throw error;
    }
  }

  /**
   * อัปเดตเกรด
   */
  updateGrade(studentId: string, subjectId: string, grade: string): void {
    try {
      const gradesService = new DataService<any>('grades.json');
      const registeredSubjectsService = new DataService<any>('registeredSubjects.json');
      const grades = gradesService.getAll();
      const regSubjects = registeredSubjectsService.getAll();
      const gradeIndex = grades.findIndex(g => 
        g.studentId === studentId && g.subjectId === subjectId
      );
      const regIndex = regSubjects.findIndex((reg: any) => reg.studentId === studentId && reg.subjectId === subjectId);

      if (gradeIndex !== -1) {
        grades[gradeIndex].grade = grade;
        grades[gradeIndex].updatedAt = new Date().toISOString();
        gradesService.save(grades);
      }
      // sync เกรดไปยัง registeredSubjects.json
      if (regIndex !== -1) {
        regSubjects[regIndex].grade = grade;
        registeredSubjectsService.save(regSubjects);
      }
    } catch (error) {
      console.error('Error updating grade:', error);
      throw error;
    }
  }

  /**
   * ลบเกรด
   */
  deleteGrade(studentId: string, subjectId: string): void {
    try {
      const gradesService = new DataService<any>('grades.json');
      const grades = gradesService.getAll();
      
      const filteredGrades = grades.filter(g => 
        !(g.studentId === studentId && g.subjectId === subjectId)
      );

      gradesService.save(filteredGrades);
    } catch (error) {
      console.error('Error deleting grade:', error);
      throw error;
    }
  }
}