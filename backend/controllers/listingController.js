const Listing    = require('../models/Listing');
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

// POST /api/listings 
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
        ? (Array.isArray(facilities) ? facilities : facilities.split(',').map((f) => f.trim()))
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

// GET /api/listings 
const getListings = async (req, res) => {
  try {
    const {
      search, category, district,
      minPrice, maxPrice, status,
      page = 1, limit = 12,
    } = req.query;

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit))); // cap at 50

    const match = { approved: true };

    if (search) {
      match.$or = [
        { $text: { $search: search } },
        { 'location.locality': new RegExp(search, 'i') },
        { 'location.district': new RegExp(search, 'i') },
      ];
    }

    if (category)  match.category           = category;
    if (district)  match['location.district'] = district;
    if (status)    match.status             = status;

    if (minPrice || maxPrice) {
      match['price.amount'] = {};
      if (minPrice) match['price.amount'].$gte = Number(minPrice);
      if (maxPrice) match['price.amount'].$lte = Number(maxPrice);
    }

    const skip = (pageNum - 1) * limitNum;

    const [total, listings] = await Promise.all([
      Listing.countDocuments(match),

      Listing.aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },

        {
          $lookup: {
            from:     'reviews',
            let:      { listingId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$listing', '$$listingId'] } } },
              { $project: { rating: 1, _id: 0 } },  // Only rating field
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

        
        {
          $lookup: {
            from:     'users',
            let:      { userId: '$createdBy' },
            pipeline: [
              { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
              { $project: { name: 1, email: 1, phone: 1, _id: 1 } },
            ],
            as: 'createdBy',
          },
        },
        { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },

      
        {
          $project: {
            title:         1,
            category:      1,
            price:         1,
            'location.district': 1,
            'location.locality': 1,
            images:        1,
            status:        1,
            facilities:    1,
            vrMediaUrl:    1,
            avgRating:     1,
            reviewCount:   1,
            createdAt:     1,
            createdBy:     1,
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      total,
      page:   pageNum,
      pages:  Math.ceil(total / limitNum),
      listings,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch listings', error: err.message });
  }
};

// GET /api/listings/:id 
const getListingById = async (req, res) => {
  try {
    
    const listing = await Listing
      .findById(req.params.id)
      .populate('createdBy', 'name email phone')
      .lean();

    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch listing', error: err.message });
  }
};

//GET /api/listings/my/listings 
const getMyListings = async (req, res) => {
  try {
    const listings = await Listing
      .find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .lean();  // lean() here too

    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your listings', error: err.message });
  }
};

// PUT /api/listings/:id 
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

    const hasCoordUpdate = lat !== undefined || lng !== undefined;
    const newCoords = hasCoordUpdate
      ? { lat: lat ? parseFloat(lat) : null, lng: lng ? parseFloat(lng) : null }
      : listing.location.coordinates;

    const updatedData = {
      ...(title       && { title }),
      ...(description && { description }),
      ...(category    && { category }),
      ...(priceAmount && { price: { amount: Number(priceAmount), period: pricePeriod || listing.price.period } }),
      location: {
        district:    district   || listing.location.district,
        locality:    locality   || listing.location.locality,
        landmark:    landmark   !== undefined ? landmark : listing.location.landmark,
        coordinates: newCoords,
      },
      ...(facilities && {
        facilities: Array.isArray(facilities) ? facilities : facilities.split(',').map((f) => f.trim()),
      }),
      ...(contactNumber  && { contactNumber }),
      ...(whatsappNumber !== undefined && { whatsappNumber }),
      ...(status         && { status }),
      ...(newImages.length > 0 && { images: [...listing.images, ...newImages] }),
      ...(req.user.role !== 'admin' && { approved: false }),
    };

    const updated = await Listing.findByIdAndUpdate(
      req.params.id, updatedData, { new: true, runValidators: true }
    ).lean();

    res.json({ success: true, message: 'Listing updated', listing: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update listing', error: err.message });
  }
};

//DELETE /api/listings/:id 
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

//PATCH /api/listings/:id/status 
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

//GET /api/listings/stats 
const getPublicStats = async (req, res) => {
  try {
    const User = require('../models/User');
    const [listingStats, userStats] = await Promise.all([
      Listing.aggregate([
        {
          $facet: {
            activeListings: [
              { $match: { approved: true, status: 'available' } },
              { $count: 'count' },
            ],
            activeDistricts: [
              { $match: { approved: true } },
              { $group: { _id: '$location.district' } },
              { $count: 'count' },
            ],
          },
        },
      ]),
      User.aggregate([
        {
          $facet: {
            owners:  [{ $match: { role: 'owner' } },  { $count: 'count' }],
            tenants: [{ $match: { role: 'user' } },   { $count: 'count' }],
          },
        },
      ]),
    ]);

    const ls = listingStats[0];
    const us = userStats[0];

    res.json({
      success: true,
      stats: {
        activeListings:  ls.activeListings[0]?.count  || 0,
        ownerCount:      us.owners[0]?.count          || 0,
        tenantCount:     us.tenants[0]?.count         || 0,
        activeDistricts: ls.activeDistricts[0]?.count || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
  }
};

//PATCH /api/listings/:id/vr 
const uploadVR = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (listing.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorised' });
    }

    const vrMediaUrl = req.file ? req.file.path : '';

    if (!vrMediaUrl && listing.vrMediaUrl) {
      try {
        const publicId = listing.vrMediaUrl.split('/').slice(-2).join('/').replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
      } catch (_) {}
    }

    listing.vrMediaUrl = vrMediaUrl;
    await listing.save();

    res.json({
      success:  true,
      message:  vrMediaUrl ? 'VR media uploaded' : 'VR media removed',
      vrMediaUrl,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload VR media', error: err.message });
  }
};

module.exports = {
  createListing, getListings, getListingById, getMyListings,
  updateListing, deleteListing, toggleStatus, getPublicStats, uploadVR,
};