const multer  = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'YumVR/listings',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      {
        width:   1200,
        height:  900,
        crop:    'limit',
        quality: 'auto:good',
        fetch_format: 'auto',
        flags:   'strip_exif',
      },
    ],
    // Unique filename to prevent collisions
    public_id: (req, file) => {
      const timestamp = Date.now();
      const random    = Math.random().toString(36).slice(2, 8);
      return `listing_${timestamp}_${random}`;
    },
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  if (allowed.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024,  // 8MB per file (Cloudinary compress)
    files: 6,
  },
});

module.exports = upload;