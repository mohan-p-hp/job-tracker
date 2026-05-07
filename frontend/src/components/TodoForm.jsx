import { useState, useEffect } from 'react';
import TagSelector from './TagSelector';

const categories = ['Work', 'Personal', 'Shopping', 'Health', 'Finance', 'Other'];
const priorities = ['Urgent', 'High', 'Medium', 'Low'];
const statuses = ['Pending', 'In Progress', 'Completed'];

export default function TodoForm({ todo, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    category: 'Personal',
    priority: 'Medium',
    status: 'Pending',
    due_date: '',
    due_time: '',
    is_recurring: false,
    recur_every: 'Daily',
    subtasks: [],
    tags: []
  });

  useEffect(() => {
    if (todo) {
      setFormData({
        title: todo.title || '',
        notes: todo.notes || '',
        category: todo.category || 'Personal',
        priority: todo.priority || 'Medium',
        status: todo.status || 'Pending',
        due_date: todo.due_date || '',
        due_time: todo.due_time || '',
        is_recurring: todo.is_recurring || false,
        recur_every: todo.recur_every || 'Daily',
        subtasks: todo.subtasks?.map(s => s.title) || [],
        tags: todo.tags || []
      });
    }
  }, [todo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert empty strings to null and format date for backend compatibility
    const cleanData = {
      ...formData,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString().split('T')[0] : null,
      due_time: formData.due_time || null,
      notes: formData.notes || null
    };
    
    onSubmit(cleanData);
  };

  const addSubtask = () => {
    setFormData({
      ...formData,
      subtasks: [...formData.subtasks, '']
    });
  };

  const updateSubtask = (index, value) => {
    const updated = [...formData.subtasks];
    updated[index] = value;
    setFormData({ ...formData, subtasks: updated });
  };

  const removeSubtask = (index) => {
    const updated = formData.subtasks.filter((_, i) => i !== index);
    setFormData({ ...formData, subtasks: updated });
  };

  return (
    <div className="todo-form-overlay">
      <div className="todo-form">
        <h2>{todo ? 'Edit Task' : 'New Task'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-select"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="form-select"
              >
                {priorities.map(pri => (
                  <option key={pri} value={pri}>{pri}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-select"
              >
                {statuses.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Due Time</label>
              <input
                type="time"
                value={formData.due_time}
                onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
              />
              Recurring Task
            </label>
            
            {formData.is_recurring && (
              <select
                value={formData.recur_every}
                onChange={(e) => setFormData({ ...formData, recur_every: e.target.value })}
                className="form-select"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            )}
          </div>

          <TagSelector 
        selectedTags={formData.tags}
        onTagsChange={(tags) => setFormData({ ...formData, tags })}
      />

      <div className="form-group">
            <div className="subtasks-header">
              <label className="form-label">Subtasks</label>
              <button type="button" className="btn btn--sm btn--secondary" onClick={addSubtask}>
                + Add Subtask
              </button>
            </div>
            
            {formData.subtasks.map((subtask, index) => (
              <div key={index} className="subtask-input-row">
                <input
                  type="text"
                  value={subtask}
                  onChange={(e) => updateSubtask(index, e.target.value)}
                  placeholder="Enter subtask..."
                  className="form-input"
                />
                <button 
                  type="button" 
                  className="btn btn--sm btn--danger"
                  onClick={() => removeSubtask(index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn--primary">
              {todo ? 'Update' : 'Create'} Task
            </button>
            <button type="button" className="btn btn--secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
