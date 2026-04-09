import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { getImageUrl } from '../../utils/helpers';

export default function ImageCarousel({ images = [], title = '' }) {
  const [current,  setCurrent]  = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images.length) {
    return (
      <div className="aspect-video bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-sm">
        No images available
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden bg-gray-100 group">
        <div className="aspect-video sm:aspect-[16/9] lg:aspect-[2/1]">
          <img src={getImageUrl(images[current])} alt={`${title} - photo ${current + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = 'https://placehold.co/800x450/f97316/white?text=Image'; }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <button onClick={() => setLightbox(true)}
          className="absolute top-3 right-3 bg-black/40 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={16} />
        </button>
        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110">
              <ChevronRight size={18} />
            </button>
          </>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
            {current + 1} / {images.length}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${i === current ? 'border-brand shadow-md scale-105' : 'border-transparent opacity-60 hover:opacity-90'}`}>
              <img src={getImageUrl(img)} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors">
            <X size={20} />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 bg-white/20 text-white rounded-full p-3 hover:bg-white/30 transition-colors">
                <ChevronLeft size={22} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 bg-white/20 text-white rounded-full p-3 hover:bg-white/30 transition-colors">
                <ChevronRight size={22} />
              </button>
            </>
          )}
          <img src={getImageUrl(images[current])} alt={title} className="max-h-[85vh] max-w-full object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-4 text-white/60 text-sm">{current + 1} / {images.length}</div>
        </div>
      )}
    </>
  );
}
