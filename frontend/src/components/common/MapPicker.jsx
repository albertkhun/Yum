import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v12';

const DEFAULT_LAT  = 24.817;
const DEFAULT_LNG  = 93.9368;
const DEFAULT_ZOOM = 13;

export default function MapPicker({ lat, lng, onChange, readOnly = false }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);
  const [loaded,  setLoaded]  = useState(false);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

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
    script.onload  = () => { setLoaded(true);  setLoading(false); };
    script.onerror = () => { setError(true);   setLoading(false); };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current || mapRef.current) return;
    const mapboxgl = window.mapboxgl;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const initLat = lat ?? DEFAULT_LAT;
    const initLng = lng ?? DEFAULT_LNG;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style:     MAPBOX_STYLE,
      center:    [initLng, initLat],
      zoom:      DEFAULT_ZOOM,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    const MARKER_SVG = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 34"><path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 20 14 20s14-10.67 14-20C28 6.27 21.73 0 14 0z" fill="#e85d04"/><circle cx="14" cy="14" r="6" fill="white"/></svg>`
    );

    const makeEl = () => {
      const el = document.createElement('div');
      el.style.cssText = `width:28px;height:34px;cursor:${readOnly ? 'default' : 'grab'};background:url("data:image/svg+xml,${MARKER_SVG}") no-repeat center/contain;`;
      return el;
    };

    if (lat != null && lng != null) {
      markerRef.current = new mapboxgl.Marker({ element: makeEl(), draggable: !readOnly })
        .setLngLat([lng, lat]).addTo(map);
      if (!readOnly) {
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLngLat();
          onChange?.({ lat: parseFloat(pos.lat.toFixed(6)), lng: parseFloat(pos.lng.toFixed(6)) });
        });
      }
    }

    if (!readOnly) {
      map.on('click', (e) => {
        const { lng: cLng, lat: cLat } = e.lngLat;
        const rounded = { lat: parseFloat(cLat.toFixed(6)), lng: parseFloat(cLng.toFixed(6)) };
        if (markerRef.current) {
          markerRef.current.setLngLat([rounded.lng, rounded.lat]);
        } else {
          markerRef.current = new mapboxgl.Marker({ element: makeEl(), draggable: true })
            .setLngLat([rounded.lng, rounded.lat]).addTo(map);
          markerRef.current.on('dragend', () => {
            const pos = markerRef.current.getLngLat();
            onChange?.({ lat: parseFloat(pos.lat.toFixed(6)), lng: parseFloat(pos.lng.toFixed(6)) });
          });
        }
        onChange?.(rounded);
      });
      map.getCanvas().style.cursor = 'crosshair';
    }

    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  }, [loaded]);

  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    const mapboxgl = window.mapboxgl;
    const MARKER_SVG = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 34"><path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 20 14 20s14-10.67 14-20C28 6.27 21.73 0 14 0z" fill="#e85d04"/><circle cx="14" cy="14" r="6" fill="white"/></svg>`
    );
    if (lat != null && lng != null) {
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        const el = document.createElement('div');
        el.style.cssText = `width:28px;height:34px;background:url("data:image/svg+xml,${MARKER_SVG}") no-repeat center/contain;`;
        markerRef.current = new mapboxgl.Marker({ element: el, draggable: !readOnly })
          .setLngLat([lng, lat]).addTo(mapRef.current);
      }
      mapRef.current.flyTo({ center: [lng, lat], zoom: mapRef.current.getZoom() });
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
        mapRef.current?.flyTo({ center: [pos.lng, pos.lat], zoom: 16 });
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
      <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 focus-within:border-brand transition-colors"
           style={{ height: readOnly ? '280px' : '320px' }}>
        {loading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={containerRef} className="w-full h-full z-0" />
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