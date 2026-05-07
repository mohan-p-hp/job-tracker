-- Time Tracking System for Job Tracker
-- Run this migration to add time tracking functionality

CREATE TABLE IF NOT EXISTS time_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  todo_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NULL,
  duration_minutes INT NULL,
  session_type ENUM('pomodoro', 'manual') DEFAULT 'manual',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
  INDEX idx_todo_id (todo_id),
  INDEX idx_start_time (start_time),
  INDEX idx_session_type (session_type)
);

-- Add total_time_tracked column to todos table for quick access
ALTER TABLE todos ADD COLUMN total_time_tracked INT DEFAULT 0 COMMENT 'Total minutes tracked for this todo';

-- Create view for time tracking analytics
CREATE OR REPLACE VIEW time_analytics AS
SELECT 
  t.id as todo_id,
  t.title,
  t.category,
  t.priority,
  t.status,
  COUNT(ts.id) as session_count,
  COALESCE(SUM(ts.duration_minutes), 0) as total_minutes,
  COALESCE(AVG(ts.duration_minutes), 0) as avg_session_minutes,
  MAX(ts.start_time) as last_session_date
FROM todos t
LEFT JOIN time_sessions ts ON t.id = ts.todo_id
WHERE ts.duration_minutes IS NOT NULL
GROUP BY t.id, t.title, t.category, t.priority, t.status;
