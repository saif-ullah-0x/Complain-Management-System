-- University of Haripur Complaint Management System Database Schema

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    roll_no_or_id VARCHAR(50) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL,
    password TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    department_id INTEGER REFERENCES departments(id)
);

-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create faculty_staff table
CREATE TABLE IF NOT EXISTS faculty_staff (
    id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL REFERENCES departments(id),
    roll_no_or_id VARCHAR(50) NOT NULL
);

-- Create complaint_assignments table
CREATE TABLE IF NOT EXISTS complaint_assignments (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id),
    faculty_id INTEGER NOT NULL REFERENCES faculty_staff(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id),
    action_type VARCHAR(50) NOT NULL,
    action_by INTEGER NOT NULL REFERENCES users(id),
    action_details TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by INTEGER NOT NULL REFERENCES users(id)
);

-- Insert departments
INSERT INTO departments (name) VALUES 
('Computer Science'),
('Engineering'),
('Business Administration')
ON CONFLICT DO NOTHING;

-- Insert test users with hashed passwords (bcrypt hash for the specified passwords)
INSERT INTO users (roll_no_or_id, role, password, name, department_id) VALUES 
('F23-1686', 'student', '$2b$10$YourHashedPasswordHere34567', 'Ahmad Ali', 1),
('faculty1', 'faculty', '$2b$10$YourHashedPasswordHere54321', 'Dr. Sarah Khan', 1),
('depthead1', 'dept_head', '$2b$10$YourHashedPasswordHere54321', 'Prof. Muhammad Hassan', 1),
('admin1', 'university_head', '$2b$10$YourHashedPasswordHere76543', 'Dr. Fatima Shah', NULL)
ON CONFLICT (roll_no_or_id) DO NOTHING;

-- Insert faculty staff records
INSERT INTO faculty_staff (department_id, roll_no_or_id) VALUES 
(1, 'faculty1')
ON CONFLICT DO NOTHING;

-- Insert sample complaints
INSERT INTO complaints (user_id, category, description, priority, status, is_anonymous) VALUES 
(1, 'Academic', 'Issue with course registration system not working properly', 'medium', 'pending', false),
(1, 'Infrastructure', 'Library Wi-Fi is very slow and disconnects frequently', 'high', 'in_progress', false),
(1, 'Administrative', 'Fee payment portal is showing incorrect amount', 'urgent', 'pending', false)
ON CONFLICT DO NOTHING;

-- Insert sample announcements
INSERT INTO announcements (message, role, created_by) VALUES 
('New semester registration opens next week. Please check your email for detailed instructions.', 'all', 4),
('Faculty meeting scheduled for tomorrow at 2 PM in the conference room.', 'faculty', 3),
('System maintenance scheduled for this weekend. Expect brief interruptions.', 'all', 4)
ON CONFLICT DO NOTHING;

-- Insert audit logs for the sample complaints
INSERT INTO audit_log (complaint_id, action_type, action_by, action_details) VALUES 
(1, 'created', 1, 'Complaint submitted'),
(2, 'created', 1, 'Complaint submitted'),
(2, 'status_updated', 2, 'Status changed to in_progress'),
(3, 'created', 1, 'Complaint submitted')
ON CONFLICT DO NOTHING;