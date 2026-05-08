import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star, Trash2, ChevronDown, ChevronUp, ShieldCheck, Clock, PenLine } from 'lucide-react';
import { reviewAPI } from '../../services/api';
import { useAuth }   from '../../context/AuthContext';
import { getImageUrl, timeAgo } from '../../utils/helpers';
import toast from 'react-hot-toast';

// ── Star display (readonly) ───────────────────────────────────────────────
function StarRow({ value, size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= value ? 'fill-amber-400 text-amber-400' : 'fill-none text-gray-200'}
        />
      ))}
    </div>
  );
}

// ── Single review card ────────────────────────────────────────────────────
function ReviewCard({ review, listingId, onDeleted }) {
  const { user }   = useAuth();
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
    finally   { setDeleting(false); }
  };

  return (
    <div className="py-5 border-b border-gray-100 last:border-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand/10 rounded-full flex items-center justify-center
                          text-brand font-bold text-sm shrink-0">
            {review.user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-gray-900">{review.user?.name || 'User'}</p>
              <span className="badge badge-blue text-[10px]">
                <ShieldCheck size={10} /> Verified
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <StarRow value={review.rating} size={13} />
              <span className="text-xs text-gray-400">{timeAgo(review.createdAt)}</span>
              {review.stayDuration && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={11} />{review.stayDuration}
                </span>
              )}
            </div>
          </div>
        </div>

        {(isOwn || isAdmin) && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600
                       transition-colors disabled:opacity-40 shrink-0"
          >
            {deleting
              ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              : <Trash2 size={15} />}
          </button>
        )}
      </div>

      {/* Comment */}
      <p className={`text-sm text-gray-700 leading-relaxed
                     ${!expanded && review.comment.length > 220 ? 'line-clamp-3' : ''}`}>
        {review.comment}
      </p>
      {review.comment.length > 220 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-brand mt-1.5 font-medium"
        >
          {expanded ? <><ChevronUp size={13} />Show less</> : <><ChevronDown size={13} />Read more</>}
        </button>
      )}

      {/* Photos */}
      {review.images?.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {review.images.map((img, i) => (
            <a key={i} href={getImageUrl(img)} target="_blank" rel="noopener noreferrer">
              <img
                src={getImageUrl(img)}
                alt={`review-img-${i + 1}`}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl
                           border border-gray-200 hover:opacity-90 transition-opacity"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Rating summary bar (Google Play style) ────────────────────────────────
function RatingSummary({ reviews, avg }) {
  const counts = [5, 4, 3, 2, 1].map((n) => ({
    star: n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  return (
    <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 py-5 border-b border-gray-100">
      {/* Big score */}
      <div className="flex flex-col items-center justify-center sm:w-28 shrink-0">
        <span className="font-display font-bold text-5xl text-gray-900 leading-none">{avg}</span>
        <div className="mt-1.5">
          <StarRow value={Math.round(avg)} size={16} />
        </div>
        <span className="text-xs text-gray-400 mt-1.5">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Bars */}
      <div className="flex-1 space-y-1.5 justify-center flex flex-col">
        {counts.map(({ star, count }) => {
          const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2.5">
              <span className="text-xs text-gray-400 w-2.5 shrink-0 text-right">{star}</span>
              <Star size={11} className="fill-amber-400 text-amber-400 shrink-0" />
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-5 text-right shrink-0">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────
export default function ReviewSection({ listingId, listingOwnerId }) {
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();
  const [reviews,    setReviews]    = useState([]);
  const [avg,        setAvg]        = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [showAll,    setShowAll]    = useState(false);

  const alreadyReviewed = reviews.some((r) => r.user?._id === user?.id);
  const isOwner         = user?.id === listingOwnerId;
  const canReview       = !isOwner && !alreadyReviewed;

  useEffect(() => {
    reviewAPI.getAll(listingId)
      .then(({ data }) => {
        setReviews(data.reviews || []);
        setAvg(data.avgRating);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listingId]);

  const handleDeleted = (reviewId) => {
    const updated = reviews.filter((r) => r._id !== reviewId);
    setReviews(updated);
    setAvg(updated.length
      ? (updated.reduce((s, r) => s + r.rating, 0) / updated.length).toFixed(1)
      : null);
  };

  const goToReviewForm = () => {
    if (!user) {
      toast.error('Please login to write a review.');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    navigate(`/listings/${listingId}/review`);
  };

  const PREVIEW_COUNT = 3;
  const visible = showAll ? reviews : reviews.slice(0, PREVIEW_COUNT);

  return (
    <section>
      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display font-bold text-gray-900 text-xl">
          Reviews
          {reviews.length > 0 && (
            <span className="text-gray-400 font-normal text-base ml-2">({reviews.length})</span>
          )}
        </h2>

        {/* Write a Review button — Google Play style */}
        {!loading && canReview && (
          <button
            onClick={goToReviewForm}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-brand
                       text-brand text-sm font-semibold hover:bg-orange-50 transition-colors"
          >
            <PenLine size={15} />
            Write a Review
          </button>
        )}
      </div>

      {/* Already reviewed badge */}
      {!loading && user && alreadyReviewed && !isOwner && (
        <p className="text-xs text-green-600 font-medium mb-3 flex items-center gap-1.5">
          <span className="text-green-500">✓</span> You've reviewed this listing
        </p>
      )}

      {/* Login prompt */}
      {!loading && !user && (
        <p className="text-xs text-gray-400 mb-4">
          <button onClick={goToReviewForm} className="text-brand font-semibold hover:underline">
            Sign in
          </button>{' '}to leave a review
        </p>
      )}

      {/* ── Rating summary ── */}
      {!loading && reviews.length > 0 && (
        <RatingSummary reviews={reviews} avg={avg} />
      )}

      {/* ── Reviews list ── */}
      {loading ? (
        <div className="space-y-4 pt-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-3 py-4 border-b border-gray-100">
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-gray-200 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Star size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium text-gray-500">No reviews yet</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to share your experience</p>
          {canReview && (
            <button
              onClick={goToReviewForm}
              className="mt-4 btn-primary inline-flex items-center gap-2 text-sm px-5 py-2.5"
            >
              <PenLine size={15} />Write a Review
            </button>
          )}
        </div>
      ) : (
        <>
          <div>
            {visible.map((review) => (
              <ReviewCard
                key={review._id}
                review={review}
                listingId={listingId}
                onDeleted={handleDeleted}
              />
            ))}
          </div>

          {/* Show all / collapse */}
          {reviews.length > PREVIEW_COUNT && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-4 w-full flex items-center justify-center gap-2
                         py-3 rounded-xl border-2 border-gray-200 text-gray-600
                         text-sm font-semibold hover:border-gray-300 hover:bg-gray-50
                         transition-colors"
            >
              {showAll
                ? <><ChevronUp size={16} />Show less</>
                : <><ChevronDown size={16} />Show all {reviews.length} reviews</>}
            </button>
          )}
        </>
      )}
    </section>
  );
}
