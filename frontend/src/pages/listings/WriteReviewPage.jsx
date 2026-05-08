import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Star, Upload, X, CheckCircle2 } from 'lucide-react';
import { reviewAPI, listingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/helpers';
import { PageSpinner } from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const RATING_COLORS = ['', 'text-red-500', 'text-orange-400', 'text-yellow-500', 'text-lime-500', 'text-green-500'];
const RATING_BG     = ['', 'bg-red-50', 'bg-orange-50', 'bg-yellow-50', 'bg-lime-50', 'bg-green-50'];

function StarPicker({ value, onChange, size = 40 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            size={size}
            className={`transition-colors ${
              n <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function WriteReviewPage() {
  const { id }       = useParams();           // listing id
  const navigate     = useNavigate();
  const location     = useLocation();
  const { user }     = useAuth();

  const [listing,      setListing]      = useState(null);
  const [loadingPage,  setLoadingPage]  = useState(true);
  const [rating,       setRating]       = useState(0);
  const [comment,      setComment]      = useState('');
  const [stayDuration, setStayDuration] = useState('');
  const [previews,     setPreviews]     = useState([]);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
    }
  }, [user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    listingAPI.getById(id)
      .then(({ data }) => setListing(data.listing))
      .catch(() => navigate(`/listings/${id}`))
      .finally(() => setLoadingPage(false));
  }, [id]);

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 3 - previews.length);
    const items = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPreviews((p) => [...p, ...items].slice(0, 3));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating)        return toast.error('Please select a rating');
    if (!comment.trim()) return toast.error('Please write a comment');

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('rating',  rating);
      fd.append('comment', comment.trim());
      if (stayDuration) fd.append('stayDuration', stayDuration);
      previews.forEach(({ file }) => fd.append('images', file));

      await reviewAPI.create(id, fd);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPage) return <PageSpinner />;
  if (!listing)    return null;

  // ── Success screen
  if (submitted) {
    return (
      <div className="page-wrapper max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <h1 className="font-display font-bold text-2xl text-gray-900 mb-2">Review Submitted!</h1>
        <p className="text-gray-500 text-sm mb-8">
          Thank you for sharing your experience with <span className="font-semibold text-gray-700">{listing.title}</span>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(`/listings/${id}`)}
            className="btn-primary"
          >
            Back to Listing
          </button>
          <button
            onClick={() => navigate('/listings')}
            className="btn-secondary"
          >
            Browse More
          </button>
        </div>
      </div>
    );
  }

  //  Review Form
  return (
    <div className="page-wrapper max-w-xl mx-auto">

      {/* Back button */}
      <button
        onClick={() => navigate(`/listings/${id}`)}
        className="flex items-center gap-2 text-gray-500 hover:text-brand text-sm font-medium mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to listing
      </button>

      {/* Listing mini-card */}
      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8">
        {listing.images?.[0] && (
          <img
            src={getImageUrl(listing.images[0])}
            alt={listing.title}
            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-200"
          />
        )}
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{listing.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {listing.location?.locality}, {listing.location?.district}
          </p>
        </div>
      </div>

      {/* Page title */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900">Write a Review</h1>
        <p className="text-gray-500 text-sm mt-1">Your honest feedback helps others find the right place.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Star rating ── */}
        <div>
          <label className="block text-base font-semibold text-gray-900 mb-4">
            Overall Rating <span className="text-red-400">*</span>
          </label>
          <StarPicker value={rating} onChange={setRating} size={44} />
          {rating > 0 && (
            <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-sm font-semibold
                             ${RATING_BG[rating]} ${RATING_COLORS[rating]}`}>
              <Star size={14} className="fill-current" />
              {RATING_LABELS[rating]}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* Comment */}
        <div>
          <label className="block text-base font-semibold text-gray-900 mb-1">
            Your Review <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-gray-400 mb-3">
            Describe the property, landlord, neighbourhood, facilities, etc.
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="Share your experience — what did you like or dislike about this property?"
            className="input resize-none text-sm leading-relaxed"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${comment.length > 900 ? 'text-red-400' : 'text-gray-400'}`}>
              {comment.length}/1000
            </span>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Stay duration */}
        <div>
          <label className="block text-base font-semibold text-gray-900 mb-1">
            How long did you stay?
            <span className="text-gray-400 font-normal text-sm ml-2">Optional</span>
          </label>
          <p className="text-xs text-gray-400 mb-3">e.g. 2 months, 6 weeks, 1 year</p>
          <input
            type="text"
            value={stayDuration}
            onChange={(e) => setStayDuration(e.target.value)}
            placeholder="e.g. 3 months"
            className="input"
            maxLength={100}
          />
        </div>

        <div className="border-t border-gray-100" />

        {/*  Photo upload  */}
        <div>
          <label className="block text-base font-semibold text-gray-900 mb-1">
            Add Photos
            <span className="text-gray-400 font-normal text-sm ml-2">Optional · max 3</span>
          </label>
          <p className="text-xs text-gray-400 mb-4">Photos help others see the actual condition of the property.</p>

          <div className="flex flex-wrap gap-3">
            {previews.map(({ url }, i) => (
              <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 group border border-gray-200">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPreviews((p) => p.filter((_, j) => j !== i))}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-gray-900/70 text-white
                             rounded-full flex items-center justify-center
                             opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {previews.length < 3 && (
              <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300
                                flex flex-col items-center justify-center gap-1.5
                                cursor-pointer hover:border-brand hover:bg-orange-50
                                transition-colors text-gray-400 hover:text-brand">
                <Upload size={20} />
                <span className="text-xs font-medium">Add Photo</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
              </label>
            )}
          </div>
        </div>

        {/*Submit */}
        <div className="pt-2 pb-8">
          <button
            type="submit"
            disabled={submitting || !rating || !comment.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2.5 py-4 text-base
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Star size={18} className="fill-white" />Submit Review</>
            )}
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">
            Reviews are public and cannot be edited after submission.
          </p>
        </div>
      </form>
    </div>
  );
}
