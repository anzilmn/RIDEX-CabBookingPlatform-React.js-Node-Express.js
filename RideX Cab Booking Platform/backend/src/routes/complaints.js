const express    = require('express');
const router     = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Complaint  = require('../models/Complaint');
const Ride       = require('../models/Ride');
const User       = require('../models/User');
const { notify } = require('../utils/notify');

// ── FILE COMPLAINT (rider) ────────────────────────────────────
router.post('/', protect, authorize('rider'), async (req, res) => {
  try {
    const io = req.app.locals.io;
    const { rideId, subject, description, category = 'other' } = req.body;
    if (!subject?.trim() || !description?.trim())
      return res.status(400).json({ success: false, message: 'Subject and description required' });

    // Resolve the driver from the ride (if provided)
    let driverId = null;
    if (rideId) {
      const ride = await Ride.findById(rideId);
      if (ride?.driverId) driverId = ride.driverId;
    }

    const complaint = await Complaint.create({
      userId: req.user._id, rideId: rideId || null, driverId, subject, description, category
    });

    // Notify rider: complaint confirmed
    await notify(io, req.user._id, 'complaint_filed', rideId || null, { extra: subject });

    // Notify all admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await notify(io, admin._id, 'admin_new_complaint', rideId || null, {
        extra: subject, extra2: req.user.name
      });
    }

    res.status(201).json({ success: true, message: 'Complaint submitted', complaint });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── MY COMPLAINTS (rider) ────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id })
      .populate('rideId', 'pickupLocation dropLocation fare status')
      .sort({ createdAt: -1 });
    res.json({ success: true, complaints });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
