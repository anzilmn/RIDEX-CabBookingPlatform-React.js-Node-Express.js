const jwt  = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized. No token.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    // Auto-unblock if timed block has expired
    if (user.isBlocked && user.blockedUntil && new Date() > user.blockedUntil) {
      user.isBlocked    = false;
      user.blockedUntil = null;
      user.blockReason  = '';
      await user.save();
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success:      false,
        isBlocked:    true,
        message:      'Account blocked',
        blockReason:  user.blockReason  || 'Policy violation',
        blockedUntil: user.blockedUntil || null,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Role '${req.user.role}' not authorized` });
  }
  next();
};
