import { DataService } from './DataService';
import { SubjectStructure, isValidCurriculumId, isValidSemester } from '../models/SubjectStructure';

export class SubjectStructureService {
  private dataService: DataService<SubjectStructure>;

  constructor() {
    this.dataService = new DataService<SubjectStructure>('subjectStructures.json');
  }

  /**
   * ดึงโครงสร้างหลักสูตรทั้งหมด
   */
  getAllSubjectStructures(): SubjectStructure[] {
    return this.dataService.getAll();
  }

  /**
   * ดึงโครงสร้างหลักสูตรตามรหัสหลักสูตร
   */
  getSubjectStructuresByCurriculum(curriculumId: string): SubjectStructure[] {
    return this.dataService.find(structure => structure.curriculumId === curriculumId);
  }

  /**
   * ดึงรายวิชาบังคับในหลักสูตรและเทอมที่กำหนด
   */
  getRequiredSubjectsByCurriculumAndSemester(curriculumId: string, semester: number): SubjectStructure[] {
    return this.dataService.find(structure => 
      structure.curriculumId === curriculumId && structure.semester === semester
    );
  }

  /**
   * ดึงรายวิชาบังคับในเทอม 1
   */
  getFirstSemesterSubjects(curriculumId: string): SubjectStructure[] {
    return this.getRequiredSubjectsByCurriculumAndSemester(curriculumId, 1);
  }

  /**
   * ดึงรายวิชาบังคับในเทอม 2
   */
  getSecondSemesterSubjects(curriculumId: string): SubjectStructure[] {
    return this.getRequiredSubjectsByCurriculumAndSemester(curriculumId, 2);
  }

  /**
   * ดึงรายการหลักสูตรทั้งหมด (ไม่ซ้ำ)
   */
  getAllCurriculums(): { curriculumId: string; curriculumName: string; departmentName: string }[] {
    const structures = this.getAllSubjectStructures();
    const curriculumMap = new Map<string, { curriculumName: string; departmentName: string }>();
    
    structures.forEach(structure => {
      if (!curriculumMap.has(structure.curriculumId)) {
        curriculumMap.set(structure.curriculumId, {
          curriculumName: structure.curriculumName,
          departmentName: structure.departmentName
        });
      }
    });

    return Array.from(curriculumMap.entries()).map(([curriculumId, info]) => ({
      curriculumId,
      curriculumName: info.curriculumName,
      departmentName: info.departmentName
    })).sort((a, b) => a.curriculumName.localeCompare(b.curriculumName));
  }

  /**
   * ดึงรายการภาควิชาทั้งหมด (ไม่ซ้ำ)
   */
  getAllDepartments(): string[] {
    const structures = this.getAllSubjectStructures();
    const departments = structures.map(structure => structure.departmentName);
    return [...new Set(departments)].sort();
  }

  /**
   * ค้นหาหลักสูตรตามภาควิชา
   */
  getCurriculumsByDepartment(departmentName: string): SubjectStructure[] {
    return this.dataService.find(structure => structure.departmentName === departmentName);
  }

  /**
   * ค้นหาว่ารายวิชาใดเป็นวิชาบังคับในหลักสูตรใด
   */
  getCurriculumsByRequiredSubject(subjectId: string): SubjectStructure[] {
    return this.dataService.find(structure => structure.requiredSubjectId === subjectId);
  }

  /**
   * ตรวจสอบว่ารายวิชาเป็นวิชาบังคับในหลักสูตรนี้หรือไม่
   */
  isRequiredSubject(curriculumId: string, subjectId: string): boolean {
    return this.dataService.exists(structure => 
      structure.curriculumId === curriculumId && structure.requiredSubjectId === subjectId
    );
  }

  /**
   * ตรวจสอบว่ารายวิชาเป็นวิชาบังคับในเทอมที่กำหนดหรือไม่
   */
  isRequiredSubjectInSemester(curriculumId: string, subjectId: string, semester: number): boolean {
    return this.dataService.exists(structure => 
      structure.curriculumId === curriculumId &&
      structure.requiredSubjectId === subjectId &&
      structure.semester === semester
    );
  }

  /**
   * เพิ่มโครงสร้างหลักสูตรใหม่
   */
  addSubjectStructure(structure: SubjectStructure): SubjectStructure | null {
    // ตรวจสอบรูปแบบรหัสหลักสูตร
    if (!isValidCurriculumId(structure.curriculumId)) {
      return null;
    }

    // ตรวจสอบเทอม
    if (!isValidSemester(structure.semester)) {
      return null;
    }

    // ตรวจสอบว่าไม่มีการซ้ำกัน (หลักสูตร + วิชา + เทอม)
    const exists = this.dataService.exists(existing => 
      existing.curriculumId === structure.curriculumId &&
      existing.requiredSubjectId === structure.requiredSubjectId &&
      existing.semester === structure.semester
    );

    if (exists) {
      return null;
    }

    return this.dataService.add(structure);
  }

  /**
   * อัปเดตโครงสร้างหลักสูตร
   */
  updateSubjectStructure(curriculumId: string, subjectId: string, semester: number, updatedStructure: SubjectStructure): SubjectStructure | null {
    const existing = this.dataService.findOne(structure => 
      structure.curriculumId === curriculumId &&
      structure.requiredSubjectId === subjectId &&
      structure.semester === semester
    );

    if (!existing) {
      return null;
    }

    // อัปเดตโดยใช้การค้นหาแบบหลายเงื่อนไข
    const updated = this.dataService.updateMany(
      structure => 
        structure.curriculumId === curriculumId &&
        structure.requiredSubjectId === subjectId &&
        structure.semester === semester,
      () => updatedStructure
    );

    return updated.length > 0 ? updated[0] : null;
  }

  /**
   * ลบโครงสร้างหลักสูตร
   */
  deleteSubjectStructure(curriculumId: string, subjectId: string, semester: number): boolean {
    const deletedCount = this.dataService.deleteMany(structure => 
      structure.curriculumId === curriculumId &&
      structure.requiredSubjectId === subjectId &&
      structure.semester === semester
    );

    return deletedCount > 0;
  }

  /**
   * ลบโครงสร้างหลักสูตรทั้งหมดของหลักสูตรนี้
   */
  deleteAllStructuresForCurriculum(curriculumId: string): number {
    return this.dataService.deleteMany(structure => structure.curriculumId === curriculumId);
  }

  /**
   * นับจำนวนวิชาบังคับในหลักสูตร
   */
  countRequiredSubjects(curriculumId: string): number {
    return this.dataService.count(structure => structure.curriculumId === curriculumId);
  }

  /**
   * นับจำนวนวิชาบังคับในแต่ละเทอม
   */
  countRequiredSubjectsBySemester(curriculumId: string): { semester1: number; semester2: number } {
    const semester1Count = this.dataService.count(structure => 
      structure.curriculumId === curriculumId && structure.semester === 1
    );
    
    const semester2Count = this.dataService.count(structure => 
      structure.curriculumId === curriculumId && structure.semester === 2
    );

    return {
      semester1: semester1Count,
      semester2: semester2Count
    };
  }
}