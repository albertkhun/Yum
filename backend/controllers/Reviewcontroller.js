const Review   = require('../models/Review');
const Listing  = require('../models/Listing');
const cloudinary = require('../utils/cloudinary');

const getPublicId = (url) => {
  try {
    const parts  = url.split('/');
    const upload = parts.indexOf('upload');
    const start  = parts[upload + 1].startsWith('v') ? upload + 2 : upload + 1;
    return parts.slice(start).join('/').replace(/\.[^/.]+$/, '');
  } catch { return null; }
};

// ── GET /api/reviews/:listingId ────────────────────────────
// Public — get all reviews for a listing
const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ listing: req.params.listingId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Average rating
    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.json({ success: true, reviews, avgRating: avg, total: reviews.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reviews', error: err.message });
  }
};

// ── POST /api/reviews/:listingId ───────────────────────────
// Private — logged-in users only, one review per listing
const createReview = async (req, res) => {
  try {
    const { rating, comment, stayDuration } = req.body;

    if (!rating || !comment)
      return res.status(400).json({ message: 'Rating and comment are required' });

    // Listing must exist and be approved
    const listing = await Listing.findById(req.params.listingId);
    if (!listing || !listing.approved)
      return res.status(404).json({ message: 'Listing not found' });

    // Owner cannot review their own listing
    if (listing.createdBy.toString() === req.user.id)
      return res.status(403).json({ message: 'You cannot review your own listing' });

    // One review per user per listing enforced by unique index — catch duplicate
    const images = req.files ? req.files.map((f) => f.path) : [];

    const review = await Review.create({
      listing: req.params.listingId,
      user:    req.user.id,
      rating:  Number(rating),
      comment,
      stayDuration: stayDuration || '',
      images,
    });

    await review.populate('user', 'name');
    res.status(201).json({ success: true, message: 'Review added', review });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: 'You have already reviewed this listing' });
    res.status(500).json({ message: 'Failed to add review', error: err.message });
  }
};

// ── DELETE /api/reviews/:reviewId ──────────────────────────
// Private — own review or admin
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.user.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorised' });

    // Delete images from Cloudinary
    const ids = review.images.map(getPublicId).filter(Boolean);
    await Promise.allSettled(ids.map((id) => cloudinary.uploader.destroy(id)));

    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete review', error: err.message });
  }
};

// ── PUT /api/reviews/:reviewId ─────────────────────────────
// Private — own review only
const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorised' });

    const { rating, comment, stayDuration } = req.body;
    if (rating)       review.rating      = Number(rating);
    if (comment)      review.comment     = comment;
    if (stayDuration !== undefined) review.stayDuration = stayDuration;

    await review.save();
    await review.populate('user', 'name');
    res.json({ success: true, message: 'Review updated', review });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update review', error: err.message });
  }
};

module.exports = { getReviews, createReview, deleteReview, updateReview };