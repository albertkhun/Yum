const multer  = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

// Separate Cloudinary storage for VR media — allows video too
const vrStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder:        'meitei-stay-vr',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'webm'],
      // For images: no crop (preserve the full equirectangular panorama)
      ...(isVideo ? {} : { transformation: [{ quality: 'auto' }] }),
    };
  },
});

const vrFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|mp4|mov|webm/;
  if (allowed.test(file.mimetype.replace('video/', '').replace('image/', ''))) {
    return cb(null, true);
  }
  // Broader check
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    return cb(null, true);
  }
  cb(new Error('Only panorama images (jpg/png/webp) or 360° videos (mp4/mov/webm) allowed'));
};

const vrUpload = multer({
  storage: vrStorage,
  fileFilter: vrFileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB for VR video
});

module.exports = vrUpload;
