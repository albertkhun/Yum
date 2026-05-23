import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Home, Building2, Store, TreePine, MapPin, Shield, Zap, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchBar   from '../components/common/SearchBar';
import ListingCard from '../components/common/ListingCard';
import { listingAPI } from '../services/api';

const CATEGORIES = [
  { name: 'Rent',      icon: Home,      color: 'bg-blue-50 text-blue-600' },
  { name: 'Hostel',    icon: Building2, color: 'bg-purple-50 text-purple-600' },
  { name: 'PG',        icon: Home,      color: 'bg-green-50 text-green-600' },
];

const WHY = [
  { icon: Shield, title: 'Verified Listings', desc: 'Every listing is reviewed by our admin team before going live.', color: 'bg-green-50 text-green-600' },
  { icon: Zap,    title: 'Instant Contact',   desc: 'Connect directly with owners — no middlemen, no hidden fees.', color: 'bg-yellow-50 text-yellow-600' },
  { icon: Heart,  title: 'Local First',       desc: 'Built specifically for Manipur with all 16 districts covered.', color: 'bg-red-50 text-red-500' },
];

function ListingsCarousel({ listings, loading }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    const el = scrollRef.current;

    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 8);

    setCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - 8
    );
  };

  useEffect(() => {
    const el = scrollRef.current;

    if (!el) return;

    el.addEventListener("scroll", updateScrollState, {
      passive: true,
    });

    updateScrollState();

    return () => {
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [listings]);

  const scroll = (dir) => {
    const el = scrollRef.current;

    if (!el) return;

    const cardWidth =
      el.querySelector("[data-card]")?.offsetWidth || 300;

    el.scrollBy({
      left: dir * (cardWidth + 16),
      behavior: "smooth",
    });
  };

  // LOADING
  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden px-4 pb-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="
              shrink-0
              w-[82%]
              sm:w-[300px]
              md:w-[320px]
              lg:w-[280px]
              xl:w-[260px]
            "
          >
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm animate-pulse">
              <div className="aspect-[4/3] bg-gray-200" />

              <div className="p-4 space-y-3">
                <div className="h-5 w-3/4 rounded bg-gray-200" />

                <div className="h-4 w-1/2 rounded bg-gray-200" />

                <div className="h-4 w-1/3 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // EMPTY
  if (listings.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400">
        <Home size={40} className="mx-auto mb-3 opacity-40" />

        <p>No listings yet. Be the first to post!</p>
      </div>
    );
  }

  return (
    <div className="relative group/carousel">
      {/* LEFT BUTTON */}
      {canScrollLeft && (
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="
            hidden md:flex
            absolute left-2 top-1/2 z-20
            -translate-y-1/2
            h-10 w-10
            items-center justify-center
            rounded-full
            border border-gray-200
            bg-white/95
            text-gray-700
            shadow-lg
            backdrop-blur
            transition-all
            hover:scale-105
            hover:border-orange-400
            hover:text-orange-500
            opacity-0 group-hover/carousel:opacity-100
          "
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {/* CAROUSEL */}
      <div
        ref={scrollRef}
        className="
          flex
          gap-4
          overflow-x-auto
          scroll-smooth
          px-4
          pb-4
          hide-scrollbar
        "
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {listings.map((listing) => (
          <div
            key={listing._id}
            data-card
            className="
              shrink-0
              w-[82%]
              sm:w-[300px]
              md:w-[320px]
              lg:w-[280px]
              xl:w-[260px]
            "
            style={{
              scrollSnapAlign: "start",
              minWidth: "280px",
            }}
          >
            <div className="h-full overflow-hidden rounded-2xl">
              <ListingCard listing={listing} />
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT BUTTON */}
      {canScrollRight && (
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="
            hidden md:flex
            absolute right-2 top-1/2 z-20
            -translate-y-1/2
            h-10 w-10
            items-center justify-center
            rounded-full
            border border-gray-200
            bg-white/95
            text-gray-700
            shadow-lg
            backdrop-blur
            transition-all
            hover:scale-105
            hover:border-orange-400
            hover:text-orange-500
            opacity-0 group-hover/carousel:opacity-100
          "
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [stats,    setStats]    = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const [listingRes, statsRes] = await Promise.all([
          listingAPI.getAll({ limit: 6 }),
          listingAPI.getPublicStats(),
        ]);
        if (!controller.signal.aborted) {
          setFeatured(listingRes.data.listings || []);
          setStats(statsRes.data.stats);
        }
      } catch (err) {
        if (!controller.signal.aborted) console.error(err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px), radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`, backgroundSize: '60px 60px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full mb-5">
              <MapPin size={14} />Manipur's Rental Platform
            </div>
            <h1 className="font-display font-bold text-white text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tight mb-4">
              Find Your Perfect<span className="block text-amber-200">Stay in Manipur</span>
            </h1>
            <p className="text-orange-100 text-sm sm:text-base lg:text-lg max-w-lg mx-auto mb-8">
              Rent, PG, Hostel, Lodge and to-let across all 16 districts. Browse verified listings and connect directly with owners.
            </p>
            <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-2xl shadow-orange-900/20">
              <SearchBar />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 30C1200 60 900 0 720 20C540 40 240 0 0 30L0 60Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>
    {/* CATEGORIES */}
      <section className="hp-cats-section">
        <div className="hp-cats-strip">
          <Link to="/listings" className="hp-cat-pill hp-cat-pill-all">
            <span className="hp-cat-pill-label">All</span>
          </Link>

          {CATEGORIES.map(({ name, icon: Icon, dot }) => (
            <Link key={name} to={`/listings?category=${name}`} className="hp-cat-pill">
              <span className={`hp-cat-pill-dot ${dot}`}>
                <Icon size={13} />
              </span>
              <span className="hp-cat-pill-label">{name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-wrapper pt-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title">Latest Listings</h2>
            <p className="text-gray-500 text-sm mt-1">Recently added across Manipur</p>
          </div>
          <Link to="/listings" className="flex items-center gap-1.5 text-brand font-semibold text-sm hover:gap-3 transition-all duration-200">
            View all <ArrowRight size={16} />
          </Link>
        </div>

        <ListingsCarousel listings={featured} loading={loading} />

        <div className="text-center mt-8">
          <Link to="/listings" className="btn-secondary inline-flex items-center gap-2">Browse All Listings <ArrowRight size={17} /></Link>
        </div>
      </section>

      {/* Why YumVR */}
<section className="hp-why-section">
  <div className="page-wrapper" style={{ paddingTop: 0, paddingBottom: 0 }}>
    <p className="hp-why-eyebrow">Why YumVR?</p>

    <div className="hp-why-grid">
      {WHY.map(({ icon: Icon, title, desc, color }) => (
        <div key={title} className="hp-why-card">
          <div className={`hp-why-icon ${color}`}>
            <Icon size={16} />
          </div>

          <div className="hp-why-text">
            <h3 className="hp-why-title">{title}</h3>
            <p className="hp-why-desc">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

      <section className="page-wrapper">
        <div className="bg-gradient-to-r from-orange-500 to-amber-400 rounded-3xl p-8 sm:p-12 text-center text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 80% 20%, white 2px, transparent 2px)`, backgroundSize: '40px 40px' }} />
          <div className="relative">
            <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl mb-3">Own a Property?</h2>
            <p className="text-orange-100 mb-8 text-sm sm:text-base max-w-md mx-auto">List your property for free and reach thousands of potential tenants across Manipur.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="bg-white text-brand font-bold px-8 py-3.5 rounded-xl hover:bg-orange-50 transition-colors text-sm sm:text-base">Post for Free</Link>
              <Link to="/listings" className="border-2 border-white/60 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-sm sm:text-base">Browse First</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}