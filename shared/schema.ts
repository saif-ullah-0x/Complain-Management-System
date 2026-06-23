import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  rollNoOrId: varchar("roll_no_or_id", { length: 50 }).notNull().unique(),
  role: varchar("role", { length: 20 }).notNull(), // 'student', 'faculty', 'dept_head', 'university_head'
  password: text("password").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  departmentId: integer("department_id"),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
});

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description").notNull(),
  priority: varchar("priority", { length: 20 }).notNull(), // 'low', 'medium', 'high', 'urgent'
  status: varchar("status", { length: 20 }).notNull().default('pending'), // 'pending', 'in_progress', 'resolved', 'escalated'
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  assignedTo: integer("assigned_to"), // faculty/dept head assigned to handle this complaint
  assignedBy: integer("assigned_by"), // who assigned this complaint
  assignedAt: timestamp("assigned_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const facultyStaff = pgTable("faculty_staff", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id").notNull(),
  rollNoOrId: varchar("roll_no_or_id", { length: 50 }).notNull(),
});

export const complaintAssignments = pgTable("complaint_assignments", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").notNull(),
  facultyId: integer("faculty_id").notNull(),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").notNull(),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  actionBy: integer("action_by").notNull(),
  actionDetails: text("action_details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  targetRoles: text("target_roles").array().notNull(), // Array of roles: ['student', 'faculty', 'dept_head', 'university_head']
  departmentId: integer("department_id"), // null for university-wide announcements
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  complaints: many(complaints),
  facultyStaff: many(facultyStaff),
  auditLogs: many(auditLog),
  announcements: many(announcements),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
  facultyStaff: many(facultyStaff),
}));

export const complaintsRelations = relations(complaints, ({ one, many }) => ({
  user: one(users, {
    fields: [complaints.userId],
    references: [users.id],
  }),
  assignments: many(complaintAssignments),
  auditLogs: many(auditLog),
}));

export const facultyStaffRelations = relations(facultyStaff, ({ one, many }) => ({
  department: one(departments, {
    fields: [facultyStaff.departmentId],
    references: [departments.id],
  }),
  user: one(users, {
    fields: [facultyStaff.rollNoOrId],
    references: [users.rollNoOrId],
  }),
  assignments: many(complaintAssignments),
}));

export const complaintAssignmentsRelations = relations(complaintAssignments, ({ one }) => ({
  complaint: one(complaints, {
    fields: [complaintAssignments.complaintId],
    references: [complaints.id],
  }),
  faculty: one(facultyStaff, {
    fields: [complaintAssignments.facultyId],
    references: [facultyStaff.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  complaint: one(complaints, {
    fields: [auditLog.complaintId],
    references: [complaints.id],
  }),
  user: one(users, {
    fields: [auditLog.actionBy],
    references: [users.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  creator: one(users, {
    fields: [announcements.createdBy],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [announcements.departmentId],
    references: [departments.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Department = typeof departments.$inferSelect;
export type FacultyStaff = typeof facultyStaff.$inferSelect;
export type ComplaintAssignment = typeof complaintAssignments.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
