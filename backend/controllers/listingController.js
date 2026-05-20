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

const VALID_CATEGORIES = ['Rent', 'Apartment', 'PG', 'Hostel', 'Lodge', 'Tolet', 'Other'];
const VALID_DISTRICTS  = [
  'Imphal East', 'Imphal West', 'Thoubal', 'Bishnupur',
  'Churachandpur', 'Chandel', 'Ukhrul', 'Senapati',
  'Tamenglong', 'Jiribam', 'Kakching', 'Kangpokpi',
  'Noney', 'Pherzawl', 'Tengnoupal', 'Kamjong',
];

const validateListingFields = (body) => {
  const { title, description, category, priceAmount, district, locality, contactNumber } = body;
  const errors = [];

  if (!title?.trim())          errors.push('Title is required');
  if (!description?.trim())    errors.push('Description is required');
  if (!category)               errors.push('Category is required');
  if (!priceAmount)            errors.push('Price is required');
  if (!district)               errors.push('District is required');
  if (!locality?.trim())       errors.push('Locality is required');
  if (!contactNumber?.trim())  errors.push('Contact number is required');

  if (category && !VALID_CATEGORIES.includes(category)) {
    errors.push(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  if (district && !VALID_DISTRICTS.includes(district)) {
    errors.push(`Invalid district`);
  }
  if (priceAmount && (isNaN(Number(priceAmount)) || Number(priceAmount) < 0)) {
    errors.push('Price must be a positive number');
  }

  return errors;
};

const createListing = async (req, res) => {
  try {
    const validationErrors = validateListingFields(req.body);
    if (validationErrors.length > 0) {
      if (req.files?.length > 0) {
        await deleteImages(req.files.map((f) => f.path));
      }
      return res.status(400).json({ message: validationErrors[0], errors: validationErrors });
    }

    const {
      title, description, category,
      priceAmount, pricePeriod,
      district, locality, landmark,
      lat, lng,
      facilities, contactNumber, whatsappNumber,
    } = req.body;

    const images = req.files ? req.files.map((f) => f.path).filter(Boolean) : [];

    const parseFacilities = (raw) => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw.filter(Boolean);
      return raw.split(',').map((f) => f.trim()).filter(Boolean);
    };

    const listing = await Listing.create({
      title:       title.trim(),
      description: description.trim(),
      category,
      price: {
        amount: Number(priceAmount),
        period: ['per night', 'per week', 'per month'].includes(pricePeriod) ? pricePeriod : 'per month',
      },
      location: {
        district,
        locality: locality.trim(),
        landmark: landmark?.trim() || '',
        coordinates: {
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null,
        },
      },
      facilities: parseFacilities(facilities),
      images,
      contactNumber:  contactNumber.trim(),
      whatsappNumber: whatsappNumber?.trim() || contactNumber.trim(),
      createdBy: req.user.id,
      approved:  req.user.role === 'admin',
    });

    res.status(201).json({ success: true, message: 'Listing created', listing });
  } catch (err) {
    if (req.files?.length > 0) {
      await deleteImages(req.files.map((f) => f.path)).catch(() => {});
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages[0], errors: messages });
    }
    res.status(500).json({ message: 'Failed to create listing', error: err.message });
  }
};

const getListings = async (req, res) => {
  try {
    const {
      search, category, district,
      minPrice, maxPrice, status,
      page = 1, limit = 12,
    } = req.query;

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));

    const match = { approved: true };

    if (search) {
      match.$or = [
        { $text: { $search: search } },
        { 'location.locality': new RegExp(search, 'i') },
        { 'location.district': new RegExp(search, 'i') },
      ];
    }

    if (category && VALID_CATEGORIES.includes(category)) match.category = category;
    if (district && VALID_DISTRICTS.includes(district))   match['location.district'] = district;
    if (status && ['available', 'rented'].includes(status)) match.status = status;

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

const getMyListings = async (req, res) => {
  try {
    const listings = await Listing
      .find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your listings', error: err.message });
  }
};

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

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    const newImages = req.files ? req.files.map((f) => f.path).filter(Boolean) : [];

    const rawKeep = req.body.keepImages;
    let keptImages;
    if (rawKeep !== undefined) {
      keptImages = Array.isArray(rawKeep) ? rawKeep.filter(Boolean) : [rawKeep].filter(Boolean);
    } else {
      keptImages = listing.images;
    }

    const removedImages = listing.images.filter((url) => !keptImages.includes(url));
    if (removedImages.length > 0) {
      await deleteImages(removedImages).catch(() => {});
    }

    const finalImages = [...keptImages, ...newImages];

    const hasCoordUpdate = lat !== undefined || lng !== undefined;
    const newCoords = hasCoordUpdate
      ? { lat: lat ? parseFloat(lat) : null, lng: lng ? parseFloat(lng) : null }
      : listing.location.coordinates;

    const parseFacilities = (raw) => {
      if (!raw) return undefined;
      if (Array.isArray(raw)) return raw.filter(Boolean);
      return raw.split(',').map((f) => f.trim()).filter(Boolean);
    };

    const updatedData = {
      ...(title       && { title: title.trim() }),
      ...(description && { description: description.trim() }),
      ...(category    && { category }),
      ...(priceAmount && { price: { amount: Number(priceAmount), period: pricePeriod || listing.price.period } }),
      location: {
        district:    district   || listing.location.district,
        locality:    locality   || listing.location.locality,
        landmark:    landmark   !== undefined ? landmark.trim() : listing.location.landmark,
        coordinates: newCoords,
      },
      ...(facilities !== undefined && { facilities: parseFacilities(facilities) || listing.facilities }),
      ...(contactNumber  && { contactNumber: contactNumber.trim() }),
      ...(whatsappNumber !== undefined && { whatsappNumber: whatsappNumber.trim() }),
      ...(status && ['available', 'rented'].includes(status) && { status }),
      images: finalImages,
      ...(req.user.role !== 'admin' && { approved: false }),
    };

    const updated = await Listing.findByIdAndUpdate(
      req.params.id, updatedData, { new: true, runValidators: true }
    ).lean();

    res.json({ success: true, message: 'Listing updated', listing: updated });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages[0], errors: messages });
    }
    res.status(500).json({ message: 'Failed to update listing', error: err.message });
  }
};

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
      success:   true,
      message:   vrMediaUrl ? 'VR media uploaded' : 'VR media removed',
      vrMediaUrl,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload VR media', error: err.message });
  }
};

// ── Haversine distance (km) ──────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R   = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const getNearbyListings = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await Listing.findById(id).lean();
    if (!current) return res.status(404).json({ message: 'Listing not found' });

    const {
      category,
      'price.amount': _priceField,
      location: { coordinates: { lat, lng } = {}, district } = {},
      facilities = [],
    } = current;
    const currentPrice = current.price?.amount ?? 0;
    const hasCoords    = lat != null && lng != null;

    // ── Build a broad match ───────────────────────────────────────────────
    const match = {
      approved: true,
      _id:      { $ne: current._id },
      $or: [
        { category },
        { 'location.district': district },
        ...(hasCoords
          ? [{
              'location.coordinates.lat': { $gte: lat - 0.3, $lte: lat + 0.3 },
              'location.coordinates.lng': { $gte: lng - 0.3, $lte: lng + 0.3 },
            }]
          : []),
      ],
    };

    const candidates = await Listing.find(match)
      .select('title category price location images facilities vrMediaUrl approved status createdAt')
      .limit(80)
      .lean();

    // ── Score & sort ─────────────────────────────────────────────────────
    const PRICE_RANGE = 0.4; // ±40 %

    const scored = candidates.map((l) => {
      let score = 0;

      // 1. Same category (highest weight)
      if (l.category === category) score += 40;

      // 2. Distance (if coords available)
      let distanceKm = null;
      if (
        hasCoords &&
        l.location?.coordinates?.lat != null &&
        l.location?.coordinates?.lng != null
      ) {
        distanceKm = haversineKm(lat, lng, l.location.coordinates.lat, l.location.coordinates.lng);
        if      (distanceKm <= 1)  score += 30;
        else if (distanceKm <= 3)  score += 20;
        else if (distanceKm <= 7)  score += 10;
        else if (distanceKm <= 15) score += 5;
      } else if (l.location?.district === district) {
        score += 15; // same district fallback
      }

      // 3. Similar price (±40 %)
      if (currentPrice > 0 && l.price?.amount) {
        const ratio = l.price.amount / currentPrice;
        if (ratio >= 1 - PRICE_RANGE && ratio <= 1 + PRICE_RANGE) score += 15;
      }

      // 4. Shared facilities
      if (facilities.length > 0 && l.facilities?.length > 0) {
        const shared = l.facilities.filter((f) => facilities.includes(f)).length;
        score += Math.min(shared * 3, 15);
      }

      return { ...l, _score: score, distanceKm };
    });

    scored.sort((a, b) => b._score - a._score);
    const top6 = scored.slice(0, 6);

    // ── Format distance string ────────────────────────────────────────────
    const formatDistance = (km) => {
      if (km == null) return null;
      if (km < 1)     return `${Math.round(km * 1000)} m away`;
      return `${km.toFixed(1)} km away`;
    };

    const results = top6.map(({ _score, distanceKm, ...l }) => ({
      ...l,
      distanceAway: formatDistance(distanceKm),
    }));

    res.json({ success: true, listings: results });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch nearby listings', error: err.message });
  }
};

module.exports = {
  createListing, getListings, getListingById, getMyListings,
  updateListing, deleteListing, toggleStatus, getPublicStats, uploadVR,
  getNearbyListings,
};