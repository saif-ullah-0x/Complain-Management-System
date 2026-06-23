-- Complaint Management System Database Schema
-- University of Haripur
-- Compatible with Neon SQL (PostgreSQL)

-- Create tables if they don't exist

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    roll_no_or_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'faculty', 'hod', 'university_admin')),
    department_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    head_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Faculty Staff table
CREATE TABLE IF NOT EXISTS faculty_staff (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    department_id INTEGER REFERENCES departments(id),
    position VARCHAR(100),
    specialization VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'escalated', 'rejected')),
    assigned_to INTEGER REFERENCES users(id),
    assigned_by INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP,
    is_anonymous BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,
    escalation_level INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaint Assignments table
CREATE TABLE IF NOT EXISTS complaint_assignments (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id),
    faculty_id INTEGER REFERENCES faculty_staff(id),
    assigned_by INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'active'
);

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id),
    action_type VARCHAR(50) NOT NULL,
    action_by INTEGER REFERENCES users(id),
    action_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(20),
    target_department_id INTEGER REFERENCES departments(id),
    created_by INTEGER REFERENCES users(id),
    is_urgent BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample departments
INSERT INTO departments (name) VALUES 
('Computer Science'),
('Mathematics'),
('Physics'),
('Chemistry'),
('English'),
('Business Administration')
ON CONFLICT (name) DO NOTHING;

-- Insert sample users (password is 'password123' hashed with bcrypt)
INSERT INTO users (roll_no_or_id, name, password, role, department_id) VALUES 
('ADMIN001', 'University Administrator', '$2b$10$8K.TlVmNJhrlqTHrKE.n3.CqPW5jqRRGhYOZY7a7KP8cLHw7.gBji', 'university_admin', NULL),
('HOD001', 'Dr. Sarah Ahmed', '$2b$10$8K.TlVmNJhrlqTHrKE.n3.CqPW5jqRRGhYOZY7a7KP8cLHw7.gBji', 'hod', 1),
('FAC001', 'Prof. Muhammad Ali', '$2b$10$8K.TlVmNJhrlqTHrKE.n3.CqPW5jqRRGhYOZY7a7KP8cLHw7.gBji', 'faculty', 1),
('FAC002', 'Dr. Ayesha Khan', '$2b$10$8K.TlVmNJhrlqTHrKE.n3.CqPW5jqRRGhYOZY7a7KP8cLHw7.gBji', 'faculty', 2),
('STU001', 'Ahmad Hassan', '$2b$10$8K.TlVmNJhrlqTHrKE.n3.CqPW5jqRRGhYOZY7a7KP8cLHw7.gBji', 'student', 1),
('STU002', 'Fatima Malik', '$2b$10$8K.TlVmNJhrlqTHrKE.n3.CqPW5jqRRGhYOZY7a7KP8cLHw7.gBji', 'student', 2)
ON CONFLICT (roll_no_or_id) DO NOTHING;

-- Update department heads
UPDATE departments SET head_id = (SELECT id FROM users WHERE roll_no_or_id = 'HOD001') WHERE name = 'Computer Science';

-- Insert sample faculty staff
INSERT INTO faculty_staff (user_id, department_id, position, specialization) VALUES 
((SELECT id FROM users WHERE roll_no_or_id = 'HOD001'), 1, 'Head of Department', 'Software Engineering'),
((SELECT id FROM users WHERE roll_no_or_id = 'FAC001'), 1, 'Professor', 'Database Systems'),
((SELECT id FROM users WHERE roll_no_or_id = 'FAC002'), 2, 'Associate Professor', 'Applied Mathematics')
ON CONFLICT DO NOTHING;

-- Insert sample complaints
INSERT INTO complaints (user_id, category, description, priority, status) VALUES 
((SELECT id FROM users WHERE roll_no_or_id = 'STU001'), 'Academic', 'Course registration system not working properly', 'medium', 'pending'),
((SELECT id FROM users WHERE roll_no_or_id = 'STU002'), 'Infrastructure', 'Library Wi-Fi is very slow and disconnects frequently', 'high', 'in_progress'),
((SELECT id FROM users WHERE roll_no_or_id = 'STU001'), 'Administrative', 'Fee payment portal showing incorrect amount', 'urgent', 'pending');

-- Insert sample announcements
INSERT INTO announcements (title, content, target_role, created_by, is_urgent) VALUES 
('System Maintenance Notice', 'The complaint system will be under maintenance on Friday from 2-4 PM.', NULL, (SELECT id FROM users WHERE roll_no_or_id = 'ADMIN001'), false),
('New Academic Policies', 'Please review the updated academic policies in the student handbook.', 'student', (SELECT id FROM users WHERE roll_no_or_id = 'ADMIN001'), true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_audit_log_complaint_id ON audit_log(complaint_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_complaints_updated_at ON complaints;
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();