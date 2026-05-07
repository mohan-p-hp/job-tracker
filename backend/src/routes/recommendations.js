const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ─────────────────────────────────────────────
// GET /api/recommendations - Get smart task recommendations
// Query: limit (default 10)
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent todos for pattern analysis
    const [recentTodos] = await db.query(`
      SELECT * FROM todos 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY created_at DESC
    `);

    // Get completed todos for success patterns
    const [completedTodos] = await db.query(`
      SELECT * FROM todos 
      WHERE status = 'Completed' 
        AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY updated_at DESC
    `);

    // Get time tracking data for productivity patterns
    const [timeData] = await db.query(`
      SELECT 
        DATE(start_time) as date,
        COUNT(*) as sessions,
        COALESCE(SUM(duration_minutes), 0) as total_minutes
      FROM time_sessions 
      WHERE start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND duration_minutes IS NOT NULL
      GROUP BY DATE(start_time)
      ORDER BY date DESC
    `);

    // Generate recommendations
    const recommendations = await generateSmartRecommendations(recentTodos, completedTodos, timeData, limit);
    
    res.json({
      recommendations,
      insights: generateInsights(recentTodos, completedTodos, timeData),
      patterns: analyzePatterns(recentTodos, completedTodos, timeData)
    });
  } catch (err) {
    console.error('GET /api/recommendations error:', err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// ─────────────────────────────────────────────
// Smart recommendation generation
// ─────────────────────────────────────────────
async function generateSmartRecommendations(recentTodos, completedTodos, timeData, limit) {
  const recommendations = [];
  
  // 1. Recommend breaking down large tasks
  const largeTasks = recentTodos
    .filter(t => t.status === 'Pending' && t.notes && t.notes.length > 200)
    .slice(0, 3);
  
  largeTasks.forEach(task => {
    recommendations.push({
      type: 'breakdown',
      priority: 'high',
      title: `Break down: "${task.title}"`,
      description: `This task has extensive notes. Consider breaking it into smaller subtasks for better progress tracking.`,
      action: {
        type: 'edit',
        todoId: task.id,
        suggestion: 'Add subtasks to break this down'
      },
      icon: '🔧',
      color: '#3B82F6'
    });
  });

  // 2. Recommend rescheduling overdue tasks
  const overdueTasks = recentTodos
    .filter(t => t.status === 'Pending' && t.due_date && new Date(t.due_date) < new Date())
    .slice(0, 2);
  
  overdueTasks.forEach(task => {
    recommendations.push({
      type: 'reschedule',
      priority: 'urgent',
      title: `Reschedule overdue task: "${task.title}"`,
      description: `This task was due ${Math.floor((new Date() - new Date(task.due_date)) / (1000 * 60 * 60 * 24))} days ago.`,
      action: {
        type: 'edit',
        todoId: task.id,
        suggestion: 'Update due date to today or tomorrow'
      },
      icon: '📅',
      color: '#EF4444'
    });
  });

  // 3. Recommend similar tasks based on patterns
  const patterns = analyzeTaskPatterns(completedTodos);
  Object.entries(patterns).forEach(([pattern, count]) => {
    if (count >= 3) { // If pattern appears 3+ times
      recommendations.push({
        type: 'pattern',
        priority: 'medium',
        title: `Create similar task: ${pattern}`,
        description: `You've completed ${count} similar tasks recently. Consider creating another one.`,
        action: {
          type: 'create',
          suggestion: {
            title: pattern,
            category: inferCategory(pattern, completedTodos),
            priority: 'Medium'
          }
        },
        icon: '🔄',
        color: '#10B981'
      });
    }
  });

  // 4. Recommend time tracking for high-priority tasks
  const untrackedHighPriority = recentTodos
    .filter(t => t.priority === 'Urgent' && t.status === 'In Progress' && !t.total_time_tracked)
    .slice(0, 2);
  
  untrackedHighPriority.forEach(task => {
    recommendations.push({
      type: 'time_tracking',
      priority: 'high',
      title: `Track time for: "${task.title}"`,
      description: `This urgent task is in progress but has no time tracking. Start tracking to measure productivity.`,
      action: {
        type: 'track_time',
        todoId: task.id
      },
      icon: '⏱️',
      color: '#F59E0B'
    });
  });

  // 5. Recommend completing stuck tasks
  const stuckTasks = recentTodos
    .filter(t => t.status === 'In Progress' && 
      new Date(t.updated_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days old
    .slice(0, 2);
  
  stuckTasks.forEach(task => {
    recommendations.push({
      type: 'completion',
      priority: 'medium',
      title: `Complete or update: "${task.title}"`,
      description: `This task has been in progress for over a week. Consider completing it or updating the status.`,
      action: {
        type: 'edit',
        todoId: task.id,
        suggestion: 'Mark as completed or add subtasks'
      },
      icon: '✅',
      color: '#8B5CF6'
    });
  });

  // Sort by priority and limit
  return recommendations
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, limit);
}

// ─────────────────────────────────────────────
// Generate insights from data
// ─────────────────────────────────────────────
function generateInsights(recentTodos, completedTodos, timeData) {
  const completionRate = recentTodos.length > 0 
    ? Math.round((completedTodos.length / recentTodos.length) * 100) 
    : 0;

  const avgDailyTime = timeData.length > 0
    ? Math.round(timeData.reduce((sum, day) => sum + day.total_minutes, 0) / timeData.length)
    : 0;

  const mostProductiveDay = timeData.length > 0
    ? timeData.reduce((max, day) => day.total_minutes > max.total_minutes ? day : max)
    : null;

  const categoryBreakdown = completedTodos.reduce((acc, todo) => {
    acc[todo.category] = (acc[todo.category] || 0) + 1;
    return acc;
  }, {});

  return {
    completionRate: `${completionRate}%`,
    avgDailyTime: `${Math.floor(avgDailyTime / 60)}h ${avgDailyTime % 60}m`,
    mostProductiveDay: mostProductiveDay 
      ? new Date(mostProductiveDay.date).toLocaleDateString('en-US', { weekday: 'long' })
      : 'No data',
    topCategory: Object.entries(categoryBreakdown).length > 0
      ? Object.entries(categoryBreakdown).sort(([,a], [,b]) => b - a)[0][0]
      : 'None',
    totalCompleted: completedTodos.length,
    totalActive: recentTodos.filter(t => t.status !== 'Completed').length
  };
}

// ─────────────────────────────────────────────
// Analyze patterns in task data
// ─────────────────────────────────────────────
function analyzePatterns(recentTodos, completedTodos, timeData) {
  return {
    bestTimeOfDay: analyzeBestTime(timeData),
    taskComplexity: analyzeComplexity(completedTodos),
    completionSpeed: analyzeCompletionSpeed(recentTodos, completedTodos),
    focusAreas: analyzeFocusAreas(completedTodos)
  };
}

function analyzeTaskPatterns(completedTodos) {
  const patterns = {};
  
  completedTodos.forEach(todo => {
    // Extract patterns from titles
    const words = todo.title.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) { // Only meaningful words
        patterns[word] = (patterns[word] || 0) + 1;
      }
    });
  });
  
  return patterns;
}

function inferCategory(pattern, completedTodos) {
  const matchingTodos = completedTodos.filter(t => 
    t.title.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (matchingTodos.length === 0) return 'Personal';
  
  const categories = matchingTodos.reduce((acc, todo) => {
    acc[todo.category] = (acc[todo.category] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(categories).sort(([,a], [,b]) => b - a)[0][0];
}

function analyzeBestTime(timeData) {
  if (timeData.length === 0) return 'No data';
  
  // This would need more detailed time tracking data
  // For now, return the day with most sessions
  const bestDay = timeData.reduce((best, current) => 
    current.sessions > best.sessions ? current : best
  );
  
  return new Date(bestDay.date).toLocaleDateString('en-US', { weekday: 'long' });
}

function analyzeComplexity(completedTodos) {
  const withSubtasks = completedTodos.filter(t => t.subtasks && t.subtasks.length > 0);
  return {
    withSubtasks: withSubtasks.length,
    withoutSubtasks: completedTodos.length - withSubtasks.length,
    avgSubtasks: withSubtasks.length > 0 
      ? Math.round(withSubtasks.reduce((sum, t) => sum + t.subtasks.length, 0) / withSubtasks.length)
      : 0
  };
}

function analyzeCompletionSpeed(recentTodos, completedTodos) {
  const completedWithDates = completedTodos.filter(t => t.created_at && t.updated_at);
  
  if (completedWithDates.length === 0) return 'No data';
  
  const avgCompletionTime = completedWithDates.reduce((sum, todo) => {
    const created = new Date(todo.created_at);
    const completed = new Date(todo.updated_at);
    return sum + (completed - created);
  }, 0) / completedWithDates.length;
  
  const days = Math.floor(avgCompletionTime / (1000 * 60 * 60 * 24));
  
  if (days < 1) return 'Fast (< 1 day)';
  if (days < 3) return 'Quick (1-3 days)';
  if (days < 7) return 'Normal (3-7 days)';
  return 'Slow (> 7 days)';
}

function analyzeFocusAreas(completedTodos) {
  const categories = completedTodos.reduce((acc, todo) => {
    acc[todo.category] = (acc[todo.category] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([category, count]) => ({ category, count }));
}

module.exports = router;
