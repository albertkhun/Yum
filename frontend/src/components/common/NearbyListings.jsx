import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, IndianRupee, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { listingAPI } from '../../services/api';
import { getCardImageUrl, getCategoryColor } from '../../utils/helpers';

// ── Skeleton card ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="nearby-card shrink-0 animate-pulse" aria-hidden="true">
      <div className="nearby-img-wrap bg-gray-200 rounded-2xl" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded-full w-4/5" />
        <div className="h-3   bg-gray-200 rounded-full w-3/5" />
        <div className="h-3   bg-gray-200 rounded-full w-2/5 mt-1" />
        <div className="flex justify-between mt-2">
          <div className="h-4 bg-gray-200 rounded-full w-1/3" />
          <div className="h-4 bg-gray-200 rounded-full w-1/4" />
        </div>
      </div>
    </div>
  );
}

// ── Single nearby card ────────────────────────────────────────────────────
function NearbyCard({ listing }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError,  setImgError]  = useState(false);

  const {
    _id, title, category, price, location,
    images, approved, vrMediaUrl, distanceAway,
  } = listing;

  const imgSrc = images?.[0] && !imgError
    ? getCardImageUrl(images[0])
    : `https://placehold.co/600x450/f97316/white?text=${encodeURIComponent(category || 'Property')}`;

  return (
    <Link
      to={`/listings/${_id}`}
      className="nearby-card shrink-0 group block rounded-2xl overflow-hidden
                 bg-white border border-gray-100 shadow-sm
                 hover:shadow-md hover:-translate-y-0.5
                 transition-all duration-200"
      style={{ textDecoration: 'none' }}
    >
      {/* Image */}
      <div className="nearby-img-wrap relative overflow-hidden bg-gray-100">
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <img
          src={imgSrc}
          alt={title}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(true); }}
          className={`w-full h-full object-cover transition-opacity duration-300
                      group-hover:scale-105 transition-transform duration-500
                      ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Top-left badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {approved && (
            <span className="flex items-center gap-1 text-[10px] font-semibold
                             bg-white/90 backdrop-blur-sm text-green-700
                             px-2 py-0.5 rounded-full shadow-sm">
              <CheckCircle2 size={9} className="text-green-600" />
              Verified
            </span>
          )}
          {vrMediaUrl && (
            <span className="text-[10px] font-semibold
                             bg-white/90 backdrop-blur-sm text-orange-600
                             px-2 py-0.5 rounded-full shadow-sm">
              🥽 VR Tour
            </span>
          )}
        </div>

        {/* Category badge top-right */}
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                            bg-white/90 backdrop-blur-sm shadow-sm ${getCategoryColor(category)}`}>
            {category}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-1.5">
          {title}
        </h3>

        <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
          <MapPin size={11} className="text-brand shrink-0" />
          <span className="truncate">
            {location?.locality}, {location?.district}
          </span>
        </div>

        {distanceAway && (
            <div className="flex items-center gap-1 mb-1.5">
                <MapPin className="w-3 h-3 text-brand" />
                <p className="text-[11px] text-brand font-medium">
                {distanceAway}
                </p>
            </div>
)}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
          <div className="flex items-center gap-0.5 text-brand">
            <IndianRupee size={12} />
            <span className="text-sm font-bold text-gray-900">
              {Number(price?.amount).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-gray-400 ml-0.5">
              /{price?.period?.replace('per ', '')}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-brand group-hover:underline">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Main NearbyListings section ───────────────────────────────────────────
export default function NearbyListings({ listingId }) {
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);

  const scrollRef = useRef(null);

  // Fetch
  useEffect(() => {
    if (!listingId) return;
    setLoading(true);
    setListings([]);
    listingAPI.getNearby(listingId)
      .then(({ data }) => setListings(data.listings || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [listingId]);

  // Sync arrow states
  const syncArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    syncArrows();
    el.addEventListener('scroll', syncArrows, { passive: true });
    window.addEventListener('resize', syncArrows);
    return () => {
      el.removeEventListener('scroll', syncArrows);
      window.removeEventListener('resize', syncArrows);
    };
  }, [listings, syncArrows]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('.nearby-card');
    const gap  = 16;
    const step = card ? card.offsetWidth + gap : 260;
    el.scrollBy({ left: dir === 'right' ? step : -step, behavior: 'smooth' });
  };

  // Don't render if no data after load
  if (!loading && listings.length === 0) return null;

  return (
    <section className="mt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-bold text-gray-900 text-2xl leading-tight">
            More Places Like This
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Similar listings in the area
          </p>
        </div>

        {/* Desktop arrows */}
        {!loading && listings.length > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canLeft}
              aria-label="Scroll left"
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center
                          transition-all duration-150
                          ${canLeft
                            ? 'border-gray-300 text-gray-700 hover:border-brand hover:text-brand'
                            : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canRight}
              aria-label="Scroll right"
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center
                          transition-all duration-150
                          ${canRight
                            ? 'border-gray-300 text-gray-700 hover:border-brand hover:text-brand'
                            : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="nearby-scroll flex gap-4 overflow-x-auto
                   pb-3 -mx-1 px-1
                   snap-x snap-mandatory
                   scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : listings.map((l) => <NearbyCard key={l._id} listing={l} />)
        }
      </div>

      {/* Mobile swipe hint — only on first render with data */}
      {!loading && listings.length > 2 && (
        <p className="text-xs text-gray-400 text-center mt-2 sm:hidden">
          Swipe to see more
        </p>
      )}
    </section>
  );
}