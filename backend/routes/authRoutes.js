const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();
const {
  register, login, googleLogin, completeGoogleProfile,
  getMe, updateMe, updateRole, changePassword, adminChangePassword,
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});

router.post('/register',              register);
router.post('/login',                 loginLimiter, login);
router.post('/google',                loginLimiter, googleLogin);
router.post('/google/complete',       completeGoogleProfile);      // new Google user profile
router.get('/me',                     protect, getMe);
router.put('/me',                     protect, updateMe);
router.patch('/role',                 protect, updateRole);
router.post('/change-password',       protect, changePassword);
router.post('/admin/change-password', protect, adminOnly, adminChangePassword);

module.exports = router;