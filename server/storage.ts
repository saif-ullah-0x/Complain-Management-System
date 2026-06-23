import { 
  users, 
  complaints, 
  departments, 
  facultyStaff, 
  complaintAssignments, 
  auditLog, 
  announcements,
  type User, 
  type InsertUser, 
  type Complaint, 
  type InsertComplaint,
  type Department,
  type FacultyStaff,
  type ComplaintAssignment,
  type AuditLog,
  type Announcement,
  type InsertAnnouncement
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, isNull } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByRollNoOrId(rollNoOrId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Complaint methods
  getComplaint(id: number): Promise<Complaint | undefined>;
  getComplaintsByUser(userId: number): Promise<Complaint[]>;
  getComplaintsByDepartment(departmentId: number): Promise<Complaint[]>;
  getAllComplaints(): Promise<Complaint[]>;
  getComplaintsByStatus(status: string): Promise<Complaint[]>;
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  updateComplaintStatus(id: number, status: string): Promise<Complaint | undefined>;
  assignComplaint(complaintId: number, assignedTo: number, assignedBy: number): Promise<Complaint | undefined>;
  escalateComplaint(complaintId: number, escalatedBy: number): Promise<Complaint | undefined>;
  
  // Department methods
  getDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  
  // Faculty methods
  getFacultyByDepartment(departmentId: number): Promise<FacultyStaff[]>;
  assignComplaintToFaculty(complaintId: number, facultyId: number): Promise<ComplaintAssignment>;
  
  // Audit methods
  addAuditLog(complaintId: number, actionType: string, actionBy: number, actionDetails?: string): Promise<AuditLog>;
  getAuditLogsByComplaint(complaintId: number): Promise<AuditLog[]>;
  
  // Announcement methods
  getAnnouncements(role?: string, departmentId?: number): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByRollNoOrId(rollNoOrId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.rollNoOrId, rollNoOrId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getComplaint(id: number): Promise<Complaint | undefined> {
    const [complaint] = await db.select().from(complaints).where(eq(complaints.id, id));
    return complaint || undefined;
  }

  async getComplaintsByUser(userId: number): Promise<Complaint[]> {
    return await db.select().from(complaints).where(eq(complaints.userId, userId)).orderBy(desc(complaints.createdAt));
  }

  async getComplaintsByDepartment(departmentId: number): Promise<Complaint[]> {
    const result = await db
      .select({
        id: complaints.id,
        userId: complaints.userId,
        title: complaints.title,
        category: complaints.category,
        description: complaints.description,
        priority: complaints.priority,
        status: complaints.status,
        isAnonymous: complaints.isAnonymous,
        assignedTo: complaints.assignedTo,
        assignedBy: complaints.assignedBy,
        assignedAt: complaints.assignedAt,
        createdAt: complaints.createdAt,
        updatedAt: complaints.updatedAt,
      })
      .from(complaints)
      .innerJoin(users, eq(complaints.userId, users.id))
      .where(eq(users.departmentId, departmentId))
      .orderBy(desc(complaints.createdAt));
    return result;
  }

  async getAllComplaints(): Promise<Complaint[]> {
    return await db.select().from(complaints).orderBy(desc(complaints.createdAt));
  }

  async getComplaintsByStatus(status: string): Promise<Complaint[]> {
    return await db.select().from(complaints).where(eq(complaints.status, status)).orderBy(desc(complaints.createdAt));
  }

  async createComplaint(insertComplaint: InsertComplaint): Promise<Complaint> {
    const [complaint] = await db
      .insert(complaints)
      .values(insertComplaint)
      .returning();
    return complaint;
  }

  async updateComplaintStatus(id: number, status: string): Promise<Complaint | undefined> {
    const [complaint] = await db
      .update(complaints)
      .set({ status, updatedAt: new Date() })
      .where(eq(complaints.id, id))
      .returning();
    return complaint || undefined;
  }

  async assignComplaint(complaintId: number, assignedTo: number, assignedBy: number): Promise<Complaint | undefined> {
    const [complaint] = await db
      .update(complaints)
      .set({ 
        assignedTo, 
        assignedBy, 
        assignedAt: new Date(),
        status: 'in_progress',
        updatedAt: new Date() 
      })
      .where(eq(complaints.id, complaintId))
      .returning();
    return complaint || undefined;
  }

  async escalateComplaint(complaintId: number, escalatedBy: number): Promise<Complaint | undefined> {
    const [complaint] = await db
      .update(complaints)
      .set({ 
        status: 'escalated',
        updatedAt: new Date() 
      })
      .where(eq(complaints.id, complaintId))
      .returning();
    return complaint || undefined;
  }

  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department || undefined;
  }

  async getFacultyByDepartment(departmentId: number): Promise<FacultyStaff[]> {
    return await db.select().from(facultyStaff).where(eq(facultyStaff.departmentId, departmentId));
  }

  async assignComplaintToFaculty(complaintId: number, facultyId: number): Promise<ComplaintAssignment> {
    const [assignment] = await db
      .insert(complaintAssignments)
      .values({ complaintId, facultyId })
      .returning();
    return assignment;
  }

  async addAuditLog(complaintId: number, actionType: string, actionBy: number, actionDetails?: string): Promise<AuditLog> {
    const [log] = await db
      .insert(auditLog)
      .values({ complaintId, actionType, actionBy, actionDetails })
      .returning();
    return log;
  }

  async getAuditLogsByComplaint(complaintId: number): Promise<AuditLog[]> {
    return await db.select().from(auditLog).where(eq(auditLog.complaintId, complaintId)).orderBy(desc(auditLog.timestamp));
  }

  async getAnnouncements(role?: string, departmentId?: number): Promise<Announcement[]> {
    let query = db.select().from(announcements);
    
    if (role && departmentId) {
      // Get announcements for specific role and department, plus university-wide announcements
      return await query.where(
        and(
          or(
            sql`${announcements.departmentId} IS NULL`, // University-wide announcements
            eq(announcements.departmentId, departmentId) // Department-specific announcements
          ),
          sql`${announcements.targetRoles} @> ARRAY[${role}]::text[]` // Role is in target roles array
        )
      ).orderBy(desc(announcements.createdAt));
    } else if (role) {
      // Get announcements for specific role (university-wide only)
      return await query.where(
        and(
          sql`${announcements.departmentId} IS NULL`,
          sql`${announcements.targetRoles} @> ARRAY[${role}]::text[]`
        )
      ).orderBy(desc(announcements.createdAt));
    }
    
    return await query.orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db
      .insert(announcements)
      .values(insertAnnouncement)
      .returning();
    return announcement;
  }
}

// In-memory storage for demo purposes when database is unavailable
class MemoryStorage implements IStorage {
  private users: User[] = [];
  private complaints: Complaint[] = [];
  private departments: Department[] = [];
  private facultyStaff: FacultyStaff[] = [];
  private complaintAssignments: ComplaintAssignment[] = [];
  private auditLogs: AuditLog[] = [];
  private announcements: Announcement[] = [];
  private nextId = 1;

  constructor() {
    this.initializeTestData();
  }

  private initializeTestData() {
    // Create departments
    this.departments = [
      { id: 1, name: "Computer Science" },
      { id: 2, name: "Engineering" },
      { id: 3, name: "Business Administration" }
    ];

    // For demo purposes, storing plain text passwords (in production these would be properly hashed)
    this.users = [
      {
        id: 1,
        rollNoOrId: "F23-1686",
        role: "student",
        password: "34567",
        name: "Ahmad Ali",
        departmentId: 1
      },
      {
        id: 2,
        rollNoOrId: "faculty1",
        role: "faculty", 
        password: "54321",
        name: "Dr. Sarah Khan",
        departmentId: 1
      },
      {
        id: 3,
        rollNoOrId: "depthead1",
        role: "dept_head",
        password: "54321",
        name: "Prof. Muhammad Hassan",
        departmentId: 1
      },
      {
        id: 4,
        rollNoOrId: "admin1",
        role: "university_head",
        password: "76543",
        name: "Dr. Fatima Shah",
        departmentId: null
      }
    ];

    // Create faculty staff
    this.facultyStaff = [
      { id: 1, departmentId: 1, rollNoOrId: "faculty1" }
    ];

    // Create sample complaints
    this.complaints = [
      {
        id: 1,
        userId: 1,
        title: "Course Registration System Error",
        category: "Academic",
        description: "Issue with course registration system not working properly",
        priority: "medium",
        status: "pending",
        isAnonymous: false,
        assignedTo: null,
        assignedBy: null,
        assignedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2, 
        userId: 1,
        title: "Library Wi-Fi Connection Issues",
        category: "Infrastructure",
        description: "Library Wi-Fi is very slow and disconnects frequently",
        priority: "high",
        status: "in_progress", 
        isAnonymous: false,
        assignedTo: 2,
        assignedBy: 3,
        assignedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        userId: 1, 
        title: "Fee Payment Portal Error",
        category: "Administrative",
        description: "Fee payment portal showing incorrect amount",
        priority: "urgent",
        status: "pending",
        isAnonymous: false,
        assignedTo: null,
        assignedBy: null,
        assignedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Create announcements
    this.announcements = [
      {
        id: 1,
        message: "New semester registration opens next week. Please check your email for detailed instructions.",
        targetRoles: ["student", "faculty", "dept_head"],
        departmentId: null,
        createdAt: new Date(),
        createdBy: 4
      },
      {
        id: 2,
        message: "Faculty meeting scheduled for tomorrow at 2 PM in the conference room.", 
        targetRoles: ["faculty"],
        departmentId: 1,
        createdAt: new Date(),
        createdBy: 3
      }
    ];

    this.nextId = 5;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByRollNoOrId(rollNoOrId: string): Promise<User | undefined> {
    return this.users.find(u => u.rollNoOrId === rollNoOrId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = { ...user, id: this.nextId++ } as User;
    this.users.push(newUser);
    return newUser;
  }

  async getComplaint(id: number): Promise<Complaint | undefined> {
    return this.complaints.find(c => c.id === id);
  }

  async getComplaintsByUser(userId: number): Promise<Complaint[]> {
    return this.complaints.filter(c => c.userId === userId);
  }

  async getComplaintsByDepartment(departmentId: number): Promise<Complaint[]> {
    return this.complaints.filter(c => {
      const user = this.users.find(u => u.id === c.userId);
      return user?.departmentId === departmentId;
    });
  }

  async getAllComplaints(): Promise<Complaint[]> {
    return [...this.complaints];
  }

  async getComplaintsByStatus(status: string): Promise<Complaint[]> {
    return this.complaints.filter(c => c.status === status);
  }

  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    const newComplaint = { 
      ...complaint, 
      id: this.nextId++,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Complaint;
    this.complaints.push(newComplaint);
    return newComplaint;
  }

  async updateComplaintStatus(id: number, status: string): Promise<Complaint | undefined> {
    const complaint = this.complaints.find(c => c.id === id);
    if (complaint) {
      complaint.status = status as any;
      complaint.updatedAt = new Date();
    }
    return complaint;
  }

  async assignComplaint(complaintId: number, assignedTo: number, assignedBy: number): Promise<Complaint | undefined> {
    const complaint = this.complaints.find(c => c.id === complaintId);
    if (complaint) {
      complaint.assignedTo = assignedTo;
      complaint.assignedBy = assignedBy;
      complaint.assignedAt = new Date();
      complaint.status = 'in_progress' as any;
      complaint.updatedAt = new Date();
    }
    return complaint;
  }

  async escalateComplaint(complaintId: number, escalatedBy: number): Promise<Complaint | undefined> {
    const complaint = this.complaints.find(c => c.id === complaintId);
    if (complaint) {
      complaint.status = 'escalated' as any;
      complaint.updatedAt = new Date();
    }
    return complaint;
  }

  async getDepartments(): Promise<Department[]> {
    return [...this.departments];
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.find(d => d.id === id);
  }

  async getFacultyByDepartment(departmentId: number): Promise<FacultyStaff[]> {
    return this.facultyStaff.filter(f => f.departmentId === departmentId);
  }

  async assignComplaintToFaculty(complaintId: number, facultyId: number): Promise<ComplaintAssignment> {
    const assignment = {
      id: this.nextId++,
      complaintId,
      facultyId,
      assignedAt: new Date()
    };
    this.complaintAssignments.push(assignment);
    return assignment;
  }

  async addAuditLog(complaintId: number, actionType: string, actionBy: number, actionDetails?: string): Promise<AuditLog> {
    const log = {
      id: this.nextId++,
      complaintId,
      actionType,
      actionBy,
      actionDetails: actionDetails || null,
      timestamp: new Date()
    };
    this.auditLogs.push(log);
    return log;
  }

  async getAuditLogsByComplaint(complaintId: number): Promise<AuditLog[]> {
    return this.auditLogs.filter(l => l.complaintId === complaintId);
  }

  async getAnnouncements(role?: string, departmentId?: number): Promise<Announcement[]> {
    if (!role) return [...this.announcements];
    return this.announcements.filter(a => {
      const isRoleMatch = a.targetRoles.includes(role);
      const isDepartmentMatch = !departmentId || !a.departmentId || a.departmentId === departmentId;
      return isRoleMatch && isDepartmentMatch;
    });
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const newAnnouncement = {
      ...announcement,
      id: this.nextId++,
      createdAt: new Date(),
      departmentId: announcement.departmentId ?? null
    };
    this.announcements.push(newAnnouncement);
    return newAnnouncement;
  }
}

// Use in-memory storage (no database configured)
const storage: IStorage = new MemoryStorage();

export { storage };
