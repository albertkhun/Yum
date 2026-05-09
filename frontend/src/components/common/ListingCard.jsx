import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, IndianRupee, Star } from 'lucide-react';
import { getCardImageUrl, getThumbImageUrl, truncate, getCategoryColor } from '../../utils/helpers';

//OPTIMIZATION: memo() wraps the entire card component.

// Fractional star row — memoized separately since it's purely presentational
const StarRow = memo(function StarRow({ avg, count }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const fill = Math.min(1, Math.max(0, (avg ?? 0) - (n - 1)));
          const pct  = Math.round(fill * 100);
          return (
            <span key={n} className="relative inline-block w-3.5 h-3.5">
              <Star size={14} className="absolute inset-0 text-gray-300 fill-gray-300" />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
                <Star size={14} className="text-amber-400 fill-amber-400" />
              </span>
            </span>
          );
        })}
      </div>
      {avg ? (
        <span className="text-[11px] font-semibold text-gray-600 leading-none">
          {avg}
          {count > 0 && <span className="font-normal text-gray-400"> ({count})</span>}
        </span>
      ) : (
        <span className="text-[11px] text-gray-400 leading-none">No reviews</span>
      )}
    </div>
  );
});

const PLACEHOLDER = (category) =>
  `https://placehold.co/600x450/f97316/white?text=${encodeURIComponent(category)}`;

const ListingCard = memo(function ListingCard({ listing }) {
  const {
    _id, title, category, price, location,
    images, status, facilities, avgRating,
    reviewCount, vrMediaUrl,
  } = listing;

  const imgSrc = images?.[0]
    ? getCardImageUrl(images[0])   // Cloudinary: 600×450 WebP, q_auto
    : PLACEHOLDER(category);

  return (
    <Link to={`/listings/${_id}`} className="card group block">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={imgSrc}
          alt={title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = PLACEHOLDER(category); }}
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className={`badge text-xs font-semibold ${status === 'available' ? 'badge-green' : 'badge-red'}`}>
            {status === 'available' ? '● Available' : '● Rented'}
          </span>
          {vrMediaUrl && (
            <span className="badge text-xs font-semibold"
              style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', backdropFilter: 'blur(4px)' }}>
              🥽 VR Tour
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className={`badge text-xs ${getCategoryColor(category)}`}>{category}</span>
        </div>
        {images?.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            +{images.length - 1} photos
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display font-semibold text-gray-900 text-sm sm:text-base leading-snug mb-1.5 group-hover:text-brand transition-colors">
          {truncate(title, 55)}
        </h3>

        {avgRating && (
          <div className="mb-2">
            <StarRow avg={avgRating} count={reviewCount ?? 0} />
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 mb-3">
          <MapPin size={13} className="text-brand shrink-0" />
          <span className="truncate">{location?.locality}, {location?.district}</span>
        </div>

        {facilities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {facilities.slice(0, 3).map((f) => (
              <span key={f} className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {f}
              </span>
            ))}
            {facilities.length > 3 && (
              <span className="text-[10px] sm:text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                +{facilities.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-baseline gap-0.5">
            <IndianRupee size={14} className="text-brand" />
            <span className="font-display font-bold text-brand text-base sm:text-lg">
              {Number(price?.amount).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-gray-400 ml-1">{price?.period}</span>
          </div>
          <span className="text-xs text-brand font-semibold group-hover:underline">View →</span>
        </div>
      </div>
    </Link>
  );
});

export default ListingCard;