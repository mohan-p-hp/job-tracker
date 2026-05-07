import { useState, useEffect } from 'react';

export default function Analytics({ todos }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/time`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics">
        <h3>📊 Analytics</h3>
        <p>Loading analytics...</p>
      </div>
    );
  }

  // Calculate local statistics
  const totalTasks = todos.length;
  const completedTasks = todos.filter(t => t.status === 'Completed').length;
  const pendingTasks = todos.filter(t => t.status === 'Pending').length;
  const inProgressTasks = todos.filter(t => t.status === 'In Progress').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const urgentTasks = todos.filter(t => t.priority === 'Urgent' && t.status !== 'Completed').length;
  const highTasks = todos.filter(t => t.priority === 'High' && t.status !== 'Completed').length;
  const overdueTasks = todos.filter(t => {
    if (!t.due_date || t.status === 'Completed') return false;
    return new Date(t.due_date) < new Date(new Date().toDateString());
  }).length;

  const categoryBreakdown = todos.reduce((acc, todo) => {
    acc[todo.category] = (acc[todo.category] || 0) + 1;
    return acc;
  }, {});

  const priorityBreakdown = todos.reduce((acc, todo) => {
    acc[todo.priority] = (acc[todo.priority] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h3>📊 Task Analytics</h3>
        <button onClick={loadAnalytics} className="btn btn--secondary btn--sm">
          🔄 Refresh
        </button>
      </div>

      {/* Task Overview */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-icon">📝</span>
            <span className="analytics-title">Total Tasks</span>
          </div>
          <div className="analytics-value">{totalTasks}</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-icon">✅</span>
            <span className="analytics-title">Completed</span>
          </div>
          <div className="analytics-value">{completedTasks}</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-icon">⏳</span>
            <span className="analytics-title">In Progress</span>
          </div>
          <div className="analytics-value">{inProgressTasks}</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-icon">📋</span>
            <span className="analytics-title">Pending</span>
          </div>
          <div className="analytics-value">{pendingTasks}</div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="completion-section">
        <h4>🎯 Completion Rate</h4>
        <div className="completion-ring">
          <svg width="120" height="120">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#10b981"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - completionRate / 100)}`}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="completion-text">
            <span className="completion-percentage">{completionRate}%</span>
            <span className="completion-label">Complete</span>
          </div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="priority-section">
        <h4>🚨 Priority Breakdown</h4>
        <div className="priority-grid">
          {Object.entries(priorityBreakdown).map(([priority, count]) => (
            <div key={priority} className="priority-item">
              <span className={`priority-label priority-${priority.toLowerCase()}`}>
                {priority === 'Urgent' ? '🔥' : priority === 'High' ? '🔴' : priority === 'Medium' ? '🟡' : '🟢'} {priority}
              </span>
              <span className="priority-count">{count}</span>
            </div>
          ))}
        </div>
        
        {(urgentTasks > 0 || highTasks > 0) && (
          <div className="priority-alerts">
            {urgentTasks > 0 && (
              <div className="alert alert--urgent">
                🔥 {urgentTasks} urgent task{urgentTasks > 1 ? 's' : ''} need attention
              </div>
            )}
            {highTasks > 0 && (
              <div className="alert alert--high">
                🔴 {highTasks} high priority task{highTasks > 1 ? 's' : ''} pending
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="category-section">
        <h4>📂 Category Breakdown</h4>
        <div className="category-grid">
          {Object.entries(categoryBreakdown).map(([category, count]) => (
            <div key={category} className="category-item">
              <span className="category-name">{category}</span>
              <div className="category-bar">
                <div 
                  className="category-fill" 
                  style={{ 
                    width: `${(count / totalTasks) * 100}%`,
                    backgroundColor: getCategoryColor(category)
                  }}
                />
              </div>
              <span className="category-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks > 0 && (
        <div className="overdue-section">
          <h4>⚠️ Overdue Tasks</h4>
          <div className="alert alert--overdue">
            📅 {overdueTasks} task{overdueTasks > 1 ? 's are' : ' is'} overdue
          </div>
        </div>
      )}

      {/* Time Tracking Summary */}
      {analytics && (
        <div className="time-section">
          <h4>⏱️ Time Tracking</h4>
          <div className="time-grid">
            <div className="time-item">
              <span className="time-label">Today's Sessions</span>
              <span className="time-value">{analytics.today.sessions_today}</span>
            </div>
            <div className="time-item">
              <span className="time-label">Time Today</span>
              <span className="time-value">{formatDuration(analytics.today.minutes_today)}</span>
            </div>
            <div className="time-item">
              <span className="time-label">This Week</span>
              <span className="time-value">{formatDuration(analytics.week.minutes_week)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryColor(category) {
  const colors = {
    Work: '#3b82f6',
    Personal: '#10b981',
    Shopping: '#f59e0b',
    Health: '#ef4444',
    Finance: '#8b5cf6',
    Other: '#6b7280'
  };
  return colors[category] || '#6b7280';
}

function formatDuration(minutes) {
  if (!minutes) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}
