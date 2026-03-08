const { body } = require('express-validator');
const Ride    = require('../models/Ride');
const Driver  = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Payment = require('../models/Payment');
const { calculateFare } = require('../utils/fareCalculator');
const { notify }        = require('../utils/notify');

exports.rideValidation = [
  body('pickupLocation.address').notEmpty().withMessage('Pickup address required'),
  body('pickupLocation.lat').isNumeric().withMessage('Pickup lat required'),
  body('pickupLocation.lng').isNumeric().withMessage('Pickup lng required'),
  body('dropLocation.address').notEmpty().withMessage('Drop address required'),
  body('dropLocation.lat').isNumeric().withMessage('Drop lat required'),
  body('dropLocation.lng').isNumeric().withMessage('Drop lng required'),
];

// ── REQUEST RIDE ─────────────────────────────────────────────
exports.requestRide = async (req, res) => {
  try {
    const io = req.app.locals.io;
    const { pickupLocation, dropLocation, vehicleType = 'sedan', paymentMethod = 'cash' } = req.body;
    const { fare, distance, duration } = calculateFare(pickupLocation, dropLocation, vehicleType);

    const ride = await Ride.create({
      riderId: req.user._id, pickupLocation, dropLocation,
      vehicleType, fare, distance, duration, paymentMethod,
      otp: null
    });
    await ride.populate('riderId', 'name phone avatar');

    await notify(io, req.user._id, 'ride_requested', ride._id, { ride });

    // ✅ FIX 2: Only notify ONLINE + approved + available drivers
    //    whose vehicle type MATCHES the requested vehicleType
    const onlineDrivers = await Driver.find({ isOnline: true, isApproved: true, status: 'available' });
    for (const driver of onlineDrivers) {
      const vehicle = await Vehicle.findOne({ driverId: driver._id });
      if (!vehicle || vehicle.vehicleType !== vehicleType) continue; // wrong type — skip
      await notify(io, driver.userId, 'new_ride_available', ride._id, { ride });
    }

    res.status(201).json({ success: true, message: 'Ride requested', ride });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── FARE ESTIMATE ────────────────────────────────────────────
exports.getFareEstimate = async (req, res) => {
  try {
    const { pickupLocation, dropLocation } = req.body;
    if (!pickupLocation?.lat || !dropLocation?.lat)
      return res.status(400).json({ success: false, message: 'Locations required' });
    const types = ['sedan','suv','hatchback','motorcycle','auto'];
    const estimates = {};
    types.forEach(t => { estimates[t] = calculateFare(pickupLocation, dropLocation, t); });
    res.json({ success: true, estimates });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── GET RIDER'S RIDES ────────────────────────────────────────
exports.getRiderRides = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { riderId: req.user._id };
    if (status) query.status = status;
    const rides = await Ride.find(query)
      .populate({ path: 'driverId', populate: { path: 'userId', select: 'name phone avatar' } })
      .sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const total = await Ride.countDocuments(query);
    res.json({ success: true, rides, total, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── CANCEL RIDE ──────────────────────────────────────────────
exports.cancelRide = async (req, res) => {
  try {
    const io = req.app.locals.io;
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.riderId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (['completed','cancelled'].includes(ride.status))
      return res.status(400).json({ success: false, message: `Cannot cancel a ${ride.status} ride` });

    const reason = req.body.reason || 'Cancelled by rider';
    ride.status = 'cancelled'; ride.cancelReason = reason; ride.cancelledAt = new Date();
    await ride.save();
    await notify(io, req.user._id, 'ride_cancelled', ride._id, reason);
    if (ride.driverId) {
      await Driver.findByIdAndUpdate(ride.driverId, { status: 'available' });
      const driver = await Driver.findById(ride.driverId);
      if (driver) await notify(io, driver.userId, 'rider_cancelled', ride._id, {});
    }
    res.json({ success: true, message: 'Ride cancelled', ride });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── ACTIVE RIDE ──────────────────────────────────────────────
exports.getActiveRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      riderId: req.user._id,
      status: { $in: ['requested','accepted','driver_arriving','in_progress'] }
    }).populate({ path: 'driverId', populate: { path: 'userId', select: 'name phone avatar' } });
    res.json({ success: true, ride });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── GET DRIVER'S RIDES ───────────────────────────────────────
exports.getDriverRides = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });
    const { status, page = 1, limit = 10 } = req.query;
    const query = { driverId: driver._id };
    if (status) query.status = status;
    const rides = await Ride.find(query)
      .populate('riderId', 'name phone avatar')
      .sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const total = await Ride.countDocuments(query);
    res.json({ success: true, rides, total, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── ACCEPT RIDE ──────────────────────────────────────────────
exports.acceptRide = async (req, res) => {
  try {
    const io = req.app.locals.io;
    const driver = await Driver.findOne({ userId: req.user._id }).populate('userId', 'name phone');
    if (!driver)          return res.status(404).json({ success: false, message: 'Driver profile not found' });
    if (!driver.isApproved) return res.status(403).json({ success: false, message: 'Driver not approved' });
    if (!driver.isOnline)   return res.status(400).json({ success: false, message: 'Driver must be online to accept rides' });

    const ride = await Ride.findById(req.params.id);
    if (!ride || ride.status !== 'requested')
      return res.status(400).json({ success: false, message: 'Ride not available' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    ride.driverId = driver._id; ride.status = 'accepted'; ride.otp = otp;
    await ride.save();
    await Driver.findByIdAndUpdate(driver._id, { status: 'busy' });
    await ride.populate('riderId', 'name phone avatar');

    await notify(io, ride.riderId._id, 'ride_accepted', ride._id, { ride, extra: driver.userId?.name || 'Your driver', otp });
    await notify(io, req.user._id, 'ride_accepted_driver', ride._id, { ride, extra: ride.riderId?.name || 'Rider', otp });
    res.json({ success: true, message: 'Ride accepted', ride });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── UPDATE RIDE STATUS ───────────────────────────────────────
exports.updateRideStatus = async (req, res) => {
  try {
    const io = req.app.locals.io;
    const driver = await Driver.findOne({ userId: req.user._id }).populate('userId', 'name');
    const { status } = req.body;
    const validTransitions = { accepted: 'driver_arriving', driver_arriving: 'in_progress', in_progress: 'completed' };
    const ride = await Ride.findById(req.params.id).populate('riderId', 'name phone _id');
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.driverId.toString() !== driver._id.toString())
      return res.status(403).json({ success: false, message: 'Not your ride' });
    if (validTransitions[ride.status] !== status)
      return res.status(400).json({ success: false, message: `Cannot change ${ride.status} to ${status}` });

    ride.status = status;

    if (status === 'driver_arriving') {
      await notify(io, ride.riderId._id, 'driver_arriving', ride._id, { extra: driver.userId?.name || 'Your driver' });
    }
    if (status === 'in_progress') {
      ride.startedAt = new Date();
      await notify(io, ride.riderId._id, 'ride_started', ride._id, { ride });
      await notify(io, req.user._id, 'ride_started_driver', ride._id, { extra: ride.riderId?.name });
    }
    if (status === 'completed') {
      ride.completedAt = new Date(); ride.paymentStatus = 'paid';
      const driverEarning = Math.round(ride.fare * 0.85);
      await Driver.findByIdAndUpdate(driver._id, {
        status: 'available', $inc: { totalRides: 1, totalEarnings: driverEarning }
      });
      await Payment.create({
        rideId: ride._id, riderId: ride.riderId._id, driverId: driver._id,
        amount: ride.fare, method: ride.paymentMethod, status: 'success',
        platformFee: Math.round(ride.fare * 0.15), driverEarning
      });
      // ✅ ride_completed message now says "Rate your experience or report an issue"
      await notify(io, ride.riderId._id, 'ride_completed', ride._id, { ride });
      await notify(io, req.user._id, 'ride_completed_driver', ride._id, { extra: driverEarning });
      await notify(io, req.user._id, 'payment_received', ride._id, { extra: driverEarning });
    }
    await ride.save();
    res.json({ success: true, message: `Ride ${status}`, ride });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── AVAILABLE RIDES (only matching driver's vehicle type) ─────
exports.getAvailableRides = async (req, res) => {
  try {
    // Find this driver's vehicle type so we only show matching rides
    const driver  = await Driver.findOne({ userId: req.user._id });
    const vehicle = driver ? await Vehicle.findOne({ driverId: driver._id }) : null;

    const query = { status: 'requested' };
    if (vehicle?.vehicleType) query.vehicleType = vehicle.vehicleType; // ✅ vehicle-type filter

    const rides = await Ride.find(query)
      .populate('riderId', 'name phone avatar')
      .sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, rides, driverVehicleType: vehicle?.vehicleType || null });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── RATE RIDE ────────────────────────────────────────────────
exports.rateRide = async (req, res) => {
  try {
    const io = req.app.locals.io;
    const { rating, review, tags = [] } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating 1-5 required' });
    const ride = await Ride.findById(req.params.id).populate('riderId', 'name');
    if (!ride || ride.status !== 'completed')
      return res.status(400).json({ success: false, message: 'Can only rate completed rides' });
    if (ride.rating) return res.status(400).json({ success: false, message: 'Already rated this ride' });

    ride.rating = rating; ride.review = review;
    await ride.save();
    const Review = require('../models/Review');
    await Review.create({ rideId: ride._id, riderId: req.user._id, driverId: ride.driverId, rating, review, tags });
    if (ride.driverId) {
      const allRated = await Ride.find({ driverId: ride.driverId, rating: { $exists: true } });
      const avg = allRated.reduce((a, r) => a + r.rating, 0) / allRated.length;
      await Driver.findByIdAndUpdate(ride.driverId, { rating: parseFloat(avg.toFixed(1)) });
      const driver = await Driver.findById(ride.driverId);
      if (driver) await notify(io, driver.userId, 'review_received', ride._id, { extra: rating, extra2: ride.riderId?.name || 'A rider' });
    }
    res.json({ success: true, message: 'Review submitted!', ride });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
