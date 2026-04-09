import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { DISTRICTS, CATEGORIES } from '../../utils/helpers';

export default function SearchBar({ onSearch, compact = false }) {
  const navigate = useNavigate();
  const [query,    setQuery]    = useState('');
  const [district, setDistrict] = useState('');
  const [category, setCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query)    params.set('search',   query);
    if (district) params.set('district', district);
    if (category) params.set('category', category);
    if (onSearch) onSearch({ search: query, district, category });
    else navigate(`/listings?${params.toString()}`);
  };

  const clearAll = () => {
    setQuery(''); setDistrict(''); setCategory('');
    onSearch?.({ search: '', district: '', category: '' });
  };

  const hasFilters = query || district || category;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`flex gap-2 ${compact ? '' : 'mb-2'}`}>
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, area, category..." className="input pl-10 pr-4" />
        </div>
        {!compact && (
          <button type="button" onClick={() => setShowFilters(!showFilters)}
            className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${showFilters ? 'bg-brand text-white border-brand' : 'border-gray-200 text-gray-600'}`}>
            <SlidersHorizontal size={16} />
          </button>
        )}
        <button type="submit" className="btn-primary whitespace-nowrap px-4 sm:px-6">
          <span className="hidden sm:inline">Search</span>
          <Search size={18} className="sm:hidden" />
        </button>
      </div>
      {!compact && (
        <div className={`gap-2 ${showFilters ? 'flex flex-col sm:flex-row' : 'hidden md:flex'}`}>
          <div className="relative flex-1">
            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select value={district} onChange={(e) => setDistrict(e.target.value)}
              className="input pl-9 pr-4 appearance-none cursor-pointer">
              <option value="">All Districts</option>
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="relative flex-1">
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="input appearance-none cursor-pointer">
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button type="button" onClick={clearAll}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-gray-200 text-sm text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors">
              <X size={14} /><span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      )}
    </form>
  );
}
