import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

export default function SearchBar({ onSearch }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (onSearch) {
      onSearch({ search: q, district: '', category: '' });
    } else {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      navigate(`/listings?${params.toString()}`);
    }
  };

  const clear = () => {
    setQuery('');
    onSearch?.({ search: '', district: '', category: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="sb-root">
      <div className="sb-input-wrap">
        <Search size={16} className="sb-icon-left" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, area, category…"
          className="sb-input"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="sb-clear"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <button type="submit" className="sb-btn" aria-label="Search">
        <Search size={16} className="sm:hidden" aria-hidden="true" />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}