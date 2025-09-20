#66050846 นายประสพชัย ช่างปั้น

# ระบบลงทะเบียนเรียนล่วงหน้า MVC - ข้อ 1

## รายละเอียดโปรเจค
โปรเจคนี้เป็นส่วนหนึ่งของการทำข้อสอบข้อที่ 1 โดยมีเป้าหมายเพื่อพัฒนาระบบลงทะเบียนเรียนล่วงหน้าสำหรับนักเรียนมัธยมปลายที่ต้องการเรียนวิชาบังคับล่วงหน้า โดยใช้รูปแบบ MVC (Model-View-Controller) Design Pattern ด้วย Express.js และ TypeScript

## Front-end & Back-end
- Backend**: Node.js + Express.js + TypeScript  
- Template Engine: EJS
- Database: JSON Files (ตามที่โจทย์กำหนด)
- Session Management: express-session
- Authentication: ระบบล็อกอินง่าย ๆ

## โครงสร้าง MVC
### Model
- `Student.ts` -> จัดเก็บข้อมูลนักเรียน
- `Subject.ts` -> จัดเก็บข้อมูลรายวิชา
- `SubjectStructure.ts` -> จัดเก็บโครงสร้างหลักสูตร
- `RegisteredSubject.ts` -> จัดเก็บการลงทะเบียนและเกรด
- `User.ts` -> จัดเก็บข้อมูลผู้ใช้ระบบ

### View
- หน้ารวมนักเรียน (สำหรับแอดมิน)
- หน้าประวัตินักเรียน
- หน้าลงทะเบียนเรียน
- หน้ากรอกเกรด (สำหรับแอดมิน)

### Controller
- `AuthController.ts` -> จัดการระบบ login/logout
- `StudentController.ts` -> จัดการข้อมูลนักเรียน
- `SubjectController.ts` -> จัดการข้อมูลรายวิชา
- `RegistrationController.ts` -> จัดการการลงทะเบียน
- `AdminController.ts` -> จัดการฟังก์ชันแอดมิน

## ข้อมูลตัวอย่าง
- นักเรียน: 10 ราย (รหัส 69000001-69000010)
- รายวิชา: 12 วิชา (มีวิชาบังคับก่อนอย่างน้อย 3 วิชา)
- หลักสูตร: 2 หลักสูตร (วิทยาการคอมพิวเตอร์, วิศวกรรมซอฟต์แวร์)
- แอดมิน: 1 คน (username: admin, password: admin123)

## Business Rules ที่ตรวจสอบ
- จำนวนคนที่ลงทะเบียนในแต่ละวิชา ≥ 0
- นักเรียนต้องมีอายุอย่างน้อย 15 ปี
- เมื่อลงทะเบียนสำเร็จต้องกลับไปหน้าประวัตินักเรียน
- ตรวจสอบวิชาบังคับก่อน

## ข้อมูลการเข้าสู่ระบบ
### แอดมิน
- Username: `admin`
- Password: `admin123`

### นักเรียน (ตัวอย่าง)
- Username: `69000001` (รหัสนักเรียน)
- Password: `69000001` (รหัสนักเรียนเดียวกัน)

## ไฟล์สำคัญในโครงสร้าง MVC

### Models (src/models/)
- ใช้ TypeScript interfaces สำหรับกำหนดโครงสร้างข้อมูล
- มีฟังก์ชันช่วยสำหรับการตรวจสอบความถูกต้อง

### Views (src/views/) เป็นส่วนที่ใช้แสดง
- ใช้ EJS template engine สำหรับแสดงผล
- แยก layout และ components ชัดเจนโดยมี admin , auth , partials(compo) , student

### Controllers (src/controllers/)
- จัดการ business logic และการควบคุมการทำงาน
- เชื่อมต่อระหว่าง Models และ Views

### Services (src/services/)
- DataService สำหรับ CRUD operations กับไฟล์ JSON
- Business logic services สำหรับแต่ละโดเมน

## หน้าจอหลัก
1. หน้า Login -> สำหรับเข้าสู่ระบบ
2. หน้ารวมนักเรียน -> แสดงรายชื่อ, ค้นหา, กรอง, เรียงลำดับ (แอดมิน)
3. หน้าประวัตินักเรียน -> แสดงข้อมูลและเกรด
4. หน้าลงทะเบียน -> เลือกวิชาที่ยังไม่ได้ลง
5. หน้ากรอกเกรด -> สำหรับแอดมินกรอกเกรด
