const Listing    = require('../models/Listing');
const User       = require('../models/User');
const cloudinary = require('../utils/cloudinary');

const getPublicId = (url) => {
  try {
    const parts  = url.split('/');
    const upload = parts.indexOf('upload');
    const start  = parts[upload + 1].startsWith('v') ? upload + 2 : upload + 1;
    return parts.slice(start).join('/').replace(/\.[^/.]+$/, '');
  } catch { return null; }
};

const deleteImages = async (images = []) => {
  const ids = images.map(getPublicId).filter(Boolean);
  await Promise.allSettled(ids.map((id) => cloudinary.uploader.destroy(id)));
};

const getAllListings = async (req, res) => {
  try {
    const { approved, page = 1, limit = 20 } = req.query;
    const query = {};
    if (approved === 'true') query.approved = true;
    if (approved === 'false') query.approved = false;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Listing.countDocuments(query);
    const listings = await Listing.find(query).populate('createdBy', 'name email phone role').sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), listings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch listings', error: err.message });
  }
};

const approveListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    listing.approved = true;
    await listing.save();
    res.json({ success: true, message: 'Listing approved', listing });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve listing', error: err.message });
  }
};

const rejectListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    listing.approved = false;
    await listing.save();
    res.json({ success: true, message: 'Listing rejected', listing });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject listing', error: err.message });
  }
};

const adminDeleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    await deleteImages(listing.images);
    await listing.deleteOne();
    res.json({ success: true, message: 'Listing deleted by admin' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete listing', error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'owner', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    if (req.params.id === req.user.id) return res.status(400).json({ message: 'Cannot change your own role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, message: `Role updated to ${role}`, user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role', error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: 'Cannot delete yourself' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const listings = await Listing.find({ createdBy: req.params.id });
    await Promise.all(listings.map((l) => deleteImages(l.images)));
    await Listing.deleteMany({ createdBy: req.params.id });
    await user.deleteOne();
    res.json({ success: true, message: 'User and their listings deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const [totalListings, pendingListings, approvedListings, totalUsers, ownerCount, availableListings, rentedListings] = await Promise.all([
      Listing.countDocuments(),
      Listing.countDocuments({ approved: false }),
      Listing.countDocuments({ approved: true }),
      User.countDocuments(),
      User.countDocuments({ role: 'owner' }),
      Listing.countDocuments({ status: 'available', approved: true }),
      Listing.countDocuments({ status: 'rented', approved: true }),
    ]);
    res.json({ success: true, stats: { totalListings, pendingListings, approvedListings, totalUsers, ownerCount, availableListings, rentedListings } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
  }
};

module.exports = { getAllListings, approveListing, rejectListing, adminDeleteListing, getAllUsers, changeUserRole, deleteUser, getStats };