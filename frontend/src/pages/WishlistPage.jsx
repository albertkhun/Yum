import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import ListingCard from '../components/common/ListingCard';
import { wishlistAPI } from '../services/api';
import { PageSpinner } from '../components/common/Spinner';
import { useWishlist } from '../context/WishlistContext';

export default function WishlistPage() {
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const { ids, refresh } = useWishlist();

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const { data } = await wishlistAPI.getAll();
        if (!ctrl.signal.aborted) setListings(data.listings || []);
      } catch (e) {
        if (!ctrl.signal.aborted) setListings([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [ids]);

  if (loading) return <div className="page-wrapper"><PageSpinner /></div>;

  return (
    <div className="page-wrapper">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <Heart size={18} className="text-red-500 fill-red-500" />
          </div>
          <h1 className="section-title">My Wishlist</h1>
        </div>
        <p className="text-gray-500 text-sm ml-12">
          {listings.length > 0
            ? `${listings.length} saved listing${listings.length !== 1 ? 's' : ''}`
            : 'Listings you save will appear here'}
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <Heart size={32} className="text-red-300" />
          </div>
          <h2 className="font-display font-bold text-xl text-gray-900 mb-2">No saved listings yet</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            Tap the heart icon on any listing to save it here for later.
          </p>
          <Link to="/listings" className="btn-primary inline-flex items-center gap-2">
            Browse Listings <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
