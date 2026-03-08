const { body } = require('express-validator');
const User   = require('../models/User');
const Driver = require('../models/Driver');
const { sendTokenResponse } = require('../utils/token');
const { notify } = require('../utils/notify');

exports.registerValidation = [
  body('name').trim().notEmpty().withMessage('Name required').isLength({min:2}).withMessage('Name min 2 chars'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({min:6}).withMessage('Password min 6 chars'),
  body('phone').matches(/^[0-9]{10,15}$/).withMessage('Valid phone required (10-15 digits)'),
  body('role').optional().isIn(['rider','driver']).withMessage('Invalid role'),
];

exports.loginValidation = [
  body('email').notEmpty().withMessage('Email or username required'),
  body('password').notEmpty().withMessage('Password required'),
];

exports.register = async (req, res) => {
  try {
    const io = req.app.locals.io;
    const { name, email, password, phone, role = 'rider' } = req.body;
    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists) {
      const field = exists.email === email ? 'Email' : 'Phone';
      return res.status(400).json({ success: false, message: `${field} already registered` });
    }
    const user = await User.create({ name, email, password, phone, role, isVerified: true });

    // ✅ Notify all admins about new registration
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      const type = role === 'driver' ? 'admin_new_driver' : 'admin_new_rider';
      await notify(io, admin._id, type, null, { extra: name });
    }

    sendTokenResponse(user, 201, res, 'Registration successful');
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    // Admin shortcut
    if ((email === 'admin' || email === 'admin@ridex.com') && password === 'admin') {
      let admin = await User.findOne({ role: 'admin' });
      if (!admin) {
        const bcrypt = require('bcryptjs');
        const hashed = await bcrypt.hash('admin', 12);
        admin = await User.create({ name:'Admin', email:'admin@ridex.com', password:hashed, phone:'9999999999', role:'admin', isVerified:true });
      }
      return sendTokenResponse(admin, 200, res, 'Admin login successful');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Auto-unblock if timed block expired
    if (user.isBlocked && user.blockedUntil && new Date() > user.blockedUntil) {
      user.isBlocked = false; user.blockedUntil = null; user.blockReason = '';
      await user.save();
    }

    // ✅ Rich blocked response — shows reason + time
    if (user.isBlocked) {
      const untilStr = user.blockedUntil
        ? new Date(user.blockedUntil).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        : null;
      return res.status(403).json({
        success:      false,
        isBlocked:    true,
        message:      'Account blocked',
        blockReason:  user.blockReason  || 'Policy violation',
        blockedUntil: user.blockedUntil || null,
        unblockTime:  untilStr,
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let driverProfile = null;
    if (user.role === 'driver') driverProfile = await Driver.findOne({ userId: user._id });
    res.json({ success: true, user, driverProfile });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone, avatar }, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, message: 'Profile updated', user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password min 6 chars' });
    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
