import { Request, Response } from 'express';
import { StudentService } from '../services/StudentService';
import { SubjectService } from '../services/SubjectService';
import { AuthService } from '../services/AuthService';
import { Student } from '../models/Student';
import { Subject } from '../models/Subject';
import { User } from '../models/User';

export class AdminController {
  private studentService: StudentService;
  private subjectService: SubjectService;
  private authService: AuthService;

  constructor() {
    this.studentService = new StudentService();
    this.subjectService = new SubjectService();
    this.authService = new AuthService();
  }

  /**
   * แสดงหน้าแดชบอร์ดของ Admin
   */
  public showDashboard = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    // สถิติข้อมูลทั้งหมด
    const allStudents = this.studentService.getAllStudents();
    const allSubjects = this.subjectService.getAllSubjects();
    const allUsers = this.authService.getAllUsers();

    // สถิติตามประเภท
    const studentCount = allStudents.length;
    const subjectCount = allSubjects.length;
    const userStats = {
      admin: allUsers.filter(u => u.role === 'admin').length,
      student: allUsers.filter(u => u.role === 'student').length
    };

    res.render('admin/dashboard', {
      title: 'แดชบอร์ดผู้ดูแลระบบ',
      user: user,
      studentCount: studentCount,
      subjectCount: subjectCount,
      userStats: userStats,
      allStudents: allStudents.slice(0, 5), // แสดง 5 คนล่าสุด
      allSubjects: allSubjects.slice(0, 5)  // แสดง 5 วิชาล่าสุด
    });
  };

  /**
   * แสดงรายการนักเรียนทั้งหมด
   */
  public showStudents = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    const students = this.studentService.getAllStudents();
    const message = req.query.message as string;
    const error = req.query.error as string;

    res.render('admin/students', {
      title: 'จัดการข้อมูลนักเรียน',
      user: user,
      students: students,
      message: message,
      error: error
    });
  };

  /**
   * แสดงฟอร์มเพิ่มนักเรียนใหม่
   */
  public showAddStudent = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    res.render('admin/add-student', {
      title: 'เพิ่มนักเรียนใหม่',
      user: user,
      error: req.query.error as string
    });
  };

  /**
   * ประมวลผลการเพิ่มนักเรียนใหม่
   */
  public addStudent = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    try {
      const { studentId, title, firstName, lastName, birthDate, school, email, curriculumId } = req.body;

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!studentId || !firstName || !lastName || !email || !curriculumId) {
        res.redirect('/admin/students/add?error=' + encodeURIComponent('กรุณากรอกข้อมูลให้ครบถ้วน'));
        return;
      }

      // ตรวจสอบว่ามีรหัสนักเรียนนี้แล้วหรือไม่
      const existingStudent = this.studentService.getStudentById(studentId);
      if (existingStudent) {
        res.redirect('/admin/students/add?error=' + encodeURIComponent('รหัสนักเรียนนี้มีอยู่ในระบบแล้ว'));
        return;
      }

      // สร้างนักเรียนใหม่
      const newStudent: Student = {
        studentId: studentId,
        title: title || 'นาย',
        firstName: firstName,
        lastName: lastName,
        birthDate: birthDate || new Date().toISOString(),
        school: school || 'ไม่ระบุ',
        email: email,
        curriculumId: curriculumId
      };

      this.studentService.addStudent(newStudent);

      // สร้าง User account สำหรับนักเรียน
      const newUser: User = {
        id: Date.now().toString(),
        username: studentId,
        password: studentId, // รหัสผ่านเริ่มต้นเป็นรหัสนักเรียน
        role: 'student',
        fullName: `${firstName} ${lastName}`,
        studentId: studentId
      };

      this.authService.createUser(newUser);

      res.redirect('/admin/students?message=' + encodeURIComponent('เพิ่มนักเรียนสำเร็จ'));
    } catch (error) {
      console.error('Error adding student:', error);
      res.redirect('/admin/students/add?error=' + encodeURIComponent('เกิดข้อผิดพลาดในการเพิ่มนักเรียน'));
    }
  };

  /**
   * แสดงฟอร์มแก้ไขข้อมูลนักเรียน
   */
  public showEditStudent = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    const studentId = req.params.id;
    const student = this.studentService.getStudentById(studentId);

    if (!student) {
      res.redirect('/admin/students?error=' + encodeURIComponent('ไม่พบข้อมูลนักเรียน'));
      return;
    }

    res.render('admin/edit-student', {
      title: 'แก้ไขข้อมูลนักเรียน',
      user: user,
      student: student,
      error: req.query.error as string
    });
  };

  /**
   * ประมวลผลการแก้ไขข้อมูลนักเรียน
   */
  public updateStudent = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    try {
      const studentId = req.params.id;
      const { title, firstName, lastName, birthDate, school, email, curriculumId } = req.body;

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!firstName || !lastName || !email || !curriculumId) {
        res.redirect(`/admin/students/edit/${studentId}?error=` + encodeURIComponent('กรุณากรอกข้อมูลให้ครบถ้วน'));
        return;
      }

      const existingStudent = this.studentService.getStudentById(studentId);
      if (!existingStudent) {
        res.redirect('/admin/students?error=' + encodeURIComponent('ไม่พบข้อมูลนักเรียน'));
        return;
      }

      // อัปเดตข้อมูลนักเรียน
      const updatedStudent: Student = {
        ...existingStudent,
        title: title || existingStudent.title,
        firstName: firstName,
        lastName: lastName,
        birthDate: birthDate || existingStudent.birthDate,
        school: school || existingStudent.school,
        email: email,
        curriculumId: curriculumId
      };

      this.studentService.updateStudent(updatedStudent.studentId, updatedStudent);

      // อัปเดตข้อมูล User account
      const userAccount = this.authService.getUserByStudentId(studentId);
      if (userAccount) {
        const updatedUser: User = {
          ...userAccount,
          fullName: `${firstName} ${lastName}`
        };
        this.authService.updateUser(userAccount.username, updatedUser);
      }

      res.redirect('/admin/students?message=' + encodeURIComponent('อัปเดตข้อมูลนักเรียนสำเร็จ'));
    } catch (error) {
      console.error('Error updating student:', error);
      res.redirect(`/admin/students/edit/${req.params.id}?error=` + encodeURIComponent('เกิดข้อผิดพลาดในการอัปเดตข้อมูล'));
    }
  };

  /**
   * ลบนักเรียน
   */
  public deleteStudent = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    try {
      const studentId = req.params.id;
      
      const student = this.studentService.getStudentById(studentId);
      if (!student) {
        res.redirect('/admin/students?error=' + encodeURIComponent('ไม่พบข้อมูลนักเรียน'));
        return;
      }

      // ลบนักเรียน
      this.studentService.deleteStudent(studentId);

      // ลบ User account
      const userAccount = this.authService.getUserByStudentId(studentId);
      if (userAccount) {
        this.authService.deleteUser(userAccount.username);
      }

      res.redirect('/admin/students?message=' + encodeURIComponent('ลบนักเรียนสำเร็จ'));
    } catch (error) {
      console.error('Error deleting student:', error);
      res.redirect('/admin/students?error=' + encodeURIComponent('เกิดข้อผิดพลาดในการลบนักเรียน'));
    }
  };

  /**
   * แสดงรายการวิชาทั้งหมด
   */
  public showSubjects = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    const subjects = this.subjectService.getAllSubjects();
    const message = req.query.message as string;
    const error = req.query.error as string;

    res.render('admin/subjects', {
      title: 'จัดการวิชาเรียน',
      user: user,
      subjects: subjects,
      message: message,
      error: error
    });
  };

  /**
   * แสดงฟอร์มเพิ่มวิชาใหม่
   */
  public showAddSubject = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    const allSubjects = this.subjectService.getAllSubjects();

    res.render('admin/add-subject', {
      title: 'เพิ่มวิชาใหม่',
      user: user,
      allSubjects: allSubjects,
      error: req.query.error as string
    });
  };

  /**
   * ประมวลผลการเพิ่มวิชาใหม่
   */
  public addSubject = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    try {
      const { subjectId, subjectName, credits, instructor, prerequisiteId } = req.body;

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!subjectId || !subjectName || !credits || !instructor) {
        res.redirect('/admin/subjects/add?error=' + encodeURIComponent('กรุณากรอกข้อมูลให้ครบถ้วน'));
        return;
      }

      // ตรวจสอบว่ามีรหัสวิชานี้แล้วหรือไม่
      const existingSubject = this.subjectService.getSubjectById(subjectId);
      if (existingSubject) {
        res.redirect('/admin/subjects/add?error=' + encodeURIComponent('รหัสวิชานี้มีอยู่ในระบบแล้ว'));
        return;
      }

      // สร้างวิชาใหม่
      const newSubject: Subject = {
        subjectId: subjectId,
        subjectName: subjectName,
        credits: parseInt(credits),
        instructor: instructor,
        prerequisiteId: prerequisiteId || undefined
      };

      const result = this.subjectService.addSubject(newSubject);
      
      if (!result) {
        res.redirect('/admin/subjects/add?error=' + encodeURIComponent('ไม่สามารถเพิ่มวิชาได้ กรุณาตรวจสอบข้อมูลอีกครั้ง'));
        return;
      }

      res.redirect('/admin/subjects?message=' + encodeURIComponent('เพิ่มวิชาสำเร็จ'));
    } catch (error) {
      console.error('Error adding subject:', error);
      res.redirect('/admin/subjects/add?error=' + encodeURIComponent('เกิดข้อผิดพลาดในการเพิ่มวิชา'));
    }
  };

  /**
   * แสดงฟอร์มแก้ไขวิชา
   */
  public showEditSubject = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    const subjectId = req.params.id;
    const subject = this.subjectService.getSubjectById(subjectId);
    const allSubjects = this.subjectService.getAllSubjects().filter((s: Subject) => s.subjectId !== subjectId);

    if (!subject) {
      res.redirect('/admin/subjects?error=' + encodeURIComponent('ไม่พบข้อมูลวิชา'));
      return;
    }

    res.render('admin/edit-subject', {
      title: 'แก้ไขวิชา',
      user: user,
      subject: subject,
      allSubjects: allSubjects,
      error: req.query.error as string
    });
  };

  /**
   * ประมวลผลการแก้ไขวิชา
   */
  public updateSubject = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    try {
      const subjectId = req.params.id;
      const { subjectName, credits, instructor, prerequisiteId } = req.body;

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!subjectName || !credits || !instructor) {
        res.redirect(`/admin/subjects/edit/${subjectId}?error=` + encodeURIComponent('กรุณากรอกข้อมูลให้ครบถ้วน'));
        return;
      }

      const existingSubject = this.subjectService.getSubjectById(subjectId);
      if (!existingSubject) {
        res.redirect('/admin/subjects?error=' + encodeURIComponent('ไม่พบข้อมูลวิชา'));
        return;
      }

      // อัปเดตข้อมูลวิชา
      const updatedSubject: Subject = {
        ...existingSubject,
        subjectName: subjectName,
        credits: parseInt(credits),
        instructor: instructor,
        prerequisiteId: prerequisiteId || undefined
      };

      this.subjectService.updateSubject(subjectId, updatedSubject);

      res.redirect('/admin/subjects?message=' + encodeURIComponent('อัปเดตข้อมูลวิชาสำเร็จ'));
    } catch (error) {
      console.error('Error updating subject:', error);
      res.redirect(`/admin/subjects/edit/${req.params.id}?error=` + encodeURIComponent('เกิดข้อผิดพลาดในการอัปเดตข้อมูล'));
    }
  };

  /**
   * ลบวิชา
   */
  public deleteSubject = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    try {
      const subjectId = req.params.id;
      
      const subject = this.subjectService.getSubjectById(subjectId);
      if (!subject) {
        res.redirect('/admin/subjects?error=' + encodeURIComponent('ไม่พบข้อมูลวิชา'));
        return;
      }

      // ตรวจสอบว่ามีวิชาอื่นที่ใช้วิชานี้เป็น prerequisite หรือไม่
      const allSubjects = this.subjectService.getAllSubjects();
      const dependentSubjects = allSubjects.filter((s: Subject) => s.prerequisiteId === subjectId);
      
      if (dependentSubjects.length > 0) {
        const dependentNames = dependentSubjects.map((s: Subject) => s.subjectName).join(', ');
        res.redirect('/admin/subjects?error=' + encodeURIComponent(`ไม่สามารถลบวิชานี้ได้ เนื่องจากมีวิชา ${dependentNames} ที่ใช้เป็นวิชาพื้นฐาน`));
        return;
      }

      // ลบวิชา
      this.subjectService.deleteSubject(subjectId);

      res.redirect('/admin/subjects?message=' + encodeURIComponent('ลบวิชาสำเร็จ'));
    } catch (error) {
      console.error('Error deleting subject:', error);
      res.redirect('/admin/subjects?error=' + encodeURIComponent('เกิดข้อผิดพลาดในการลบวิชา'));
    }
  };

  /**
   * แสดงหน้าจัดการเกรด
   */
  public showGrades = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    try {
      const students = this.studentService.getAllStudents();
      const subjects = this.subjectService.getAllSubjects();
      const message = req.query.message as string;
      const error = req.query.error as string;

      // เพิ่มข้อมูลเกรดและการลงทะเบียนให้แต่ละนักเรียน
      const studentsWithGrades = students.map(student => {
        const registeredSubjects = this.studentService.getRegisteredSubjects(student.studentId);
        const allGrades = this.studentService.getAllGrades(student.studentId);
        
        return {
          ...student,
          registeredSubjects,
          grades: allGrades
        };
      });

      res.render('admin/grades', {
        title: 'จัดการเกรดนักเรียน',
        user: user,
        students: studentsWithGrades,
        subjects: subjects,
        message: message,
        error: error
      });
    } catch (error) {
      console.error('Error loading grades page:', error);
      res.redirect('/admin/dashboard?error=' + encodeURIComponent('เกิดข้อผิดพลาดในการโหลดหน้าจัดการเกรด'));
    }
  };

  /**
   * แสดงหน้าเพิ่มเกรดสำหรับนักเรียน
   */
  public showAddGrade = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    const studentId = req.params.studentId;
    const student = this.studentService.getStudentById(studentId);
    const subjects = this.subjectService.getAllSubjects();

    if (!student) {
      res.redirect('/admin/grades?error=' + encodeURIComponent('ไม่พบข้อมูลนักเรียน'));
      return;
    }

    // ดูว่านักเรียนลงทะเบียนวิชาอะไรไว้บ้าง
    const registeredSubjects = this.studentService.getRegisteredSubjects(studentId);

    res.render('admin/add-grade', {
      title: 'เพิ่มเกรดนักเรียน',
      user: user,
      student: student,
      subjects: subjects,
      registeredSubjects: registeredSubjects,
      error: req.query.error as string
    });
  };

  /**
   * ประมวลผลการเพิ่มเกรด
   */
  public addGrade = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    try {
      const studentId = req.params.studentId;
      const { subjectId, grade } = req.body;

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!subjectId || !grade) {
        res.redirect(`/admin/grades/add/${studentId}?error=` + encodeURIComponent('กรุณากรอกข้อมูลให้ครบถ้วน'));
        return;
      }

      // ตรวจสอบว่านักเรียนมีอยู่จริง
      const student = this.studentService.getStudentById(studentId);
      if (!student) {
        res.redirect('/admin/grades?error=' + encodeURIComponent('ไม่พบข้อมูลนักเรียน'));
        return;
      }

      // ตรวจสอบว่าวิชามีอยู่จริง
      const subject = this.subjectService.getSubjectById(subjectId);
      if (!subject) {
        res.redirect(`/admin/grades/add/${studentId}?error=` + encodeURIComponent('ไม่พบข้อมูลวิชา'));
        return;
      }

      // เพิ่มเกรด
      this.studentService.addGrade(studentId, subjectId, grade);

      res.redirect('/admin/grades?message=' + encodeURIComponent('เพิ่มเกรดสำเร็จ'));
    } catch (error) {
      console.error('Error adding grade:', error);
      res.redirect(`/admin/grades/add/${req.params.studentId}?error=` + encodeURIComponent('เกิดข้อผิดพลาดในการเพิ่มเกรด'));
    }
  };

  /**
   * แสดงหน้าแก้ไขเกรด
   */
  public showEditGrade = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    const { studentId, subjectId } = req.params;
    const student = this.studentService.getStudentById(studentId);
    const subject = this.subjectService.getSubjectById(subjectId);

    if (!student || !subject) {
      res.redirect('/admin/grades?error=' + encodeURIComponent('ไม่พบข้อมูลนักเรียนหรือวิชา'));
      return;
    }

    const currentGrade = this.studentService.getGrade(studentId, subjectId);

    res.render('admin/edit-grade', {
      title: 'แก้ไขเกรดนักเรียน',
      user: user,
      student: student,
      subject: subject,
      currentGrade: currentGrade,
      error: req.query.error as string
    });
  };

  /**
   * ประมวลผลการแก้ไขเกรด
   */
  public updateGrade = async (req: Request, res: Response): Promise<void> => {
    const user = (req.session as any)?.user;

    if (!user || user.role !== 'admin') {
        res.redirect('/login');
        return;
    }

    try {
        const { studentId, subjectId } = req.params;
        const { grade } = req.body;

        // Validate input
        if (!grade) {
            res.redirect(`/admin/grades/edit/${studentId}/${subjectId}?error=` + encodeURIComponent('กรุณากรอกเกรด'));
            return;
        }

        // Validate grade format (example: numeric range 0-100)
        if (isNaN(grade) || grade < 0 || grade > 100) {
            res.redirect(`/admin/grades/edit/${studentId}/${subjectId}?error=` + encodeURIComponent('กรุณากรอกเกรดที่ถูกต้อง (0-100)'));
            return;
        }

        // Ensure student and subject exist
        const student = await this.studentService.getStudentById(studentId);
        const subject = await this.subjectService.getSubjectById(subjectId);

        if (!student || !subject) {
            res.redirect(`/admin/grades/edit/${studentId}/${subjectId}?error=` + encodeURIComponent('ไม่พบข้อมูลนักเรียนหรือวิชา'));
            return;
        }

        // Update grade
        await this.studentService.updateGrade(studentId, subjectId, grade);

        res.redirect('/admin/grades?message=' + encodeURIComponent('อัปเดตเกรดสำเร็จ'));
    } catch (error) {
        console.error('Error updating grade:', error);
        res.redirect(`/admin/grades/edit/${req.params.studentId}/${req.params.subjectId}?error=` + encodeURIComponent('เกิดข้อผิดพลาดในการอัปเดตเกรด'));
    }
};

  /**
   * ลบเกรด
   */
  public deleteGrade = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    try {
      const { studentId, subjectId } = req.params;

      // ลบเกรด
      this.studentService.deleteGrade(studentId, subjectId);

      res.redirect('/admin/grades?message=' + encodeURIComponent('ลบเกรดสำเร็จ'));
    } catch (error) {
      console.error('Error deleting grade:', error);
      res.redirect('/admin/grades?error=' + encodeURIComponent('เกิดข้อผิดพลาดในการลบเกรด'));
    }
  };

  /**
   * แสดงหน้ากรอกเกรดสำหรับรายวิชา
   */
  public showSubjectGrades = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    try {
      const subjectId = req.params.subjectId;
      const subject = this.subjectService.getSubjectById(subjectId);

      if (!subject) {
        res.redirect('/admin/subjects?error=' + encodeURIComponent('ไม่พบข้อมูลวิชา'));
        return;
      }

      // ดึงนักเรียนที่ลงทะเบียนวิชานี้
      const registeredStudents = this.getStudentsRegisteredForSubject(subjectId);
      
      // เพิ่มข้อมูลเกรดปัจจุบันให้แต่ละนักเรียน
      const studentsWithGrades = registeredStudents.map(student => {
        const currentGrade = this.studentService.getGrade(student.studentId, subjectId);
        return {
          ...student,
          currentGrade: currentGrade
        };
      });

      const message = req.query.message as string;
      const error = req.query.error as string;

      res.render('admin/subject-grades', {
        title: `กรอกเกรดวิชา ${subject.subjectName}`,
        user: user,
        subject: subject,
        students: studentsWithGrades,
        registeredCount: studentsWithGrades.length,
        message: message,
        error: error
      });
    } catch (error) {
      console.error('Error loading subject grades page:', error);
      res.redirect('/admin/subjects?error=' + encodeURIComponent('เกิดข้อผิดพลาดในการโหลดหน้ากรอกเกรด'));
    }
  };

  /**
   * อัปเดตเกรดสำหรับรายวิชา (หลายคนพร้อมกัน)
   */
  public updateSubjectGrades = (req: Request, res: Response): void => {
    const user = (req.session as any)?.user;
    
    if (!user || user.role !== 'admin') {
      res.redirect('/login');
      return;
    }

    try {
      const subjectId = req.params.subjectId;
      const grades = req.body.grades; // Object ที่มี key เป็น studentId และ value เป็น grade

      if (!grades || typeof grades !== 'object') {
        res.redirect(`/admin/grades/subject/${subjectId}?error=` + encodeURIComponent('ไม่พบข้อมูลเกรด'));
        return;
      }

      let updateCount = 0;
      let errorCount = 0;

      // อัปเดตเกรดทีละคน
      for (const studentId in grades) {
        const grade = grades[studentId];
        
        // ถ้ามีการกรอกเกรด (ไม่ใช่ค่าว่าง)
        if (grade && grade.trim() !== '') {
          try {
            this.studentService.addGrade(studentId, subjectId, grade.trim());
            updateCount++;
          } catch (error) {
            console.error(`Error updating grade for student ${studentId}:`, error);
            errorCount++;
          }
        }
      }

      if (errorCount > 0) {
        res.redirect(`/admin/grades/subject/${subjectId}?error=` + 
          encodeURIComponent(`อัปเดตเกรดสำเร็จ ${updateCount} คน แต่มีข้อผิดพลาด ${errorCount} คน`));
      } else {
        res.redirect(`/admin/grades/subject/${subjectId}?message=` + 
          encodeURIComponent(`อัปเดตเกรดสำเร็จ ${updateCount} คน`));
      }
    } catch (error) {
      console.error('Error updating subject grades:', error);
      res.redirect(`/admin/grades/subject/${req.params.subjectId}?error=` + 
        encodeURIComponent('เกิดข้อผิดพลาดในการอัปเดตเกรด'));
    }
  };

  /**
   * ดึงรายชื่อนักเรียนที่ลงทะเบียนวิชาหนึ่งๆ
   */
  private getStudentsRegisteredForSubject(subjectId: string): any[] {
    try {
      const DataService = require('../services/DataService').DataService;
      const registeredSubjectsService = new DataService('registered-subjects.json');
      const registrations = registeredSubjectsService.find((reg: any) => reg.subjectId === subjectId);
      
      const students: any[] = [];
      registrations.forEach((reg: any) => {
        const student = this.studentService.getStudentById(reg.studentId);
        if (student) {
          students.push(student);
        }
      });

      return students;
    } catch (error) {
      console.error('Error getting students for subject:', error);
      return [];
    }
  }
}