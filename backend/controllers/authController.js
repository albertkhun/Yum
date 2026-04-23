const User = require('../models/User');
const jwt  = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => jwt.sign(
  { id: user._id, role: user.role, name: user.name },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const userPayload = (user) => ({
  id: user._id, name: user.name, email: user.email,
  role: user.role, avatar: user.avatar,
  isGoogleUser: !!user.googleId,
});

// ── POST /api/auth/register ────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, phone });
    res.status(201).json({
      success: true, message: 'Registered successfully',
      token: generateToken(user), user: userPayload(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// ── POST /api/auth/login ───────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({
      success: true, message: 'Login successful',
      token: generateToken(user), user: userPayload(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// ── POST /api/auth/google ──────────────────────────────────
// Returns isNewUser=true + googleProfile when first-time signup
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential is required' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential, audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name, picture, given_name, family_name } = ticket.getPayload();

    // Existing user — link if needed, then login
    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (user) {
      if (!user.googleId) { user.googleId = googleId; user.avatar = picture; await user.save(); }
      return res.json({
        success: true, isNewUser: false,
        token: generateToken(user), user: userPayload(user),
      });
    }

    // New user — return Google profile so frontend can show completion modal
    res.json({
      success: true,
      isNewUser: true,
      googleProfile: {
        googleId, email, picture,
        firstName: given_name || name.split(' ')[0] || '',
        lastName:  family_name || name.split(' ').slice(1).join(' ') || '',
      },
    });
  } catch (err) {
    console.error('Google login error:', err.message);
    res.status(401).json({ message: 'Invalid Google credential' });
  }
};

// ── POST /api/auth/google/complete ────────────────────────
// Called after new Google user fills in firstName, lastName, role
const completeGoogleProfile = async (req, res) => {
  try {
    const { googleId, email, avatar, firstName, lastName, role } = req.body;

    const nameRegex = /^[A-Za-z\s'-]+$/;
    if (!firstName || !lastName || !role)
      return res.status(400).json({ message: 'First name, last name and role are required' });
    if (!nameRegex.test(firstName))
      return res.status(400).json({ message: 'First name: letters only, no numbers or symbols' });
    if (!nameRegex.test(lastName))
      return res.status(400).json({ message: 'Last name: letters only, no numbers or symbols' });
    if (!['user', 'owner'].includes(role))
      return res.status(400).json({ message: 'Role must be user or owner' });

    const existing = await User.findOne({ $or: [{ googleId }, { email }] });
    if (existing) return res.status(409).json({ message: 'Account already exists. Please sign in.' });

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const user = await User.create({
      name: fullName, email, googleId, avatar, role,
    });

    res.status(201).json({
      success: true, message: 'Account created',
      token: generateToken(user), user: userPayload(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to complete profile', error: err.message });
  }
};

// ── GET /api/auth/me ───────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
};

// ── PUT /api/auth/me ───────────────────────────────────────
const updateMe = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id, { name, phone }, { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};

// ── PATCH /api/auth/role ───────────────────────────────────
const updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'owner'].includes(role))
      return res.status(400).json({ message: 'Role must be user or owner' });
    const user = await User.findByIdAndUpdate(req.user.id, { role }, { new: true }).select('-password');
    res.json({ success: true, message: 'Role updated', user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role', error: err.message });
  }
};

// ── POST /api/auth/change-password ────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Current and new password are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.googleId && !user.password)
      return res.status(400).json({ message: 'Google accounts cannot change password this way' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword; // pre-save hook hashes it
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to change password', error: err.message });
  }
};

// ── POST /api/auth/admin/change-password ──────────────────
// Admin changes their own password (no current password verification bypass — still verifies)
const adminChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Both fields are required' });
    if (newPassword.length < 8)
      return res.status(400).json({ message: 'Admin password must be at least 8 characters' });

    const user = await User.findById(req.user.id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Admin password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to change password', error: err.message });
  }
};

module.exports = {
  register, login, googleLogin, completeGoogleProfile,
  getMe, updateMe, updateRole, changePassword, adminChangePassword,
};