import { useState, useEffect } from 'react';
import TodoCard from '../components/TodoCard';
import TodoForm from '../components/TodoForm';
import TodoFilters from '../components/TodoFilters';
import '../styles/todos.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function TodoPage() {
  const [todos, setTodos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    status: '',
    sort: 'created'
  });

  // Load todos
  const loadTodos = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      
      const res = await fetch(`${API_BASE}/todos?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
        setFiltered(data);
      }
    } catch (err) {
      console.error('Failed to load todos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  useEffect(() => {
    // Apply filters locally for instant UI
    let result = [...todos];
    
    if (filters.category) {
      result = result.filter(t => t.category === filters.category);
    }
    if (filters.priority) {
      result = result.filter(t => t.priority === filters.priority);
    }
    if (filters.status) {
      result = result.filter(t => t.status === filters.status);
    }

    // Sort
    if (filters.sort === 'due_date') {
      result.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      });
    } else if (filters.sort === 'priority') {
      const priorityOrder = { High: 0, Medium: 1, Low: 2 };
      result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    setFiltered(result);
  }, [todos, filters]);

  // CRUD operations
  const handleCreate = async (formData) => {
    try {
      const res = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await loadTodos();
        setShowForm(false);
      }
    } catch (err) {
      console.error('Failed to create todo:', err);
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      const res = await fetch(`${API_BASE}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await loadTodos();
        setEditingTodo(null);
      }
    } catch (err) {
      console.error('Failed to update todo:', err);
    }
  };

  const handleComplete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/todos/${id}/complete`, {
        method: 'PATCH'
      });
      if (res.ok) await loadTodos();
    } catch (err) {
      console.error('Failed to complete todo:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this todo?')) return;
    try {
      const res = await fetch(`${API_BASE}/todos/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) await loadTodos();
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      const res = await fetch(`${API_BASE}/todos/subtasks/${subtaskId}`, {
        method: 'PATCH'
      });
      if (res.ok) await loadTodos();
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  const handleAddSubtask = async (todoId, title) => {
    try {
      const res = await fetch(`${API_BASE}/todos/${todoId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (res.ok) await loadTodos();
    } catch (err) {
      console.error('Failed to add subtask:', err);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      const res = await fetch(`${API_BASE}/todos/subtasks/${subtaskId}`, {
        method: 'DELETE'
      });
      if (res.ok) await loadTodos();
    } catch (err) {
      console.error('Failed to delete subtask:', err);
    }
  };

  if (loading) return <div className="todo-page"><p>Loading...</p></div>;

  return (
    <div className="todo-page">
      <div className="todo-header">
        <div>
          <h1 className="todo-title">📝 To-Do List</h1>
          <p className="todo-subtitle">
            {filtered.length} task{filtered.length !== 1 ? 's' : ''} 
            {filters.category || filters.priority || filters.status ? ' (filtered)' : ''}
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowForm(true)}>
          + Add Task
        </button>
      </div>

      <TodoFilters filters={filters} onChange={setFilters} />

      {showForm && (
        <TodoForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingTodo && (
        <TodoForm
          todo={editingTodo}
          onSubmit={(data) => handleUpdate(editingTodo.id, data)}
          onCancel={() => setEditingTodo(null)}
        />
      )}

      <div className="todo-list">
        {filtered.length === 0 ? (
          <div className="todo-empty">
            <p>No tasks found</p>
            <button className="btn btn--primary" onClick={() => setShowForm(true)}>
              Create your first task
            </button>
          </div>
        ) : (
          filtered.map(todo => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onComplete={handleComplete}
              onEdit={() => setEditingTodo(todo)}
              onDelete={handleDelete}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onDeleteSubtask={handleDeleteSubtask}
            />
          ))
        )}
      </div>
    </div>
  );
}
