import { useState } from 'react';
import SubtaskList from './SubtaskList';

const PRIORITY_STYLES = {
  High:   { color: '#dc2626', bg: '#fef2f2', label: '● High' },
  Medium: { color: '#d97706', bg: '#fffbeb', label: '● Medium' },
  Low:    { color: '#16a34a', bg: '#f0fdf4', label: '● Low' },
};

const CATEGORY_EMOJI = {
  Work: '💼', Personal: '👤', Shopping: '🛒',
  Health: '💪', Finance: '💰', Other: '📌',
};

const STATUS_STYLES = {
  'Pending':     { color: '#6b7280', bg: '#f3f4f6' },
  'In Progress': { color: '#2563eb', bg: '#eff6ff' },
  'Completed':   { color: '#16a34a', bg: '#f0fdf4' },
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function isOverdue(todo) {
  if (!todo.due_date || todo.status === 'Completed') return false;
  const due = new Date(todo.due_date);
  const today = new Date(new Date().toDateString());
  return due < today;
}

export default function TodoCard({
  todo, onComplete, onEdit, onDelete,
  onToggleSubtask, onAddSubtask, onDeleteSubtask
}) {
  const [expanded, setExpanded] = useState(false);

  const priority = PRIORITY_STYLES[todo.priority] || PRIORITY_STYLES.Medium;
  const status   = STATUS_STYLES[todo.status] || STATUS_STYLES['Pending'];
  const overdue  = isOverdue(todo);
  const done     = todo.status === 'Completed';

  const subtasksDone  = (todo.subtasks || []).filter(s => s.is_done).length;
  const subtasksTotal = (todo.subtasks || []).length;
  const progress      = subtasksTotal > 0 ? Math.round((subtasksDone / subtasksTotal) * 100) : null;

  return (
    <div className={`todo-card ${done ? 'todo-card--done' : ''} ${overdue ? 'todo-card--overdue' : ''}`}>
      {/* Left priority bar */}
      <div className="todo-card-bar" style={{ background: priority.color }} />

      <div className="todo-card-body">
        {/* Top row */}
        <div className="todo-card-top">
          <div className="todo-card-meta">
            <span className="todo-category-badge">
              {CATEGORY_EMOJI[todo.category]} {todo.category}
            </span>
            <span className="todo-priority-badge"
              style={{ color: priority.color, background: priority.bg }}>
              {priority.label}
            </span>
            <span className="todo-status-badge"
              style={{ color: status.color, background: status.bg }}>
              {todo.status}
            </span>
            {todo.is_recurring && (
              <span className="todo-recur-badge">🔁 {todo.recur_every}</span>
            )}
          </div>

          <div className="todo-card-actions">
            {!done && (
              <button className="action-btn action-btn--complete" onClick={() => onComplete(todo.id)} title="Mark complete">
                ✓
              </button>
            )}
            <button className="action-btn action-btn--edit" onClick={onEdit} title="Edit">
              ✏️
            </button>
            <button className="action-btn action-btn--delete" onClick={() => onDelete(todo.id)} title="Delete">
              🗑️
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className={`todo-card-title ${done ? 'todo-card-title--done' : ''}`}>
          {todo.title}
        </h3>

        {/* Notes */}
        {todo.notes && (
          <p className="todo-card-notes">{todo.notes}</p>
        )}

        {/* Due date */}
        {todo.due_date && (
          <div className={`todo-card-due ${overdue ? 'todo-card-due--overdue' : ''}`}>
            📅 {formatDate(todo.due_date)}
            {todo.due_time && ` · ⏰ ${formatTime(todo.due_time)}`}
            {overdue && <span className="overdue-tag"> · OVERDUE</span>}
          </div>
        )}

        {/* Subtask progress bar */}
        {subtasksTotal > 0 && (
          <div className="todo-progress">
            <div className="todo-progress-bar">
              <div className="todo-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="todo-progress-label">{subtasksDone}/{subtasksTotal} subtasks</span>
            <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
              {expanded ? '▲ Hide' : '▼ Show'}
            </button>
          </div>
        )}

        {/* Subtasks */}
        {(expanded || subtasksTotal === 0) && (
          <SubtaskList
            subtasks={todo.subtasks || []}
            todoId={todo.id}
            onToggle={onToggleSubtask}
            onAdd={onAddSubtask}
            onDelete={onDeleteSubtask}
          />
        )}
      </div>
    </div>
  );
}
