const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Payment = require('../models/Payment');

router.get('/history', protect, async (req, res) => {
  try {
    const query = req.user.role === 'rider'
      ? { riderId: req.user._id }
      : req.user.role === 'driver'
      ? { driverId: (await require('../models/Driver').findOne({ userId: req.user._id }))?._id }
      : {};
    const payments = await Payment.find(query).populate('rideId').sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, payments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
module.exports = router;
