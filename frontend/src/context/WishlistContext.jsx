import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistAPI } from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [ids,     setIds]     = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) { setIds([]); return; }
    try {
      setLoading(true);
      const { data } = await wishlistAPI.getAll();
      setIds((data.wishlist || []).map(String));
    } catch {
      setIds([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const isWishlisted = useCallback((listingId) => ids.includes(String(listingId)), [ids]);

  const toggle = useCallback(async (listingId) => {
    if (!user) return false;
    const id = String(listingId);
    const wasIn = ids.includes(id);

    setIds((prev) => wasIn ? prev.filter((x) => x !== id) : [...prev, id]);

    try {
      const { data } = wasIn
        ? await wishlistAPI.remove(listingId)
        : await wishlistAPI.add(listingId);
      setIds((data.wishlist || []).map(String));
    } catch {
      setIds((prev) => wasIn ? [...prev, id] : prev.filter((x) => x !== id));
    }
    return !wasIn;
  }, [user, ids]);

  return (
    <WishlistContext.Provider value={{ ids, loading, isWishlisted, toggle, refresh: fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
