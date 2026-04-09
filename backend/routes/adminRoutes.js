const express = require('express');
const router = express.Router();
const { getAllListings, approveListing, rejectListing, adminDeleteListing, getAllUsers, changeUserRole, deleteUser, getStats } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/listings', getAllListings);
router.patch('/listings/:id/approve', approveListing);
router.patch('/listings/:id/reject', rejectListing);
router.delete('/listings/:id', adminDeleteListing);
router.get('/users', getAllUsers);
router.patch('/users/:id/role', changeUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;
