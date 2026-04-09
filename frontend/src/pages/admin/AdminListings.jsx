import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Trash2, Eye, Clock } from 'lucide-react';
import { adminAPI }    from '../../services/api';
import { PageSpinner } from '../../components/common/Spinner';
import EmptyState      from '../../components/common/EmptyState';
import { getImageUrl, formatPrice, timeAgo, getCategoryColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function AdminListings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(null);
  const [total,    setTotal]    = useState(0);

  const filter = searchParams.get('approved') || '';

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filter !== '') params.approved = filter;
    adminAPI.getAllListings(params)
      .then(({ data }) => { setListings(data.listings || []); setTotal(data.total || 0); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    setActing(id + '_approve');
    try { await adminAPI.approveListing(id); toast.success('Listing approved ✅'); load(); }
    catch { toast.error('Failed'); }
    finally { setActing(null); }
  };

  const reject = async (id) => {
    setActing(id + '_reject');
    try { await adminAPI.rejectListing(id); toast.success('Listing rejected'); load(); }
    catch { toast.error('Failed'); }
    finally { setActing(null); }
  };

  const remove = async (id) => {
    if (!window.confirm('Permanently delete this listing?')) return;
    setActing(id + '_delete');
    try { await adminAPI.deleteListing(id); toast.success('Listing deleted'); setListings((p) => p.filter((l) => l._id !== id)); }
    catch { toast.error('Failed'); }
    finally { setActing(null); }
  };

  const tabs = [{ label: 'All', val: '' }, { label: 'Pending', val: 'false' }, { label: 'Approved', val: 'true' }];

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Manage Listings</h1>
          <p className="text-gray-500 text-sm">{total} total</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
        {tabs.map(({ label, val }) => (
          <button key={val} onClick={() => { const p = new URLSearchParams(); if (val) p.set('approved', val); setSearchParams(p); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filter === val ? 'bg-brand text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : listings.length === 0 ? (
        <EmptyState title="No listings found" description="Try a different filter." />
      ) : (
        <div className="space-y-4">
          {listings.map((l) => (
            <div key={l._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-36 lg:w-44 shrink-0 aspect-video sm:aspect-auto bg-gray-100">
                  <img
                    src={l.images?.[0] ? getImageUrl(l.images[0]) : `https://placehold.co/200x150/f97316/white?text=${l.category}`}
                    alt={l.title} className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = `https://placehold.co/200x150/f97316/white?text=${l.category}`; }}
                  />
                </div>
                <div className="flex-1 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-gray-900 text-sm sm:text-base leading-snug truncate">{l.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        📍 {l.location?.locality}, {l.location?.district} · by {l.createdBy?.name} · {timeAgo(l.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <span className={`badge text-xs ${getCategoryColor(l.category)}`}>{l.category}</span>
                      <span className={`badge text-xs ${l.approved ? 'badge-green' : 'badge-orange'}`}>
                        {l.approved ? <><CheckCircle2 size={10} /> Approved</> : <><Clock size={10} /> Pending</>}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-brand mb-3">{formatPrice(l.price?.amount, l.price?.period)}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/listings/${l._id}`} target="_blank"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-600 hover:border-gray-400 text-xs font-semibold transition-colors">
                      <Eye size={13} />View
                    </Link>
                    {!l.approved ? (
                      <button onClick={() => approve(l._id)} disabled={acting === l._id + '_approve'}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-green-200 text-green-600 hover:bg-green-50 text-xs font-semibold transition-colors disabled:opacity-50">
                        {acting === l._id + '_approve' ? <div className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 size={13} />}
                        Approve
                      </button>
                    ) : (
                      <button onClick={() => reject(l._id)} disabled={acting === l._id + '_reject'}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-yellow-200 text-yellow-600 hover:bg-yellow-50 text-xs font-semibold transition-colors disabled:opacity-50">
                        {acting === l._id + '_reject' ? <div className="w-3 h-3 border border-yellow-500 border-t-transparent rounded-full animate-spin" /> : <XCircle size={13} />}
                        Unapprove
                      </button>
                    )}
                    <button onClick={() => remove(l._id)} disabled={acting === l._id + '_delete'}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-50">
                      {acting === l._id + '_delete' ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={13} />}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
