import fs from 'fs';
import path from 'path';

/**
 * Generic DataService สำหรับจัดการไฟล์ JSON
 * รองรับ CRUD operations พื้นฐาน
 */
export class DataService<T> {
  private filePath: string;
  private data: T[] = [];

  constructor(fileName: string) {
    // ใช้ path จาก root ของโปรเจค
    this.filePath = path.join(process.cwd(), 'src', 'data', fileName);
    this.ensureFileExists();
    this.loadData();
  }

  /**
   * ตรวจสอบและสร้างไฟล์ถ้ายังไม่มี
   */
  private ensureFileExists(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '[]', 'utf8');
    }
  }

  /**
   * โหลดข้อมูลจากไฟล์ JSON
   */
  private loadData(): void {
    try {
      const fileContent = fs.readFileSync(this.filePath, 'utf8');
      this.data = JSON.parse(fileContent) as T[];
    } catch (error) {
      console.error(`Error loading data from ${this.filePath}:`, error);
      this.data = [];
    }
  }

  /**
   * บันทึกข้อมูลลงไฟล์ JSON
   */
  private saveData(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error(`Error saving data to ${this.filePath}:`, error);
    }
  }

  /**
   * ดึงข้อมูลทั้งหมด
   */
  getAll(): T[] {
    return [...this.data];
  }

  /**
   * ค้นหาข้อมูลตาม ID
   */
  getById(id: string, idField: keyof T): T | undefined {
    return this.data.find(item => (item[idField] as unknown) === id);
  }

  /**
   * ค้นหาข้อมูลตามเงื่อนไข
   */
  find(predicate: (item: T) => boolean): T[] {
    return this.data.filter(predicate);
  }

  /**
   * ค้นหาข้อมูลรายการแรกที่ตรงเงื่อนไข
   */
  findOne(predicate: (item: T) => boolean): T | undefined {
    return this.data.find(predicate);
  }

  /**
   * เพิ่มข้อมูลใหม่
   */
  add(item: T): T {
    this.data.push(item);
    this.saveData();
    return item;
  }

  /**
   * เพิ่มข้อมูลหลายรายการ
   */
  addMany(items: T[]): T[] {
    this.data.push(...items);
    this.saveData();
    return items;
  }

  /**
   * อัปเดตข้อมูล
   */
  update(id: string, idField: keyof T, updatedItem: T): T | null {
    const index = this.data.findIndex(item => (item[idField] as unknown) === id);
    if (index === -1) return null;
    
    this.data[index] = updatedItem;
    this.saveData();
    return updatedItem;
  }

  /**
   * อัปเดตข้อมูลหลายรายการ
   */
  updateMany(predicate: (item: T) => boolean, updateFn: (item: T) => T): T[] {
    const updatedItems: T[] = [];
    
    for (let i = 0; i < this.data.length; i++) {
      if (predicate(this.data[i])) {
        this.data[i] = updateFn(this.data[i]);
        updatedItems.push(this.data[i]);
      }
    }
    
    if (updatedItems.length > 0) {
      this.saveData();
    }
    
    return updatedItems;
  }

  /**
   * ลบข้อมูล
   */
  delete(id: string, idField: keyof T): boolean {
    const initialLength = this.data.length;
    this.data = this.data.filter(item => (item[idField] as unknown) !== id);
    
    if (initialLength !== this.data.length) {
      this.saveData();
      return true;
    }
    
    return false;
  }

  /**
   * ลบข้อมูลหลายรายการ
   */
  deleteMany(predicate: (item: T) => boolean): number {
    const initialLength = this.data.length;
    this.data = this.data.filter(item => !predicate(item));
    
    const deletedCount = initialLength - this.data.length;
    if (deletedCount > 0) {
      this.saveData();
    }
    
    return deletedCount;
  }

  /**
   * นับจำนวนข้อมูล
   */
  count(predicate?: (item: T) => boolean): number {
    if (predicate) {
      return this.data.filter(predicate).length;
    }
    return this.data.length;
  }

  /**
   * ตรวจสอบว่ามีข้อมูลหรือไม่
   */
  exists(predicate: (item: T) => boolean): boolean {
    return this.data.some(predicate);
  }

  /**
   * รีเฟรชข้อมูลจากไฟล์
   */
  refresh(): void {
    this.loadData();
  }

  /**
   * ล้างข้อมูลทั้งหมด
   */
  clear(): void {
    this.data = [];
    this.saveData();
  }

  /**
   * บันทึกข้อมูลที่ระบุลงไฟล์
   */
  save(data: T[]): void {
    this.data = data;
    this.saveData();
  }
}