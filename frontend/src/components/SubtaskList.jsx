import { useState } from 'react';

export default function SubtaskList({ subtasks, todoId, onToggle, onAdd, onDelete }) {
  const [newSubtask, setNewSubtask] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    
    await onAdd(todoId, newSubtask.trim());
    setNewSubtask('');
    setAdding(false);
  };

  return (
    <div className="subtasks">
      <div className="subtasks-header">
        <span className="subtasks-title">Subtasks</span>
        <button 
          className="subtask-add-btn"
          onClick={() => setAdding(true)}
        >
          + Add
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="subtask-form">
          <input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            placeholder="Enter subtask..."
            className="subtask-input"
            autoFocus
          />
          <button type="submit" className="btn btn--sm btn--primary">Add</button>
          <button 
            type="button" 
            className="btn btn--sm btn--secondary"
            onClick={() => {
              setAdding(false);
              setNewSubtask('');
            }}
          >
            Cancel
          </button>
        </form>
      )}

      {subtasks.length === 0 && !adding && (
        <p className="subtasks-empty">No subtasks yet</p>
      )}

      {subtasks.map(subtask => (
        <div key={subtask.id} className="subtask">
          <label className="subtask-checkbox">
            <input
              type="checkbox"
              checked={subtask.is_done}
              onChange={() => onToggle(subtask.id)}
            />
            <span className={`subtask-text ${subtask.is_done ? 'subtask-text--done' : ''}`}>
              {subtask.title}
            </span>
          </label>
          <button 
            className="subtask-delete"
            onClick={() => onDelete(subtask.id)}
            title="Delete subtask"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
