const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    title:       { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Rent',  'PG', 'Hostel'],
    },
    price: {
      amount: { type: Number, required: [true, 'Price is required'], min: 0 },
      period: { type: String, enum: ['per night', 'per week', 'per month'], default: 'per month' },
    },
    location: {
      district: {
        type: String,
        required: [true, 'District is required'],
        enum: [
          'Imphal East', 'Imphal West', 'Thoubal', 'Bishnupur',
          'Churachandpur', 'Chandel', 'Ukhrul', 'Senapati',
          'Tamenglong', 'Jiribam', 'Kakching', 'Kangpokpi',
          'Noney', 'Pherzawl', 'Tengnoupal', 'Kamjong',
        ],
      },
      locality:  { type: String, required: [true, 'Locality is required'], trim: true },
      landmark:  { type: String, trim: true },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
    facilities:     { type: [String], default: [] },
    images:         { type: [String], default: [] },
    contactNumber:  { type: String, required: [true, 'Contact number is required'] },
    vrMediaUrl:     { type: String, default: '' },
    whatsappNumber: { type: String, default: '' },
    status:         { type: String, enum: ['available', 'rented'], default: 'available' },
    approved:       { type: Boolean, default: false },
    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Powers: search by title, locality, category
listingSchema.index(
  { title: 'text', 'location.locality': 'text', category: 'text' },
  { weights: { title: 3, 'location.locality': 2, category: 1 }, name: 'text_search' }
);

// Primary browse query: approved + sort by createdAt
listingSchema.index({ approved: 1, createdAt: -1 }, { name: 'approved_date' });

// Approved + category filter 
listingSchema.index({ approved: 1, category: 1, createdAt: -1 }, { name: 'approved_category_date' });

// Approved + district filter
listingSchema.index({ approved: 1, 'location.district': 1, createdAt: -1 }, { name: 'approved_district_date' });

//  Compound: approved + category + district (both filters active)
listingSchema.index(
  { approved: 1, category: 1, 'location.district': 1, createdAt: -1 },
  { name: 'approved_cat_dist_date' }
);

// Price range queries
listingSchema.index({ approved: 1, 'price.amount': 1 }, { name: 'approved_price' });

// Status filter
listingSchema.index({ approved: 1, status: 1, createdAt: -1 }, { name: 'approved_status_date' });

//Owner dashboard: fetch listings by createdBy
listingSchema.index({ createdBy: 1, createdAt: -1 }, { name: 'owner_listings' });

//Admin: pending approval queue
listingSchema.index({ approved: 1, createdAt: -1 }, { name: 'admin_approval_queue', sparse: true });

module.exports = mongoose.model('Listing', listingSchema);