

const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Rent','Apartment', 'PG', 'Hostel', 'Lodge', 'Tolet', 'Other'],
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
    vrMediaUrl:     { type: String, default: '' },   // 360° panorama image or video URL
    whatsappNumber: { type: String, default: '' },
    status:         { type: String, enum: ['available', 'rented'], default: 'available' },
    approved:       { type: Boolean, default: false },
    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

listingSchema.index({ title: 'text', 'location.locality': 'text', category: 'text' });

module.exports = mongoose.model('Listing', listingSchema);