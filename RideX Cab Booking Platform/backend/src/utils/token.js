const jwt = require('jsonwebtoken');

const generateToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRE
});

const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id, user.role);
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified
    }
  });
};

module.exports = { generateToken, sendTokenResponse };
