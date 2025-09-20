import { Request, Response } from 'express';
import { StudentService } from '../services/StudentService';
import { SubjectService } from '../services/SubjectService';
import { RegistrationService } from '../services/RegistrationService';
import { Student } from '../models/Student';
import { RegisteredSubject } from '../models/RegisteredSubject';

export class StudentController {
  private studentService: StudentService;
  private subjectService: SubjectService;
  private registrationService: RegistrationService;

  constructor() {
    this.studentService = new StudentService();
    this.subjectService = new SubjectService();
    this.registrationService = new RegistrationService();
  }

  /**
   * แสดงหน้าข้อมูลส่วนตัวของนักเรียน
   */
  public showProfile = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'student' || !user.studentId) {
      res.redirect('/login');
      return;
    }

    const student = this.studentService.getStudentById(user.studentId);
    
    if (!student) {
      res.status(404).render('error', {
        title: 'ไม่พบข้อมูลนักเรียน',
        message: 'ไม่พบข้อมูลนักเรียนในระบบ',
        error: { status: 404 }
      });
      return;
    }

    // ดึงวิชาที่ลงทะเบียนแล้ว
    const registeredSubjects = this.registrationService.getRegistrationsByStudent(user.studentId);
    const totalCredits = registeredSubjects.reduce((sum: number, reg: RegisteredSubject) => {
      const subject = this.subjectService.getSubjectById(reg.subjectId);
      return sum + (subject?.credits || 0);
    }, 0);

    // เพิ่มข้อมูลชื่อวิชาให้กับการลงทะเบียน
    const registeredSubjectsWithDetails = registeredSubjects.map(reg => {
      const subject = this.subjectService.getSubjectById(reg.subjectId);
      return {
        ...reg,
        subjectName: subject?.subjectName || 'ไม่พบชื่อวิชา',
        credits: subject?.credits || 0
      };
    });

    res.render('student/profile', {
      title: 'ข้อมูลส่วนตัว',
      user: user,
      student: student,
      registeredSubjects: registeredSubjectsWithDetails,
      totalCredits: totalCredits
    });
  };

  /**
   * แสดงหน้าลงทะเบียนเรียน
   */
  public showRegistration = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'student' || !user.studentId) {
      res.redirect('/login');
      return;
    }

    const student = this.studentService.getStudentById(user.studentId);
    
    if (!student) {
      res.status(404).render('error', {
        title: 'ไม่พบข้อมูลนักเรียน',
        message: 'ไม่พบข้อมูลนักเรียนในระบบ',
        error: { status: 404 }
      });
      return;
    }

    // ดึงวิชาที่สามารถลงทะเบียนได้
    const availableSubjects = this.subjectService.getSubjectsByCurrentCurriculum(student.curriculumId);
    
    // ดึงวิชาที่ลงทะเบียนแล้ว
    const rawRegisteredSubjects = this.registrationService.getRegistrationsByStudent(user.studentId);
    const registeredSubjectIds = rawRegisteredSubjects.map((reg: RegisteredSubject) => reg.subjectId);

    // เพิ่มข้อมูลวิชาให้กับการลงทะเบียน
    const registeredSubjects = rawRegisteredSubjects.map(reg => {
      const subject = this.subjectService.getSubjectById(reg.subjectId);
      return {
        ...reg,
        subjectName: subject?.subjectName || 'ไม่พบชื่อวิชา',
        credits: subject?.credits || 0
      };
    });

    // กรองวิชาที่ยังไม่ได้ลงทะเบียน
    const unregisteredSubjects = availableSubjects.filter((subject: any) => 
      !registeredSubjectIds.includes(subject.subjectId)
    );

    const totalCredits = registeredSubjects.reduce((sum: number, reg: any) => {
      return sum + (reg.credits || 0);
    }, 0);

    res.render('student/register', {
      title: 'ลงทะเบียนเรียน',
      user: user,
      student: student,
      availableSubjects: unregisteredSubjects,
      registeredSubjects: registeredSubjects,
      totalCredits: totalCredits,
      maxCredits: 22 // ตาม business rules
    });
  };

  /**
   * ประมวลผลการลงทะเบียนเรียน
   */
  public processRegistration = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'student' || !user.studentId) {
      res.redirect('/login');
      return;
    }

    const { subjectId } = req.body;

    if (!subjectId) {
      res.status(400).json({
        success: false,
        message: 'กรุณาเลือกวิชาที่ต้องการลงทะเบียน'
      });
      return;
    }

    try {
      const result = this.registrationService.registerSubject(user.studentId, subjectId);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลงทะเบียน'
      });
    }
  };

  /**
   * ยกเลิกการลงทะเบียนวิชา
   */
  public cancelRegistration = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'student' || !user.studentId) {
      res.redirect('/login');
      return;
    }

    const { subjectId } = req.body;

    if (!subjectId) {
      res.status(400).json({
        success: false,
        message: 'กรุณาระบุวิชาที่ต้องการยกเลิก'
      });
      return;
    }

    try {
      const result = this.registrationService.unregisterSubject(user.studentId, subjectId);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Unregistration error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการยกเลิกการลงทะเบียน'
      });
    }
  };



  /**
   * แสดงผลการเรียน
   */
  public showGrades = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'student' || !user.studentId) {
      res.redirect('/login');
      return;
    }

    const student = this.studentService.getStudentById(user.studentId);
    
    if (!student) {
      res.status(404).render('error', {
        title: 'ไม่พบข้อมูลนักเรียน',
        message: 'ไม่พบข้อมูลนักเรียนในระบบ',
        error: { status: 404 }
      });
      return;
    }

    // ดึงข้อมูลการลงทะเบียนพร้อมข้อมูลวิชาและเกรด
    const rawRegistrations = this.registrationService.getRegistrationsByStudent(user.studentId);
    const registeredSubjects = rawRegistrations.map(reg => {
      const subject = this.subjectService.getSubjectById(reg.subjectId);
      return {
        ...reg,
        subjectName: subject?.subjectName || 'ไม่พบชื่อวิชา',
        credits: subject?.credits || 0,
        instructor: subject?.instructor || 'ไม่ระบุ',
        grade: reg.grade || null
      };
    });

    // คำนวณสถิติ
    const totalCredits = registeredSubjects.reduce((sum: number, reg: any) => sum + reg.credits, 0);
    
    // คำนวณ GPA
    const gradePoints: { [key: string]: number } = {
      'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0
    };
    
    let totalGradePoints = 0;
    let totalGradedCredits = 0;
    
    registeredSubjects.forEach((reg: any) => {
      if (reg.grade && gradePoints[reg.grade] !== undefined) {
        totalGradePoints += gradePoints[reg.grade] * reg.credits;
        totalGradedCredits += reg.credits;
      }
    });
    
    const gpa = totalGradedCredits > 0 ? totalGradePoints / totalGradedCredits : 0;

    // สถิติเกรด
    const gradeStats: { [key: string]: number } = {};
    registeredSubjects.forEach((reg: any) => {
      if (reg.grade) {
        gradeStats[reg.grade] = (gradeStats[reg.grade] || 0) + 1;
      }
    });

    res.render('student/grades', {
      title: 'ผลการเรียน',
      user: user,
      student: student,
      registeredSubjects: registeredSubjects,
      totalCredits: totalCredits,
      gpa: gpa,
      gradeStats: gradeStats,
      getGradeClass: (grade: string) => {
        switch(grade) {
          case 'A': return 'bg-success';
          case 'B+': return 'bg-info';
          case 'B': return 'bg-primary';
          case 'C+': return 'bg-warning';
          case 'C': return 'bg-secondary';
          case 'D+': return 'bg-warning';
          case 'D': return 'bg-danger';
          case 'F': return 'bg-danger';
          default: return 'bg-secondary';
        }
      },
      getGradePoint: (grade: string) => {
        return gradePoints[grade] || 0;
      }
    });
  };
}