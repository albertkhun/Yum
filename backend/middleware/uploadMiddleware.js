const multer  = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');
 
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'Yum',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
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
  limits: { fileSize: 5 * 1024 * 1024 },
});
 
module.exports = upload;
 