import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid3X3, List, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import SearchBar   from '../../components/common/SearchBar';
import ListingCard from '../../components/common/ListingCard';
import EmptyState  from '../../components/common/EmptyState';
import { PageSpinner } from '../../components/common/Spinner';
import { listingAPI }  from '../../services/api';
import { DISTRICTS, CATEGORIES, formatPrice, getImageUrl, getCategoryColor, truncate } from '../../utils/helpers';

function ListCardRow({ listing }) {
  const { _id, title, category, price, location, images, status, description } = listing;
  return (
    <a href={`/listings/${_id}`} className="card flex flex-col sm:flex-row group">
      <div className="sm:w-48 lg:w-56 shrink-0 aspect-[4/3] sm:aspect-auto overflow-hidden bg-gray-100">
        <img src={images?.[0] ? getImageUrl(images[0]) : `https://placehold.co/300x200/f97316/white?text=${category}`} alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = `https://placehold.co/300x200/f97316/white?text=${category}`; }} />
      </div>
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-display font-bold text-gray-900 text-base group-hover:text-brand transition-colors leading-snug">{truncate(title, 70)}</h3>
            <span className={`badge shrink-0 ${getCategoryColor(category)}`}>{category}</span>
          </div>
          <p className="text-sm text-gray-500 mb-3 leading-relaxed">{truncate(description, 100)}</p>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={12} className="text-brand" />{location?.locality}, {location?.district}</span>
          <div className="flex items-center gap-3">
            <span className={`badge ${status === 'available' ? 'badge-green' : 'badge-red'}`}>{status}</span>
            <span className="font-display font-bold text-brand text-base">{formatPrice(price?.amount, price?.period)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [view,     setView]     = useState('grid');

  const currentPage = Number(searchParams.get('page') || 1);
  const search      = searchParams.get('search')   || '';
  const category    = searchParams.get('category') || '';
  const district    = searchParams.get('district') || '';
  const minPrice    = searchParams.get('minPrice') || '';
  const maxPrice    = searchParams.get('maxPrice') || '';
  const status      = searchParams.get('status')   || '';

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listingAPI.getAll({ search, category, district, minPrice, maxPrice, status, page: currentPage, limit: 12 });
      setListings(data.listings || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch { setListings([]); }
    finally { setLoading(false); }
  }, [search, category, district, minPrice, maxPrice, status, currentPage]);

  useEffect(() => { fetchListings(); window.scrollTo({ top: 0, behavior: 'smooth' }); }, [fetchListings]);

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const handleSearch = ({ search: s, district: d, category: c }) => {
    const p = new URLSearchParams();
    if (s) p.set('search', s);
    if (d) p.set('district', d);
    if (c) p.set('category', c);
    setSearchParams(p);
  };

  const goPage = (n) => {
    const p = new URLSearchParams(searchParams);
    p.set('page', n);
    setSearchParams(p);
  };

  return (
    <div className="page-wrapper">
      <div className="mb-6">
        <h1 className="section-title mb-1">Browse Listings</h1>
        <p className="text-gray-500 text-sm">{total > 0 ? `${total} properties found` : 'Search properties across Manipur'}</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <SearchBar onSearch={handleSearch} />
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24 space-y-6">
            <h3 className="font-display font-bold text-gray-900 text-base">Filters</h3>
            <div>
              <p className="label mb-2">Category</p>
              <div className="space-y-1.5">
                {['', ...CATEGORIES].map((c) => (
                  <button key={c || 'all'} onClick={() => updateParam('category', c)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${category === c ? 'bg-brand text-white font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}>
                    {c || 'All Categories'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label mb-2">District</p>
              <select value={district} onChange={(e) => updateParam('district', e.target.value)} className="input text-sm">
                <option value="">All Districts</option>
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <p className="label mb-2">Price Range (₹/month)</p>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={minPrice} onChange={(e) => updateParam('minPrice', e.target.value)} className="input text-sm w-1/2" />
                <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => updateParam('maxPrice', e.target.value)} className="input text-sm w-1/2" />
              </div>
            </div>
            <div>
              <p className="label mb-2">Status</p>
              <div className="flex gap-2">
                {['', 'available', 'rented'].map((s) => (
                  <button key={s || 'all'} onClick={() => updateParam('status', s)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 transition-colors ${status === s ? 'border-brand bg-brand text-white' : 'border-gray-200 text-gray-600 hover:border-brand/40'}`}>
                    {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                  </button>
                ))}
              </div>
            </div>
            {(category || district || minPrice || maxPrice || status) && (
              <button onClick={() => setSearchParams(search ? { search } : {})}
                className="w-full py-2 rounded-xl border-2 border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors">
                Clear Filters
              </button>
            )}
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{loading ? 'Loading...' : `${total} result${total !== 1 ? 's' : ''}`}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-brand'}`}><Grid3X3 size={16} /></button>
              <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-brand'}`}><List size={16} /></button>
            </div>
          </div>

          {loading ? <PageSpinner /> : listings.length === 0 ? (
            <EmptyState title="No listings found" description="Try adjusting your search filters." action={() => setSearchParams({})} actionLabel="Clear all filters" />
          ) : (
            <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5' : 'flex flex-col gap-4'}>
              {listings.map((listing) => view === 'grid' ? <ListingCard key={listing._id} listing={listing} /> : <ListCardRow key={listing._id} listing={listing} />)}
            </div>
          )}

          {!loading && pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => goPage(currentPage - 1)} disabled={currentPage === 1}
                className="p-2 rounded-xl border-2 border-gray-200 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand hover:text-brand transition-colors">
                <ChevronLeft size={18} />
              </button>
              {[...Array(pages)].map((_, i) => {
                const p = i + 1;
                const show = p === 1 || p === pages || Math.abs(p - currentPage) <= 1;
                const dots = (p === 2 && currentPage > 4) || (p === pages - 1 && currentPage < pages - 3);
                if (dots) return <span key={p} className="text-gray-400">…</span>;
                if (!show) return null;
                return (
                  <button key={p} onClick={() => goPage(p)}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold border-2 transition-colors ${p === currentPage ? 'bg-brand text-white border-brand' : 'border-gray-200 text-gray-600 hover:border-brand'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => goPage(currentPage + 1)} disabled={currentPage === pages}
                className="p-2 rounded-xl border-2 border-gray-200 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand hover:text-brand transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
