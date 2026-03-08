const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Review = require('../models/Review');
const Driver = require('../models/Driver');

// Get public reviews for homepage
router.get('/public', async (req, res) => {
  try {
    const reviews = await Review.find({ isPublic: true, rating: { $gte: 4 } })
      .populate('riderId', 'name avatar')
      .populate({ path: 'driverId', populate: { path: 'userId', select: 'name avatar' } })
      .sort({ createdAt: -1 }).limit(12);
    res.json({ success: true, reviews });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get reviews for a specific driver
router.get('/driver/:driverId', async (req, res) => {
  try {
    const reviews = await Review.find({ driverId: req.params.driverId, isPublic: true })
      .populate('riderId', 'name avatar')
      .sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, reviews });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get my reviews (rider)
router.get('/my', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ riderId: req.user._id })
      .populate({ path: 'driverId', populate: { path: 'userId', select: 'name avatar' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
