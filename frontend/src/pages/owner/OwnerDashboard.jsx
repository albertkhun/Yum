import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Edit2, Trash2, ToggleLeft, ToggleRight, Clock, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { listingAPI }  from '../../services/api';
import { useAuth }     from '../../context/AuthContext';
import { PageSpinner } from '../../components/common/Spinner';
import EmptyState      from '../../components/common/EmptyState';
import { formatPrice, getImageUrl, getCategoryColor, timeAgo } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function OwnerDashboard() {
  const { user }  = useAuth();
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    listingAPI.getMyListings()
      .then(({ data }) => setListings(data.listings || []))
      .catch(() => toast.error('Failed to load listings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await listingAPI.delete(id);
      toast.success('Listing deleted');
      setListings((prev) => prev.filter((l) => l._id !== id));
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await listingAPI.toggleStatus(id);
      setListings((prev) => prev.map((l) => l._id === id ? { ...l, status: data.listing.status } : l));
      toast.success(`Marked as ${data.listing.status}`);
    } catch { toast.error('Failed to update status'); }
  };

  const stats = {
    total:     listings.length,
    approved:  listings.filter((l) => l.approved).length,
    pending:   listings.filter((l) => !l.approved).length,
    available: listings.filter((l) => l.status === 'available').length,
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="page-wrapper">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard size={20} className="text-brand" />
            <h1 className="section-title">My Listings</h1>
          </div>
          <p className="text-gray-500 text-sm">Welcome back, {user?.name}</p>
        </div>
        <Link to="/owner/create" className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <PlusCircle size={18} />New Listing
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[
          { label: 'Total',     value: stats.total,     color: 'text-blue-600' },
          { label: 'Approved',  value: stats.approved,  color: 'text-green-600' },
          { label: 'Pending',   value: stats.pending,   color: 'text-yellow-600' },
          { label: 'Available', value: stats.available, color: 'text-orange-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className={`font-display font-bold text-2xl sm:text-3xl ${color}`}>{value}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {listings.length === 0 ? (
        <EmptyState title="No listings yet" description="Create your first listing to start receiving enquiries." actionTo="/owner/create" actionLabel="Post First Listing" />
      ) : (
        <div className="space-y-4">
          {listings.map((l) => (
            <div key={l._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-44 lg:w-52 shrink-0 aspect-video sm:aspect-auto bg-gray-100 overflow-hidden">
                  <img
                    src={l.images?.[0] ? getImageUrl(l.images[0]) : `https://placehold.co/300x200/f97316/white?text=${l.category}`}
                    alt={l.title} className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = `https://placehold.co/300x200/f97316/white?text=${l.category}`; }}
                  />
                </div>
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-start gap-2 mb-1.5">
                      <h3 className="font-display font-bold text-gray-900 text-base leading-snug flex-1 min-w-0">{l.title}</h3>
                      <span className={`badge text-xs shrink-0 ${getCategoryColor(l.category)}`}>{l.category}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-3">📍 {l.location?.locality}, {l.location?.district}</p>
                    <div className="flex flex-wrap gap-2">
                      {l.approved
                        ? <span className="badge badge-green text-xs"><CheckCircle2 size={11} /> Approved</span>
                        : <span className="badge badge-orange text-xs"><Clock size={11} /> Pending Review</span>}
                      <span className={`badge text-xs ${l.status === 'available' ? 'badge-green' : 'badge-red'}`}>{l.status}</span>
                      <span className="text-xs text-gray-400">{timeAgo(l.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
                    <span className="font-display font-bold text-brand text-lg">{formatPrice(l.price?.amount, l.price?.period)}</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => handleToggle(l._id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-colors ${l.status === 'available' ? 'border-green-200 text-green-600 hover:bg-green-50' : 'border-red-200 text-red-500 hover:bg-red-50'}`}>
                        {l.status === 'available' ? <><ToggleRight size={14} />Available</> : <><ToggleLeft size={14} />Rented</>}
                      </button>
                      <Link to={`/owner/edit/${l._id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition-colors">
                        <Edit2 size={13} />Edit
                      </Link>
                      <button onClick={() => handleDelete(l._id)} disabled={deleting === l._id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-50">
                        {deleting === l._id
                          ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <Trash2 size={13} />}
                        Delete
                      </button>
                    </div>
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
