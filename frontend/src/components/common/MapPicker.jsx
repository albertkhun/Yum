import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';

// ── Leaflet loaded from CDN via useEffect (no npm install needed) ──
// Default center: Imphal, Manipur
const DEFAULT_LAT = 24.817;
const DEFAULT_LNG = 93.9368;
const DEFAULT_ZOOM = 13;

export default function MapPicker({ lat, lng, onChange, readOnly = false }) {
  const mapRef      = useRef(null);   // leaflet map instance
  const markerRef   = useRef(null);   // leaflet marker instance
  const containerRef = useRef(null);  // DOM div
  const [loaded,  setLoaded]  = useState(false);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  // Inject Leaflet CSS + JS once
  useEffect(() => {
    if (document.getElementById('leaflet-css')) { setLoaded(true); setLoading(false); return; }

    const link = document.createElement('link');
    link.id   = 'leaflet-css';
    link.rel  = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => { setLoaded(true); setLoading(false); };
    script.onerror = () => { setError(true); setLoading(false); };
    document.head.appendChild(script);
  }, []);

  // Init map once Leaflet is loaded
  useEffect(() => {
  if (!loaded || !containerRef.current || mapRef.current) return;

  if (!window.L) return; // ✅ safety
    // ✅ FIX: prevent undefined crash

    const L = window.L;
    const initLat = lat || DEFAULT_LAT;
    const initLng = lng || DEFAULT_LNG;

    const map = L.map(containerRef.current, { zoomControl: true }).setView([initLat, initLng], DEFAULT_ZOOM);
    mapRef.current = map;

    // OpenStreetMap tiles — completely free, no key needed
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Custom orange marker icon
    const icon = L.divIcon({
      html: `<div style="background:#e85d04;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      className: '',
    });

    // Place marker if coords exist
    if (lat != null && lng != null) {
      markerRef.current = L.marker([lat, lng], { icon, draggable: !readOnly }).addTo(map);
      if (!readOnly) {
        markerRef.current.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          onChange?.({ lat: parseFloat(pos.lat.toFixed(6)), lng: parseFloat(pos.lng.toFixed(6)) });
        });
      }
    }

    // Click to place/move marker (owner mode)
    if (!readOnly) {
      map.on('click', (e) => {
        const { lat: cLat, lng: cLng } = e.latlng;
        const rounded = { lat: parseFloat(cLat.toFixed(6)), lng: parseFloat(cLng.toFixed(6)) };

        if (markerRef.current) {
          markerRef.current.setLatLng([rounded.lat, rounded.lng]);
        } else {
          markerRef.current = L.marker([rounded.lat, rounded.lng], { icon, draggable: true }).addTo(map);
          markerRef.current.on('dragend', (ev) => {
            const pos = ev.target.getLatLng();
            onChange?.({ lat: parseFloat(pos.lat.toFixed(6)), lng: parseFloat(pos.lng.toFixed(6)) });
          });
        }
        onChange?.(rounded);
      });
    }

    // Fix map size after render
    setTimeout(() => map.invalidateSize(), 100);

    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  }, [loaded]);

  // Sync external lat/lng changes (e.g., clear)
  useEffect(() => {
    if (!mapRef.current) return;
    const L = window.L;
    if (lat && lng) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const icon = L.divIcon({
          html: `<div style="background:#e85d04;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
          iconSize: [28, 28], iconAnchor: [14, 28], className: '',
        });
        markerRef.current = L.marker([lat, lng], { icon, draggable: !readOnly }).addTo(mapRef.current);
      }
      mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [lat, lng]);

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: parseFloat(coords.latitude.toFixed(6)), lng: parseFloat(coords.longitude.toFixed(6)) };
        mapRef.current?.setView([pos.lat, pos.lng], 16);
        onChange?.(pos);
      },
      () => {},
      { enableHighAccuracy: true }
    );
  };

  if (error) return (
    <div className="h-48 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-sm">
      Map unavailable — check your internet connection
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Map container */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 focus-within:border-brand transition-colors"
           style={{ height: readOnly ? '280px' : '320px' }}>
        {loading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={containerRef} className="w-full h-full z-0" />

        {/* Locate me button (owner mode) */}
        {!readOnly && loaded && (
          <button type="button" onClick={locateMe}
            className="absolute bottom-3 right-3 z-[1000] bg-white text-brand
                       border-2 border-brand/30 rounded-xl px-3 py-2
                       flex items-center gap-1.5 text-xs font-semibold
                       hover:bg-orange-50 transition-colors shadow-md">
            <Navigation size={14} />Use My Location
          </button>
        )}
      </div>

      {/* Coordinate display + clear */}
      {!readOnly && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin size={13} className="text-brand shrink-0" />
            {lat && lng
              ? <span className="font-mono">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
              : <span className="italic">Click on the map to pin your property location</span>}
          </div>
          {lat && lng && (
            <button type="button" onClick={() => onChange?.(null)}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors">
              <X size={12} />Clear
            </button>
          )}
        </div>
      )}

      {/* Read-only: open in Google Maps */}
      {readOnly && lat && lng && (
        <a href={`https://www.google.com/maps?q=${lat},${lng}`}
           target="_blank" rel="noopener noreferrer"
           className="flex items-center gap-1.5 text-xs text-brand font-semibold hover:underline">
          <MapPin size={13} />Open in Google Maps →
        </a>
      )}
    </div>
  );
}
