CREATE DATABASE IF NOT EXISTS job_tracker;
USE job_tracker;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  company_name VARCHAR(150) NOT NULL,
  job_title VARCHAR(150) NOT NULL,
  job_url TEXT,
  platform VARCHAR(50),
  status ENUM('Applied','Interviewing','Offer','Rejected','Ghosted') DEFAULT 'Applied',
  applied_at DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS recruiters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT,
  name VARCHAR(100),
  email VARCHAR(100),
  linkedin_url TEXT,
  company VARCHAR(150),
  FOREIGN KEY (application_id) REFERENCES job_applications(id)
);

CREATE TABLE IF NOT EXISTS outreach_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recruiter_id INT,
  application_id INT,
  channel VARCHAR(50),
  subject VARCHAR(200),
  message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reply_received BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (recruiter_id) REFERENCES recruiters(id),
  FOREIGN KEY (application_id) REFERENCES job_applications(id)
);
