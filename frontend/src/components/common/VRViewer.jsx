import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { X, Maximize2, Minimize2, Move, Mouse, ZoomIn, Smartphone } from 'lucide-react';


function isVideo(url = '') {
  return /\.(mp4|mov|webm)/i.test(url) || url.includes('/video/upload/');
}

// ── 360° Video player ──────────────────────────────────────────────────
function Video360({ url }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const drag = useRef(null);

  const start = (cx, cy) => { drag.current = { cx: cx - rotation.y, cy: cy - rotation.x }; };
  const move  = (cx, cy) => {
    if (!drag.current) return;
    setRotation({
      y: cx - drag.current.cx,
      x: Math.max(-40, Math.min(40, cy - drag.current.cy)),
    });
  };
  const end = () => { drag.current = null; };

  return (
    <div
      className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ perspective: '900px' }}
      onMouseDown={(e) => start(e.clientX, e.clientY)}
      onMouseMove={(e) => move(e.clientX, e.clientY)}
      onMouseUp={end} onMouseLeave={end}
      onTouchStart={(e) => { const t = e.touches[0]; start(t.clientX, t.clientY); }}
      onTouchMove={(e)  => { const t = e.touches[0]; move(t.clientX, t.clientY); }}
      onTouchEnd={end}
    >
      <div style={{
        width: '100%', height: '100%',
        transform: `rotateX(${-rotation.x * 0.3}deg) rotateY(${rotation.y * 0.5}deg)`,
        transition: drag.current ? 'none' : 'transform 80ms ease',
      }}>
        {/*
          OPTIMIZATION: preload="metadata" instead of preload="auto"
        */}
        <video
          src={url}
          autoPlay loop muted playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />
      </div>
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none select-none">
        <Move size={12} /> Drag to look around
      </p>
    </div>
  );
}

// 360° Image viewer 
function Image360({ url }) {
  const containerRef = useRef(null);
  const viewerRef    = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!containerRef.current) return;
    let viewer;

    (async () => {
      try {
        //OPTIMIZATION: Dynamic import — PSV + Three.js are loaded ONLY now.
        const { Viewer } = await import('@photo-sphere-viewer/core');

        await import('@photo-sphere-viewer/core/index.css').catch(() => {
          if (!document.getElementById('psv-style')) {
            const style = document.createElement('style');
            style.id = 'psv-style';
            style.textContent = `.psv-container{position:relative;width:100%;height:100%;overflow:hidden;background:#000;font-family:sans-serif}.psv-canvas-container{position:absolute;top:0;left:0;width:100%;height:100%}`;
            document.head.appendChild(style);
          }
        });

        viewer = new Viewer({
          container:    containerRef.current,
          panorama:     url,
          navbar:       ['autorotate', 'zoom', 'fullscreen'],
          defaultYaw:   0,
          defaultPitch: 0,
        
          autorotateDelay: 2000,
          autorotateSpeed: '0.8rpm',
          loadingTxt: 'Loading 360° view…',
          touchmoveTwoFingers: false,
          mousewheelCtrlKey: false,
      
          sphereCorrection: { tilt: 0 },
        });

        viewerRef.current = viewer;
        viewer.addEventListener('ready', () => setStatus('ready'), { once: true });
        viewer.addEventListener('error', () => setStatus('error'), { once: true });
      } catch (err) {
        console.error('[VRViewer] PSV error:', err);
        setStatus('error');
      }
    })();

    return () => {
      try { viewerRef.current?.destroy(); } catch (_) {}
      viewerRef.current = null;
    };
  }, [url]);

  return (
    <div className="relative w-full h-full">
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-950">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/60 text-sm">Loading panorama…</p>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-950 px-6 text-center">
          <div className="text-4xl mb-4">🥽</div>
          <p className="text-white font-semibold mb-1">Could not load the panorama</p>
          <p className="text-white/50 text-sm mb-4">The image may still be processing on Cloudinary.</p>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="text-brand underline text-sm hover:text-brand-light transition-colors">
            Open image directly ↗
          </a>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

// Main modal 
export default function VRViewer({ url, title = 'Virtual Tour', onClose }) {
  const modalRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const video = isVideo(url);

  // ESC to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await modalRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (_) {}
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm shrink-0 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand/10 border border-brand/30 rounded-lg flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-brand">
              <path d="M20.5 7H3.5C2.67 7 2 7.67 2 8.5v7C2 16.33 2.67 17 3.5 17h4.62l1.5 2h4.76l1.5-2H20.5c.83 0 1.5-.67 1.5-1.5v-7C22 7.67 21.33 7 20.5 7zM9 13.5C9 14.88 7.88 16 6.5 16S4 14.88 4 13.5v-2C4 10.12 5.12 9 6.5 9S9 10.12 9 11.5v2zm9 0c0 1.38-1.12 2.5-2.5 2.5S13 14.88 13 13.5v-2C13 10.12 14.12 9 15.5 9S18 10.12 18 11.5v2z"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight line-clamp-1">{title}</p>
            <p className="text-white/40 text-xs">360° Virtual Tour</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleFullscreen} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
          <button onClick={onClose} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <X size={19} />
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div ref={modalRef} className="flex-1 min-h-0 relative">
        {video ? <Video360 url={url} /> : <Image360 url={url} />}
      </div>

      {/* Bottom hints */}
      <div className="bg-black/70 backdrop-blur-sm px-4 py-2 shrink-0 flex items-center justify-center gap-5 border-t border-white/5">
        {[
          [Mouse,      'Drag to look around'],
          [ZoomIn,     'Pinch / scroll to zoom'],
          [Smartphone, 'Gyroscope on mobile'],
        ].map(([Icon, label]) => (
          <span key={label} className="text-white/40 text-xs flex items-center gap-1.5">
            <Icon size={14} />{label}
          </span>
        ))}
      </div>
    </div>
  );
}