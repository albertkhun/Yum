const express = require('express');
const router = express.Router();
const { createListing, getListings, getListingById, getMyListings, updateListing, deleteListing, toggleStatus, getPublicStats } = require('../controllers/listingController');
const { protect, ownerOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getListings);
router.get('/stats',        getPublicStats); 
router.get('/my/listings', protect, ownerOrAdmin, getMyListings);
router.get('/:id', getListingById);
router.post('/', protect, ownerOrAdmin, upload.array('images', 6), createListing);
router.put('/:id', protect, ownerOrAdmin, upload.array('images', 6), updateListing);
router.delete('/:id', protect, ownerOrAdmin, deleteListing);
router.patch('/:id/status', protect, ownerOrAdmin, toggleStatus);

module.exports = router;
