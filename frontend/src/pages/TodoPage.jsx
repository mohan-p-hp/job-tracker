import { useState, useEffect } from 'react';
import TodoCard from '../components/TodoCard';
import TodoForm from '../components/TodoForm';
import TodoFilters from '../components/TodoFilters';
import PomodoroTimer from '../components/PomodoroTimer';
import TimeTracker from '../components/TimeTracker';
import Analytics from '../components/Analytics';
import DependencyManager from '../components/DependencyManager';
import SmartRecommendations from '../components/SmartRecommendations';
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
    sort: 'created',
    search: ''
  });
  const [selectedTodo, setSelectedTodo] = useState(null);

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
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        (t.notes && t.notes.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    if (filters.sort === 'due_date') {
      result.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      });
    } else if (filters.sort === 'priority') {
      const priorityOrder = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
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

  const handlePomodoroSessionComplete = async (sessionData) => {
    console.log('Pomodoro session completed:', sessionData);
    // You can later integrate this with time tracking API
    // For now, just log the session
    alert(`Great work! You completed a 25-minute focus session on: ${sessionData.todoTitle}`);
  };

  const handleRecommendationAction = (action, recommendation) => {
    switch (action.type) {
      case 'create':
        // Pre-fill form with suggested task data
        setEditingTodo(null);
        setShowForm(true);
        // Store suggestion in localStorage or state for form
        break;
      
      case 'edit':
        // Open edit form for specific todo
        const todoToEdit = todos.find(t => t.id === action.todoId);
        if (todoToEdit) {
          setEditingTodo(todoToEdit);
          setShowForm(false);
        }
        break;
      
      case 'track_time':
        // Start time tracking for a task
        const todoToTrack = todos.find(t => t.id === action.todoId);
        if (todoToTrack) {
          setSelectedTodo(todoToTrack);
          // Could scroll to TimeTracker component
        }
        break;
      
      default:
        console.log('Unknown action:', action);
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

      {/* Pomodoro Timer */}
      <PomodoroTimer 
        selectedTodo={selectedTodo}
        todos={filtered.filter(t => t.status !== 'Completed')}
        onSessionComplete={handlePomodoroSessionComplete}
      />

      {/* Time Tracker */}
      <TimeTracker 
        selectedTodo={selectedTodo}
        todos={filtered.filter(t => t.status !== 'Completed')}
        onSessionStart={(session) => console.log('Time session started:', session)}
        onSessionEnd={(result) => console.log('Time session ended:', result)}
      />

      {/* Analytics Dashboard */}
      <Analytics todos={filtered} />

      {/* Smart Recommendations */}
      <SmartRecommendations 
        onAction={handleRecommendationAction}
      />

      {/* Dependency Manager */}
      {editingTodo && (
        <DependencyManager 
          todoId={editingTodo.id}
          availableTodos={filtered.filter(t => t.id !== editingTodo.id && t.status !== 'Completed')}
          onDependencyChange={() => loadTodos()}
        />
      )}

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
