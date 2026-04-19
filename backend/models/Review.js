const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: 1000,
    },
    stayDuration: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// One review per user per listing
reviewSchema.index({ listing: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);