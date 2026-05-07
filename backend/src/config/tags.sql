-- Tags System for Job Tracker
-- Run this migration to add tags functionality

CREATE TABLE IF NOT EXISTS tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
);

CREATE TABLE IF NOT EXISTS todo_tags (
  todo_id INT NOT NULL,
  tag_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (todo_id, tag_id),
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Insert some default tags
INSERT IGNORE INTO tags (name, color) VALUES
('Work', '#3B82F6'),
('Personal', '#10B981'),
('Urgent', '#EF4444'),
('Meeting', '#F59E0B'),
('Project', '#8B5CF6'),
('Learning', '#EC4899'),
('Health', '#10B981'),
('Finance', '#F59E0B'),
('Shopping', '#F59E0B'),
('Ideas', '#6B7280');
