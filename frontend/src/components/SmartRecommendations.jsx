import { useState, useEffect } from 'react';

export default function SmartRecommendations({ onAction }) {
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/recommendations?limit=8`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations);
        setInsights(data.insights);
        setPatterns(data.patterns);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationAction = (recommendation) => {
    if (onAction) {
      onAction(recommendation.action, recommendation);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#7c3aed',
      high: '#dc2626',
      medium: '#d97706',
      low: '#16a34a'
    };
    return colors[priority] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="smart-recommendations">
        <div className="recommendations-header">
          <h3>🧠 Smart Recommendations</h3>
          <span className="loading-text">Analyzing your productivity patterns...</span>
        </div>
        <div className="recommendations-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="smart-recommendations">
      <div className="recommendations-header">
        <h3>🧠 Smart Recommendations</h3>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="btn btn--sm btn--secondary"
        >
          {expanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Insights Summary */}
      {insights && expanded && (
        <div className="insights-summary">
          <div className="insights-grid">
            <div className="insight-card">
              <span className="insight-icon">📊</span>
              <div className="insight-data">
                <span className="insight-value">{insights.completionRate}</span>
                <span className="insight-label">Completion Rate</span>
              </div>
            </div>
            
            <div className="insight-card">
              <span className="insight-icon">⏱️</span>
              <div className="insight-data">
                <span className="insight-value">{insights.avgDailyTime}</span>
                <span className="insight-label">Avg Daily Time</span>
              </div>
            </div>
            
            <div className="insight-card">
              <span className="insight-icon">🏆</span>
              <div className="insight-data">
                <span className="insight-value">{insights.mostProductiveDay}</span>
                <span className="insight-label">Most Productive Day</span>
              </div>
            </div>
            
            <div className="insight-card">
              <span className="insight-icon">🎯</span>
              <div className="insight-data">
                <span className="insight-value">{insights.topCategory}</span>
                <span className="insight-label">Top Category</span>
              </div>
            </div>
            
            <div className="insight-card">
              <span className="insight-icon">✅</span>
              <div className="insight-data">
                <span className="insight-value">{insights.totalCompleted}</span>
                <span className="insight-label">Completed</span>
              </div>
            </div>
            
            <div className="insight-card">
              <span className="insight-icon">📋</span>
              <div className="insight-data">
                <span className="insight-value">{insights.totalActive}</span>
                <span className="insight-label">Active Tasks</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations List */}
      <div className="recommendations-list">
        {recommendations && recommendations.length === 0 ? (
          <div className="no-recommendations">
            <span className="no-rec-icon">🎉</span>
            <h4>Great job!</h4>
            <p>No recommendations at the moment. Your task management looks optimized!</p>
          </div>
        ) : (
          recommendations && recommendations.map((rec, index) => (
            <div 
              key={index} 
              className="recommendation-item"
              style={{ borderLeftColor: rec.color }}
            >
              <div className="recommendation-content">
                <div className="recommendation-header">
                  <span className="recommendation-icon">{rec.icon}</span>
                  <span 
                    className="recommendation-priority"
                    style={{ backgroundColor: getPriorityColor(rec.priority) }}
                  >
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                
                <h4 className="recommendation-title">{rec.title}</h4>
                <p className="recommendation-description">{rec.description}</p>
                
                <div className="recommendation-actions">
                  <button 
                    onClick={() => handleRecommendationAction(rec)}
                    className="btn btn--sm btn--primary"
                  >
                    {rec.action.type === 'create' ? 'Create Task' : 
                     rec.action.type === 'edit' ? 'Edit Task' :
                     rec.action.type === 'track_time' ? 'Start Tracking' : 'Take Action'}
                  </button>
                  
                  <button 
                    onClick={() => recommendations && setRecommendations(recommendations.filter((_, i) => i !== index))}
                    className="btn btn--sm btn--secondary"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Patterns Analysis */}
      {patterns && expanded && (
        <div className="patterns-analysis">
          <h4>📈 Productivity Patterns</h4>
          <div className="patterns-grid">
            <div className="pattern-card">
              <h5>Best Time</h5>
              <p>{patterns.bestTimeOfDay}</p>
            </div>
            
            <div className="pattern-card">
              <h5>Task Complexity</h5>
              <p>
                {patterns.taskComplexity?.withSubtasks || 0} tasks with subtasks, 
                {patterns.taskComplexity?.withoutSubtasks || 0} without
                {patterns.taskComplexity?.avgSubtasks ? ` (${patterns.taskComplexity.avgSubtasks} avg subtasks)` : ''}
              </p>
            </div>
            
            <div className="pattern-card">
              <h5>Completion Speed</h5>
              <p>{patterns.completionSpeed}</p>
            </div>
            
            <div className="pattern-card">
              <h5>Focus Areas</h5>
              <ul>
                {patterns.focusAreas?.map((area, i) => (
                  <li key={i}>
                    {area.category}: {area.count} tasks
                  </li>
                )) || <li>No data</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="recommendations-footer">
        <button 
          onClick={loadRecommendations}
          className="btn btn--secondary"
        >
          🔄 Refresh Recommendations
        </button>
      </div>
    </div>
  );
}
