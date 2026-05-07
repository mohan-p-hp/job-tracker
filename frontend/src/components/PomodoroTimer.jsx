import { useState, useEffect, useRef } from 'react';

export default function PomodoroTimer({ selectedTodo, todos = [], onSessionComplete }) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [selectedTask, setSelectedTask] = useState(selectedTodo || null);
  const intervalRef = useRef(null);

  // Timer effect
  useEffect(() => {
    if (isActive && (minutes > 0 || seconds > 0)) {
      intervalRef.current = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer completed
            handleTimerComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, minutes, seconds]);

  const handleTimerComplete = () => {
    setIsActive(false);
    playNotificationSound();
    
    if (isBreak) {
      // Break completed, start new work session
      setIsBreak(false);
      setMinutes(25);
      setSeconds(0);
    } else {
      // Work session completed
      setSessionCount(sessionCount + 1);
      
      // Notify parent component
      if (onSessionComplete && selectedTask) {
        onSessionComplete({
          todoId: selectedTask.id,
          todoTitle: selectedTask.title,
          duration: 25, // 25 minutes
          type: 'pomodoro',
          completedAt: new Date()
        });
      }

      // Start break (5 min after 4 sessions, otherwise 3 min)
      const breakTime = (sessionCount + 1) % 4 === 0 ? 5 : 3;
      setIsBreak(true);
      setMinutes(breakTime);
      setSeconds(0);
    }
  };

  const playNotificationSound = () => {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // 800 Hz
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    // Play a second beep
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 800;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.5);
    }, 600);
  };

  const toggleTimer = () => {
    if (!selectedTask && !isBreak) {
      alert('Please select a task to focus on!');
      return;
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setMinutes(25);
    setSeconds(0);
  };

  const skipToBreak = () => {
    setIsActive(false);
    setIsBreak(true);
    setMinutes(3);
    setSeconds(0);
  };

  const formatTime = (mins, secs) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (isBreak) return '#10b981'; // green for break
    if (minutes <= 5 && seconds === 0) return '#ef4444'; // red for last 5 minutes
    return '#3b82f6'; // blue for normal
  };

  return (
    <div className="pomodoro-timer">
      <div className="pomodoro-header">
        <h3>🍅 Pomodoro Timer</h3>
        <div className="session-counter">
          Session {sessionCount + 1} {isBreak ? '(Break)' : '(Focus)'}
        </div>
      </div>

      {/* Task Selection */}
      {!isBreak && (
        <div className="task-selector">
          <label>Focus Task:</label>
          <select 
            value={selectedTask?.id || ''} 
            onChange={(e) => {
              const todo = todos.find(t => t.id === parseInt(e.target.value));
              setSelectedTask(todo);
            }}
            className="task-select"
          >
            <option value="">Select a task...</option>
            {todos.map(todo => (
              <option key={todo.id} value={todo.id}>
                {todo.title} ({todo.category}) - {todo.priority}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Timer Display */}
      <div className="timer-display" style={{ borderColor: getTimerColor() }}>
        <div className="timer-circle">
          <svg width="200" height="200">
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke={getTimerColor()}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - ((isBreak ? 3 : 25) * 60 - (minutes * 60 + seconds)) / ((isBreak ? 3 : 25) * 60))}`}
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="timer-text">
            {formatTime(minutes, seconds)}
          </div>
        </div>
      </div>

      {/* Current Task Display */}
      {selectedTask && !isBreak && (
        <div className="current-task">
          <span className="task-label">Focusing on:</span>
          <span className="task-title">{selectedTask.title}</span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="timer-controls">
        <button
          onClick={toggleTimer}
          className={`btn btn--primary timer-btn ${isActive ? 'timer-btn--active' : ''}`}
        >
          {isActive ? '⏸️ Pause' : '▶️ Start'}
        </button>
        
        <button onClick={resetTimer} className="btn btn--secondary timer-btn">
          🔄 Reset
        </button>
        
        {!isBreak && (
          <button onClick={skipToBreak} className="btn btn--secondary timer-btn">
            ⏭️ Skip to Break
          </button>
        )}
      </div>

      {/* Session Stats */}
      <div className="session-stats">
        <div className="stat-item">
          <span className="stat-label">Today's Sessions:</span>
          <span className="stat-value">{sessionCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Focus Time:</span>
          <span className="stat-value">{sessionCount * 25} min</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="pomodoro-instructions">
        <h4>How it works:</h4>
        <ul>
          <li>🎯 Select a task to focus on</li>
          <li>⏱️ Work for 25 minutes</li>
          <li>☕ Take a 3-minute break</li>
          <li>🔄 After 4 sessions, take a 5-minute break</li>
        </ul>
      </div>
    </div>
  );
}
