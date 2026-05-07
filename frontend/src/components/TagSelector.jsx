import { useState, useEffect } from 'react';

export default function TagSelector({ selectedTags, availableTags, onTagsChange }) {
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [allTags, setAllTags] = useState([]);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tags`);
      if (res.ok) {
        const tags = await res.json();
        setAllTags(tags);
      }
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const handleTagToggle = (tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    let newSelectedTags;

    if (isSelected) {
      newSelectedTags = selectedTags.filter(t => t.id !== tag.id);
    } else {
      newSelectedTags = [...selectedTags, tag];
    }

    onTagsChange(newSelectedTags);
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    
    if (!newTagName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor
        })
      });

      if (res.ok) {
        const newTag = await res.json();
        setAllTags([...allTags, newTag]);
        setNewTagName('');
        setNewTagColor('#3B82F6');
        setShowNewTag(false);
        
        // Auto-select the new tag
        onTagsChange([...selectedTags, newTag]);
      }
    } catch (err) {
      console.error('Failed to create tag:', err);
      alert('Failed to create tag');
    }
  };

  const predefinedColors = [
    '#3B82F6', '#10B981', '#EF4444', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#6B7280', '#F97316'
  ];

  return (
    <div className="tag-selector">
      <div className="tag-selector-header">
        <h4>🏷️ Tags</h4>
        <button 
          onClick={() => setShowNewTag(!showNewTag)}
          className="btn btn--sm btn--secondary"
        >
          + New Tag
        </button>
      </div>

      {/* New Tag Form */}
      {showNewTag && (
        <div className="new-tag-form">
          <form onSubmit={handleCreateTag}>
            <div className="new-tag-row">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name..."
                className="tag-input"
                autoFocus
              />
              
              <div className="color-picker">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={`color-btn ${newTagColor === color ? 'color-btn--selected' : ''}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              
              <button type="submit" className="btn btn--sm btn--primary">
                Create
              </button>
              
              <button 
                type="button" 
                onClick={() => setShowNewTag(false)}
                className="btn btn--sm btn--secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tag List */}
      <div className="tag-list">
        {allTags.map(tag => {
          const isSelected = selectedTags.some(t => t.id === tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => handleTagToggle(tag)}
              className={`tag-chip ${isSelected ? 'tag-chip--selected' : ''}`}
              style={{ 
                backgroundColor: isSelected ? tag.color : 'transparent',
                borderColor: tag.color,
                color: isSelected ? 'white' : tag.color
              }}
            >
              <span className="tag-color-dot" style={{ backgroundColor: tag.color }} />
              {tag.name}
              {isSelected && <span className="tag-remove">×</span>}
            </button>
          );
        })}
        
        {allTags.length === 0 && (
          <p className="no-tags">No tags yet. Create your first tag!</p>
        )}
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="selected-tags">
          <span className="selected-label">Selected:</span>
          <div className="selected-tags-list">
            {selectedTags.map(tag => (
              <span 
                key={tag.id} 
                className="selected-tag"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
