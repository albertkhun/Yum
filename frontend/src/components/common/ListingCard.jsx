import { Link } from 'react-router-dom';
import { MapPin, IndianRupee } from 'lucide-react';
import { formatPrice, getImageUrl, truncate, getCategoryColor } from '../../utils/helpers';

export default function ListingCard({ listing }) {
  const { _id, title, category, price, location, images, status, facilities } = listing;
  return (
    <Link to={`/listings/${_id}`} className="card group block">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={images?.[0] ? getImageUrl(images[0]) : `https://placehold.co/400x300/f97316/white?text=${encodeURIComponent(category)}`}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = `https://placehold.co/400x300/f97316/white?text=${encodeURIComponent(category)}`; }}
        />
        <div className="absolute top-3 left-3">
          <span className={`badge text-xs font-semibold ${status === 'available' ? 'badge-green' : 'badge-red'}`}>
            {status === 'available' ? '● Available' : '● Rented'}
          </span>
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
        <h3 className="font-display font-semibold text-gray-900 text-sm sm:text-base leading-snug mb-2 group-hover:text-brand transition-colors">
          {truncate(title, 55)}
        </h3>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 mb-3">
          <MapPin size={13} className="text-brand shrink-0" />
          <span className="truncate">{location?.locality}, {location?.district}</span>
        </div>
        {facilities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {facilities.slice(0, 3).map((f) => (
              <span key={f} className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
            ))}
            {facilities.length > 3 && (
              <span className="text-[10px] sm:text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{facilities.length - 3} more</span>
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
}
