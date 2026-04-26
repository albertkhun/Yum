const express = require('express');
const router  = express.Router({ mergeParams: true }); // mergeParams for :listingId
const { getReviews, createReview, deleteReview, updateReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Reuse upload middleware but for review images (max 3)
const upload = require('../middleware/uploadMiddleware');

router.get('/',    getReviews);                                           // public
router.post('/',   protect, upload.array('images', 3), createReview);    // logged-in users
router.put('/:reviewId',    protect, updateReview);                       // own review
router.delete('/:reviewId', protect, deleteReview);                       // own or admin

module.exports = router;