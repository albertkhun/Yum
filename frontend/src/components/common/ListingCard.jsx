import { memo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, IndianRupee, Star, Eye, Heart } from 'lucide-react';
import { getCardImageUrl, truncate, getCategoryColor } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

const PLACEHOLDER = (category) =>
  `https://placehold.co/600x450/f97316/white?text=${encodeURIComponent(category || 'Property')}`;

const StarRow = memo(function StarRow({ avg, count }) {
  if (!avg) return null;
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const fill = Math.min(1, Math.max(0, (avg ?? 0) - (n - 1)));
          const pct  = Math.round(fill * 100);
          return (
            <span key={n} className="relative inline-block w-3 h-3">
              <Star size={12} className="absolute inset-0 text-gray-200 fill-gray-200" />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
                <Star size={12} className="text-amber-400 fill-amber-400" />
              </span>
            </span>
          );
        })}
      </div>
      <span className="text-[11px] font-semibold text-gray-700 tabular-nums leading-none">
        {avg}
        {count > 0 && <span className="font-normal text-gray-400 ml-0.5">({count})</span>}
      </span>
    </div>
  );
});

const ListingCard = memo(function ListingCard({ listing, variant = 'default' }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);

  const { user }                  = useAuth();
  const { isWishlisted, toggle }  = useWishlist();
  const navigate                  = useNavigate();

  const {
    _id, title, category, price, location,
    images, status, facilities, avgRating,
    reviewCount, vrMediaUrl,
  } = listing;

  const wishlisted = isWishlisted(_id);

  const handleWishlist = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 400);
    await toggle(_id);
  }, [user, _id, toggle, navigate]);

  const rawSrc = images?.[0] && !imgError ? getCardImageUrl(images[0]) : null;
  const imgSrc = rawSrc || PLACEHOLDER(category);

  const isCompact = variant === 'compact';

  return (
    <Link
      to={`/listings/${_id}`}
      className="lc-card group block"
      style={{ textDecoration: 'none' }}
    >
      <div className="lc-img-wrap">
        {!imgLoaded && (
          <div className="absolute inset-0 lc-skeleton" aria-hidden="true" />
        )}
        <img
          src={imgSrc}
          alt={title}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(true); }}
          className={`lc-img ${imgLoaded ? 'lc-img-loaded' : 'lc-img-hidden'}`}
        />

        <div className="lc-badges-tl">
          <span className={`lc-badge ${status === 'available' ? 'lc-badge-green' : 'lc-badge-red'}`}>
            <span className="lc-dot" />
            {status === 'available' ? 'Available' : 'Rented'}
          </span>
          {vrMediaUrl && (
            <span className="lc-badge lc-badge-dark">🥽 VR</span>
          )}
        </div>

        <div className="lc-badges-tr">
          <span className={`lc-badge ${getCategoryColor(category)}`}>{category}</span>
        </div>

        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`lc-heart ${wishlisted ? 'lc-heart-active' : ''} ${heartAnim ? 'lc-heart-pop' : ''}`}
        >
          <Heart size={15} className={wishlisted ? 'fill-current' : ''} />
        </button>

        {images?.length > 1 && imgLoaded && (
          <div className="lc-photo-count">
            <Eye size={10} />
            {images.length}
          </div>
        )}

        <div className="lc-img-overlay" aria-hidden="true" />
      </div>

      <div className="lc-body">
        <h3 className="lc-title">{truncate(title, isCompact ? 42 : 52)}</h3>

        <div className="lc-meta">
          <MapPin size={11} className="lc-pin-icon" />
          <span className="lc-location">{location?.locality}, {location?.district}</span>
        </div>

        {avgRating ? (
          <div className="lc-rating">
            <StarRow avg={avgRating} count={reviewCount ?? 0} />
          </div>
        ) : (
          <div className="lc-no-review">No reviews yet</div>
        )}

        {!isCompact && facilities?.length > 0 && (
          <div className="lc-facilities">
            {facilities.slice(0, 3).map((f) => (
              <span key={f} className="lc-facility-tag">{f}</span>
            ))}
            {facilities.length > 3 && (
              <span className="lc-facility-tag lc-facility-more">+{facilities.length - 3}</span>
            )}
          </div>
        )}

        <div className="lc-footer">
          <div className="lc-price">
            <IndianRupee size={13} className="lc-rupee-icon" />
            <span className="lc-amount">{Number(price?.amount).toLocaleString('en-IN')}</span>
            <span className="lc-period">{price?.period?.replace('per ', '/')}</span>
          </div>
          <span className="lc-cta">View →</span>
        </div>
      </div>
    </Link>
  );
});

export default ListingCard;