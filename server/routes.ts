import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertComplaintSchema, insertAnnouncementSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { rollNoOrId, password } = req.body;
      
      if (!rollNoOrId || !password) {
        return res.status(400).json({ message: "Roll number/ID and password are required" });
      }

      const user = await storage.getUserByRollNoOrId(rollNoOrId);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // For demo purposes - in production use bcrypt.compare
      const isValid = password === user.password;
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, rollNoOrId: user.rollNoOrId, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ token, user: { id: user.id, rollNoOrId: user.rollNoOrId, role: user.role, name: user.name } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        id: user.id, 
        rollNoOrId: user.rollNoOrId, 
        role: user.role, 
        name: user.name,
        departmentId: user.departmentId 
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Complaint routes
  app.get("/api/complaints", authenticateToken, async (req: any, res) => {
    try {
      const { userId, status } = req.query;
      let complaints;

      if (userId) {
        complaints = await storage.getComplaintsByUser(parseInt(userId));
      } else if (status) {
        complaints = await storage.getComplaintsByStatus(status);
      } else {
        // For university head - get all complaints
        if (req.user.role === 'university_head') {
          complaints = await storage.getAllComplaints();
        } else if (req.user.role === 'dept_head') {
          const user = await storage.getUser(req.user.id);
          if (user?.departmentId) {
            complaints = await storage.getComplaintsByDepartment(user.departmentId);
          } else {
            complaints = [];
          }
        } else {
          complaints = await storage.getComplaintsByUser(req.user.id);
        }
      }

      res.json(complaints);
    } catch (error) {
      console.error("Get complaints error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/complaints", authenticateToken, async (req: any, res) => {
    try {
      const complaintData = insertComplaintSchema.parse({
        ...req.body,
        userId: req.user.id,
        status: 'pending'
      });

      const complaint = await storage.createComplaint(complaintData);
      
      // Add audit log
      await storage.addAuditLog(
        complaint.id,
        'created',
        req.user.id,
        'Complaint submitted'
      );

      res.status(201).json(complaint);
    } catch (error) {
      console.error("Create complaint error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/complaints/:id/status", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const complaint = await storage.updateComplaintStatus(parseInt(id), status);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      // Add audit log
      await storage.addAuditLog(
        complaint.id,
        'status_updated',
        req.user.id,
        `Status changed to ${status}`
      );

      res.json(complaint);
    } catch (error) {
      console.error("Update complaint status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Assign complaint route
  app.patch("/api/complaints/:id/assign", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;

      const complaint = await storage.assignComplaint(parseInt(id), assignedTo, req.user.id);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      // Add audit log
      await storage.addAuditLog(
        complaint.id,
        'assigned',
        req.user.id,
        `Assigned to user ID ${assignedTo}`
      );

      res.json(complaint);
    } catch (error) {
      console.error("Assign complaint error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Escalate complaint route
  app.patch("/api/complaints/:id/escalate", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      const complaint = await storage.escalateComplaint(parseInt(id), req.user.id);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      // Add audit log
      await storage.addAuditLog(
        complaint.id,
        'escalated',
        req.user.id,
        `Escalated to university head`
      );

      res.json(complaint);
    } catch (error) {
      console.error("Escalate complaint error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Department routes
  app.get("/api/departments", authenticateToken, async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Get departments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Faculty routes
  app.get("/api/faculty/:departmentId", authenticateToken, async (req, res) => {
    try {
      const { departmentId } = req.params;
      const faculty = await storage.getFacultyByDepartment(parseInt(departmentId));
      res.json(faculty);
    } catch (error) {
      console.error("Get faculty error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/complaints/:id/assign", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { facultyId } = req.body;

      const assignment = await storage.assignComplaintToFaculty(parseInt(id), facultyId);
      
      // Update complaint status
      await storage.updateComplaintStatus(parseInt(id), 'in_progress');
      
      // Add audit log
      await storage.addAuditLog(
        parseInt(id),
        'assigned',
        req.user.id,
        `Assigned to faculty ID ${facultyId}`
      );

      res.json(assignment);
    } catch (error) {
      console.error("Assign complaint error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Audit log routes
  app.get("/api/complaints/:id/audit", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const auditLogs = await storage.getAuditLogsByComplaint(parseInt(id));
      res.json(auditLogs);
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/complaints/:id/audit", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { actionType, actionDetails } = req.body;

      const auditLog = await storage.addAuditLog(
        parseInt(id),
        actionType,
        req.user.id,
        actionDetails
      );
      
      res.status(201).json(auditLog);
    } catch (error) {
      console.error("Add audit log error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Announcement routes
  app.get("/api/announcements", authenticateToken, async (req: any, res) => {
    try {
      const announcements = await storage.getAnnouncements(req.user.role, req.user.departmentId);
      res.json(announcements);
    } catch (error) {
      console.error("Get announcements error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/announcements", authenticateToken, async (req: any, res) => {
    try {
      // Role-based announcement creation permissions
      let allowedTargetRoles: string[] = [];
      let departmentId: number | null = null;

      switch (req.user.role) {
        case 'university_head':
          // University Head can create announcements for all roles and departments
          allowedTargetRoles = ['student', 'faculty', 'dept_head'];
          departmentId = req.body.departmentId || null; // Can be university-wide or department-specific
          break;
        case 'dept_head':
          // Dept Head can create announcements for Faculty and Students in their department
          allowedTargetRoles = ['faculty', 'student'];
          departmentId = req.user.departmentId; // Must be their department
          if (!departmentId) {
            return res.status(400).json({ message: "Department head must be assigned to a department" });
          }
          break;
        case 'faculty':
          // Faculty can create announcements for Students in their courses/department
          allowedTargetRoles = ['student'];
          departmentId = req.user.departmentId; // Must be their department
          if (!departmentId) {
            return res.status(400).json({ message: "Faculty must be assigned to a department" });
          }
          break;
        default:
          return res.status(403).json({ message: "Insufficient permissions to create announcements" });
      }

      // Validate target roles
      const requestedRoles = req.body.targetRoles || [];
      const invalidRoles = requestedRoles.filter((role: string) => !allowedTargetRoles.includes(role));
      if (invalidRoles.length > 0) {
        return res.status(400).json({ 
          message: `You can only create announcements for: ${allowedTargetRoles.join(', ')}` 
        });
      }

      const announcementData = insertAnnouncementSchema.parse({
        message: req.body.message,
        targetRoles: requestedRoles,
        departmentId,
        createdBy: req.user.id
      });

      const announcement = await storage.createAnnouncement(announcementData);
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Create announcement error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Analytics routes (for university head)
  app.get("/api/analytics", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'university_head') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const allComplaints = await storage.getAllComplaints();
      const departments = await storage.getDepartments();

      const analytics = {
        total: allComplaints.length,
        pending: allComplaints.filter(c => c.status === 'pending').length,
        inProgress: allComplaints.filter(c => c.status === 'in_progress').length,
        resolved: allComplaints.filter(c => c.status === 'resolved').length,
        escalated: allComplaints.filter(c => c.status === 'escalated').length,
        departments: departments.length,
        resolutionRate: Math.round((allComplaints.filter(c => c.status === 'resolved').length / allComplaints.length) * 100) || 0
      };

      res.json(analytics);
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Database initialization endpoint (for development/testing)
  app.post("/api/init-db", async (req, res) => {
    try {
      // Create departments
      for (const dept of [
        { name: "Computer Science" },
        { name: "Engineering" }, 
        { name: "Business Administration" }
      ]) {
        try {
          await storage.db.insert(storage.db.schema.departments).values(dept).onConflictDoNothing();
        } catch (e) {
          console.log("Department might already exist:", dept.name);
        }
      }

      // Create test users with properly hashed passwords
      const testUsers = [
        {
          rollNoOrId: "F23-1686",
          role: "student" as const,
          password: await bcrypt.hash("34567", 10),
          name: "Ahmad Ali",
          departmentId: 1
        },
        {
          rollNoOrId: "faculty1", 
          role: "faculty" as const,
          password: await bcrypt.hash("54321", 10),
          name: "Dr. Sarah Khan",
          departmentId: 1
        },
        {
          rollNoOrId: "depthead1",
          role: "dept_head" as const, 
          password: await bcrypt.hash("54321", 10),
          name: "Prof. Muhammad Hassan",
          departmentId: 1
        },
        {
          rollNoOrId: "admin1",
          role: "university_head" as const,
          password: await bcrypt.hash("76543", 10),
          name: "Dr. Fatima Shah",
          departmentId: null
        }
      ];

      for (const user of testUsers) {
        try {
          await storage.createUser(user);
        } catch (e) {
          console.log("User might already exist:", user.rollNoOrId);
        }
      }

      // Create sample complaints
      const sampleComplaints = [
        {
          userId: 1,
          category: "Academic",
          description: "Issue with course registration system not working properly",
          priority: "medium" as const,
          status: "pending" as const,
          isAnonymous: false
        },
        {
          userId: 1,
          category: "Infrastructure", 
          description: "Library Wi-Fi is very slow and disconnects frequently",
          priority: "high" as const,
          status: "in_progress" as const,
          isAnonymous: false
        },
        {
          userId: 1,
          category: "Administrative",
          description: "Fee payment portal showing incorrect amount",
          priority: "urgent" as const,
          status: "pending" as const,
          isAnonymous: false
        }
      ];

      for (const complaint of sampleComplaints) {
        try {
          const newComplaint = await storage.createComplaint(complaint);
          await storage.addAuditLog(newComplaint.id, 'created', complaint.userId, 'Complaint submitted');
        } catch (e) {
          console.log("Complaint creation error:", e);
        }
      }

      // Create sample announcements
      const sampleAnnouncements = [
        {
          message: "New semester registration opens next week. Please check your email for detailed instructions.",
          role: "all" as const,
          createdBy: 4
        },
        {
          message: "Faculty meeting scheduled for tomorrow at 2 PM in the conference room.",
          role: "faculty" as const,
          createdBy: 3
        }
      ];

      for (const announcement of sampleAnnouncements) {
        try {
          await storage.createAnnouncement(announcement);
        } catch (e) {
          console.log("Announcement creation error:", e);
        }
      }

      res.json({ 
        message: "Database initialized successfully with test data",
        status: "ready"
      });
    } catch (error) {
      console.error("Database initialization error:", error);
      res.status(500).json({ message: "Failed to initialize database" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
