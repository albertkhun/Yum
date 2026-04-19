import { useState, useEffect } from 'react';
import { Star, Trash2, Upload, X, ShieldCheck, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { reviewAPI } from '../../services/api';
import { useAuth }   from '../../context/AuthContext';
import { getImageUrl, timeAgo } from '../../utils/helpers';
import toast from 'react-hot-toast';

// ── Star rating picker ────────────────────────────────────
function StarPicker({ value, onChange, readonly = false, size = 22 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-transform ${readonly ? 'cursor-default' : 'hover:scale-110'}`}
        >
          <Star
            size={size}
            className={`transition-colors ${
              n <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Single review card ────────────────────────────────────
function ReviewCard({ review, listingId, onDeleted }) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isOwn  = user?.id === review.user?._id;
  const isAdmin = user?.role === 'admin';

  const handleDelete = async () => {
    if (!window.confirm('Delete this review?')) return;
    setDeleting(true);
    try {
      await reviewAPI.delete(listingId, review._id);
      toast.success('Review deleted');
      onDeleted(review._id);
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 bg-brand/10 dark:bg-brand/20 rounded-full
                          flex items-center justify-center text-brand font-bold text-sm shrink-0">
            {review.user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {review.user?.name || 'User'}
              </p>
              <span className="badge badge-blue text-[10px]">
                <ShieldCheck size={10} /> Verified
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <StarPicker value={review.rating} readonly size={14} />
              <span className="text-xs text-gray-400">{timeAgo(review.createdAt)}</span>
              {review.stayDuration && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={11} /> {review.stayDuration}
                </span>
              )}
            </div>
          </div>
        </div>

        {(isOwn || isAdmin) && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                       hover:text-red-600 transition-colors disabled:opacity-40 shrink-0"
          >
            {deleting
              ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              : <Trash2 size={15} />}
          </button>
        )}
      </div>

      {/* Comment */}
      <p className={`text-sm text-gray-700 dark:text-gray-300 leading-relaxed
                     ${!expanded && review.comment.length > 200 ? 'line-clamp-3' : ''}`}>
        {review.comment}
      </p>
      {review.comment.length > 200 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-brand mt-1 font-medium"
        >
          {expanded ? <><ChevronUp size={13} />Show less</> : <><ChevronDown size={13} />Read more</>}
        </button>
      )}

      {/* Review images */}
      {review.images?.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {review.images.map((img, i) => (
            <a key={i} href={getImageUrl(img)} target="_blank" rel="noopener noreferrer">
              <img
                src={getImageUrl(img)}
                alt={`review-img-${i + 1}`}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl
                           border border-gray-200 dark:border-gray-700
                           hover:opacity-90 transition-opacity"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Review form ───────────────────────────────────────────
function ReviewForm({ listingId, onSubmitted }) {
  const { user } = useAuth();
  const [rating,       setRating]       = useState(0);
  const [comment,      setComment]      = useState('');
  const [stayDuration, setStayDuration] = useState('');
  const [previews,     setPreviews]     = useState([]);
  const [submitting,   setSubmitting]   = useState(false);

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 3 - previews.length);
    const urls  = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPreviews((p) => [...p, ...urls].slice(0, 3));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!rating)   return toast.error('Please select a rating');
    if (!comment.trim()) return toast.error('Please write a comment');

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('rating',  rating);
      fd.append('comment', comment.trim());
      if (stayDuration) fd.append('stayDuration', stayDuration);
      previews.forEach(({ file }) => fd.append('images', file));

      const { data } = await reviewAPI.create(listingId, fd);
      toast.success('Review submitted! ⭐');
      onSubmitted(data.review);
      // Reset
      setRating(0); setComment(''); setStayDuration(''); setPreviews([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={submit}
      className="bg-orange-50 dark:bg-gray-800/60 rounded-2xl border border-orange-100
                 dark:border-gray-700 p-4 sm:p-5 space-y-4">
      <h3 className="font-display font-bold text-gray-900 dark:text-white text-base">
        Write a Review
      </h3>

      {/* Stars */}
      <div>
        <p className="label">Your Rating <span className="text-red-400">*</span></p>
        <div className="flex items-center gap-3">
          <StarPicker value={rating} onChange={setRating} size={28} />
          {rating > 0 && (
            <span className="text-sm font-semibold text-amber-500">
              {['','Poor','Fair','Good','Very Good','Excellent'][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="label">Comment <span className="text-red-400">*</span></label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Share your experience with this property..."
          className="input resize-none"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/1000</p>
      </div>

      {/* Stay duration */}
      <div>
        <label className="label">
          Stay Duration
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </label>
        <input
          type="text"
          value={stayDuration}
          onChange={(e) => setStayDuration(e.target.value)}
          placeholder="e.g. 2 months, 6 weeks..."
          className="input"
          maxLength={100}
        />
      </div>

      {/* Image upload */}
      <div>
        <label className="label">
          Photos
          <span className="text-gray-400 font-normal ml-1">(optional, max 3)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {previews.map(({ url }, i) => (
            <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPreviews((p) => p.filter((_, j) => j !== i))}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white
                           rounded-full flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {previews.length < 3 && (
            <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300
                              dark:border-gray-600 flex flex-col items-center justify-center
                              cursor-pointer hover:border-brand hover:bg-orange-50
                              dark:hover:bg-gray-700 transition-colors">
              <Upload size={16} className="text-gray-400" />
              <span className="text-[10px] text-gray-400 mt-0.5">Add</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
            </label>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full flex items-center justify-center gap-2
                   disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting
          ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <><Star size={16} />Submit Review</>}
      </button>
    </form>
  );
}

// ── Rating summary bar ────────────────────────────────────
function RatingSummary({ reviews, avg }) {
  const counts = [5, 4, 3, 2, 1].map((n) => ({
    star: n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100
                    dark:border-gray-800 p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
      {/* Big number */}
      <div className="flex flex-col items-center justify-center sm:pr-6 sm:border-r
                      border-gray-100 dark:border-gray-800 min-w-[100px]">
        <span className="font-display font-bold text-4xl text-gray-900 dark:text-white">
          {avg}
        </span>
        <StarPicker value={Math.round(avg)} readonly size={16} />
        <span className="text-xs text-gray-400 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Bar chart */}
      <div className="flex-1 space-y-1.5">
        {counts.map(({ star, count }) => {
          const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-3 shrink-0">{star}</span>
              <Star size={11} className="fill-amber-400 text-amber-400 shrink-0" />
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-6 text-right shrink-0">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main exported component ───────────────────────────────
export default function ReviewSection({ listingId, listingOwnerId }) {
  const { user } = useAuth();
  const [reviews,    setReviews]    = useState([]);
  const [avg,        setAvg]        = useState(null);
  const [loading,    setLoading]    = useState(true);

  // Has the current user already reviewed?
  const alreadyReviewed = reviews.some((r) => r.user?._id === user?.id);
  // Owner cannot review their own
  const isOwner = user?.id === listingOwnerId;
  // Show form only to logged-in non-owners who haven't reviewed yet
  const canReview = user && !isOwner && !alreadyReviewed;

  useEffect(() => {
    reviewAPI.getAll(listingId)
      .then(({ data }) => {
        setReviews(data.reviews || []);
        setAvg(data.avgRating);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listingId]);

  const handleNewReview = (review) => {
    setReviews((prev) => [review, ...prev]);
    const newAvg = (([review, ...reviews].reduce((s, r) => s + r.rating, 0)) /
      (reviews.length + 1)).toFixed(1);
    setAvg(newAvg);
  };

  const handleDeleted = (reviewId) => {
    const updated = reviews.filter((r) => r._id !== reviewId);
    setReviews(updated);
    setAvg(updated.length
      ? (updated.reduce((s, r) => s + r.rating, 0) / updated.length).toFixed(1)
      : null);
  };

  return (
    <section className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-gray-900 dark:text-white text-lg sm:text-xl">
          Reviews {reviews.length > 0 && <span className="text-gray-400 font-normal text-base">({reviews.length})</span>}
        </h2>
        {avg && (
          <div className="flex items-center gap-1.5">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <span className="font-bold text-gray-900 dark:text-white text-sm">{avg}</span>
          </div>
        )}
      </div>

      {/* Rating summary — only if there are reviews */}
      {!loading && reviews.length > 0 && (
        <RatingSummary reviews={reviews} avg={avg} />
      )}

      {/* Review form */}
      {!loading && canReview && (
        <ReviewForm listingId={listingId} onSubmitted={handleNewReview} />
      )}

      {/* Prompts for non-logged users / owner */}
      {!loading && !user && (
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200
                        dark:border-gray-700 p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <a href="/login" className="text-brand font-semibold hover:underline">Sign in</a>
            {' '}to leave a review
          </p>
        </div>
      )}

      {!loading && user && alreadyReviewed && !isOwner && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200
                        dark:border-green-800 p-3 text-center">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
            ✅ You've already reviewed this listing
          </p>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100
                                    dark:border-gray-800 p-4 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400 dark:text-gray-500">
          <Star size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              listingId={listingId}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </section>
  );
}