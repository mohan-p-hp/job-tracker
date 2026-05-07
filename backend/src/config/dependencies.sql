-- Task Dependencies System for Job Tracker
-- Run this migration to add task dependencies functionality

CREATE TABLE IF NOT EXISTS task_dependencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  todo_id INT NOT NULL,
  blocks_todo_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_dependency (todo_id, blocks_todo_id),
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
  FOREIGN KEY (blocks_todo_id) REFERENCES todos(id) ON DELETE CASCADE,
  INDEX idx_todo_id (todo_id),
  INDEX idx_blocks_todo_id (blocks_todo_id)
);

-- Add dependency status to todos table
ALTER TABLE todos ADD COLUMN dependency_status ENUM('none', 'blocked', 'ready') DEFAULT 'none' COMMENT 'Dependency status: none=no dependencies, blocked=blocked by dependencies, ready=dependencies satisfied';
