import { db } from "./db";
import { users, departments, complaints, facultyStaff, announcements } from "@shared/schema";

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Clear existing data
    await db.delete(announcements);
    await db.delete(complaints);
    await db.delete(facultyStaff);
    await db.delete(users);
    await db.delete(departments);

    // Create departments
    await db.insert(departments).values([
      { name: "Computer Science" },
      { name: "Engineering" },
      { name: "Business" }
    ]);

    console.log("Departments created");

    // Create users
    await db.insert(users).values([
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
    ]);

    console.log("Users created");

    // Create faculty staff
    await db.insert(facultyStaff).values([
      { id: 1, departmentId: 1, rollNoOrId: "faculty1" }
    ]);

    console.log("Faculty staff created");

    // Create sample complaints
    await db.insert(complaints).values([
      {
        userId: 1,
        title: "Course Registration System Error",
        category: "Academic",
        description: "Issue with course registration system not working properly",
        priority: "medium",
        status: "pending",
        isAnonymous: false
      },
      {
        userId: 1,
        title: "Library Wi-Fi Connection Issues",
        category: "Infrastructure",
        description: "Library Wi-Fi is very slow and disconnects frequently",
        priority: "high",
        status: "in_progress", 
        isAnonymous: false
      },
      {
        userId: 1,
        title: "Fee Payment Portal Error",
        category: "Administrative",
        description: "Fee payment portal showing incorrect amount",
        priority: "urgent",
        status: "pending",
        isAnonymous: false
      }
    ]);

    console.log("Complaints created");

    // Create announcements
    await db.insert(announcements).values([
      {
        id: 1,
        message: "New semester registration opens next week. Please check your email for detailed instructions.",
        targetRoles: ["student", "faculty", "dept_head", "university_head"],
        createdBy: 4
      },
      {
        id: 2,
        message: "Faculty meeting scheduled for tomorrow at 10 AM in the conference room.",
        targetRoles: ["faculty"],
        createdBy: 3
      },
      {
        id: 3,
        message: "Student council elections will be held next month. Nominations are now open.",
        targetRoles: ["student"],
        createdBy: 4
      }
    ]);

    console.log("Announcements created");
    console.log("Database seeding completed successfully!");

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedDatabase };