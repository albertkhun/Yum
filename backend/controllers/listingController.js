const Listing    = require('../models/Listing');
const cloudinary = require('../utils/cloudinary');

// Extract Cloudinary public_id from a stored URL so we can destroy it
const getPublicId = (url) => {
  // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123456/yum/abcdef.jpg
  // public_id  = yum/abcdef  (no extension)
  try {
    const parts = url.split('/');
    const upload = parts.indexOf('upload');
    // everything after upload/v<version> or just after upload
    const start  = parts[upload + 1].startsWith('v') ? upload + 2 : upload + 1;
    return parts.slice(start).join('/').replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
};

const deleteImages = async (images = []) => {
  const ids = images.map(getPublicId).filter(Boolean);
  await Promise.allSettled(ids.map((id) => cloudinary.uploader.destroy(id)));
};

// ── POST /api/listings ─────────────────────────────────────
const createListing = async (req, res) => {
  try {
    const {
      title, description, category,
      priceAmount, pricePeriod,
      district, locality, landmark,
      lat, lng,
      facilities, contactNumber, whatsappNumber,
    } = req.body;

    const images = req.files ? req.files.map((f) => f.path) : [];

    const listing = await Listing.create({
      title, description, category,
      price: { amount: Number(priceAmount), period: pricePeriod || 'per month' },
      location: {
        district, locality, landmark,
        coordinates: {
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null,
        },
      },
      facilities: facilities
        ? (Array.isArray(facilities) ? facilities : facilities.split(',').map(f => f.trim()))
        : [],
      images,
      contactNumber,
      whatsappNumber: whatsappNumber || contactNumber || '',
      createdBy: req.user.id,
      approved: req.user.role === 'admin',
    });

    res.status(201).json({ success: true, message: 'Listing created', listing });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create listing', error: err.message });
  }
};

// ── GET /api/listings ──────────────────────────────────────
const getListings = async (req, res) => {
  try {
    const { search, category, district, minPrice, maxPrice, status, page = 1, limit = 12 } = req.query;
    const query = { approved: true };
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { title: regex }, { category: regex },
        { 'location.locality': regex }, { 'location.district': regex },
      ];
    }
    if (category) query.category = category;
    if (district) query['location.district'] = district;
    if (status) query.status = status;
    if (minPrice || maxPrice) {
      query['price.amount'] = {};
      if (minPrice) query['price.amount'].$gte = Number(minPrice);
      if (maxPrice) query['price.amount'].$lte = Number(maxPrice);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Listing.countDocuments(query);
    const listings = await Listing.find(query)
      .populate('createdBy', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), listings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch listings', error: err.message });
  }
};

// ── GET /api/listings/:id ──────────────────────────────────
const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('createdBy', 'name email phone');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch listing', error: err.message });
  }
};

// ── GET /api/listings/my/listings ─────────────────────────
const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your listings', error: err.message });
  }
};

// ── PUT /api/listings/:id ──────────────────────────────────
const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    const {
      title, description, category,
      priceAmount, pricePeriod,
      district, locality, landmark,
      lat, lng,
      facilities, contactNumber, whatsappNumber, status,
    } = req.body;

    const newImages = req.files ? req.files.map((f) => f.path) : [];

    // Build coordinates update
    const hasCoordUpdate = lat !== undefined || lng !== undefined;
    const newCoords = hasCoordUpdate ? {
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
    } : listing.location.coordinates;

    const updatedData = {
      ...(title       && { title }),
      ...(description && { description }),
      ...(category    && { category }),
      ...(priceAmount && { price: { amount: Number(priceAmount), period: pricePeriod || listing.price.period } }),
      location: {
        district:  district  || listing.location.district,
        locality:  locality  || listing.location.locality,
        landmark:  landmark  !== undefined ? landmark : listing.location.landmark,
        coordinates: newCoords,
      },
      ...(facilities && {
        facilities: Array.isArray(facilities) ? facilities : facilities.split(',').map(f => f.trim()),
      }),
      ...(contactNumber    && { contactNumber }),
      ...(whatsappNumber   !== undefined && { whatsappNumber }),
      ...(status           && { status }),
      ...(newImages.length > 0 && { images: [...listing.images, ...newImages] }),
      ...(req.user.role !== 'admin' && { approved: false }),
    };

    const updated = await Listing.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
    res.json({ success: true, message: 'Listing updated', listing: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update listing', error: err.message });
  }
};

// ── DELETE /api/listings/:id ───────────────────────────────
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }
    await deleteImages(listing.images);
    await listing.deleteOne();
    res.json({ success: true, message: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete listing', error: err.message });
  }
};

// ── PATCH /api/listings/:id/status ────────────────────────
const toggleStatus = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    listing.status = listing.status === 'available' ? 'rented' : 'available';
    await listing.save();
    res.json({ success: true, message: `Status changed to ${listing.status}`, listing });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
};

// ── GET /api/listings/stats (public) ──────────────────────
const getPublicStats = async (req, res) => {
  try {
    const Listing = require('../models/Listing');
    const User    = require('../models/User');

    const [activeListings, ownerCount, tenantCount, districtsRaw] = await Promise.all([
      Listing.countDocuments({ approved: true, status: 'available' }),
      User.countDocuments({ role: 'owner' }),
      User.countDocuments({ role: 'user' }),
      // distinct districts that have at least one approved listing
      Listing.distinct('location.district', { approved: true }),
    ]);

    res.json({
      success: true,
      stats: {
        activeListings,
        ownerCount,
        tenantCount,
        activeDistricts: districtsRaw.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
  }
};

module.exports = { createListing, getListings, getListingById, getMyListings, updateListing, deleteListing, toggleStatus, getPublicStats };