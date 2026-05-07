import { useState, useEffect, useRef } from 'react';

export default function TimeTracker({ selectedTodo, todos, onSessionStart, onSessionEnd }) {
  const [activeSession, setActiveSession] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const intervalRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Timer effect for manual tracking
  useEffect(() => {
    if (isTracking && activeSession) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const start = new Date(activeSession.start_time);
        const elapsed = Math.floor((now - start) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, activeSession]);

  // Load sessions and analytics
  useEffect(() => {
    if (selectedTodo) {
      loadSessions();
      loadAnalytics();
    }
  }, [selectedTodo]);

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/time-sessions?todo_id=${selectedTodo.id}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/time`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const startTracking = async () => {
    if (!selectedTodo) {
      alert('Please select a task to track time for');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/time-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          todo_id: selectedTodo.id,
          session_type: 'manual',
          notes: notes || null
        })
      });

      if (res.ok) {
        const session = await res.json();
        setActiveSession(session);
        setIsTracking(true);
        setNotes('');
        setShowNotes(false);
        if (onSessionStart) onSessionStart(session);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      alert('Failed to start time tracking');
    }
  };

  const stopTracking = async () => {
    if (!activeSession) return;

    try {
      const res = await fetch(`${API_BASE}/api/time-sessions/${activeSession.id}/end`, {
        method: 'PATCH'
      });

      if (res.ok) {
        const result = await res.json();
        setIsTracking(false);
        setActiveSession(null);
        setElapsedTime(0);
        loadSessions();
        loadAnalytics();
        if (onSessionEnd) onSessionEnd(result);
      }
    } catch (err) {
      console.error('Failed to stop session:', err);
      alert('Failed to stop time tracking');
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="time-tracker">
      <div className="time-tracker-header">
        <h3>⏱️ Time Tracker</h3>
        {selectedTodo && (
          <div className="current-task-info">
            <span className="task-label">Tracking:</span>
            <span className="task-title">{selectedTodo.title}</span>
          </div>
        )}
      </div>

      {/* Timer Display */}
      <div className="timer-display">
        <div className={`timer-circle ${isTracking ? 'timer-circle--active' : ''}`}>
          <div className="timer-text">
            {formatTime(elapsedTime)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="tracker-controls">
        {!isTracking ? (
          <>
            {!selectedTodo && (
              <select 
                value="" 
                onChange={(e) => {
                  const todo = todos.find(t => t.id === parseInt(e.target.value));
                  // This would be handled by parent component
                }}
                className="task-select"
                disabled
              >
                <option value="">Select a task...</option>
                {todos.filter(t => t.status !== 'Completed').map(todo => (
                  <option key={todo.id} value={todo.id}>
                    {todo.title}
                  </option>
                ))}
              </select>
            )}
            
            <button 
              onClick={() => setShowNotes(!showNotes)}
              className="btn btn--secondary"
              disabled={!selectedTodo}
            >
              📝 Add Notes
            </button>
            
            <button 
              onClick={startTracking}
              className="btn btn--primary"
              disabled={!selectedTodo}
            >
              ▶️ Start Tracking
            </button>
          </>
        ) : (
          <button 
            onClick={stopTracking}
            className="btn btn--danger"
          >
            ⏹️ Stop Tracking
          </button>
        )}
      </div>

      {/* Notes Input */}
      {showNotes && (
        <div className="notes-section">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes for this time session..."
            className="notes-textarea"
            rows={3}
          />
        </div>
      )}

      {/* Analytics Summary */}
      {analytics && (
        <div className="analytics-summary">
          <h4>📊 Today's Summary</h4>
          <div className="analytics-grid">
            <div className="analytics-item">
              <span className="analytics-label">Sessions:</span>
              <span className="analytics-value">{analytics.today.sessions_today}</span>
            </div>
            <div className="analytics-item">
              <span className="analytics-label">Time Today:</span>
              <span className="analytics-value">{formatDuration(analytics.today.minutes_today)}</span>
            </div>
            <div className="analytics-item">
              <span className="analytics-label">This Week:</span>
              <span className="analytics-value">{formatDuration(analytics.week.minutes_week)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="recent-sessions">
          <h4>📝 Recent Sessions</h4>
          <div className="sessions-list">
            {sessions.slice(0, 5).map(session => (
              <div key={session.id} className="session-item">
                <div className="session-info">
                  <span className="session-type">
                    {session.session_type === 'pomodoro' ? '🍅' : '⏱️'}
                  </span>
                  <span className="session-duration">
                    {formatDuration(session.duration_minutes)}
                  </span>
                </div>
                <div className="session-time">
                  {new Date(session.start_time).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                {session.notes && (
                  <div className="session-notes">{session.notes}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
