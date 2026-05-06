export default function TodoFilters({ filters, onChange }) {
  const categories = ['Work', 'Personal', 'Shopping', 'Health', 'Finance', 'Other'];
  const priorities = ['High', 'Medium', 'Low'];
  const statuses = ['Pending', 'In Progress', 'Completed'];
  const sortOptions = [
    { value: 'created', label: 'Date Added' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'priority', label: 'Priority' }
  ];

  return (
    <div className="todo-filters">
      <div className="filter-row">
        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(e) => onChange({ ...filters, priority: e.target.value })}
          className="filter-select"
        >
          <option value="">All Priorities</option>
          {priorities.map(pri => (
            <option key={pri} value={pri}>{pri}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          {statuses.map(st => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value })}
          className="filter-select"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {(filters.category || filters.priority || filters.status) && (
          <button
            className="btn btn--secondary"
            onClick={() => onChange({ category: '', priority: '', status: '', sort: 'created' })}
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
