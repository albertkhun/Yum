import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  MapPin, Phone, IndianRupee, CheckCircle2,
  ArrowLeft, Share2, Flag, Layers, ExternalLink,
} from 'lucide-react';
import ImageCarousel   from '../../components/common/ImageCarousel';
import VRViewer        from '../../components/common/VRViewer';
import ReviewSection   from '../../components/common/ReviewSection';
import { PageSpinner } from '../../components/common/Spinner';
import { listingAPI }  from '../../services/api';
import { useAuth }     from '../../context/AuthContext';
import { timeAgo, getCategoryColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MAP_STYLES = [
  { id: 'streets',   label: 'Streets',   url: 'mapbox://styles/mapbox/navigation-day-v1' },
  { id: 'satellite', label: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { id: 'outdoors',  label: 'Outdoors',  url: 'mapbox://styles/mapbox/outdoors-v12' },
  { id: 'dark',      label: 'Dark',      url: 'mapbox://styles/mapbox/dark-v11' },
];

const CATEGORY_SVG_PATH = {
  Rent:      'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  Apartment: 'M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5v-2h2v2zm4 4H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2z',
  PG:        'M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z',
  Hostel:    'M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z',
  Lodge:     'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5z',
  Tolet:     'M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
  Other:     'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
};

// Google Maps logo
const GoogleMapsIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
    <path fill="#ec0a0a" d="M32 6C20.95 6 12 14.95 12 26c0 14.25 20 32 20 32S52 40.25 52 26C52 14.95 43.05 6 32 6z"/>
    <path fill="#300beb" d="M32 6v52S52 40.25 52 26C52 14.95 43.05 6 32 6z"/>
    <circle fill="#eef3ee" cx="32" cy="26" r="10"/>
    <circle fill="#bbc1cb" cx="32" cy="26" r="6"/>
  </svg>
);
 
// Mapbox zoom where ~200m radius 
const PRIVACY_RADIUS_M = 150;

function getZoomForRadius(radiusM, latitudeDeg, mapHeightPx) {
  // metres per pixel at zoom 0 at given latitude
  const metersPerPxZ0 = (156543.03392 * Math.cos((latitudeDeg * Math.PI) / 180));
  // radius to be ~40% of half the map height
  const targetPx = (mapHeightPx * 0.4);
  const metersPerPx = radiusM / targetPx;
  return Math.log2(metersPerPxZ0 / metersPerPx);
}

//  map panel 
function MapPanel({ lat, lng, category }) {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const [loaded,      setLoaded]     = useState(false);
  const [loading,     setLoading]    = useState(true);
  const [activeStyle, setActiveStyle] = useState('streets');
  const [styleOpen,   setStyleOpen]  = useState(false);

  const svgPath = CATEGORY_SVG_PATH[category] || CATEGORY_SVG_PATH.Other;

  // Load Mapbox SDK
  useEffect(() => {
    if (window.mapboxgl) { setLoaded(true); setLoading(false); return; }
    if (!document.getElementById('mapbox-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-css'; link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js';
    script.onload  = () => { setLoaded(true); setLoading(false); };
    script.onerror = () => setLoading(false);
    document.head.appendChild(script);
  }, []);

  // Init map
  useEffect(() => {
    if (!loaded || !containerRef.current || mapRef.current) return;
    const mapboxgl = window.mapboxgl;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const mapHeightPx = containerRef.current.clientHeight || 480;
    const autoZoom    = getZoomForRadius(PRIVACY_RADIUS_M, lat, mapHeightPx);

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style:     MAP_STYLES[0].url,
      center:    [lng, lat],
      zoom:      autoZoom,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    // Black circle + white SVG icon 
    const el = document.createElement('div');
    el.innerHTML = `
      <div style="
        width:44px;height:44px;border-radius:50%;
        background:#222;border:3px solid white;
        box-shadow:0 4px 18px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
        cursor:default;
      ">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
          <path d="${svgPath}"/>
        </svg>
      </div>
    `;
    new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([lng, lat])
      .addTo(map);

    // Privacy blur circle
    map.on('load', () => addPrivacyLayers(map, lng, lat));

    return () => { map.remove(); mapRef.current = null; };
  }, [loaded]);

  const addPrivacyLayers = (map, lngVal, latVal) => {
    if (!map.getSource('privacy-circle')) {
      map.addSource('privacy-circle', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Point', coordinates: [lngVal, latVal] } },
      });
    }
    if (!map.getLayer('privacy-fill')) {
      map.addLayer({
        id: 'privacy-fill', type: 'circle', source: 'privacy-circle',
        paint: {
          'circle-radius':  { stops: [[10, 60], [13, 130], [14, 180], [16, 320]] },
          'circle-color':   '#9ca3af',
          'circle-opacity': 0.28,
          'circle-blur':    0.6,
        },
      });
    }
    if (!map.getLayer('privacy-ring')) {
      map.addLayer({
        id: 'privacy-ring', type: 'circle', source: 'privacy-circle',
        paint: {
          'circle-radius':         { stops: [[10, 60], [13, 130], [14, 180], [16, 320]] },
          'circle-color':          'transparent',
          'circle-stroke-width':   1.5,
          'circle-stroke-color':   '#6b7280',
          'circle-stroke-opacity': 0.35,
        },
      });
    }
  };

  const switchStyle = (styleId) => {
    if (!mapRef.current) return;
    const styleObj = MAP_STYLES.find(s => s.id === styleId);
    if (!styleObj) return;
    setActiveStyle(styleId);
    setStyleOpen(false);
    mapRef.current.setStyle(styleObj.url);
    mapRef.current.once('style.load', () => {
      if (mapRef.current) addPrivacyLayers(mapRef.current, lng, lat);
    });
  };

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-4 border-gray-800 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />

      {/* Style switcher */}
      {loaded && (
        <div className="absolute top-3 left-3 z-10">
          <div className="relative">
            <button
              onClick={() => setStyleOpen(o => !o)}
              className="flex items-center gap-2 bg-white text-gray-800 text-xs font-semibold
                         px-3 py-2 rounded-xl shadow-md border border-gray-200 hover:border-gray-400 transition-colors"
            >
              <Layers size={13} />
              {MAP_STYLES.find(s => s.id === activeStyle)?.label}
              <svg width="10" height="6" viewBox="0 0 10 6"
                   className={`transition-transform ${styleOpen ? 'rotate-180' : ''}`}>
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </button>
            {styleOpen && (
              <div className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[136px]">
                {MAP_STYLES.map(s => (
                  <button
  key={s.id}
  onClick={() => switchStyle(s.id)}
  className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center gap-2.5 transition-colors
    ${
      activeStyle === s.id
        ? 'bg-gray-100 font-semibold text-gray-900'
        : 'text-gray-600 hover:bg-gray-50'
    }`}
>
  {s.label}

  {activeStyle === s.id && (
    <svg
      className="ml-auto"
      width="12"
      height="12"
      viewBox="0 0 12 12"
    >
      <path
        d="M2 6l3 3 5-5"
        stroke="#111"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )}
</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared icons ──────────────────────────────────────────────────────────
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const VRIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
    <path d="M20.5 7H3.5C2.67 7 2 7.67 2 8.5v7C2 16.33 2.67 17 3.5 17h4.62l1.5 2h4.76l1.5-2H20.5c.83 0 1.5-.67 1.5-1.5v-7C22 7.67 21.33 7 20.5 7zM9 13.5C9 14.88 7.88 16 6.5 16S4 14.88 4 13.5v-2C4 10.12 5.12 9 6.5 9S9 10.12 9 11.5v2zm9 0c0 1.38-1.12 2.5-2.5 2.5S13 14.88 13 13.5v-2C13 10.12 14.12 9 15.5 9S18 10.12 18 11.5v2z"/>
  </svg>
);

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ListingDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { user }     = useAuth();

  const [listing,   setListing]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [vrOpen,    setVrOpen]    = useState(false);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [id]);

  useEffect(() => {
    listingAPI.getById(id)
      .then(({ data }) => setListing(data.listing))
      .catch(() => navigate('/listings'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: listing.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  const requireAuth = (action) => {
    if (!user) {
      toast.error('Please login or sign up to continue.');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    action?.();
  };

  if (loading) return <PageSpinner />;
  if (!listing) return null;

  const {
    title, description, category, price,
    location: loc, images, facilities,
    contactNumber, whatsappNumber, vrMediaUrl,
    status, approved, createdBy, createdAt,
  } = listing;

  const isOwner   = user?.id === (createdBy?._id || createdBy);
  const hasCoords = loc?.coordinates?.lat && loc?.coordinates?.lng;
  const gmapsUrl  = hasCoords
    ? `https://www.google.com/maps?q=${loc.coordinates.lat},${loc.coordinates.lng}`
    : null;

  const whatsappHref = `https://wa.me/${(whatsappNumber || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hi, I'm interested in your listing: ${title}`
  )}`;

  // ── Get Directions button — always shown, login-gated ──
  const DirectionsBtn = () => {
  if (!gmapsUrl) return null;

  const baseClasses = `
    flex items-center justify-center gap-2.5 w-full
    py-3.5 rounded-xl font-semibold text-sm text-white transition-colors
  `;

  const baseStyle = { background: '#1A73E8' };

  const hoverHandlers = {
    onMouseEnter: e => (e.currentTarget.style.background = '#1558B0'),
    onMouseLeave: e => (e.currentTarget.style.background = '#1A73E8'),
  };

  if (user) {
    return (
      <a
        href={gmapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
        style={baseStyle}
        {...hoverHandlers}
      >
        <GoogleMapsIcon size={20} />
        Get Directions
        <ExternalLink size={14} className="opacity-70" />
      </a>
    );
  }

  return (
    <button
      onClick={() => requireAuth(null)}
      className={baseClasses}
      style={baseStyle}
      {...hoverHandlers}
    >
      <GoogleMapsIcon size={20} />
      Get Directions
      <ExternalLink size={14} className="opacity-70" />
    </button>
  );
};

  return (
    <div className="page-wrapper max-w-6xl mx-auto">

      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-brand text-sm font-medium mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to listings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <ImageCarousel images={images} title={title} />

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`badge text-xs ${getCategoryColor(category)}`}>{category}</span>
                  <span className={`badge text-xs ${status === 'available' ? 'badge-green' : 'badge-red'}`}>
                    {status === 'available' ? '● Available' : '● Rented'}
                  </span>
                  {approved && <span className="badge badge-blue text-xs"><CheckCircle2 size={11} /> Verified</span>}
                  {vrMediaUrl && (
                    <span className="badge text-xs" style={{ background: '#fff3e0', color: '#e65100' }}>🥽 VR Tour</span>
                  )}
                </div>
                <h1 className="font-display font-bold text-gray-900 text-xl sm:text-2xl lg:text-3xl leading-snug">
                  {title}
                </h1>
              </div>
              <button onClick={handleShare}
                className="p-2.5 rounded-xl border-2 border-gray-200 text-gray-500 hover:border-brand hover:text-brand transition-colors shrink-0">
                <Share2 size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
              <MapPin size={16} className="text-brand shrink-0" />
              <span>{loc?.locality}{loc?.landmark ? `, near ${loc.landmark}` : ''}, {loc?.district}</span>
            </div>

            <div className="flex items-baseline gap-1 pb-4 border-b border-gray-100">
              <IndianRupee size={20} className="text-brand" />
              <span className="font-display font-bold text-3xl text-brand">
                {Number(price?.amount).toLocaleString('en-IN')}
              </span>
              <span className="text-gray-400 text-sm ml-1">{price?.period}</span>
            </div>

            <div className="pt-4">
              <h2 className="font-display font-bold text-gray-900 text-lg mb-3">About this property</h2>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">{description}</p>
            </div>
          </div>

          {facilities?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <h2 className="font-display font-bold text-gray-900 text-lg mb-4">Facilities & Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {facilities.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 bg-orange-50 rounded-xl px-3 py-2.5">
                    <CheckCircle2 size={15} className="text-brand shrink-0" />
                    <span className="text-sm font-medium text-gray-700">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="font-display font-bold text-gray-900 text-lg mb-4">Location Details</h2>
            <div className="space-y-3">
              {[
                { label: 'District', value: loc?.district },
                { label: 'Locality', value: loc?.locality },
                { label: 'Landmark', value: loc?.landmark || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500 font-medium">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — sticky contact */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <h2 className="font-display font-bold text-gray-900 text-lg mb-4">Contact Owner</h2>

              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl mb-4 border border-orange-100">
                <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {createdBy?.name?.[0]?.toUpperCase() || 'O'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{createdBy?.name || 'Property Owner'}</p>
                  <p className="text-xs text-gray-500">Owner</p>
                </div>
              </div>

              <div className="space-y-3">

                {/* Phone */}
                {showPhone && user ? (
                  <a href={`tel:${contactNumber}`}
                    className="flex items-center justify-center gap-2.5 w-full bg-brand hover:bg-brand-dark
                               text-white font-semibold py-3.5 rounded-xl transition-colors text-sm">
                    <Phone size={20} />{contactNumber}
                  </a>
                ) : (
                  <button onClick={() => requireAuth(() => setShowPhone(true))}
                    className="btn-primary w-full flex items-center justify-center gap-2.5">
                    <Phone size={20} /> Contact Owner
                  </button>
                )}

                {/* WhatsApp */}
                {whatsappNumber && (
                  user ? (
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 w-full bg-[#25D366] hover:bg-[#1ebe5d]
                                 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm">
                      <WhatsAppIcon />Chat on WhatsApp
                    </a>
                  ) : (
                    <button onClick={() => requireAuth(null)}
                      className="flex items-center justify-center gap-2.5 w-full bg-[#25D366] hover:bg-[#1ebe5d]
                                 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm">
                      <WhatsAppIcon />Chat on WhatsApp
                    </button>
                  )
                )}

                {/* VR Tour */}
                {vrMediaUrl && (
                  user ? (
                    <button onClick={() => setVrOpen(true)}
                      className="flex items-center justify-center gap-2.5 w-full
                                 bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500
                                 text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-sm shadow-orange-200">
                      <VRIcon />View Virtual Tour — Free
                    </button>
                  ) : (
                    <button onClick={() => requireAuth(() => setVrOpen(true))}
                      className="flex items-center justify-center gap-2.5 w-full
                                 bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500
                                 text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-sm shadow-orange-200">
                      <VRIcon />View Virtual Tour — Free
                    </button>
                  )
                )}

                {/* Get Directions — always visible, login-gated */}
                {gmapsUrl && <DirectionsBtn />}
              </div>

              {!user && (
                <p className="text-xs text-gray-400 text-center mt-4">
                  <Link to="/login" state={{ from: location.pathname }} className="text-brand font-semibold hover:underline">Login</Link>
                  {' or '}
                  <Link to="/register" state={{ from: location.pathname }} className="text-brand font-semibold hover:underline">sign up</Link>
                  {' to contact the owner.'}
                </p>
              )}

              <p className="text-xs text-gray-400 text-center mt-4">Posted {timeAgo(createdAt)}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-2.5">
                <Flag size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">Safety Tip</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Always visit the property in person before making any payment. Never transfer money without seeing the property.
                  </p>
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Owner Actions</p>
                <Link to={`/owner/edit/${listing._id}`} className="btn-secondary w-full text-center text-sm block">
                  Edit Listing
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

    
      {hasCoords && (
        <div className="mt-10">
          <div className="mb-4">
            <h2 className="font-display font-bold text-gray-900 text-2xl">Where you'll be</h2>
            <p className="text-gray-500 text-sm mt-1">
              {loc?.locality}{loc?.landmark ? `, near ${loc.landmark}` : ''}, {loc?.district}
            </p>
          </div>

          <div className="w-full rounded-3xl overflow-hidden border border-gray-200 shadow-md" style={{ height: '480px' }}>
            <MapPanel
              lat={loc.coordinates.lat}
              lng={loc.coordinates.lng}
              category={category}
            />
          </div>

          <p className="text-sm text-gray-500 mt-3">
            Note: The exact location is shown, but directions can be accessed only to login user .
          </p>
        </div>
      )}

      {/* REVIEWS */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <ReviewSection listingId={listing._id} listingOwnerId={createdBy?._id || createdBy} />
      </div>

      {vrOpen && <VRViewer url={vrMediaUrl} title={title} onClose={() => setVrOpen(false)} />}
    </div>
  );
}