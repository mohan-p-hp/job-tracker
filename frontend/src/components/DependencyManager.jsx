import { useState, useEffect } from 'react';

export default function DependencyManager({ todoId, availableTodos, onDependencyChange }) {
  const [dependencies, setDependencies] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedBlockingTodo, setSelectedBlockingTodo] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (todoId) {
      loadDependencies();
    }
  }, [todoId]);

  const loadDependencies = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dependencies/${todoId}`);
      if (res.ok) {
        const data = await res.json();
        setDependencies(data);
      }
    } catch (err) {
      console.error('Failed to load dependencies:', err);
    }
  };

  const handleAddDependency = async (e) => {
    e.preventDefault();
    
    if (!selectedBlockingTodo) return;

    try {
      const res = await fetch(`${API_BASE}/api/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          todo_id: todoId,
          blocks_todo_id: parseInt(selectedBlockingTodo)
        })
      });

      if (res.ok) {
        const newDependency = await res.json();
        setDependencies([...dependencies, newDependency]);
        setSelectedBlockingTodo('');
        setShowAddForm(false);
        onDependencyChange();
      }
    } catch (err) {
      console.error('Failed to add dependency:', err);
      alert('Failed to add dependency');
    }
  };

  const handleDeleteDependency = async (dependencyId) => {
    if (!confirm('Remove this dependency?')) return;

    try {
      await fetch(`${API_BASE}/api/dependencies/${dependencyId}`, {
        method: 'DELETE'
      });
      
      setDependencies(dependencies.filter(d => d.id !== dependencyId));
      onDependencyChange();
    } catch (err) {
      console.error('Failed to delete dependency:', err);
      alert('Failed to remove dependency');
    }
  };

  const getAvailableTodos = () => {
    return availableTodos.filter(t => 
      t.id !== todoId && 
      !dependencies.some(d => d.blocks_todo_id === t.id)
    );
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Urgent': '#7c3aed',
      'High': '#dc2626',
      'Medium': '#d97706',
      'Low': '#16a34a'
    };
    return colors[priority] || '#6b7280';
  };

  return (
    <div className="dependency-manager">
      <div className="dependency-header">
        <h4>🔗 Task Dependencies</h4>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn--sm btn--secondary"
        >
          + Add Dependency
        </button>
      </div>

      {/* Add Dependency Form */}
      {showAddForm && (
        <div className="add-dependency-form">
          <form onSubmit={handleAddDependency}>
            <div className="form-row">
              <select
                value={selectedBlockingTodo}
                onChange={(e) => setSelectedBlockingTodo(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select a task that blocks this one...</option>
                {getAvailableTodos().map(todo => (
                  <option key={todo.id} value={todo.id}>
                    {todo.title} ({todo.priority})
                  </option>
                ))}
              </select>
              
              <button type="submit" className="btn btn--sm btn--primary">
                Add
              </button>
              
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="btn btn--sm btn--secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dependencies List */}
      <div className="dependencies-list">
        {dependencies.length === 0 ? (
          <p className="no-dependencies">No dependencies set. This task can be started anytime.</p>
        ) : (
          dependencies.map(dep => (
            <div key={dep.id} className="dependency-item">
              <div className="dependency-info">
                <span className="dependency-label">Blocked by:</span>
                <span 
                  className="dependency-title"
                  style={{ 
                    borderLeftColor: getPriorityColor(dep.blocks_priority),
                    color: getPriorityColor(dep.blocks_priority)
                  }}
                >
                  {dep.blocks_todo_title}
                </span>
                <span className="dependency-status">
                  {dep.blocks_status === 'Completed' ? '✅' : '⏳'}
                </span>
              </div>
              
              <button 
                onClick={() => handleDeleteDependency(dep.id)}
                className="dependency-remove"
                title="Remove dependency"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {dependencies.length > 0 && (
        <div className="dependency-note">
          <span className="note-icon">ℹ️</span>
          This task cannot be started until all blocking tasks are completed.
        </div>
      )}
    </div>
  );
}
