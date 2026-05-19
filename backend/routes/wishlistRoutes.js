const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User    = require('../models/User');
const Listing = require('../models/Listing');

router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('wishlist').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const listings = await Listing.aggregate([
      { $match: { _id: { $in: user.wishlist }, approved: true } },
      {
        $lookup: {
          from: 'reviews',
          let: { lid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$listing', '$$lid'] } } },
            { $project: { rating: 1, _id: 0 } },
          ],
          as: 'reviews',
        },
      },
      {
        $addFields: {
          avgRating: {
            $cond: [
              { $gt: [{ $size: '$reviews' }, 0] },
              { $round: [{ $avg: '$reviews.rating' }, 1] },
              null,
            ],
          },
          reviewCount: { $size: '$reviews' },
        },
      },
      { $unset: 'reviews' },
    ]);

    res.json({ success: true, wishlist: user.wishlist, listings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch wishlist', error: err.message });
  }
});

router.post('/:listingId', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId).lean();
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { wishlist: req.params.listingId } },
      { new: true, select: 'wishlist' }
    ).lean();

    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add to wishlist', error: err.message });
  }
});

router.delete('/:listingId', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { wishlist: req.params.listingId } },
      { new: true, select: 'wishlist' }
    ).lean();

    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove from wishlist', error: err.message });
  }
});

module.exports = router;
